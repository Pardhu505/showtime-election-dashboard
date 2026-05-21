// =========================================================================
// pardhu.js — entity detection + data grounding for the Pardhu chatbot.
//
// On every user question we scan for mentions of states, parties, and years,
// then pull matching data from the backend. The fetched facts are injected
// into the LLM's system prompt so the model has real numbers to work with
// instead of inventing seat counts.
// =========================================================================
import { api } from './api';

// ----- Known states with short-form aliases -------------------------------
const STATES = [
  ['Andhra Pradesh', ['ap']], ['Arunachal Pradesh', ['arunachal']],
  ['Assam', []], ['Bihar', []], ['Chhattisgarh', ['chattisgarh']],
  ['Delhi', ['ncr', 'new delhi']], ['Goa', []], ['Gujarat', []],
  ['Haryana', []], ['Himachal Pradesh', ['hp', 'himachal']],
  ['Jammu & Kashmir', ['jk', 'j&k', 'kashmir']],
  ['Jharkhand', []], ['Karnataka', ['ka']], ['Kerala', []],
  ['Madhya Pradesh', ['mp']], ['Maharashtra', ['mh']],
  ['Manipur', []], ['Meghalaya', []], ['Mizoram', []], ['Nagaland', []],
  ['Odisha', ['orissa']], ['Puducherry', ['pondicherry']],
  ['Punjab', []], ['Rajasthan', ['rj']], ['Sikkim', []],
  ['Tamil Nadu', ['tn', 'tamilnadu']], ['Telangana', ['ts']],
  ['Tripura', []], ['Uttar Pradesh', ['up']], ['Uttarakhand', ['uk']],
  ['West Bengal', ['wb', 'bengal']],
];

// ----- Party expansions (for nicer prose in answers) ----------------------
const PARTY_KEYWORDS = [
  'bjp', 'inc', 'congress', 'sp', 'samajwadi', 'tmc', 'trinamool', 'aap',
  'dmk', 'aiadmk', 'tdp', 'ysrcp', 'ysr', 'jdu', 'jds', 'bsp', 'rjd',
  'shiv sena', 'shs', 'ncp', 'cpi', 'cpm', 'biju', 'bjd', 'aimim',
  'national conference', 'jkn', 'mns',
];

// ----- Year detection (4-digit, 2014–2030) --------------------------------
const YEAR_RE = /\b(20\d\d)\b/g;

// ----- Election-type cues -------------------------------------------------
const ASSEMBLY_CUES = /\b(assembly|vidhan|state election|state polls?|state-level)\b/i;
const LOKSABHA_CUES = /\b(lok ?sabha|parliament|general election|ls ?(poll|election))\b/i;

/**
 * Detect entities in the user message.
 * Returns { states: [...], party: ['bjp', ...], years: [2024, ...], type }
 */
export function detectEntities(text) {
  const lower = text.toLowerCase();
  // States — match the canonical name or any alias (word-bounded)
  const found = new Set();
  for (const [name, aliases] of STATES) {
    const candidates = [name.toLowerCase(), ...aliases];
    for (const c of candidates) {
      // Word-boundary match. For 2-letter codes, require space/punct on both sides.
      const re = c.length <= 3
        ? new RegExp(`(^|[\\s,.?!])${c}([\\s,.?!]|$)`, 'i')
        : new RegExp(`\\b${c.replace(/[.&]/g, '\\$&')}\\b`, 'i');
      if (re.test(lower)) { found.add(name); break; }
    }
  }
  const parties = PARTY_KEYWORDS.filter(p => new RegExp(`\\b${p}\\b`).test(lower));
  const years = [...text.matchAll(YEAR_RE)].map(m => parseInt(m[1], 10)).filter(y => y >= 2010 && y <= 2030);
  let type = null;
  if (ASSEMBLY_CUES.test(text)) type = 'Assembly';
  if (LOKSABHA_CUES.test(text)) type = 'Lok Sabha';
  return { states: [...found], parties, years: [...new Set(years)], type };
}

/**
 * Build a compact factual brief that we'll inject into the LLM's prompt so
 * its answer is grounded in your actual database, not its training memory.
 *
 * Strategy:
 *   • State-specific question → most recent LS + most recent AS for that state
 *   • National "who won" question → top-3 alliances + top parties from /by-state
 *   • Year-specific → that year's rollup
 *
 * Returns a plain-text block (or empty string if no useful context found).
 */
