const mongoose = require('mongoose');
const { Schema } = mongoose;

const BoothSchema = new Schema({}, {
  strict: false,
  timestamps: true
});

/**
 * Returns (or registers) the Booth model bound to a specific Mongoose
 * connection. We use this to save booth-level data into dynamic collections
 * within the booth_db.
 */
module.exports = function getBoothModel(db, collectionName) {
  return db.models[collectionName] || db.model(collectionName, BoothSchema, collectionName);
};

module.exports.BoothSchema = BoothSchema;
