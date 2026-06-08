// =========================================================================
// boundaries.js — fetches real constituency boundary GeoJSON for both
// Lok Sabha (PC) and Assembly (AC) elections, matches each polygon to a
// constituency in the dataset by name, and gracefully falls back when a
// state isn't available in the source.
//
// Sources (CC-BY-SA / MIT licensed, free public open data):
//   PC: HindustanTimesLabs/shapefiles — state-specific PC files,
//       fall back to datameet/maps all-India PC file when missing
//   AC: HindustanTimesLabs/shapefiles — state-specific AC files
//
// Per-state files are 50–250 KB each, so we cache them in memory after the
// first fetch.
// =========================================================================

const HT_BASE       = 'https://cdn.jsdelivr.net/gh/HindustanTimesLabs/shapefiles@master/state_ut';
const HT_BASE_RAW   = 'https://raw.githubusercontent.com/HindustanTimesLabs/shapefiles/master/state_ut';
const DM_PC_ALL     = 'https://cdn.jsdelivr.net/gh/datameet/maps@master/parliamentary-constituencies/india_pc_2019_simplified.geojson';
const DM_PC_ALL_RAW = 'https://raw.githubusercontent.com/datameet/maps/master/parliamentary-constituencies/india_pc_2019_simplified.geojson';

// type/state → cache key
const cache = new Map();
const inflight = new Map();   // de-dupe parallel fetches
let allIndiaPCPromise = null; // memoised datameet fetch

