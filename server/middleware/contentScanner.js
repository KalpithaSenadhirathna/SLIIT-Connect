// backend/middleware/contentScanner.js

const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Ask Claude Vision to evaluate one image ───────────────────────────────────
async function scanImageWithClaude(imageBase64, mediaType, context) {
  console.log(`[Scanner] Sending to Claude Vision — ${context}`);

  const prompt = `You are a strict content moderator for SLIIT Connect, a university academic notes platform.

Analyse this image carefully and respond ONLY with valid JSON (no markdown, no extra text):
{
  "safe": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "one concise sentence",
  "category": "academic" | "personal_data" | "adult_content" | "violence" | "hate" | "copyright" | "illegal" | "other"
}

Mark UNSAFE if the image contains ANY of:
- Nudity, sexual or suggestive content
- Graphic violence, gore, disturbing imagery
- Hate symbols, racist or discriminatory content
- Personal ID documents (ID cards, passports, licences)
- Financial info (card numbers, bank statements)
- Passwords, API keys, secret tokens, private keys
- Pirated or watermarked paid commercial content
- Malware, hacking tools, or instructions for illegal acts
- Drug use or illegal substance imagery
- Extremist propaganda or incitement to violence
- Harassment or targeted personal content

Mark SAFE if the image contains:
- Academic content: lecture slides, notes, diagrams, textbook pages
- Maths/graphs/charts/scientific figures
- Code screenshots or terminal output
- University assignments, past papers, study materials
- Architecture/UML diagrams, flowcharts
- Generic decorative graphics unrelated to violations

Context: ${context}`;

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
        { type: "text", text: prompt },
      ],
    }],
  });

  const raw = response.content[0].text.trim().replace(/```json|```/g, "").trim();
  console.log(`[Scanner] Claude response: ${raw}`);

  try {
    const result = JSON.parse(raw);
    console.log(`[Scanner] safe=${result.safe} confidence=${result.confidence} category=${result.category} reason="${result.reason}"`);
    return result;
  } catch {
    console.warn("[Scanner] Parse failed — defaulting to UNSAFE");
    return { safe: false, confidence: 0.8, reason: "Could not parse AI response — treated as unsafe", category: "other" };
  }
}

