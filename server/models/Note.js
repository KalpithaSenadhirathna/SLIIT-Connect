// backend/models/Note.js
// ── ADD these two fields to your existing Note schema ────────────────────────
// Find your noteSchema definition and add:

//   archived:   { type: Boolean, default: false },
//   archivedAt: { type: Date,    default: null  },

// Example — your full schema should look like this:
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text:     String,
  author:   String,
  av:       String,
  avColor:  String,
  date:     String,
}, { timestamps: true });

const noteSchema = new mongoose.Schema({
  userId:       { type: String, default: "default_user" },
  color:        { type: String, default: "blue" },
  subject:      String,
  subjectKey:   String,
  title:        { type: String, required: true },
  excerpt:      String,
  content:      String,
  tags:         [String],
  author:       String,
  av:           String,
  avColor:      String,
  date:         String,
  moduleCode:   String,
  moduleName:   String,
  faculty:      String,
  semester:     String,
  resourceType: String,
  fileData:     String,
  fileName:     String,
  fileType:     String,
  fileSize:     Number,
  likes:        { type: Number, default: 0 },
  saves:        { type: Number, default: 0 },
  liked:        { type: Boolean, default: false },
  saved:        { type: Boolean, default: false },
  pinned:       { type: Boolean, default: false },
  comments:     [commentSchema],
  // ── NEW: Archive fields ──────────────────────────────────────────────────
  archived:     { type: Boolean, default: false },
  archivedAt:   { type: Date,    default: null  },
}, { timestamps: true });

module.exports = mongoose.model("Note", noteSchema);