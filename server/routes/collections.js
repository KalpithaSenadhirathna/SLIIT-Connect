// backend/routes/collections.js
// CRITICAL FIX: /check-duplicate, /archive/:id, /restore/:id, /archived
// MUST be defined BEFORE /:id routes — Express matches top to bottom
const express    = require("express");
const router     = express.Router();
const Collection = require("../models/Collection");
const Note       = require("../models/Note");

// ─────────────────────────────────────────────────────────────────────────────
// SPECIFIC NAMED ROUTES FIRST (before any /:id param routes)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/collections?userId=xxx
router.get("/", async (req, res) => {
  try {
    const cols = await Collection.find({ userId: req.query.userId || "default_user" }).sort({ createdAt: -1 });
    res.json({ success: true, data: cols });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/collections/archived?userId=xxx
router.get("/archived", async (req, res) => {
  try {
    const notes = await Note.find(
      { userId: req.query.userId || "default_user", archived: true },
      { fileData: 0 }
    ).sort({ archivedAt: -1 });
    res.json({ success: true, data: notes });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/collections  (create collection)
router.post("/", async (req, res) => {
  try {
    const { userId, name, icon, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: "Name required." });
    const col = await Collection.create({
      userId: userId || "default_user",
      name: name.trim(), icon: icon || "📁", color: color || "blue",
    });
    res.status(201).json({ success: true, data: col });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// ── POST /api/collections/check-duplicate ────────────────────────────────────
// MUST be before /:id routes
router.post("/check-duplicate", async (req, res) => {
  try {
    const { userId, title, content } = req.body;
    const uid = userId || "default_user";

    console.log(`[check-duplicate] userId=${uid} title="${title?.slice(0,40)}"`);

    // Get all non-archived notes for this user (exclude fileData for speed)
    const notes = await Note.find(
      { userId: uid, archived: { $ne: true } },
      { title: 1, content: 1, excerpt: 1, _id: 1 }
    );

    console.log(`[check-duplicate] Comparing against ${notes.length} existing notes`);

    if (notes.length === 0) {
      return res.json({ success: true, isDuplicate: false, matches: [] });
    }

    const normalize = (str) =>
      (str || "").toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const STOP = new Set([
      "the","a","an","and","or","but","in","on","at","to","for","of","with",
      "is","are","was","were","be","been","being","have","has","had","do",
      "does","did","will","would","could","should","may","might","shall",
      "can","need","this","that","these","those","it","its","not","from",
      "by","as","into","through","about","after","before","between","each",
      "both","more","also","than","then","some","very","just","over","such",
      "many","like","here","time","used","using","often","called","known"
    ]);

    const toWords = (str) => {
      const words = normalize(str).split(" ").filter(w => w.length > 2 && !STOP.has(w));
      return new Set(words);
    };

    const jaccard = (setA, setB) => {
      if (setA.size === 0 || setB.size === 0) return 0;
      let inter = 0;
      setA.forEach(w => { if (setB.has(w)) inter++; });
      const union = setA.size + setB.size - inter;
      return union === 0 ? 0 : inter / union;
    };

    const inTitle   = toWords(title);
    const inContent = toWords(content);

    const matches = notes
      .map(n => {
        const tSim = jaccard(inTitle,   toWords(n.title));
        const cSim = jaccard(inContent, toWords(n.content || n.excerpt || ""));
        // Title is 60%, content is 40%
        const score = tSim * 0.6 + cSim * 0.4;
        const pct   = Math.round(score * 100);
        return { _id: n._id, title: n.title, similarity: pct, tSim: Math.round(tSim*100), cSim: Math.round(cSim*100) };
      })
      .filter(m => m.similarity >= 50)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    console.log(`[check-duplicate] Matches found: ${matches.length}`, matches.map(m=>`${m.title}(${m.similarity}%)`));

    res.json({ success: true, isDuplicate: matches.length > 0, matches });
  } catch (e) {
    console.error("[check-duplicate] ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /api/collections/auto-archive ───────────────────────────────────────
router.post("/auto-archive", async (req, res) => {
  try {
    const { userId } = req.body;
    const CURRENT = ["Y3S1","Y3S2","Y4S1","Y4S2"];
    const result = await Note.updateMany(
      { userId: userId || "default_user", archived: { $ne: true }, semester: { $nin: CURRENT } },
      { archived: true, archivedAt: new Date() }
    );
    res.json({ success: true, archivedCount: result.modifiedCount });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PATCH /api/collections/archive/:noteId ───────────────────────────────────
router.patch("/archive/:noteId", async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.noteId,
      { archived: true, archivedAt: new Date() },
      { new: true }
    );
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });
    res.json({ success: true, data: note });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── PATCH /api/collections/restore/:noteId ───────────────────────────────────
router.patch("/restore/:noteId", async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.noteId,
      { archived: false, archivedAt: null },
      { new: true }
    );
    if (!note) return res.status(404).json({ success: false, message: "Note not found." });
    res.json({ success: true, data: note });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// /:id PARAM ROUTES — must come AFTER all named routes above
// ─────────────────────────────────────────────────────────────────────────────

// DELETE /api/collections/:id
router.delete("/:id", async (req, res) => {
  try {
    await Collection.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted." });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /api/collections/:id  (rename)
router.put("/:id", async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    const col = await Collection.findByIdAndUpdate(req.params.id, { name, icon, color }, { new: true });
    if (!col) return res.status(404).json({ success: false, message: "Not found." });
    res.json({ success: true, data: col });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// PATCH /api/collections/:id/add
router.patch("/:id/add", async (req, res) => {
  try {
    const { noteId } = req.body;
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ success: false, message: "Not found." });
    if (!col.noteIds.includes(noteId)) col.noteIds.push(noteId);
    await col.save();
    res.json({ success: true, data: col });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// PATCH /api/collections/:id/remove
router.patch("/:id/remove", async (req, res) => {
  try {
    const { noteId } = req.body;
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ success: false, message: "Not found." });
    col.noteIds = col.noteIds.filter(n => n.toString() !== noteId);
    await col.save();
    res.json({ success: true, data: col });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

module.exports = router;