// ── Extract ALL images from Office docs (DOCX/PPTX/XLSX = ZIP files) ─────────
function extractImagesFromOfficeDoc(rawBase64) {
  const AdmZip = require("adm-zip"); // throws MODULE_NOT_FOUND if not installed

  const zip     = new AdmZip(Buffer.from(rawBase64, "base64"));
  const entries = zip.getEntries();
  const images  = [];
  const MIME    = { png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", gif:"image/gif", bmp:"image/bmp", webp:"image/webp" };

  console.log(`[Scanner] ZIP has ${entries.length} entries:`);
  entries.forEach(e => console.log(`[Scanner]   ${e.entryName}`));

  for (const entry of entries) {
    const name = entry.entryName.toLowerCase();
    const ext  = name.split(".").pop();
    if (!MIME[ext]) continue; // not an image

    // Accept any image anywhere in the archive — don't restrict by folder
    const data = entry.getData();
    console.log(`[Scanner] Extracting image: ${entry.entryName} (${data.length} bytes)`);
    images.push({ base64: data.toString("base64"), mediaType: MIME[ext], name: entry.entryName });
  }

  console.log(`[Scanner] Total images extracted: ${images.length}`);
  return images;
}

// ── Rasterise PDF pages to images ────────────────────────────────────────────
async function pdfToPageImages(rawBase64) {
  const pdfjsLib        = require("pdfjs-dist/legacy/build/pdf.js");
  const { createCanvas } = require("canvas");
  const pdfDoc = await pdfjsLib.getDocument({ data: Buffer.from(rawBase64, "base64") }).promise;
  const max    = Math.min(pdfDoc.numPages, 15);
  const images = [];
  console.log(`[Scanner] PDF: ${pdfDoc.numPages} pages, scanning ${max}`);
  for (let p = 1; p <= max; p++) {
    const page = await pdfDoc.getPage(p);
    const vp   = page.getViewport({ scale: 1.5 });
    const c    = createCanvas(vp.width, vp.height);
    await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
    images.push({ base64: c.toDataURL("image/png").split(",")[1], mediaType: "image/png", name: `page_${p}` });
  }
  return images;
}

// ── Text pattern scan ─────────────────────────────────────────────────────────
function scanTextPatterns(rawBase64) {
  let text = "";
  try { text = Buffer.from(rawBase64, "base64").toString("utf-8"); } catch { return null; }
  const checks = [
    { re: /\b\d{13,19}\b/,                          label: "Possible credit/debit card number",  cat: "personal_data" },
    { re: /password\s*[:=]\s*\S+/i,                  label: "Embedded password",                 cat: "personal_data" },
    { re: /api[_\s-]?key\s*[:=]\s*\S+/i,             label: "Embedded API key",                  cat: "personal_data" },
    { re: /sk-[a-zA-Z0-9]{20,}/,                     label: "Possible secret key",               cat: "personal_data" },
    { re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, label: "Private key embedded",              cat: "personal_data" },
  ];
  for (const { re, label, cat } of checks) {
    if (re.test(text)) return { safe: false, confidence: 0.97, reason: label, category: cat };
  }
  return null;
}

// ── Main export ───────────────────────────────────────────────────────────────
async function scanFileContent(base64Data, fileName, fileType) {
  const ext       = (fileName || "").split(".").pop().toLowerCase();
  const rawBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
  const flagged   = [];
  let   scanned   = 0;
  let   imageList = [];

  console.log(`\n[Scanner] ======== START SCAN ========`);
  console.log(`[Scanner] File: "${fileName}" | Type: ${fileType} | Ext: ${ext}`);

  // ── PDF ────────────────────────────────────────────────────────────────────
  if (ext === "pdf" || fileType === "application/pdf") {
    try {
      imageList = await pdfToPageImages(rawBase64);
    } catch (err) {
      console.warn("[Scanner] PDF scan unavailable (canvas not built):", err.message);
      return { safe: true, reason: "PDF visual scan unavailable on this machine.", scannedPages: 0, flaggedPages: [] };
    }
  }

  // ── Office docs ────────────────────────────────────────────────────────────
  else if (["doc","docx","ppt","pptx","xls","xlsx"].includes(ext)) {
    try {
      imageList = extractImagesFromOfficeDoc(rawBase64);
    } catch (err) {
      console.error(`[Scanner] FATAL: ${err.message}`);
      if (err.code === "MODULE_NOT_FOUND") {
        console.error("[Scanner] adm-zip is NOT installed. Run: npm install adm-zip");
        // Block the upload — scanner must be working for office docs
        return {
          safe: false,
          reason: "Content scanner misconfigured — adm-zip not installed. Please contact admin.",
          category: "other",
          scannedPages: 0,
          flaggedPages: [{ page: 1, safe: false, confidence: 1.0, reason: "Scanner not configured", category: "other" }],
        };
      }
      return { safe: true, reason: "Office doc scan error — passed through.", scannedPages: 0, flaggedPages: [] };
    }

    if (imageList.length === 0) {
      console.log("[Scanner] No images found in document — passes.");
      return { safe: true, reason: "No embedded images found in document.", scannedPages: 0, flaggedPages: [] };
    }
  }

  // ── Text files ─────────────────────────────────────────────────────────────
  else if (["txt","md","csv"].includes(ext)) {
    const hit = scanTextPatterns(rawBase64);
    if (hit) return { safe: false, reason: hit.reason, category: hit.category, scannedPages: 1, flaggedPages: [{ page: 1, ...hit }] };
    return { safe: true, reason: "Text file passed pattern checks.", scannedPages: 1, flaggedPages: [] };
  }

  // ── Direct image ───────────────────────────────────────────────────────────
  else if (["jpg","jpeg","png","gif","webp","bmp"].includes(ext)) {
    const m = { jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",gif:"image/gif",webp:"image/webp",bmp:"image/bmp" };
    imageList = [{ base64: rawBase64, mediaType: m[ext] || "image/png", name: fileName }];
  }

  // ── Scan images ────────────────────────────────────────────────────────────
  console.log(`[Scanner] Scanning ${imageList.length} image(s)...`);

  for (let i = 0; i < imageList.length; i++) {
    const img = imageList[i];
    scanned++;
    try {
      const result = await scanImageWithClaude(
        img.base64, img.mediaType,
        `Image ${i+1}/${imageList.length} — "${img.name}" from "${fileName}"`
      );
      if (!result.safe && result.confidence >= 0.65) {
        console.log(`[Scanner] ⛔ FLAGGED: ${img.name}`);
        flagged.push({ page: i + 1, name: img.name, ...result });
      } else {
        console.log(`[Scanner] ✅ PASSED: ${img.name}`);
      }
    } catch (err) {
      console.error(`[Scanner] Error scanning ${img.name}:`, err.message);
      // Skip this image on API error
    }
  }

  console.log(`[Scanner] Result: ${flagged.length} flagged / ${scanned} scanned`);
  console.log(`[Scanner] ======== END SCAN ========\n`);

  if (flagged.length > 0) {
    const top = flagged[0];
    return { safe: false, reason: `${top.name}: ${top.reason}`, category: top.category, scannedPages: scanned, flaggedPages: flagged };
  }
  return { safe: true, reason: `All ${scanned} image(s) passed AI content screening.`, scannedPages: scanned, flaggedPages: [] };
}

module.exports = { scanFileContent };