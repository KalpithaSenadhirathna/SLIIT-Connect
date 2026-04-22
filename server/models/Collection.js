// backend/models/Collection.js
const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema({
  userId:    { type: String, required: true, index: true },
  name:      { type: String, required: true, trim: true },
  icon:      { type: String, default: "📁" },
  color:     { type: String, default: "blue" },
  noteIds:   [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Collection", collectionSchema);