// ---- name normalisation ----------------------------------------------------
const normName = (s) =>
  String(s || '')
    .toUpperCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[\.,'`"&]/g, '')
    .replace(/\s+/g, '')
    .trim();

const stateSlug = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

// Common alternative names — extend as we discover mismatches
const ALIASES = {
  ALLAHABAD: ['PRAYAGRAJ'], PRAYAGRAJ: ['ALLAHABAD'],
  GAUTAMBUDDHANAGAR: ['GAUTAMBUDDHNAGAR', 'NOIDA'],
  AURANGABAD: ['CHHATRAPATISAMBHAJINAGAR'],
  GURGAON: ['GURUGRAM'], GURUGRAM: ['GURGAON'],
  BANGALORE: ['BENGALURU'], BENGALURU: ['BANGALORE'],
  MYSORE: ['MYSURU'], MYSURU: ['MYSORE'],
  CALCUTTA: ['KOLKATA'], KOLKATA: ['CALCUTTA'],
  MADRAS: ['CHENNAI'], CHENNAI: ['MADRAS'],
  BOMBAY: ['MUMBAI'], MUMBAI: ['BOMBAY'],
  KHADOORSAHIB: ['TARNTARAN'],
  JALANDHAR: ['JULLUNDUR'],
  ANANDPURSAHIB: ['ROPAR'],
  FATEHGARHSAHIB: ['PHILLAUR'],
  FIROZPUR: ['FEROZEPUR', 'FIROZEPUR'],
  BATHINDA: ['BHATINDA'],
};

function nameMatches(a, b) {
  if (a === b) return true;
  if ((ALIASES[a] || []).includes(b)) return true;
  if ((ALIASES[b] || []).includes(a)) return true;
  // First-6-char heuristic — catches small spelling variations
  if (a.length >= 6 && b.length >= 6 && a.slice(0, 6) === b.slice(0, 6)) return true;
  return false;
}

// Levenshtein distance for last-resort fuzzy matching across the
// transliteration variants the source data inevitably contains
// (e.g. "Tirupati"/"Thirupathi", "Aruku"/"Araku", "Kurnoolu"/"Kurnool").
function editDistance(a, b) {
  if (!a) return b ? b.length : 0;
  if (!b) return a.length;
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 4) return 99;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function fuzzyMatchFeature(targetKey, featureMap) {
  if (!targetKey || featureMap.size === 0) return null;
  let bestKey = null, bestDist = Infinity;
  for (const k of featureMap.keys()) {
    if (Math.abs(k.length - targetKey.length) > 3) continue;
    const d = editDistance(targetKey, k);
    if (d < bestDist) { bestDist = d; bestKey = k; }
  }
  if (!bestKey) return null;
  const longer = Math.max(targetKey.length, bestKey.length);
  const allowed = Math.max(1, Math.floor(longer * 0.2));
  return bestDist <= allowed ? featureMap.get(bestKey) : null;
}

const readProp = (props, keys) => {
  for (const k of keys) {
    if (props[k] !== undefined && props[k] !== null && props[k] !== '') return props[k];
  }
  return '';
};
const readStateProp = (p) => readProp(p, ['ST_NAME', 'st_name', 'STATE', 'state', 'StateName']);
const readACProp = (p) => readProp(p, ['AC_NAME', 'ac_name', 'AC_NAME_E', 'NAME', 'name', 'Constituency']);
const readPCProp = (p) => readProp(p, ['PC_NAME', 'pc_name', 'PCNAME', 'NAME', 'name', 'Constituency']);

// ---- fetching --------------------------------------------------------------
async function tryFetch(urls) {
  let lastErr;
  for (const url of urls) {
    try {
      const resp = await fetch(url, { mode: 'cors' });
      if (!resp.ok) { lastErr = new Error(`HTTP ${resp.status} on ${url}`); continue; }
      const data = await resp.json();
      if (data && (data.features || data.type === 'FeatureCollection')) {
        return data;
      }
      lastErr = new Error(`Unexpected response shape from ${url}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All sources failed');
}

async function loadHTState(state, kind) {
  const slug = stateSlug(state);
  if (!slug) throw new Error('Empty state name');
  // Try a few filename variants — most files are <slug>_<KIND>.json
  // but some early files used hyphenated or differently-cased filenames.
  const sub = kind === 'AC' ? 'assembly' : 'parliament';
  const variants = [
    `${HT_BASE}/${slug}/${sub}/${slug}_${kind}.json`,
    `${HT_BASE}/${slug}/${sub}/${slug}_${kind}.geojson`,
    `${HT_BASE}/${slug}/${sub}/${slug}.json`,
    `${HT_BASE_RAW}/${slug}/${sub}/${slug}_${kind}.json`,
    `${HT_BASE_RAW}/${slug}/${sub}/${slug}_${kind}.geojson`,
  ];
  return tryFetch(variants);
}

async function loadDMAllIndiaPC() {
  if (allIndiaPCPromise) return allIndiaPCPromise;
  allIndiaPCPromise = tryFetch([DM_PC_ALL, DM_PC_ALL_RAW]);
  allIndiaPCPromise.catch(() => { allIndiaPCPromise = null; });
  return allIndiaPCPromise;
}

// ---- public API ------------------------------------------------------------

/**
 * Load boundary features for one state + election type.
 *
 * @param {string} state — e.g. "Madhya Pradesh"
 * @param {'Lok Sabha'|'Assembly'} type
 * @returns {Promise<{features: Array, source: string}>}
 */
export async function loadBoundariesForState(state, type) {
  const ck = `${normName(state)}|${type}`;
  if (cache.has(ck)) return cache.get(ck);
  if (inflight.has(ck)) return inflight.get(ck);

  const p = (async () => {
    const isPC = type === 'Lok Sabha';
    const kind = isPC ? 'PC' : 'AC';

    // 1) try HindustanTimesLabs state-specific file
    try {
      const geo = await loadHTState(state, kind);
      const features = (geo.features || []).filter(f => {
        // The file is already state-specific; usually no state filter needed,
        // but if ST_NAME is present, use it to be safe.
        const sp = (f.properties || {});
        const st = readStateProp(sp);
        return !st || normName(st) === normName(state);
      });
      if (features.length) {
        const result = { features, source: `HindustanTimesLabs/${kind === 'PC' ? 'parliament' : 'assembly'} (${state})` };
        cache.set(ck, result);
        return result;
      }
    } catch (_) { /* fall through */ }

    // 2) for PC, fall back to datameet all-India file filtered to state
    if (isPC) {
      try {
        const geo = await loadDMAllIndiaPC();
        const features = (geo.features || []).filter(f =>
          normName(readStateProp(f.properties || {})) === normName(state)
        );
        if (features.length) {
          const result = { features, source: `datameet/maps (all-India PC 2019, filtered)` };
          cache.set(ck, result);
          return result;
        }
      } catch (_) { /* fall through */ }
    }

    const err = new Error(`No ${kind} boundary file available for "${state}"`);
    err.code = 'NOT_FOUND';
    throw err;
  })();

  inflight.set(ck, p);
  p.finally(() => inflight.delete(ck));
  return p;
}

/**
 * Match constituencies in the dataset to GeoJSON features by name.
 * Returns `[{ constituency, feature }, ...]` — feature is null on no match.
 */
export function matchFeatures(constituencies, features, type) {
  const readName = type === 'Lok Sabha' ? readPCProp : readACProp;
  const byName = new Map();
  for (const f of features) {
    const key = normName(readName(f.properties || {}));
    if (key && !byName.has(key)) byName.set(key, f);
  }
  return constituencies.map(c => {
    const cKey = normName(c.constituencyName);
    let f = byName.get(cKey);
    if (!f) {
      // Try alias / prefix match
      for (const [fName, feat] of byName) {
        if (nameMatches(cKey, fName)) { f = feat; break; }
      }
    }
    if (!f) {
      // Last-resort fuzzy match — handles transliteration variants like
      // Tirupati/Thirupathi, Aruku/Araku, Kurnoolu/Kurnool.
      f = fuzzyMatchFeature(cKey, byName);
    }
    return { constituency: c, feature: f || null };
  });
}

/** Convert GeoJSON Polygon / MultiPolygon coordinates to react-leaflet positions. */
export function geometryToPositions(geometry) {
  if (!geometry) return null;
  const swap = (ring) => ring.map(([lng, lat]) => [lat, lng]);
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(swap);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map(poly => poly.map(swap));
  }
  return null;
}

/** Forget cached data so the next call refetches. */
export function resetBoundaryCache() {
  cache.clear();
  inflight.clear();
  allIndiaPCPromise = null;
}
