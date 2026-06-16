require('dotenv').config();
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// ---------------------------------------------------------------------------
// DNS workaround for Windows machines whose configured resolver is at an
// IPv6 link-local address (e.g. fe80::...). Node's c-ares library, which
// MongoDB uses for SRV record lookups in `mongodb+srv://` URIs, can't query
// link-local resolvers. Force public DNS so SRV resolution always works.
// Override via DNS_SERVERS env var (comma-separated) if you need different
// servers — set to empty string to disable.
// ---------------------------------------------------------------------------
const dnsServers = (process.env.DNS_SERVERS ?? '8.8.8.8,1.1.1.1')
  .split(',').map(s => s.trim()).filter(Boolean);
if (dnsServers.length) {
  try { dns.setServers(dnsServers); } catch (_) { /* ignore */ }
}

const electionRoutes  = require('./routes/elections');
const candidateRoutes = require('./routes/candidates');
const uploadRoutes    = require('./routes/upload');
const casteRoutes     = require('./routes/caste');
const boothRoutes     = require('./routes/booth');
const chatRoutes      = require('./routes/chat');

const app  = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Connection string (NO database in path — we pick databases via useDb below).
// Strip any /dbname from a user-supplied URI so we always end at the cluster.
const RAW_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_URI = stripDbName(RAW_URI);

// Per-dataset database names (override via env if you want different names)
const DB_NAMES = {
  loksabha: process.env.DB_LOKSABHA || 'loksabha_db',
  assembly: process.env.DB_ASSEMBLY || 'assembly_db',
  caste:    process.env.DB_CASTE    || 'caste_db',
  booth:    process.env.DB_BOOTH    || 'booth_db',
};

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Routes
app.use('/api/elections',  electionRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/caste',      casteRoutes);
app.use('/api/booth',      boothRoutes);
app.use('/api/chat',       chatRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'OK',
  mode: mongoose.connection.readyState === 1 ? 'mongodb' : 'mock',
  dbs:   mongoose.connection.readyState === 1 ? DB_NAMES : null,
  timestamp: new Date(),
}));

// ----------------------------------------------------------------------------
// Bootstrap: connect to Mongo, register database handles, start the server
// ----------------------------------------------------------------------------
async function bootstrap() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 6000,
      retryWrites: true,
    });

    // useDb gives us a separate connection scoped to a database name —
    // models registered on each handle live in that database only.
    const baseConn = mongoose.connection;
    app.locals.dbs = {
      loksabha: baseConn.useDb(DB_NAMES.loksabha, { useCache: true }),
      assembly: baseConn.useDb(DB_NAMES.assembly, { useCache: true }),
      caste:    baseConn.useDb(DB_NAMES.caste,    { useCache: true }),
      booth:    baseConn.useDb(DB_NAMES.booth,    { useCache: true }),
    };
    console.log(`✅ MongoDB connected — databases ready: ${Object.values(DB_NAMES).join(', ')}`);
  } catch (err) {
    console.warn(`⚠️  MongoDB connection failed (${err.message}).`);
    console.warn('    The API will respond with bundled mock data instead.');
  }
  startServer(PORT);
}

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`\n🚀 ShowTime Election API running on http://localhost:${port}`);
    console.log(`📊 Mode: ${mongoose.connection.readyState === 1 ? '✅ MongoDB connected' : '⚠️  Mock data (no DB)'}`);
    console.log(`🔗 Health check: http://localhost:${port}/api/health\n`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} in use, trying ${port + 1}…`);
      startServer(port + 1);
    } else {
      throw err;
    }
  });
}

bootstrap();

// ----------------------------------------------------------------------------
function stripDbName(uri) {
  // mongodb+srv://user:pass@cluster/dbname?args -> mongodb+srv://user:pass@cluster?args
  try {
    const m = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(\/[^?]*)?(\?.*)?$/);
    if (!m) return uri;
    return `${m[1]}${m[3] || ''}`;
  } catch { return uri; }
}
