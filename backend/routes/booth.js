const express = require('express');
const mongoose = require('mongoose');
const getBoothModel = require('../models/Booth');

const router = express.Router();

// GET /api/booth?year=2024&type=Lok Sabha&state=Andhra Pradesh
router.get('/', async (req, res) => {
  try {
    const { year, type, state } = req.query;
    console.log(`[Booth] Request received: year=${year}, type=${type}, state=${state}`);

    if (!year || !type || !state) {
      return res.status(400).json({ error: 'year, type, state required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'MongoDB not connected' });
    }
    if (!req.app.locals.dbs || !req.app.locals.dbs.booth) {
      return res.status(503).json({ error: 'Booth database handle not initialised' });
    }

    const norm = (s) => s.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const collectionName = `${norm(state)}_${norm(year)}_${norm(type)}`;
    console.log(`[Booth] Searching collection: ${collectionName} in Booth_level_data db`);

    const Booth = getBoothModel(req.app.locals.dbs.booth, collectionName);
    const data = await Booth.find({}).lean();

    if (!data || data.length === 0) {
      return res.status(404).json({
        error: 'No booth data found for this selection',
        hint: `The system is looking for a collection named "${collectionName}" in the "Booth_level_data" database. Please ensure your manual import matches this name exactly.`
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
