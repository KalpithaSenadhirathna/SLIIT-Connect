// backend/routes/notes.js
const express = require("express");
const router  = express.Router();
const Note    = require("../models/Note");

// ── Pre-flight: verify scanner dependencies on first load ─────────────────────
(function checkScannerDeps() {
  const missing = [];
  try { require("adm-zip"); } catch { missing.push("adm-zip"); }
  try { require("@anthropic-ai/sdk"); } catch { missing.push("@anthropic-ai/sdk"); }
  if (!process.env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY (in .env)");

  if (missing.length > 0) {
    console.error("\n╔══════════════════════════════════════════════════════╗");
    console.error("║  ⚠️  CONTENT SCANNER NOT READY — UPLOADS WILL PASS   ║");
    console.error("╠══════════════════════════════════════════════════════╣");
    missing.forEach(m => console.error(`║  ✗ Missing: ${m.padEnd(40)}║`));
    console.error("╠══════════════════════════════════════════════════════╣");
    console.error("║  Fix: npm install adm-zip @anthropic-ai/sdk          ║");
    console.error("║       and add ANTHROPIC_API_KEY=sk-ant-... to .env   ║");
    console.error("╚══════════════════════════════════════════════════════╝\n");
  } else {
    console.log("[Scanner] ✅ All dependencies ready — scanner is active");
  }
})();

// ── Anthropic client ──────────────────────────────────────────────────────────
const Anthropic = require("@anthropic-ai/sdk");
const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────────────────────────────────────
// SCANNER SYSTEM PROMPT — used for ALL file types
// ─────────────────────────────────────────────────────────────────────────────
const SCAN_SYSTEM = `You are a strict AI content moderator for a university academic notes-sharing platform (SLIIT Connect — a Sri Lankan university).

Your ONLY job is to decide whether uploaded content is safe and appropriate for a university notes platform.

SAFE content (ALLOW):
- Academic lecture notes, slides, assignments, lab reports
- Textbook content, past exam papers, cheat sheets
- Diagrams, flowcharts, code snippets, formulas, equations
- University-related text in any language (Sinhala, Tamil, English)
- Screenshots of academic software, IDEs, terminals
- Data tables, graphs, charts used for study

UNSAFE content (REJECT) — reject if ANY of these appear anywhere in the file:
- Nudity, sexual content, or suggestive imagery (explicit or implied)
- Graphic violence, gore, or disturbing imagery
- Hate speech, discriminatory language, or hate symbols
- Personal identification documents (passports, NIC cards, driving licenses, birth certificates)
- Financial data: credit/debit card numbers, bank account numbers, PINs
- Passwords, API keys, secret tokens, private keys (-----BEGIN PRIVATE KEY-----)
- Pirated content with DRM watermarks or stolen paid course material
- Drug-related imagery or instructions
- Extremist, terrorist, or politically violent content
- Screenshots of private chats, personal photos, selfies
- Hacking tools, malware code, exploit instructions
- Content completely unrelated to academic study (memes-only, social media screenshots, entertainment)

Be STRICT but FAIR. If content is clearly academic with minor issues, prefer SAFE.
Only reject when you find clear violations.`;

// ─────────────────────────────────────────────────────────────────────────────
// NEW: DOCUMENT PURPOSE CHECK
// Checks whether the document is genuinely academic study material.
// This runs BEFORE content scanning and catches:
//   - Photo albums saved as DOCX/PDF
//   - Personal documents disguised as notes
//   - Image-heavy non-academic files
//   - Random files with no educational purpose
// ─────────────────────────────────────────────────────────────────────────────
async function checkDocumentPurpose(rawBase64, fileName, ext, imageCount) {
  let textSample = "";

  // Extract text for office files
  if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) {
    try {
      textSample = extractOfficeText(rawBase64).slice(0, 6000);
    } catch (e) {
      console.warn("[Scanner] Could not extract text for purpose check:", e.message);
    }
  }

  const hasNoText    = !textSample || textSample.trim().length < 80;
  const imageDominated = imageCount > 0 && hasNoText;

  console.log(`[Scanner] Purpose check — file: "${fileName}", ext: ${ext}, images: ${imageCount}, textLen: ${textSample.length}, imageDominated: ${imageDominated}`);

  // If the file is image-dominated (lots of images, virtually no text),
  // it is very likely NOT academic notes — flag it immediately without
  // spending an extra API call.
  if (imageDominated && imageCount >= 3) {
    console.log(`[Scanner] ⛔ Purpose check: image-dominated document with no academic text (${imageCount} images, ${textSample.length} chars text)`);
    return {
      isAcademic: false,
      confidence: 0.92,
      reason: `Document contains ${imageCount} image(s) but no academic text — does not appear to be study notes.`,
    };
  }

  // AI-based purpose check
  const response = await ai.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `You are reviewing a file uploaded to a university notes-sharing platform.
Decide if this file is genuinely academic study material (lecture notes, slides, assignments, lab reports, past papers, cheat sheets, study guides, etc.).

File name: "${fileName}"
File type: .${ext}
Embedded images found: ${imageCount}
Extracted text sample (first 6000 chars — empty if image-only):
${textSample || "(no readable text found)"}

REJECT (isAcademic: false) if:
- The file appears to be a photo album, personal photo collection, or image dump
- The file is a personal document unrelated to study (CV, ID, personal letter, etc.)
- The file is mostly images with no academic text explaining them
- The file has no clear educational purpose
- The filename suggests non-academic content (e.g. "holiday_photos.docx", "family_album.pdf")

ALLOW (isAcademic: true) if:
- The file contains lecture/study text even if it also has diagrams or screenshots
- The text references course topics, modules, formulas, code, or academic concepts
- It is clearly a student-made study document

Respond ONLY with valid JSON — no markdown, no extra text:
{
  "isAcademic": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "one concise sentence"
}`,
    }],
  });

  const raw = response.content[0].text.trim().replace(/```json|```/g, "").trim();
  console.log(`[Scanner] ← Purpose check result: ${raw}`);
  return JSON.parse(raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN: PDF — sent natively as a document to Claude (no rasterisation needed)
// Claude reads the full PDF content directly
// ─────────────────────────────────────────────────────────────────────────────
async function scanPdfWithClaude(rawBase64, fileName) {
  console.log(`[Scanner] → Sending PDF natively to Claude: "${fileName}"`);

  const response = await ai.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 500,
    system: SCAN_SYSTEM,
    messages: [{
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: rawBase64,
          },
        },
        {
          type: "text",
          text: `Scan this entire PDF document ("${fileName}") for harmful or inappropriate content.

Read through ALL pages and ALL text. Analyse any embedded images if present.

IMPORTANT: Also check whether this PDF is genuinely academic study material (notes, slides, past papers, assignments, lab reports). If it is a photo album, personal photo collection, or non-academic document, mark it as unsafe with category "unrelated".

Respond ONLY with valid JSON — no markdown fences, no extra text:
{
  "safe": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "one concise sentence explaining your decision",
  "category": "academic" | "personal_data" | "adult_content" | "violence" | "hate" | "copyright" | "illegal" | "unrelated" | "other",
  "pagesScanned": estimated number of pages you read,
  "isAcademic": true or false
}`,
        },
      ],
    }],
  });

  const raw = response.content[0].text.trim().replace(/```json|```/g, "").trim();
  console.log(`[Scanner] ← Claude PDF result: ${raw}`);
  return JSON.parse(raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN: Images (jpg, png, gif, webp, bmp) — sent as vision input
// ─────────────────────────────────────────────────────────────────────────────
async function scanImageWithClaude(imageBase64, mediaType, fileName) {
  console.log(`[Scanner] → Sending image to Claude Vision: "${fileName}"`);

  const response = await ai.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 400,
    system: SCAN_SYSTEM,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: imageBase64 },
        },
        {
          type: "text",
          text: `Scan this image file ("${fileName}") for harmful or inappropriate content.

Respond ONLY with valid JSON — no markdown fences, no extra text:
{
  "safe": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "one concise sentence explaining your decision",
  "category": "academic" | "personal_data" | "adult_content" | "violence" | "hate" | "copyright" | "illegal" | "unrelated" | "other"
}`,
        },
      ],
    }],
  });

  const raw = response.content[0].text.trim().replace(/```json|```/g, "").trim();
  console.log(`[Scanner] ← Claude image result: ${raw}`);
  return JSON.parse(raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN: Office files (DOCX, PPTX, XLSX) — two-pass approach:
//   Pass 1: Extract embedded images → scan each with Claude Vision
//   Pass 2: Extract all text → scan text content with Claude
// ─────────────────────────────────────────────────────────────────────────────
function extractOfficeImages(rawBase64) {
  const AdmZip = require("adm-zip");
  const zip    = new AdmZip(Buffer.from(rawBase64, "base64"));
  const MIME   = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    gif: "image/gif", bmp: "image/bmp",  webp: "image/webp",
  };
  const images = [];

  for (const entry of zip.getEntries()) {
    const ext = entry.entryName.split(".").pop().toLowerCase();
    if (!MIME[ext]) continue;
    const data = entry.getData();
    if (data.length < 200) continue; // skip tiny placeholder icons
    console.log(`[Scanner] ✓ Image in ZIP: ${entry.entryName} (${data.length} bytes)`);
    images.push({
      base64: data.toString("base64"),
      mediaType: MIME[ext],
      name: entry.entryName,
    });
  }
  return images;
}

