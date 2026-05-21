const express = require('express');
const mongoose = require('mongoose');
const getElectionModel = require('../models/Election');
const { MOCK_ELECTIONS } = require('../middleware/mockData');

const router = express.Router();

// ---------------------------------------------------------------------------
const useMock = () => mongoose.connection.readyState !== 1;
const TYPES = ['Lok Sabha', 'Assembly'];

/** Pick the right db connection based on election type. */
function dbFor(req, type) {
  if (!req.app.locals.dbs) return null;
  return type === 'Lok Sabha' ? req.app.locals.dbs.loksabha : req.app.locals.dbs.assembly;
}

/**
 * Query both databases (Lok Sabha + Assembly) and merge results.
 * Used by endpoints that don't specify a type (e.g. /years).
 */
async function queryBoth(req, runner) {
  const out = [];
  for (const t of TYPES) {
    const db = dbFor(req, t);
    if (!db) continue;
    const Election = getElectionModel(db);
    out.push(await runner(Election, t));
  }
  return out;
}

// ---------------------------------------------------------------------------
router.get('/years', async (req, res) => {
  try {
    if (useMock()) {
      const ys = [...new Set(MOCK_ELECTIONS.map(e => e.year))].sort((a, b) => b - a);
      return res.json(ys);
    }
    const lists = await queryBoth(req, (Election) => Election.distinct('year'));
    const merged = [...new Set(lists.flat())].sort((a, b) => b - a);
    res.json(merged);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/states', async (req, res) => {
  try {
    const { year, type } = req.query;
    if (useMock()) {
      const states = [...new Set(MOCK_ELECTIONS
        .filter(e => (!year || e.year == year) && (!type || e.type === type))
        .map(e => e.state))].sort();
      return res.json(states);
    }
    if (type) {
      const db = dbFor(req, type);
      if (!db) return res.json([]);
      const Election = getElectionModel(db);
      const filter = year ? { year: Number(year) } : {};
      const states = await Election.distinct('state', filter);
      return res.json(states.sort());
    }
    const lists = await queryBoth(req, async (Election) => {
      const filter = year ? { year: Number(year) } : {};
      return Election.distinct('state', filter);
    });
    res.json([...new Set(lists.flat())].sort());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/constituencies', async (req, res) => {
  try {
    const { year, type, state, cType } = req.query;
    if (useMock()) {
      const el = MOCK_ELECTIONS.find(e =>
        (!year || e.year == year) && (!type || e.type === type) && (!state || e.state === state));
      if (!el) return res.json([]);
      return res.json(el.constituencies
        .filter(c => !cType || c.constituencyType === cType)
        .map(c => ({ constituencyName: c.constituencyName, constituencyType: c.constituencyType,
                     parentConstituency: c.parentConstituency || '' })));
    }
    const db = dbFor(req, type);
    if (!db) return res.json([]);
    const Election = getElectionModel(db);
    const el = await Election.findOne({ year: Number(year), type, state });
    if (!el) return res.json([]);
    res.json(el.constituencies
      .filter(c => !cType || c.constituencyType === cType)
      .map(c => ({ constituencyName: c.constituencyName, constituencyType: c.constituencyType,
                   parentConstituency: c.parentConstituency || '' })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/summary', async (req, res) => {
  try {
    const { year, type, state } = req.query;
    if (useMock()) {
      const el = MOCK_ELECTIONS.find(e =>
        (!year || e.year == year) && (!type || e.type === type) && (!state || e.state === state));
      if (!el) return res.status(404).json({ error: 'Not found' });
      return res.json(buildSummaryResponse(el));
    }
    const db = dbFor(req, type);
    if (!db) return res.status(503).json({ error: 'Database not initialised' });
    const Election = getElectionModel(db);
    const el = await Election.findOne({ year: Number(year), type, state });
    if (!el) return res.status(404).json({ error: 'Election not found' });
    res.json(buildSummaryResponse(el));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/constituency', async (req, res) => {
  try {
    const { year, type, state, name } = req.query;
    if (useMock()) {
      const el = MOCK_ELECTIONS.find(e => e.year == year && e.type === type && e.state === state);
      if (!el) return res.status(404).json({ error: 'Not found' });
      const c = el.constituencies.find(cc => cc.constituencyName === name);
      return c ? res.json(c) : res.status(404).json({ error: 'Constituency not found' });
    }
    const db = dbFor(req, type);
    if (!db) return res.status(503).json({ error: 'Database not initialised' });
    const Election = getElectionModel(db);
    const el = await Election.findOne({ year: Number(year), type, state });
    if (!el) return res.status(404).json({ error: 'Election not found' });
    const c = el.constituencies.find(cc => cc.constituencyName === name);
    if (!c) return res.status(404).json({ error: 'Constituency not found' });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Find the most recent election for the same state+type BEFORE `year`.
// Used by the dashboard to compute year-over-year comparisons.
router.get('/previous', async (req, res) => {
  try {
    const { year, type, state } = req.query;
    if (!year || !type || !state) return res.status(400).json({ error: 'year, type, state required' });
    if (useMock()) {
      const prev = MOCK_ELECTIONS
        .filter(e => e.type === type && e.state === state && e.year < Number(year))
        .sort((a, b) => b.year - a.year)[0];
      return prev ? res.json(buildSummaryResponse(prev)) : res.status(404).json({ error: 'No previous election found' });
    }
    const db = dbFor(req, type);
    if (!db) return res.status(503).json({ error: 'Database not initialised' });
    const Election = getElectionModel(db);
    const prev = await Election.findOne({ type, state, year: { $lt: Number(year) } })
      .sort({ year: -1 });
    if (!prev) return res.status(404).json({ error: 'No previous election found' });
    res.json(buildSummaryResponse(prev));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Per-state party rollup for an entire (year, type). Used by the home-page
// alliance map to colour each state. Returns one row per state with the
// full partySummary so the client can classify by alliance.
router.get('/by-state', async (req, res) => {
  try {
    const { year, type } = req.query;
    if (!year || !type) return res.status(400).json({ error: 'year and type required' });

    if (useMock()) {
      const list = MOCK_ELECTIONS.filter(e => e.year == year && e.type === type);
      return res.json(list.map(el => ({
        state: el.state,
        totalSeats: el.totalSeats,
        partySummary: el.partySummary,
      })));
    }

    const db = dbFor(req, type);
    if (!db) return res.status(503).json({ error: 'Database not initialised' });
    const Election = getElectionModel(db);
    const docs = await Election.find({ year: Number(year), type })
      .select('state totalSeats partySummary')
      .lean();
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Return the most-recent N elections for a given type, with each result
// shaped as a "card" the home-page Recent Elections section can render.
// Each card includes top-3 parties with their seats-won swing vs the most
// recent previous election in the same state.
router.get('/recent', async (req, res) => {
  try {
    const type = req.query.type || 'Assembly';
    const limit = Math.max(1, Math.min(20, parseInt(req.query.limit || '6', 10)));

    if (useMock()) {
      const list = MOCK_ELECTIONS
        .filter(e => e.type === type)
        .sort((a, b) => b.year - a.year || a.state.localeCompare(b.state))
        .slice(0, limit);
      const cards = list.map(el => {
        const prev = MOCK_ELECTIONS
          .filter(p => p.type === type && p.state === el.state && p.year < el.year)
          .sort((a, b) => b.year - a.year)[0];
        return buildRecentCard(el, prev);
      });
      return res.json(cards);
    }

    const db = dbFor(req, type);
    if (!db) return res.status(503).json({ error: 'Database not initialised' });
    const Election = getElectionModel(db);

    // Most recent N elections
    const list = await Election.find({ type })
      .sort({ year: -1, state: 1 })
      .limit(limit)
      .lean();

    // For each, find the most recent previous election in the same state.
    // Done in parallel to keep this snappy.
    const previousLookups = await Promise.all(list.map(el =>
      Election.findOne({ type, state: el.state, year: { $lt: el.year } })
        .sort({ year: -1 })
        .lean()
    ));

    const cards = list.map((el, i) => buildRecentCard(el, previousLookups[i]));
    res.json(cards);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/heatmap', async (req, res) => {
  try {
    const { year, type, state } = req.query;
    let el;
    if (useMock()) {
      el = MOCK_ELECTIONS.find(e => e.year == year && e.type === type && e.state === state);
    } else {
      const db = dbFor(req, type);
      if (!db) return res.status(503).json({ error: 'Database not initialised' });
      const Election = getElectionModel(db);
      el = await Election.findOne({ year: Number(year), type, state });
    }
    if (!el) return res.status(404).json({ error: 'Not found' });
    res.json(el.constituencies.map(c => ({
      constituencyName: c.constituencyName,
      lat: c.latitude, lng: c.longitude,
      winner: c.winner, turnout: c.turnout, margin: c.winner?.margin,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------------------------------------------------------------------------
function buildSummaryResponse(el) {
  return {
    year: el.year, type: el.type, state: el.state,
    totalSeats: el.totalSeats, status: el.status,
    partySummary: el.partySummary,
    constituencies: el.constituencies.map(c => ({
      constituencyNo: c.constituencyNo,
      constituencyName: c.constituencyName,
      constituencyType: c.constituencyType,
      parentConstituency: c.parentConstituency || '',
      state: c.state,
      winner: c.winner,
      candidates: c.candidates || [],
      turnout: c.turnout,
      totalVoters: c.totalVoters,
      totalVotesCast: c.totalVotesCast,
      latitude: c.latitude, longitude: c.longitude,
    })),
  };
}

module.exports = router;

// =========================================================================
// Helpers
// =========================================================================
function buildRecentCard(el, previous) {
  // Build a quick lookup of previous-year seats by party abbreviation so we
  // can compute year-over-year swing for the top-3 parties shown on the card.
  const prevSeatsByParty = new Map();
  if (previous?.partySummary) {
    for (const p of previous.partySummary) {
      const key = p.partyAbbr || p.party;
      if (key) prevSeatsByParty.set(key, p.seatsWon || 0);
    }
  }

  const top = (el.partySummary || [])
    .slice()
    .sort((a, b) => (b.seatsWon || 0) - (a.seatsWon || 0))
    .slice(0, 3)
    .map(p => {
      const key = p.partyAbbr || p.party;
      const won = p.seatsWon || 0;
      const prevWon = prevSeatsByParty.get(key) || 0;
      return {
        party: key,
        color: p.partyColor || '#666',
        won,
        swing: won - prevWon,            // signed integer; renderer adds + / -
        prevYear: previous?.year || null,
      };
    });
  return {
    state: el.state,
    year:  el.year,
    type:  el.type,
    totalSeats: el.totalSeats || (el.constituencies || []).length,
    bannerFrom: '#fff5e6',
    bannerTo:   '#ffe9c2',
    rows: top,
  };
}
