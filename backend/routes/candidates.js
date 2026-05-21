const express = require('express');
const router = express.Router();
const Election = require('../models/Election');

// GET /api/candidates?year=&type=&state=&constituency=
router.get('/', async (req, res) => {
  try {
    const { year, type, state, constituency } = req.query;
    const el = await Election.findOne({ year: Number(year), type, state }, 'constituencies');
    if (!el) return res.status(404).json({ error: 'Election not found' });
    const c = el.constituencies.find(c => c.constituencyName === constituency);
    if (!c) return res.status(404).json({ error: 'Constituency not found' });
    res.json(c.candidates);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
