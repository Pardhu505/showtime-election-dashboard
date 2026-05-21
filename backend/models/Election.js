const mongoose = require('mongoose');
const { Schema } = mongoose;

const CandidateSchema = new Schema({
  name: String,
  party: String,
  partyAbbr: String,
  partyColor: String,
  votes: Number,
  voteShare: Number,
  isWinner: Boolean,
  margin: Number,
  gender: String,
  age: Number,
  criminal_cases: Number,
}, { _id: false });

const ConstituencySchema = new Schema({
  constituencyNo: Number,
  constituencyName: { type: String, index: true },
  constituencyType: String,
  parentConstituency: String,
  state: { type: String, index: true },
  totalVoters: Number,
  totalVotesCast: Number,
  turnout: Number,
  latitude: Number,
  longitude: Number,
  candidates: [CandidateSchema],
  winner: CandidateSchema,
}, { _id: false });

const PartySummarySchema = new Schema({
  party: String,
  partyAbbr: String,
  partyColor: String,
  seatsWon: Number,
  seatsContested: Number,
  totalVotes: Number,
  voteShare: Number,
  leading: Number,
}, { _id: false });

const ElectionSchema = new Schema({
  year:       { type: Number, required: true, index: true },
  type:       { type: String, required: true, index: true }, // 'Lok Sabha' | 'Assembly'
  state:      { type: String, required: true, index: true },
  totalSeats: Number,
  status:     { type: String, default: 'Declared' },
  constituencies: [ConstituencySchema],
  partySummary:   [PartySummarySchema],
}, { timestamps: true });

ElectionSchema.index({ year: 1, type: 1, state: 1 }, { unique: true });

/**
 * Returns (or registers) the Election model bound to a specific Mongoose
 * connection. We use this with `mongoose.connection.useDb(...)` so the
 * same schema can live in different databases (loksabha_db, assembly_db).
 */
module.exports = function getElectionModel(db) {
  return db.models.Election || db.model('Election', ElectionSchema);
};

module.exports.ElectionSchema = ElectionSchema;