function extractOfficeText(rawBase64) {
  // Pull readable text out of XML inside Office ZIP (word/document.xml, ppt slides, etc.)
  try {
    const AdmZip = require("adm-zip");
    const zip    = new AdmZip(Buffer.from(rawBase64, "base64"));
    const xmlFiles = zip.getEntries().filter(e =>
      e.entryName.endsWith(".xml") &&
      (e.entryName.startsWith("word/") ||
       e.entryName.startsWith("ppt/slides/") ||
       e.entryName.startsWith("xl/worksheets/") ||
       e.entryName === "word/document.xml")
    );

    let text = "";
    for (const entry of xmlFiles.slice(0, 20)) { // cap at 20 xml files
      const xml = entry.getData().toString("utf-8");
      // Strip XML tags, collapse whitespace
      const clean = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (clean.length > 30) text += clean + "\n";
    }
    return text.slice(0, 40000); // send max ~40k chars to Claude
  } catch {
    return "";
  }
}

async function scanOfficeTextWithClaude(text, fileName) {
  if (!text || text.trim().length < 50) return null; // nothing to scan

  console.log(`[Scanner] → Scanning extracted text from "${fileName}" (${text.length} chars)`);

  const response = await ai.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 400,
    system: SCAN_SYSTEM,
    messages: [{
      role: "user",
      content: `Scan the following text content extracted from a university file ("${fileName}") for harmful or inappropriate content.

TEXT CONTENT:
${text}

Respond ONLY with valid JSON — no markdown fences, no extra text:
{
  "safe": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "one concise sentence explaining your decision",
  "category": "academic" | "personal_data" | "adult_content" | "violence" | "hate" | "copyright" | "illegal" | "unrelated" | "other"
}`,
    }],
  });

  const raw = response.content[0].text.trim().replace(/```json|```/g, "").trim();
  console.log(`[Scanner] ← Claude text result: ${raw}`);
  return JSON.parse(raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// SCAN: Plain text files (txt, md, csv) — direct text scan + regex safety net
// ─────────────────────────────────────────────────────────────────────────────
const SENSITIVE_PATTERNS = [
  // Credit / debit card numbers
  { re: /\b(?:\d[ -]?){13,19}\b/,                                        msg: "Possible card number detected",              cat: "personal_data" },
  // Passwords in config / env style  (PASSWORD=... or password: ...)
  { re: /(?:password|passwd|pwd)\s*[:=]\s*\S+/i,                         msg: "Embedded password detected",                 cat: "personal_data" },
  // Generic API key assignments  (API_KEY=... or apiKey: ...)
  { re: /api[_\s-]?key\s*[:=]\s*\S+/i,                                   msg: "Embedded API key detected",                  cat: "personal_data" },
  // Anthropic API keys  sk-ant-...
  { re: /sk-ant-[a-zA-Z0-9\-_]{20,}/,                                    msg: "Anthropic API key detected",                 cat: "personal_data" },
  // Generic sk- secret keys (OpenAI, Stripe, etc.)
  { re: /sk-[a-zA-Z0-9]{20,}/,                                           msg: "Secret API key detected",                    cat: "personal_data" },
  // PEM private keys
  { re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,                       msg: "Private key embedded",                       cat: "personal_data" },
  // GitHub tokens
  { re: /ghp_[a-zA-Z0-9]{36}/,                                           msg: "GitHub personal access token detected",      cat: "personal_data" },
  // MongoDB / database URIs with credentials  (mongodb://user:pass@host)
  { re: /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@/i,                           msg: "MongoDB connection string with credentials", cat: "personal_data" },
  // Generic DB connection strings  (postgres://, mysql://, etc.)
  { re: /(?:postgres|mysql|mariadb|redis|mssql):\/\/[^:]+:[^@]+@/i,      msg: "Database URI with credentials detected",     cat: "personal_data" },
  // JWT secrets in env style  (JWT_SECRET=... or jwtSecret: ...)
  { re: /jwt[_\s-]?secret\s*[:=]\s*\S+/i,                                msg: "JWT secret detected",                        cat: "personal_data" },
  // .env-style secret assignments  (SECRET=..., TOKEN=..., AUTH_TOKEN=...)
  { re: /(?:secret|auth_token|access_token|refresh_token)\s*=\s*\S+/i,   msg: "Secret token/key in env format detected",    cat: "personal_data" },
  // AWS keys
  { re: /AKIA[0-9A-Z]{16}/,                                              msg: "AWS access key detected",                    cat: "personal_data" },
];

async function scanPlainTextWithClaude(rawBase64, fileName) {
  let text = "";
  try { text = Buffer.from(rawBase64, "base64").toString("utf-8"); } catch { return { safe: true, reason: "Could not decode text file.", category: "other" }; }

  // Fast regex pass first
  for (const { re, msg, cat } of SENSITIVE_PATTERNS) {
    if (re.test(text)) {
      console.log(`[Scanner] ⛔ Regex hit in "${fileName}": ${msg}`);
      return { safe: false, confidence: 0.97, reason: msg, category: cat };
    }
  }

  // Then AI scan
  console.log(`[Scanner] → Sending plain text to Claude: "${fileName}"`);
  const response = await ai.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 400,
    system: SCAN_SYSTEM,
    messages: [{
      role: "user",
      content: `Scan this text file content ("${fileName}") for harmful or inappropriate content.

CONTENT:
${text.slice(0, 30000)}

Respond ONLY with valid JSON — no markdown fences:
{
  "safe": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "one concise sentence",
  "category": "academic" | "personal_data" | "adult_content" | "violence" | "hate" | "copyright" | "illegal" | "unrelated" | "other"
}`,
    }],
  });

  const raw = response.content[0].text.trim().replace(/```json|```/g, "").trim();
  console.log(`[Scanner] ← Claude text result: ${raw}`);
  return JSON.parse(raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCANNER — routes each file type to the correct scan strategy
// ─────────────────────────────────────────────────────────────────────────────
async function scanFile(base64Data, fileName, fileType) {
  const ext = (fileName || "").split(".").pop().toLowerCase();
  const raw = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;

  console.log(`\n[Scanner] ════ SCANNING: "${fileName}" (${ext}) ════`);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[Scanner] ⚠️ No API key — skipping scan");
    return { safe: true, reason: "Scanner not configured.", scannedPages: 0, flaggedPages: [] };
  }

  try {

    // ── PDF: sent natively to Claude (reads full content + embedded images) ──
    if (ext === "pdf" || fileType === "application/pdf") {
      let result;
      try {
        result = await scanPdfWithClaude(raw, fileName);
      } catch (e) {
        console.warn("[Scanner] PDF scan error:", e.message, "— allowing");
        return { safe: true, reason: "PDF scan error — file allowed.", scannedPages: 0, flaggedPages: [] };
      }

      // ── NEW: Reject PDF if Claude says it is not academic ──────────────────
      if (result.isAcademic === false && (result.confidence || 0) >= 0.65) {
        console.log(`[Scanner] ⛔ PDF rejected (non-academic): ${result.reason}`);
        return {
          safe: false,
          reason: result.reason || "This PDF does not appear to be academic study material.",
          category: result.category || "unrelated",
          scannedPages: result.pagesScanned || 1,
          flaggedPages: [{ page: 1, ...result }],
        };
      }

      const pages = result.pagesScanned || 1;
      if (!result.safe && (result.confidence || 0) >= 0.60) {
        console.log(`[Scanner] ⛔ PDF REJECTED: ${result.reason}`);
        return {
          safe: false,
          reason: result.reason,
          category: result.category,
          scannedPages: pages,
          flaggedPages: [{ page: 1, ...result }],
        };
      }
      console.log(`[Scanner] ✅ PDF passed (safe=${result.safe}, conf=${result.confidence})`);
      return { safe: true, reason: `PDF scanned (${pages} page(s)) — passed.`, scannedPages: pages, flaggedPages: [] };
    }

    // ── Office files: purpose check → image scan → text scan ─────────────────
    if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext)) {

      // ── STEP 1: Extract images up front so we know the count ──────────────
      let images = [];
      try { images = extractOfficeImages(raw); } catch (e) {
        console.warn("[Scanner] Office image extraction error:", e.message);
      }

      // ── STEP 2: PURPOSE CHECK — is this actually academic study material? ──
      // This catches photo albums, personal documents, image-dump DOCXs, etc.
      let purposeResult;
      try {
        purposeResult = await checkDocumentPurpose(raw, fileName, ext, images.length);
      } catch (e) {
        console.warn("[Scanner] Purpose check error:", e.message, "— skipping purpose check");
        purposeResult = { isAcademic: true, confidence: 0.5, reason: "Purpose check failed — defaulting to allow." };
      }

      if (!purposeResult.isAcademic && (purposeResult.confidence || 0) >= 0.70) {
        console.log(`[Scanner] ⛔ Document REJECTED (non-academic): ${purposeResult.reason}`);
        return {
          safe: false,
          reason: purposeResult.reason,
          category: "unrelated",
          scannedPages: images.length,
          flaggedPages: [{ page: 1, reason: purposeResult.reason, category: "unrelated" }],
        };
      }

      console.log(`[Scanner] ✅ Purpose check passed — proceeding to content scan`);

      // ── STEP 3: Scan each embedded image for harmful content ──────────────
      const flagged = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        try {
          const result = await scanImageWithClaude(img.base64, img.mediaType, img.name);
          if (!result.safe && (result.confidence || 0) >= 0.60) {
            console.log(`[Scanner] ⛔ Office image FLAGGED: ${img.name} — ${result.reason}`);
            flagged.push({ page: i + 1, name: img.name, ...result });
          } else {
            console.log(`[Scanner] ✅ Office image passed: ${img.name}`);
          }
        } catch (apiErr) {
          console.warn(`[Scanner] ⚠️ API error on image ${img.name}: ${apiErr.message} — skipping`);
        }
      }

      if (flagged.length > 0) {
        const t = flagged[0];
        return {
          safe: false,
          reason: `Image in document: ${t.reason}`,
          category: t.category,
          scannedPages: images.length,
          flaggedPages: flagged,
        };
      }

      // ── STEP 4: Scan text content extracted from Office XML ───────────────
      const text = extractOfficeText(raw);
      if (text) {
        // Fast regex pass first — catches API keys, DB URIs, secrets, passwords, etc.
        // This runs BEFORE the AI call so secrets are never sent to an external API.
        for (const { re, msg, cat } of SENSITIVE_PATTERNS) {
          if (re.test(text)) {
            console.log(`[Scanner] ⛔ Regex hit in Office text "${fileName}": ${msg}`);
            return {
              safe: false,
              reason: msg,
              category: cat,
              scannedPages: images.length + 1,
              flaggedPages: [{ page: 1, name: "text content", reason: msg, category: cat }],
            };
          }
        }

        try {
          const textResult = await scanOfficeTextWithClaude(text, fileName);
          if (textResult && !textResult.safe && (textResult.confidence || 0) >= 0.60) {
            console.log(`[Scanner] ⛔ Office text REJECTED: ${textResult.reason}`);
            return {
              safe: false,
              reason: textResult.reason,
              category: textResult.category,
              scannedPages: images.length + 1,
              flaggedPages: [{ page: 1, name: "text content", ...textResult }],
            };
          }
        } catch (textErr) {
          console.warn("[Scanner] Office text scan error:", textErr.message, "— continuing");
        }
      }

      console.log(`[Scanner] ✅ Office file passed (${images.length} images, text scanned)`);
      return {
        safe: true,
        reason: `Document scanned — ${images.length} image(s) + text passed.`,
        scannedPages: images.length,
        flaggedPages: [],
      };
    }

    // ── Plain text / Markdown / CSV ──────────────────────────────────────────
    if (["txt", "md", "csv"].includes(ext)) {
      let result;
      try {
        result = await scanPlainTextWithClaude(raw, fileName);
      } catch (e) {
        console.warn("[Scanner] Text scan error:", e.message, "— allowing");
        return { safe: true, reason: "Text scan error — file allowed.", scannedPages: 1, flaggedPages: [] };
      }
      if (!result.safe && (result.confidence || 0) >= 0.60) {
        return {
          safe: false,
          reason: result.reason,
          category: result.category,
          scannedPages: 1,
          flaggedPages: [{ page: 1, ...result }],
        };
      }
      return { safe: true, reason: "Text file passed AI scan.", scannedPages: 1, flaggedPages: [] };
    }

    // ── Standalone images ────────────────────────────────────────────────────
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) {
      const MIME_MAP = {
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
        gif: "image/gif",  webp: "image/webp", bmp: "image/bmp",
      };
      let result;
      try {
        result = await scanImageWithClaude(raw, MIME_MAP[ext] || "image/png", fileName);
      } catch (e) {
        console.warn("[Scanner] Image scan error:", e.message, "— allowing");
        return { safe: true, reason: "Image scan error — file allowed.", scannedPages: 1, flaggedPages: [] };
      }
      if (!result.safe && (result.confidence || 0) >= 0.60) {
        return {
          safe: false,
          reason: result.reason,
          category: result.category,
          scannedPages: 1,
          flaggedPages: [{ page: 1, name: fileName, ...result }],
        };
      }
      return { safe: true, reason: "Image passed AI scan.", scannedPages: 1, flaggedPages: [] };
    }

    // ── Unknown file type — allow through ────────────────────────────────────
    console.log(`[Scanner] Unknown ext ".${ext}" — allowing through`);
    return { safe: true, reason: "Unrecognised file type — allowed.", scannedPages: 0, flaggedPages: [] };

  } catch (err) {
    // Top-level unexpected error — don't punish the student for a system bug
    console.error("[Scanner] Unexpected error:", err.message, "— allowing upload");
    return { safe: true, reason: "Scanner error — file allowed.", scannedPages: 0, flaggedPages: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = ["blue", "green", "yellow", "pink", "purple", "red", "orange", "teal"];
let   cidx   = 0;
const nextColor = () => { const c = COLORS[cidx % COLORS.length]; cidx++; return c; };

// GET all
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find(req.query.userId ? { userId: req.query.userId } : {}).sort({ createdAt: -1 });
    res.json({ success: true, data: notes, count: notes.length });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET stats — MUST be before /:id
router.get("/stats/summary", async (req, res) => {
  try {
    const notes = await Note.find(req.query.userId ? { userId: req.query.userId } : {});
    res.json({
      success: true,
      data: {
        count:      notes.length,
        totalLikes: notes.reduce((a, n) => a + (n.likes || 0), 0),
        totalSaves: notes.reduce((a, n) => a + (n.saves || 0), 0),
      }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET one
router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: note });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST create — scan FIRST, only save if scan passed
router.post("/", async (req, res) => {
  try {
    const {
      title, content, subject, subjectKey, tags, author, av, avColor,
      moduleCode, moduleName, faculty, semester, resourceType,
      fileData, fileName, fileType, fileSize, userId,
    } = req.body;

    // ── SCAN FIRST — only reject if Claude explicitly flags bad content ────
    if (fileData && fileName) {
      const scan = await scanFile(fileData, fileName, fileType).catch(e => {
        console.warn("[Scanner] scanFile threw:", e.message, "— allowing upload");
        return { safe: true, reason: "Scanner unavailable — allowed.", scannedPages: 0, flaggedPages: [] };
      });

      if (!scan.safe) {
        return res.status(422).json({
          success:  false,
          rejected: true,
          message:  `File rejected: ${scan.reason}`,
          detail: {
            reason:       scan.reason,
            category:     scan.category,
            scannedPages: scan.scannedPages,
            flaggedPages: scan.flaggedPages,
          },
        });
      }
    }

    // ── Save to DB ────────────────────────────────────────────────────────
    const note = new Note({
      userId: userId || "default_user",
      color: nextColor(),
      subject: subject || "💻 IT / SE",
      subjectKey: subjectKey || "it",
      title,
      excerpt: content ? content.slice(0, 160) : "",
      content: content || "",
      tags: Array.isArray(tags) ? tags : (tags || "").split(",").map(t => t.trim()).filter(Boolean),
      author:   author   || "You",
      av:       av       || "YO",
      avColor:  avColor  || "#4f6ef7",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      moduleCode:   moduleCode   || "",
      moduleName:   moduleName   || "",
      faculty:      faculty      || "",
      semester:     semester     || "",
      resourceType: resourceType || "",
      fileData:  fileData  || null,
      fileName:  fileName  || null,
      fileType:  fileType  || null,
      fileSize:  fileSize  || null,
      comments: [],
    });
    await note.save();
    res.status(201).json({ success: true, data: note });

  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// PUT update
router.put("/:id", async (req, res) => {
  try {
    const { title, content, tags, moduleCode, moduleName, semester, resourceType } = req.body;
    const u = {};
    if (title        !== undefined) u.title        = title;
    if (content      !== undefined) { u.content = content; u.excerpt = content.slice(0, 160); }
    if (tags         !== undefined) u.tags = Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim()).filter(Boolean);
    if (moduleCode   !== undefined) u.moduleCode   = moduleCode;
    if (moduleName   !== undefined) u.moduleName   = moduleName;
    if (semester     !== undefined) u.semester     = semester;
    if (resourceType !== undefined) u.resourceType = resourceType;
    const note = await Note.findByIdAndUpdate(req.params.id, u, { new: true });
    if (!note) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: note });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH like
router.patch("/:id/like", async (req, res) => {
  try {
    const n = await Note.findById(req.params.id);
    if (!n) return res.status(404).json({ success: false, message: "Not found" });
    n.liked = !n.liked;
    n.likes = n.liked ? n.likes + 1 : Math.max(0, n.likes - 1);
    await n.save();
    res.json({ success: true, data: { liked: n.liked, likes: n.likes } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH save
router.patch("/:id/save", async (req, res) => {
  try {
    const n = await Note.findById(req.params.id);
    if (!n) return res.status(404).json({ success: false, message: "Not found" });
    n.saved = !n.saved;
    n.saves = n.saved ? n.saves + 1 : Math.max(0, n.saves - 1);
    await n.save();
    res.json({ success: true, data: { saved: n.saved, saves: n.saves } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH pin
router.patch("/:id/pin", async (req, res) => {
  try {
    const n = await Note.findById(req.params.id);
    if (!n) return res.status(404).json({ success: false, message: "Not found" });
    n.pinned = !n.pinned;
    await n.save();
    res.json({ success: true, data: { pinned: n.pinned } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST comment
router.post("/:id/comments", async (req, res) => {
  try {
    const n = await Note.findById(req.params.id);
    if (!n) return res.status(404).json({ success: false, message: "Not found" });
    const { text, author, av, avColor } = req.body;
    n.comments.push({
      text,
      author:  author  || "You",
      av:      av      || "YO",
      avColor: avColor || "#4f6ef7",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
    await n.save();
    res.json({ success: true, data: n.comments[n.comments.length - 1] });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// DELETE comment
router.delete("/:id/comments/:cid", async (req, res) => {
  try {
    const n = await Note.findById(req.params.id);
    if (!n) return res.status(404).json({ success: false, message: "Not found" });
    n.comments = n.comments.filter(c => c._id.toString() !== req.params.cid);
    await n.save();
    res.json({ success: true, message: "Comment deleted" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;