const Anthropic = require("@anthropic-ai/sdk");
const AdmZip    = require("adm-zip");   // npm install adm-zip
const path      = require("path");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Extract all images from a DOCX/PPTX/XLSX (they are ZIP files) ────────────
const extractImagesFromOfficeFile = (buffer) => {
  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const images = [];
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"];

    for (const entry of entries) {
      const entryName = entry.entryName.toLowerCase();
      // Images live in word/media/, ppt/media/, xl/media/
      if (entryName.includes("/media/")) {
        const ext = path.extname(entryName);
        if (imageExts.includes(ext)) {
          const imgBuffer = entry.getData();
          const mimeMap = {
            ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".png": "image/png",  ".gif":  "image/gif",
            ".bmp": "image/bmp",  ".webp": "image/webp",
            ".tiff": "image/tiff",
          };
          images.push({
            name:      entry.entryName,
            base64:    imgBuffer.toString("base64"),
            mediaType: mimeMap[ext] || "image/jpeg",
          });
        }
      }
    }
    return images;
  } catch (err) {
    console.error("ZIP extraction error:", err.message);
    return [];
  }
};

// ── Scan a single image with Claude Vision ────────────────────────────────────
const scanImageWithClaude = async (base64, mediaType, fileName) => {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64 },
        },
        {
          type: "text",
          text: `You are a strict academic content moderator for a university student platform.
Carefully look at this image found inside a document file.

REJECT if the image contains ANY of:
- Pornographic, sexual, nudity, or adult content
- Graphic violence, gore, or disturbing imagery
- Hate symbols, racism, or discrimination
- Personal sensitive data (ID cards, passports, credit cards, phone numbers)
- Illegal content
- Completely irrelevant non-academic content (memes, personal photos unrelated to study)

ALLOW if it contains:
- Academic diagrams, charts, graphs, formulas
- Screenshots of code or software
- Educational illustrations
- Text-based study content

Respond ONLY in this exact JSON format (no markdown, no extra text):
{"approved": true/false, "category": "adult_content|violence|hate|personal_data|illegal|irrelevant|none", "reason": "brief reason if rejected or empty string if approved"}`,
        },
      ],
    }],
  });

  const text = response.content[0].text.trim().replace(/```json|```/g, "").trim();
  return JSON.parse(text);
};

// ── Main scanner — handles DOCX, PDF, and other file types ───────────────────
const scanFileWithClaude = async (base64Data, fileName, fileType) => {
  try {
    const ext = (fileName.split(".").pop() || "").toLowerCase();
    const pureBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const buffer = Buffer.from(pureBase64, "base64");

    // ── DOCX / PPTX / XLSX — extract and scan every embedded image ──────────
    if (["docx", "pptx", "xlsx"].includes(ext)) {
      const images = extractImagesFromOfficeFile(buffer);
      console.log(`📎 Found ${images.length} image(s) in ${fileName}`);

      if (images.length === 0) {
        // No images — just scan the text content
        const { execSync } = require("child_process");
        const fs = require("fs");
        const tmpPath = `/tmp/scan_${Date.now()}.${ext}`;
        fs.writeFileSync(tmpPath, buffer);
        let textContent = "";
        try {
          textContent = execSync(`pandoc "${tmpPath}" -t plain 2>/dev/null`, { timeout: 10000 }).toString().slice(0, 4000);
        } catch { textContent = ""; }
        fs.unlinkSync(tmpPath);

        if (!textContent.trim()) {
          return { approved: true, category: "none", reason: "", scannedPages: 0, flaggedPages: [] };
        }

        const response = await anthropic.messages.create({
          model: "claude-opus-4-5",
          max_tokens: 512,
          messages: [{
            role: "user",
            content: `Academic content moderator. Scan this text from "${fileName}" for: pornographic/sexual content, graphic violence, hate speech, illegal content, or completely non-academic material. Allow lecture notes, assignments, study guides.

Text: ${textContent}

Respond ONLY as JSON: {"approved": true/false, "category": "adult_content|violence|hate|personal_data|illegal|irrelevant|none", "reason": "explanation if rejected or empty if approved", "scannedPages": 1, "flaggedPages": []}`,
          }],
        });
        const text = response.content[0].text.trim().replace(/```json|```/g, "").trim();
        return JSON.parse(text);
      }

      // ── Scan each image — stop immediately on first rejection ────────────
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        console.log(`🔍 Scanning image ${i + 1}/${images.length}: ${img.name}`);

        // For animated GIFs — only scan first frame to avoid huge payloads
        // adm-zip gives the raw GIF bytes, Claude can handle first frame
        const result = await scanImageWithClaude(img.base64, img.mediaType, img.name);

        if (!result.approved) {
          return {
            approved:     false,
            category:     result.category,
            reason:       result.reason || "Inappropriate image found inside document.",
            scannedPages: i + 1,
            flaggedPages: [i + 1],
          };
        }
      }

      return { approved: true, category: "none", reason: "", scannedPages: images.length, flaggedPages: [] };
    }

    // ── PDF — send directly to Claude as document ────────────────────────────
    if (ext === "pdf") {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: pureBase64 },
            },
            {
              type: "text",
              text: `Academic content moderator. Scan every page of this PDF for: pornographic/sexual content, graphic violence, hate speech, personal sensitive data (IDs, cards), illegal content, or completely non-academic material. Allow lecture notes, assignments, past papers, study guides, academic diagrams.

Respond ONLY as JSON (no markdown):
{"approved": true/false, "category": "adult_content|violence|hate|personal_data|copyright|illegal|other|none", "reason": "explanation if rejected or empty if approved", "scannedPages": page_count, "flaggedPages": [page_numbers]}`,
            },
          ],
        }],
      });
      const text = response.content[0].text.trim().replace(/```json|```/g, "").trim();
      return JSON.parse(text);
    }

    // ── TXT / MD — text only ─────────────────────────────────────────────────
    const textContent = buffer.toString("utf-8", 0, 5000);
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `Academic content moderator. Scan: "${textContent}". Reject: sexual content, violence, hate, illegal, personal data. Allow academic content. JSON only: {"approved": true/false, "category": "...", "reason": "...", "scannedPages": 1, "flaggedPages": []}`,
      }],
    });
    const text = response.content[0].text.trim().replace(/```json|```/g, "").trim();
    return JSON.parse(text);

  } catch (err) {
    console.error("Scan error:", err.message);
    return { approved: false, category: "other", reason: "File could not be scanned. Please try again.", scannedPages: 0, flaggedPages: [] };
  }
};