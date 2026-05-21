// Pure helpers for comparing two elections (current vs previous).

// Format a vote count as Cr / L / K (Indian numbering)
export const fmt = n => {
  const abs = Math.abs(n);
  if (abs >= 10000000) return (n / 10000000).toFixed(2) + ' Cr';
  if (abs >= 100000) return (n / 100000).toFixed(2) + ' L';
  if (abs >= 1000) return (n / 1000).toFixed(1) + ' K';
  return String(Math.round(n));
};

const fixed = (n, d = 2) => (n == null ? null : Number(n).toFixed(d));

/**
 * Build a per-constituency comparison record.
 * @param {object} current - current election's constituency record
 * @param {object} previous - previous election's matching constituency record (or null)
 * @returns {object|null}
 */
export function buildSeatComparison(current, previous) {
  if (!current || !previous) return null;

  const voteTotalDelta = current.totalVotesCast - previous.totalVotesCast;
  const voteTotalDeltaRatio = previous.totalVotesCast
    ? +((voteTotalDelta / previous.totalVotesCast) * 100).toFixed(2)
    : null;

  const partyChanged = current.winner.party !== previous.winner.party;
  const marginDelta = current.winner.margin - previous.winner.margin;
  const turnoutDelta = +(current.turnout - previous.turnout).toFixed(2);

  // Vote transfer table — union of parties from both elections
  const partyMap = new Map();
  const addCand = (cand, period) => {
    if (!partyMap.has(cand.party)) {
      partyMap.set(cand.party, {
        party: cand.party,
        partyColor: cand.partyColor,
        prevVotes: 0, currVotes: 0,
        prevShare: 0, currShare: 0,
      });
    }
    const rec = partyMap.get(cand.party);
    if (period === 'prev') { rec.prevVotes += cand.votes; rec.prevShare = cand.voteShare; }
    else                    { rec.currVotes += cand.votes; rec.currShare = cand.voteShare; }
  };
  previous.candidates.forEach(c => addCand(c, 'prev'));
  current.candidates.forEach(c => addCand(c, 'curr'));

  const voteTransfer = Array.from(partyMap.values())
    .map(v => ({
      ...v,
      delta: v.currVotes - v.prevVotes,
      shareDelta: +(v.currShare - v.prevShare).toFixed(2),
    }))
    .sort((a, b) => b.currVotes - a.currVotes || b.prevVotes - a.prevVotes);

  return {
    partyChanged,
    currentWinner: current.winner,
    previousWinner: previous.winner,
    currentMargin: current.winner.margin,
    previousMargin: previous.winner.margin,
    marginDelta,
    currentTurnout: current.turnout,
    previousTurnout: previous.turnout,
    turnoutDelta,
    voteTotalCurrent: current.totalVotesCast,
    voteTotalPrevious: previous.totalVotesCast,
    voteTotalDelta,
    voteTotalDeltaRatio,
    voteTransfer,
    runnerUps: {
      current: current.candidates.slice(0, 3),
      previous: previous.candidates.slice(0, 3),
    },
  };
}

/**
 * Build a party-wise contest/won comparison (current vs previous).
 * @param {Array} currentSummary - electionData.partySummary
 * @param {Array} previousSummary
 * @returns {Array}
 */
export function buildPartyContestComparison(currentSummary, previousSummary) {
  if (!currentSummary || !previousSummary) return [];
  const m = new Map();
  const add = (rec, period) => {
    if (!m.has(rec.party)) {
      m.set(rec.party, {
        party: rec.party,
        partyColor: rec.partyColor,
        currWon: 0, prevWon: 0,
        currContested: 0, prevContested: 0,
        currShare: 0, prevShare: 0,
      });
    }
    const r = m.get(rec.party);
    if (period === 'prev') {
      r.prevWon = rec.seatsWon;
      r.prevContested = rec.seatsContested;
      r.prevShare = rec.voteShare;
    } else {
      r.currWon = rec.seatsWon;
      r.currContested = rec.seatsContested;
      r.currShare = rec.voteShare;
    }
  };
  previousSummary.forEach(p => add(p, 'prev'));
  currentSummary.forEach(p => add(p, 'curr'));

  return Array.from(m.values())
    .map(r => ({
      ...r,
      wonDelta: r.currWon - r.prevWon,
      contestedDelta: r.currContested - r.prevContested,
      shareDelta: +(r.currShare - r.prevShare).toFixed(2),
    }))
    .sort((a, b) => b.currWon - a.currWon || b.prevWon - a.prevWon);
}

/**
 * Build the row list for the constituency-analysis summary table.
/**
 * Normalise a constituency name for cross-year matching. Strips whitespace,
 * punctuation, parentheticals, and casing — so that "Ajmer South (Sc)" and
 * "Ajmer South", "Baran-Atru" and "Baran Atru", "Hawa Mahal" and "Hawamahal"
 * all resolve to the same key.
 */
function normaliseConstituencyKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')    // strip "(sc)" / "(st)" / "(general)" tags
    .replace(/[^a-z0-9]/g, '')    // strip every non-alphanumeric (spaces, hyphens, dots)
    .trim();
}

// Levenshtein edit distance — used as a last-resort match for spelling
// variants across years (e.g. "Tirupati" ↔ "Thirupathi", "Aruku" ↔ "Araku").
function editDistance(a, b) {
  if (!a) return b ? b.length : 0;
  if (!b) return a.length;
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 4) return 99;  // early-out: too different in length
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

/**
 * Find the best fuzzy match for `target` among `candidates` (a Map from
 * normalised key → original value). Returns the value or null.
 *
 * Acceptance threshold: distance ≤ max(1, 20% of longer name's length).
 * Catches "Tirupati"↔"Thirupathi" (d=2 on 10 chars = 20%) and similar
 * single-character substitutions / insertions, while rejecting
 * "Bhopal" vs "Berhampur" (entirely different seats).
 */
function fuzzyMatch(target, candidatesMap) {
  if (!target || candidatesMap.size === 0) return null;
  let best = null;
  let bestDist = Infinity;
  for (const key of candidatesMap.keys()) {
    if (Math.abs(key.length - target.length) > 3) continue;
    const d = editDistance(target, key);
    if (d < bestDist) { bestDist = d; best = key; }
  }
  if (!best) return null;
  const longer = Math.max(target.length, best.length);
  const allowed = Math.max(1, Math.floor(longer * 0.2));
  return bestDist <= allowed ? candidatesMap.get(best) : null;
}

/**
 * Pairs each current constituency with its matching previous-election record.
 */
export function buildConstituencyComparisons(currentElection, previousElection) {
  if (!currentElection) return [];

  // Build a map keyed on the normalised name once, instead of doing an O(n)
  // find for every current constituency.
  const prevMap = new Map();
  if (previousElection?.constituencies) {
    for (const c of previousElection.constituencies) {
      const key = normaliseConstituencyKey(c.constituencyName);
      if (key && !prevMap.has(key)) prevMap.set(key, c);
    }
  }

  return currentElection.constituencies.map(curr => {
    const key = normaliseConstituencyKey(curr.constituencyName);
    // 1) Exact normalised match
    let prev = prevMap.get(key) || null;
    // 2) Fuzzy fallback for transliteration variants
    if (!prev) prev = fuzzyMatch(key, prevMap);
    return {
      current: curr,
      previous: prev,
      comparison: prev ? buildSeatComparison(curr, prev) : null,
    };
  });
}
