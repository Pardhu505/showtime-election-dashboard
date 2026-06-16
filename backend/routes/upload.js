const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const getElectionModel = require('../models/Election');
const getCasteModel = require('../models/Caste');
const getBoothModel = require('../models/Booth');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls', '.json'];
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only CSV, Excel, and JSON files allowed'));
  }
});

// POST /api/upload/election — upload full election dataset
router.post('/election', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { year, type, state, phase } = req.body;
    if (!year || !type || !state) return res.status(400).json({ error: 'year, type, state required' });

    let records = [];
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      records = parse(req.file.buffer.toString(), { columns: true, skip_empty_lines: true, trim: true });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      records = XLSX.utils.sheet_to_json(ws, { defval: '' });
    } else if (ext === 'json') {
      records = JSON.parse(req.file.buffer.toString());
    }

    // Parse records into constituencies
    const constituencyMap = {};
    for (const row of records) {
      const cName = row['Constituency Name'] || row['constituency_name'] || row['CONSTITUENCY'];
      const cType = (row['Constituency Type'] || row['constituency_type'] || 'AC').toUpperCase() === 'PC' ? 'PC' : 'AC';
      const key = cName;

      if (!constituencyMap[key]) {
        constituencyMap[key] = {
          constituencyName: cName,
          constituencyType: cType,
          parentConstituency: row['Parliament Constituency'] || row['parent_constituency'] || '',
          state,
          totalVoters: Number(row['Total Voters'] || row['total_voters'] || 0),
          totalVotesCast: Number(row['Total Votes Cast'] || row['total_votes_cast'] || 0),
          turnout: Number(row['Turnout'] || row['turnout'] || 0),
          latitude: Number(row['Latitude'] || row['lat'] || 0),
          longitude: Number(row['Longitude'] || row['lng'] || row['lon'] || 0),
          candidates: [],
        };
      }

      const votes = Number(row['Votes'] || row['votes'] || row['VOTES'] || 0);
      const candidate = {
        name: row['Candidate Name'] || row['candidate_name'] || row['CANDIDATE'],
        party: row['Party'] || row['party'] || row['PARTY'] || 'Independent',
        partyAbbr: row['Party Abbr'] || row['party_abbr'] || '',
        partyColor: row['Party Color'] || row['party_color'] || PARTY_COLORS[row['Party']] || '#666',
        votes,
        voteShare: Number(row['Vote Share'] || row['vote_share'] || 0),
        isWinner: (row['Winner'] || row['winner'] || '').toLowerCase() === 'yes' || (row['Position'] || row['position'] || '') == '1',
        gender: row['Gender'] || row['gender'] || 'M',
        age: Number(row['Age'] || row['age'] || 0),
        criminal_cases: Number(row['Criminal Cases'] || row['criminal_cases'] || 0),
      };
      constituencyMap[key].candidates.push(candidate);
    }

    // Calculate winners and totals
    const constituencies = Object.values(constituencyMap).map(c => {
      c.candidates.sort((a, b) => b.votes - a.votes);
      const winner = c.candidates.find(x => x.isWinner) || c.candidates[0];
      const runnerUp = c.candidates[1];
      if (winner) {
        winner.isWinner = true;
        winner.margin = runnerUp ? winner.votes - runnerUp.votes : winner.votes;
        c.winner = {
          name: winner.name,
          party: winner.party,
          partyAbbr: winner.partyAbbr,
          partyColor: winner.partyColor,
          votes: winner.votes,
          margin: winner.margin,
          voteShare: winner.voteShare,
        };
      }
      if (!c.totalVotesCast) c.totalVotesCast = c.candidates.reduce((s, x) => s + x.votes, 0);
      if (!c.turnout && c.totalVoters) c.turnout = (c.totalVotesCast / c.totalVoters) * 100;
      return c;
    });

    // Party summary
    const partyMap = {};
    for (const c of constituencies) {
      for (const cand of c.candidates) {
        if (!partyMap[cand.party]) {
          partyMap[cand.party] = { party: cand.party, partyAbbr: cand.partyAbbr, partyColor: cand.partyColor, seatsWon: 0, seatsContested: 0, totalVotes: 0, voteShare: 0 };
        }
        partyMap[cand.party].seatsContested++;
        partyMap[cand.party].totalVotes += cand.votes;
        if (cand.isWinner) partyMap[cand.party].seatsWon++;
      }
    }
    const totalVotes = Object.values(partyMap).reduce((s, p) => s + p.totalVotes, 0);
    const partySummary = Object.values(partyMap).map(p => ({
      ...p, voteShare: totalVotes ? (p.totalVotes / totalVotes * 100).toFixed(2) : 0,
    })).sort((a, b) => b.seatsWon - a.seatsWon);

    // Pick the right database for this election type
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'MongoDB is not connected. Configure MONGO_URI in backend/.env and restart.' });
    }
    if (!req.app.locals.dbs) {
      return res.status(503).json({ error: 'Database handles not initialised.' });
    }
    const db = type === 'Lok Sabha' ? req.app.locals.dbs.loksabha : req.app.locals.dbs.assembly;
    const Election = getElectionModel(db);

    // Upsert election
    const el = await Election.findOneAndUpdate(
      { year: Number(year), type, state },
      {
        year: Number(year), type, state,
        phase: Number(phase) || 1,
        totalSeats: constituencies.length,
        constituencies,
        partySummary,
        status: 'Declared',
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: `Uploaded ${constituencies.length} constituencies`, electionId: el._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PARTY_COLORS = {
  'BJP': '#FF6B00', 'INC': '#00A651', 'AAP': '#00BFFF', 'BSP': '#1565C0',
  'SP': '#E53935', 'TMC': '#26A69A', 'CPI(M)': '#C62828', 'NCP': '#F9A825',
  'SS': '#FF8F00', 'JDU': '#00897B', 'TDP': '#FFD600', 'YSRCP': '#6A1B9A',
  'DMK': '#E91E63', 'AIADMK': '#00ACC1', 'Independent': '#757575',
};

// =========================================================================
// POST /api/upload/caste — bulk upload caste demographics (CSV / XLSX / JSON)
// Expected columns (case-insensitive): state, district, caste, populationPct
// =========================================================================
router.post('/caste', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (mongoose.connection.readyState !== 1 || !req.app.locals.dbs) {
      return res.status(503).json({ error: 'MongoDB is not connected.' });
    }

    let records = [];
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      records = parse(req.file.buffer.toString(), { columns: true, skip_empty_lines: true, trim: true });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      records = XLSX.utils.sheet_to_json(ws, { defval: '' });
    } else if (ext === 'json') {
      records = JSON.parse(req.file.buffer.toString());
    } else {
      return res.status(400).json({ error: `Unsupported extension: .${ext}` });
    }

    // Normalise — accept multiple column-name variants
    const pick = (row, keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== '') return row[k];
        // Also try case-insensitive
        for (const rk of Object.keys(row)) {
          if (rk.toLowerCase() === k.toLowerCase() && row[rk] !== '') return row[rk];
        }
      }
      return undefined;
    };

    const docs = records.map(r => ({
      state:         String(pick(r, ['state', 'State', 'STATE']) || '').trim(),
      district:      String(pick(r, ['district', 'District', 'DISTRICT']) || '').trim(),
      caste:         String(pick(r, ['caste', 'Caste', 'caste_name', 'Caste Name', 'CASTE']) || '').trim(),
      populationPct: Number(pick(r, ['populationPct', 'population_pct', 'Population (%)', 'Population%', 'population%', 'Population', 'population']) || 0),
    })).filter(d => d.state && d.district && d.caste);

    if (!docs.length) return res.status(400).json({ error: 'No valid rows found. Expected columns: state, district, caste, populationPct' });

    const Caste = getCasteModel(req.app.locals.dbs.caste);

    // Bulk upsert by (state, district, caste)
    const ops = docs.map(d => ({
      updateOne: {
        filter: { state: d.state, district: d.district, caste: d.caste },
        update: { $set: d },
        upsert: true,
      },
    }));
    const result = await Caste.bulkWrite(ops, { ordered: false });

    res.json({
      success: true,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      totalRows: docs.length,
      message: `Saved ${docs.length} caste rows (${result.upsertedCount} new, ${result.modifiedCount} updated).`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// POST /api/upload/booth — upload booth-level JSON data
// Expected format: JSON array of objects. Collection named as State_Year_Type
// =========================================================================
router.post('/booth', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (mongoose.connection.readyState !== 1 || !req.app.locals.dbs) {
      return res.status(503).json({ error: 'MongoDB is not connected.' });
    }

    const { year, type, state } = req.body;
    if (!year || !type || !state) return res.status(400).json({ error: 'year, type, state required' });

    let records = [];
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    if (ext === 'json') {
      records = JSON.parse(req.file.buffer.toString());
    } else {
      return res.status(400).json({ error: 'Only JSON files supported for booth-level data' });
    }

    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'JSON must be an array of objects' });
    }

    // Organised collection name: State_Year_Type (normalised)
    const norm = (s) => s.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const collectionName = `${norm(state)}_${norm(year)}_${norm(type)}`;

    const Booth = getBoothModel(req.app.locals.dbs.booth, collectionName);

    // For booth level data, we usually want to clear and replace, or just insert new ones.
    // The request says "the data should get save in MongoDB in organised folder".
    // We'll insert all records.
    await Booth.deleteMany({}); // Clear existing for this specific dataset
    const result = await Booth.insertMany(records);

    res.json({
      success: true,
      count: result.length,
      collection: collectionName,
      message: `Successfully uploaded ${result.length} booth records to ${collectionName}.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