export async function buildGrounding(message, lastFilters = null) {
  const ent = detectEntities(message);
  const blocks = [];

  // Resolve effective year + type
  let year = ent.years[0] || (ent.type === 'Lok Sabha' ? 2024 : null);
  let type = ent.type;

  // For state-specific questions, gather data for each mentioned state
  if (ent.states.length) {
    for (const state of ent.states.slice(0, 3)) {  // cap at 3 to keep prompt small
      // Most recent Lok Sabha for this state (2024)
      try {
        const ls = await api.getSummary(2024, 'Lok Sabha', state);
        if (ls?.partySummary?.length) {
          blocks.push(`${state} — Lok Sabha 2024 result (${ls.totalSeats} seats):\n` +
            ls.partySummary.slice(0, 6).map(p =>
              `  • ${p.partyAbbr || p.party}: ${p.seatsWon} seats won, ${(p.voteShare || 0).toFixed(1)}% vote share`
            ).join('\n'));
        }
      } catch (_) {}

      // Most recent Assembly for this state — try a few likely years descending
      for (const y of [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018]) {
        try {
          const as = await api.getSummary(y, 'Assembly', state);
          if (as?.partySummary?.length) {
            blocks.push(`${state} — Assembly ${y} result (${as.totalSeats} seats):\n` +
              as.partySummary.slice(0, 6).map(p =>
                `  • ${p.partyAbbr || p.party}: ${p.seatsWon} seats won, ${(p.voteShare || 0).toFixed(1)}% vote share`
              ).join('\n'));
            break;  // stop at first hit
          }
        } catch (_) {}
      }
    }
  }

  // National-level question (no specific state mentioned)
  if (!ent.states.length && (year || type === 'Lok Sabha')) {
    try {
      const rollup = await api.getStateRollup(year || 2024, type || 'Lok Sabha');
      if (Array.isArray(rollup) && rollup.length) {
        // Aggregate top parties nationally
        const tally = {};
        for (const doc of rollup) {
          for (const p of doc.partySummary || []) {
            const k = p.partyAbbr || p.party;
            if (!tally[k]) tally[k] = { seatsWon: 0, totalVotes: 0, color: p.partyColor };
            tally[k].seatsWon += p.seatsWon || 0;
            tally[k].totalVotes += p.totalVotes || 0;
          }
        }
        const totalVotes = Object.values(tally).reduce((s, t) => s + t.totalVotes, 0) || 1;
        const top = Object.entries(tally)
          .sort((a, b) => b[1].seatsWon - a[1].seatsWon)
          .slice(0, 8);
        blocks.push(`National ${type || 'Lok Sabha'} ${year || 2024} totals — top parties:\n` +
          top.map(([abbr, t]) => `  • ${abbr}: ${t.seatsWon} seats, ${(t.totalVotes * 100 / totalVotes).toFixed(1)}% vote share`).join('\n'));
      }
    } catch (_) {}
  }

  // Include the currently-applied dashboard filters as additional context
  if (lastFilters?.state && lastFilters?.year) {
    blocks.push(`(User is currently viewing: ${lastFilters.year} ${lastFilters.type} ${lastFilters.state} on the dashboard.)`);
  }

  return blocks.length ? blocks.join('\n\n') : '';
}

// ----- LLM call (routes through backend /api/chat) ------------------------
// The backend handles provider selection (Groq → Pollinations → fallback)
// and keeps API keys server-side. We just send the conversation history
// and any grounded data block.
export async function askPardhu(history, userMessage, grounding) {
  const messages = [
    ...history.slice(-8),
    { role: 'user', content: userMessage },
  ];
  try {
    const API_BASE = process.env.REACT_APP_API_URL || '/api';
    const resp = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, grounding }),
    });
    if (!resp.ok) throw new Error(`Backend returned ${resp.status}`);
    const data = await resp.json();
    return {
      reply: data.reply || "I didn't get a response — please try again.",
      provider: data.provider || 'unknown',
    };
  } catch (err) {
    return {
      reply: `I couldn't reach my backend right now (${err.message}). Make sure the API server is running on port 5000.`,
      provider: 'error',
    };
  }
}
