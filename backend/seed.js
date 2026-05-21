/**
 * seed.js — reads real election + caste data from backend/seed_data/ and
 * upserts it into the three databases (loksabha_db, assembly_db, caste_db).
 *
 * Source files (generated from the real Excel/CSV uploads):
 *   backend/seed_data/elections/*.json    — one file per (state, year, type)
 *   backend/seed_data/caste.json          — flat list of caste rows
 *
 * Re-runnable. Run:  cd backend && npm run seed
 */
require('dotenv').config();
const dns = require('dns');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// DNS workaround — see server.js for why this is here.
// ---------------------------------------------------------------------------
const dnsServers = (process.env.DNS_SERVERS ?? '8.8.8.8,1.1.1.1')
  .split(',').map(s => s.trim()).filter(Boolean);
if (dnsServers.length) {
  try { dns.setServers(dnsServers); } catch (_) { /* ignore */ }
}

const getElectionModel = require('./models/Election');
const getCasteModel    = require('./models/Caste');

const RAW_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_URI = stripDbName(RAW_URI);

const DB_NAMES = {
  loksabha: process.env.DB_LOKSABHA || 'loksabha_db',
  assembly: process.env.DB_ASSEMBLY || 'assembly_db',
  caste:    process.env.DB_CASTE    || 'caste_db',
};

const SEED_DIR     = path.join(__dirname, 'seed_data');
const ELECTIONS_DIR = path.join(SEED_DIR, 'elections');
const CASTE_FILE    = path.join(SEED_DIR, 'caste.json');

function stripDbName(uri) {
  const m = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(\/[^?]*)?(\?.*)?$/);
  if (!m) return uri;
  return `${m[1]}${m[3] || ''}`;
}

function pad(s, n) { return String(s).padEnd(n).slice(0, n); }

(async () => {
  console.log('🔌 Connecting to MongoDB…');
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('   Check MONGO_URI in backend/.env');
    process.exit(1);
  }

  const conn = mongoose.connection;
  const dbs = {
    loksabha: conn.useDb(DB_NAMES.loksabha, { useCache: true }),
    assembly: conn.useDb(DB_NAMES.assembly, { useCache: true }),
    caste:    conn.useDb(DB_NAMES.caste,    { useCache: true }),
  };
  console.log(`✅ Connected. Target databases: ${Object.values(DB_NAMES).join(', ')}`);

  // -----------------------------------------------------------------------
  // 0) Clear existing data so re-runs don't leave stale documents with
  //    old (un-normalised) state names like "NCT OF Delhi".
  // -----------------------------------------------------------------------
  const skipClean = process.argv.includes('--no-clean');
  if (!skipClean) {
    console.log('\n🧹 Clearing existing collections (use --no-clean to skip)…');
    try {
      await getElectionModel(dbs.loksabha).deleteMany({});
      await getElectionModel(dbs.assembly).deleteMany({});
      await getCasteModel(dbs.caste).deleteMany({});
      console.log('   Collections cleared.');
    } catch (e) {
      console.warn('   Warning during clear:', e.message);
    }
  }

  // -----------------------------------------------------------------------
  // 1) Elections — Lok Sabha + Assembly
  // -----------------------------------------------------------------------
  if (!fs.existsSync(ELECTIONS_DIR)) {
    console.warn(`⚠️  ${ELECTIONS_DIR} not found — skipping election seed.`);
  } else {
    const files = fs.readdirSync(ELECTIONS_DIR).filter(f => f.endsWith('.json')).sort();
    console.log(`\n📥 Seeding ${files.length} election files…\n`);

    let lokCount = 0, assemblyCount = 0, totalConstituencies = 0, totalCandidates = 0;
    const t0 = Date.now();

    for (const file of files) {
      const doc = JSON.parse(fs.readFileSync(path.join(ELECTIONS_DIR, file), 'utf-8'));
      const targetDb = doc.type === 'Lok Sabha' ? dbs.loksabha : dbs.assembly;
      const Election = getElectionModel(targetDb);
      await Election.findOneAndUpdate(
        { year: doc.year, type: doc.type, state: doc.state },
        { ...doc, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      if (doc.type === 'Lok Sabha') lokCount++; else assemblyCount++;
      totalConstituencies += doc.constituencies.length;
      totalCandidates += doc.constituencies.reduce((s, c) => s + (c.candidates?.length || 0), 0);
      // Compact progress line
      process.stdout.write(`  ${pad(doc.type, 10)} | ${doc.year} | ${pad(doc.state, 22)} | ${pad(doc.constituencies.length + ' seats', 9)} → ${DB_NAMES[doc.type === 'Lok Sabha' ? 'loksabha' : 'assembly']}\n`);
    }
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n  Elections seeded in ${dt}s — ${totalConstituencies.toLocaleString()} constituencies, ${totalCandidates.toLocaleString()} candidate records.`);
  }

  // -----------------------------------------------------------------------
  // 2) Caste data
  // -----------------------------------------------------------------------
  let casteCount = 0;
  if (!fs.existsSync(CASTE_FILE)) {
    console.warn(`⚠️  ${CASTE_FILE} not found — skipping caste seed.`);
  } else {
    const rows = JSON.parse(fs.readFileSync(CASTE_FILE, 'utf-8'));
    const Caste = getCasteModel(dbs.caste);

    console.log(`\n📥 Seeding ${rows.length.toLocaleString()} caste rows…`);
    // Chunked bulkWrite — Atlas free tier rejects >100K ops per call
    const CHUNK = 1000;
    let upserted = 0, modified = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const ops = slice.map(d => ({
        updateOne: {
          filter: { state: d.state, district: d.district, caste: d.caste },
          update: { $set: d },
          upsert: true,
        },
      }));
      const r = await Caste.bulkWrite(ops, { ordered: false });
      upserted += r.upsertedCount || 0;
      modified += r.modifiedCount || 0;
      process.stdout.write(`  …${Math.min(i + CHUNK, rows.length).toLocaleString()} / ${rows.length.toLocaleString()}\r`);
    }
    casteCount = upserted + modified;
    console.log(`\n  Caste seeded: ${upserted.toLocaleString()} new, ${modified.toLocaleString()} updated.`);
  }

  console.log('\n📊 Seed summary:');
  console.log(`   • ${DB_NAMES.loksabha}.elections   — Lok Sabha files seeded`);
  console.log(`   • ${DB_NAMES.assembly}.elections   — Assembly files seeded`);
  console.log(`   • ${DB_NAMES.caste}.castes         — caste rows seeded`);
  console.log('\n✨ Done. Start the API with `npm run dev`.\n');
  process.exit(0);
})().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
