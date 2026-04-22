const createNote = async (req, res) => {
  try {
    const { fileData, fileName, fileType, ...rest } = req.body;

    // ── Scan the file if one was uploaded ───────────────────────────────────
    if (fileData && fileName) {
      console.log(`🔍 Scanning file: ${fileName}`);
      const scanResult = await scanFileWithClaude(fileData, fileName, fileType);
      console.log("Scan result:", scanResult);

      if (!scanResult.approved) {
        // Return rejection — frontend RejectionModal will show this
        return res.status(200).json({
          success: false,
          rejected: true,
          message: scanResult.reason || "File rejected by AI content scanner.",
          detail: {
            category:     scanResult.category,
            reason:       scanResult.reason,
            scannedPages: scanResult.scannedPages,
            flaggedPages: scanResult.flaggedPages || [],
          },
        });
      }
    }

    // ── File passed scan — save to DB ────────────────────────────────────────
    const note = await Note.create({ fileData, fileName, fileType, ...rest });
    return res.status(201).json({ success: true, data: note });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};