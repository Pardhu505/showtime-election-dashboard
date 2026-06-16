const BASE = process.env.REACT_APP_API_URL || '/api';

const get = async (path) => {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    let msg = `API error: ${res.status}`;
    const text = await res.text();
    try {
      const body = JSON.parse(text);
      if (body.error) msg = body.error;
      if (body.hint) msg += ` (${body.hint})`;
    } catch (_) {
      if (text && text.length < 200) msg += `: ${text}`;
    }
    throw new Error(msg);
  }
  return res.json();
};

const post = async (path, formData) => {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: formData });
  if (!res.ok) {
    let msg = `API error: ${res.status}`;
    const text = await res.text();
    try {
      const body = JSON.parse(text);
      if (body.error) msg = body.error;
    } catch (_) {
      if (text && text.length < 200) msg += `: ${text}`;
    }
    throw new Error(msg);
  }
  return res.json();
};

// =========================================================================
// Normalisers — bridge the backend response shape to the frontend's
// expected shape (which matches the mock-data structure). Specifically:
//   - The /summary endpoint returns each constituency as a slim object
//     with `name` and no `candidates` array. The dashboard expects
//     `constituencyName` and a (possibly empty) `candidates` array.
//   - Without normalising, components that iterate `c.candidates` crash.
// =========================================================================
const normaliseConstituency = (c) => {
  if (!c || typeof c !== 'object') return c;
  let candidates = Array.isArray(c.candidates) ? c.candidates : [];

  // If the backend stripped candidates but kept a single winner, synthesise
  // a 1-element candidate list so per-constituency aggregation works.
  if (candidates.length === 0 && c.winner) {
    candidates = [{
      name: c.winner.name,
      party: c.winner.party,
      partyAbbr: c.winner.partyAbbr || c.winner.party,
      partyColor: c.winner.partyColor,
      votes: c.winner.votes,
      voteShare: c.winner.voteShare,
      isWinner: true,
      margin: c.winner.margin,
    }];
  }

  return {
    ...c,
    constituencyName: c.constituencyName ?? c.name ?? '',
    constituencyType: c.constituencyType ?? c.type ?? 'PC',
    parentConstituency: c.parentConstituency ?? c.parent ?? '',
    candidates,
  };
};

const normaliseElection = (el) => {
  if (!el || typeof el !== 'object') return el;
  const constituencies = Array.isArray(el.constituencies)
    ? el.constituencies.map(normaliseConstituency)
    : [];
  return { ...el, constituencies };
};

export const api = {
  getYears: () => get('/elections/years'),
  getStates: (year, type) => get(`/elections/states?year=${year}&type=${encodeURIComponent(type)}`),
  getConstituencies: (year, type, state, cType) =>
    get(`/elections/constituencies?year=${year}&type=${encodeURIComponent(type)}&state=${encodeURIComponent(state)}&cType=${cType}`)
      .then(list => Array.isArray(list) ? list.map(normaliseConstituency) : list),
  getSummary: (year, type, state) =>
    get(`/elections/summary?year=${year}&type=${encodeURIComponent(type)}&state=${encodeURIComponent(state)}`)
      .then(normaliseElection),
  getPrevious: (year, type, state) =>
    get(`/elections/previous?year=${year}&type=${encodeURIComponent(type)}&state=${encodeURIComponent(state)}`)
      .then(normaliseElection)
      .catch(() => null),
  getConstituency: (year, type, state, name) =>
    get(`/elections/constituency?year=${year}&type=${encodeURIComponent(type)}&state=${encodeURIComponent(state)}&name=${encodeURIComponent(name)}`)
      .then(normaliseConstituency),
  getHeatmap: (year, type, state) =>
    get(`/elections/heatmap?year=${year}&type=${encodeURIComponent(type)}&state=${encodeURIComponent(state)}`),
  getRecentElections: (type = 'Assembly', limit = 6) =>
    get(`/elections/recent?type=${encodeURIComponent(type)}&limit=${limit}`),
  getStateRollup: (year, type) =>
    get(`/elections/by-state?year=${year}&type=${encodeURIComponent(type)}`),
  uploadDataset: (formData) => post('/upload/election', formData),

  // ---- Caste endpoints ----
  getCasteStates:    () => get('/caste/states'),
  getCasteDistricts: (state) => get(`/caste/districts?state=${encodeURIComponent(state)}`),
  getCasteData:      (state, district) => get(`/caste/data?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`),
  uploadCasteData:   (formData) => post('/upload/caste', formData),

  // ---- Booth endpoints ----
  getBoothData: (year, type, state) =>
    get(`/booth?year=${year}&type=${encodeURIComponent(type)}&state=${encodeURIComponent(state)}`),
  uploadBoothData: (formData) => post('/upload/booth', formData),
};
