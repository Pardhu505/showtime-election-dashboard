const express = require('express');
const mongoose = require('mongoose');
const getCasteModel = require('../models/Caste');

const router = express.Router();
const useMock = () => mongoose.connection.readyState !== 1;

// Bundled fallback so the panel works even without a DB.
const MOCK_CASTE = [
  // A tiny subset — the frontend's bundled data covers the full sample
  { state: 'Uttar Pradesh', district: 'Lucknow',  caste: 'Brahmin',   populationPct: 14.2 },
  { state: 'Uttar Pradesh', district: 'Lucknow',  caste: 'Yadav',     populationPct: 11.4 },
  { state: 'Uttar Pradesh', district: 'Lucknow',  caste: 'Muslim',    populationPct: 16.4 },
  { state: 'Madhya Pradesh', district: 'Bhopal',  caste: 'OBC',       populationPct: 35.7 },
  { state: 'Madhya Pradesh', district: 'Bhopal',  caste: 'Muslim',    populationPct: 21.2 },
  { state: 'Maharashtra', district: 'Pune',       caste: 'Maratha',   populationPct: 41.7 },
];

function dbCaste(req) {
  if (!req.app.locals.dbs) return null;
  return req.app.locals.dbs.caste;
}

// ---------------------------------------------------------------------------
// GET /api/caste/states  →  ["Uttar Pradesh", "Madhya Pradesh", ...]
// ---------------------------------------------------------------------------
router.get('/states', async (req, res) => {
  try {
    if (useMock()) {
      return res.json([...new Set(MOCK_CASTE.map(r => r.state))].sort());
    }
    const Caste = getCasteModel(dbCaste(req));
    const states = await Caste.distinct('state');
    res.json(states.sort());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------------------------------------------------------------------------
// GET /api/caste/districts?state=Uttar%20Pradesh
// ---------------------------------------------------------------------------
router.get('/districts', async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) return res.status(400).json({ error: 'state query is required' });
    if (useMock()) {
      return res.json([...new Set(MOCK_CASTE.filter(r => r.state === state).map(r => r.district))].sort());
    }
    const Caste = getCasteModel(dbCaste(req));
    const districts = await Caste.distinct('district', { state });
    res.json(districts.sort());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------------------------------------------------------------------------
// GET /api/caste/data?state=...&district=...
// → [{state, district, caste, populationPct}, ...] sorted by populationPct desc
// ---------------------------------------------------------------------------
router.get('/data', async (req, res) => {
  try {
    const { state, district } = req.query;
    if (!state || !district) return res.status(400).json({ error: 'state and district query params are required' });
    if (useMock()) {
      return res.json(MOCK_CASTE
        .filter(r => r.state === state && r.district === district)
        .sort((a, b) => b.populationPct - a.populationPct));
    }
    const Caste = getCasteModel(dbCaste(req));
    const rows = await Caste.find({ state, district }).sort({ populationPct: -1 }).lean();
    res.json(rows.map(r => ({
      state: r.state, district: r.district, caste: r.caste, populationPct: r.populationPct,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------------------------------------------------------------------------
// GET /api/caste/all (debug helper)
// ---------------------------------------------------------------------------
router.get('/all', async (req, res) => {
  try {
    if (useMock()) return res.json(MOCK_CASTE);
    const Caste = getCasteModel(dbCaste(req));
    const rows = await Caste.find().lean();
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
