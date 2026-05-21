const mongoose = require('mongoose');
const { Schema } = mongoose;

const CasteSchema = new Schema({
  state:         { type: String, required: true, index: true },
  district:      { type: String, required: true, index: true },
  caste:         { type: String, required: true },
  populationPct: { type: Number, required: true },
  notes:         { type: String },
}, { timestamps: true });

CasteSchema.index({ state: 1, district: 1, caste: 1 }, { unique: true });

module.exports = function getCasteModel(db) {
  return db.models.Caste || db.model('Caste', CasteSchema);
};

module.exports.CasteSchema = CasteSchema;
