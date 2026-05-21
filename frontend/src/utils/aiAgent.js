// =========================================================================
// aiAgent.js — produces an analytical natural-language summary of a
// constituency's election results comparison.
//
// Two paths:
//   1. localSummary(payload)   — rule-based, instant, fully offline
//   2. remoteSummary(payload)  — calls Pollinations.ai (free public LLM,
//                                no API key required) for richer prose
//
// The remote path falls back to the local one if the network call fails,
// so the UI is never blocked.
// =========================================================================

const fmt = n => {
  const abs = Math.abs(n);
  if (abs >= 10000000) return (n / 10000000).toFixed(2) + ' Cr';
  if (abs >= 100000) return (n / 100000).toFixed(2) + ' L';
  if (abs >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(Math.round(n));
};
const signed = (n, suffix = '') => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n))}${suffix}`;
const signedPct = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2)}%`;

/**
 * Builds the analytical payload that both summarizers consume.
 * Keeping this separate means the same facts feed the local and remote paths.
 */
export function buildAnalysisPayload({ current, comparison, currentElection, previousElection }) {
  const winner = comparison.currentWinner;
  const prevWinner = comparison.previousWinner;
  const flipped = comparison.partyChanged;

  // Biggest gainer and loser by absolute votes
  const gainers = [...comparison.voteTransfer].sort((a, b) => b.delta - a.delta);
  const biggestGainer = gainers[0];
  const biggestLoser  = gainers[gainers.length - 1];

  // Share-shift leaders
  const shareGainers = [...comparison.voteTransfer].sort((a, b) => b.shareDelta - a.shareDelta);
  const topShareGainer = shareGainers[0];
  const topShareLoser  = shareGainers[shareGainers.length - 1];

  // Margin trend
  const marginTrend = comparison.marginDelta > 0 ? 'widened' : comparison.marginDelta < 0 ? 'narrowed' : 'unchanged';
  const turnoutTrend = comparison.turnoutDelta > 0 ? 'increased' : comparison.turnoutDelta < 0 ? 'declined' : 'flat';

  // Vote-share level descriptor
  const marginPct = comparison.voteTotalCurrent
    ? (comparison.currentMargin / comparison.voteTotalCurrent) * 100
    : 0;
  const winType =
    marginPct < 2  ? 'wafer-thin' :
    marginPct < 5  ? 'narrow' :
    marginPct < 10 ? 'comfortable' :
    marginPct < 20 ? 'commanding' : 'landslide';

  const ru = comparison.runnerUps.current[1];
  const prevRu = comparison.runnerUps.previous[1];

  return {
    constituency: current.constituencyName,
    state: currentElection.state,
    type: currentElection.type,
    currentYear: currentElection.year,
    previousYear: previousElection.year,
    flipped,
    winner: { ...winner },
    prevWinner: { ...prevWinner },
    runnerUp: ru,
    prevRunnerUp: prevRu,
    winType,
    marginPct: +marginPct.toFixed(2),
    marginDelta: comparison.marginDelta,
    marginTrend,
    currentMargin: comparison.currentMargin,
    previousMargin: comparison.previousMargin,
    turnoutDelta: comparison.turnoutDelta,
    turnoutTrend,
    currentTurnout: comparison.currentTurnout,
    previousTurnout: comparison.previousTurnout,
    voteTotalDelta: comparison.voteTotalDelta,
    voteTotalDeltaRatio: comparison.voteTotalDeltaRatio,
    voteTotalCurrent: comparison.voteTotalCurrent,
    voteTotalPrevious: comparison.voteTotalPrevious,
    biggestGainer,
    biggestLoser,
    topShareGainer,
    topShareLoser,
    voteTransfer: comparison.voteTransfer,
  };
}

/**
 * Pure-JS template-based analysis. Produces 4 short paragraphs covering:
 *   - The headline result (who won, how, vs whom)
 *   - Vote-share movement and turnout
 *   - Vote transfer (which parties gained, which lost)
 *   - Runner-up dynamics and key takeaway
 *
 * `variant` (0+) lets the caller rotate phrasing on each regeneration so
 * the output isn't identical when the user clicks "Regenerate". The same
 * facts are conveyed each time — only the sentence templates differ.
 */
export function localSummary(p, variant = 0) {
  // Each phrasing pool is selected by `variant % pool.length`.
  // Keep alternatives factually identical — only word choice changes.
  const v = Math.max(0, Math.floor(variant));
  const pick = (arr) => arr[v % arr.length];

  const paras = [];

  // ===== Paragraph 1: Headline result =====
  if (p.flipped) {
    paras.push(pick([
      `${p.constituency} flipped from ${p.prevWinner.party} to ${p.winner.party} in ${p.currentYear}. ${p.winner.name} (${p.winner.party}) won by a ${p.winType} ${fmt(p.currentMargin)}-vote margin (${p.marginPct}% of votes cast), defeating ${p.runnerUp ? `${p.runnerUp.name} (${p.runnerUp.party})` : 'the runner-up'} and ending ${p.prevWinner.party}'s hold on the seat that ${p.prevWinner.name} had secured in ${p.previousYear} with a ${fmt(p.previousMargin)}-vote margin.`,
      `In ${p.currentYear}, ${p.constituency} changed hands — ${p.winner.party} wrested the seat from ${p.prevWinner.party} via ${p.winner.name}'s ${p.winType} ${fmt(p.currentMargin)}-vote victory (a ${p.marginPct}% margin). The ousted incumbent ${p.prevWinner.name} (${p.prevWinner.party}) had taken the constituency in ${p.previousYear} by ${fmt(p.previousMargin)} votes, so this is a clear reversal of fortune.`,
      `${p.winner.party} claimed ${p.constituency} in ${p.currentYear} after ${p.prevWinner.party} had held it in ${p.previousYear}. ${p.winner.name}'s ${fmt(p.currentMargin)}-vote ${p.winType} win (${p.marginPct}% margin of votes cast) overturned ${p.prevWinner.name}'s ${fmt(p.previousMargin)}-vote cushion from the previous cycle.`,
    ]));
  } else {
    paras.push(pick([
      `${p.winner.party} retained ${p.constituency} in ${p.currentYear}, with ${p.winner.name} winning by a ${p.winType} ${fmt(p.currentMargin)}-vote margin — ${p.marginTrend === 'widened' ? `widening` : p.marginTrend === 'narrowed' ? `narrowing` : `roughly matching`} the ${fmt(p.previousMargin)}-vote margin recorded in ${p.previousYear}. The seat now sits at ${p.marginPct}% of total votes cast as the winner's cushion.`,
      `${p.constituency} stayed with ${p.winner.party} in ${p.currentYear}. ${p.winner.name}'s ${p.winType} ${fmt(p.currentMargin)}-vote victory represents a ${p.marginTrend} margin compared to ${p.previousYear}'s ${fmt(p.previousMargin)}-vote win, leaving the party with a ${p.marginPct}% cushion of votes cast.`,
      `Holding ${p.constituency} again, ${p.winner.party}'s ${p.winner.name} took the ${p.currentYear} round by ${fmt(p.currentMargin)} votes — a ${p.winType} margin that ${p.marginTrend === 'widened' ? `expanded` : p.marginTrend === 'narrowed' ? `compressed` : `mirrored`} the ${fmt(p.previousMargin)}-vote result from ${p.previousYear}. That works out to a ${p.marginPct}% gap on votes polled.`,
    ]));
  }

  // ===== Paragraph 2: Vote-share and turnout =====
  const turnoutPhrase = (() => {
    if (p.turnoutTrend === 'flat') return pick([
      `Turnout held steady at ${p.currentTurnout}%`,
      `Voter turnout barely moved, sitting at ${p.currentTurnout}%`,
      `The turnout figure stayed at ${p.currentTurnout}%`,
    ]);
    return pick([
      `Turnout ${p.turnoutTrend} from ${p.previousTurnout}% to ${p.currentTurnout}% (${signedPct(p.turnoutDelta)})`,
      `Voter participation ${p.turnoutTrend === 'increased' ? 'rose' : 'fell'} ${signedPct(p.turnoutDelta)} — from ${p.previousTurnout}% in ${p.previousYear} to ${p.currentTurnout}% now`,
      `${p.turnoutTrend === 'increased' ? 'Higher' : 'Lower'} turnout was recorded this time: ${p.currentTurnout}% versus ${p.previousTurnout}% previously (${signedPct(p.turnoutDelta)})`,
    ]);
  })();
  const totalPhrase = p.voteTotalDelta === 0
    ? pick([
        `total polled votes were essentially unchanged at ${fmt(p.voteTotalCurrent)}`,
        `the absolute vote count held flat at roughly ${fmt(p.voteTotalCurrent)}`,
      ])
    : pick([
        `total votes cast moved from ${fmt(p.voteTotalPrevious)} to ${fmt(p.voteTotalCurrent)} (${signed(p.voteTotalDelta)}, ${signedPct(p.voteTotalDeltaRatio)})`,
        `the absolute vote pool ${p.voteTotalDelta > 0 ? 'grew' : 'shrank'} from ${fmt(p.voteTotalPrevious)} to ${fmt(p.voteTotalCurrent)} — a ${signedPct(p.voteTotalDeltaRatio)} change`,
        `${fmt(p.voteTotalCurrent)} valid votes were polled this time, compared with ${fmt(p.voteTotalPrevious)} in ${p.previousYear} (${signedPct(p.voteTotalDeltaRatio)})`,
      ]);
  paras.push(`${turnoutPhrase}. The ${totalPhrase[0].toUpperCase()}${totalPhrase.slice(1)}.`);

  // ===== Paragraph 3: Vote transfer =====
  const gainerLine = p.biggestGainer && p.biggestGainer.delta > 0
    ? pick([
        `${p.biggestGainer.party} gained the most ground, adding ${fmt(p.biggestGainer.delta)} votes (${signedPct(p.biggestGainer.shareDelta)} vote share)`,
        `the biggest beneficiary was ${p.biggestGainer.party}, which picked up ${fmt(p.biggestGainer.delta)} additional votes (${signedPct(p.biggestGainer.shareDelta)} share)`,
        `${p.biggestGainer.party} was the principal gainer, expanding by ${fmt(p.biggestGainer.delta)} votes and ${signedPct(p.biggestGainer.shareDelta)} of vote share`,
      ])
    : null;
  const loserLine = p.biggestLoser && p.biggestLoser.delta < 0
    ? pick([
        `${p.biggestLoser.party} lost the most, shedding ${fmt(Math.abs(p.biggestLoser.delta))} votes (${signedPct(p.biggestLoser.shareDelta)} vote share)`,
        `the heaviest casualty was ${p.biggestLoser.party}, which lost ${fmt(Math.abs(p.biggestLoser.delta))} votes (${signedPct(p.biggestLoser.shareDelta)} share)`,
        `${p.biggestLoser.party} bled the most support, losing ${fmt(Math.abs(p.biggestLoser.delta))} votes and ${signedPct(p.biggestLoser.shareDelta)} of vote share`,
      ])
    : null;
  const shareSwingLine = p.topShareGainer && p.topShareLoser && p.topShareGainer.party !== p.topShareLoser.party
    ? pick([
        `the cleanest vote-share swing was ${signedPct(p.topShareGainer.shareDelta)} for ${p.topShareGainer.party} versus ${signedPct(p.topShareLoser.shareDelta)} for ${p.topShareLoser.party}`,
        `on share terms, the biggest swing pair was ${p.topShareGainer.party} (${signedPct(p.topShareGainer.shareDelta)}) against ${p.topShareLoser.party} (${signedPct(p.topShareLoser.shareDelta)})`,
      ])
    : null;
  const transferParts = [gainerLine, loserLine, shareSwingLine].filter(Boolean);
  if (transferParts.length) paras.push(transferParts.join('. ') + '.');

  // ===== Paragraph 4: Runner-up + key takeaway =====
  const ruParts = [];
  if (p.runnerUp && p.prevRunnerUp) {
    if (p.runnerUp.party !== p.prevRunnerUp.party) {
      ruParts.push(pick([
        `The runner-up slot itself changed hands — ${p.prevRunnerUp.party} (${p.prevRunnerUp.voteShare}% in ${p.previousYear}) was overtaken by ${p.runnerUp.party} (${p.runnerUp.voteShare}% in ${p.currentYear})`,
        `Second place also changed: ${p.prevRunnerUp.party} (${p.prevRunnerUp.voteShare}% last cycle) gave way to ${p.runnerUp.party} (${p.runnerUp.voteShare}% now)`,
        `A new principal challenger emerged — ${p.runnerUp.party} (${p.runnerUp.voteShare}%) displaced the previous runner-up ${p.prevRunnerUp.party} (${p.prevRunnerUp.voteShare}% in ${p.previousYear})`,
      ]));
    } else {
      ruParts.push(pick([
        `${p.runnerUp.party} remained the principal challenger, closing at ${p.runnerUp.voteShare}% (vs ${p.prevRunnerUp.voteShare}% in ${p.previousYear})`,
        `The runner-up position was again ${p.runnerUp.party} — finishing at ${p.runnerUp.voteShare}%, against ${p.prevRunnerUp.voteShare}% in ${p.previousYear}`,
        `${p.runnerUp.party} held its place as the leading opponent, registering ${p.runnerUp.voteShare}% versus ${p.prevRunnerUp.voteShare}% last time`,
      ]));
    }
  }

  let takeaway;
  if (p.flipped && p.marginPct >= 10) {
    takeaway = pick([
      `Bottom line: a decisive flip — ${p.winner.party} converted a ${p.previousYear} loss into a ${p.winType} ${p.currentYear} win, suggesting structural rather than tactical change.`,
      `Net read: a substantial flip. ${p.winner.party} didn't just edge out ${p.prevWinner.party} — the margin points to a structural shift in the constituency.`,
      `The takeaway: ${p.winner.party}'s win here is large enough to suggest a real underlying realignment, not a tactical anomaly.`,
    ]);
  } else if (p.flipped && p.marginPct < 5) {
    takeaway = pick([
      `Bottom line: a ${p.winType} flip that ${p.prevWinner.party} could plausibly reverse next cycle with a small swing.`,
      `Net read: the flip is real but fragile — ${p.prevWinner.party} stays within striking distance for the next round.`,
      `The takeaway: ${p.winner.party}'s lead is slim enough that ${p.prevWinner.party} could plausibly recapture this seat with a modest swing.`,
    ]);
  } else if (!p.flipped && p.marginTrend === 'widened') {
    takeaway = pick([
      `Bottom line: ${p.winner.party} consolidated its hold here — the increased margin makes ${p.constituency} a safer seat going into the next cycle.`,
      `Net read: ${p.winner.party}'s grip on ${p.constituency} tightened. The seat now looks safer than it did a cycle ago.`,
      `The takeaway: an entrenchment of ${p.winner.party}'s position — ${p.constituency} is now a more reliable hold than before.`,
    ]);
  } else if (!p.flipped && p.marginTrend === 'narrowed') {
    takeaway = pick([
      `Bottom line: although ${p.winner.party} held the seat, the narrowed margin signals erosion that the opposition can build on.`,
      `Net read: a held seat, but a weaker one — the compressed margin gives the opposition a clear opening.`,
      `The takeaway: ${p.winner.party} retained ${p.constituency}, but the slimmer margin marks it as a softening hold worth watching.`,
    ]);
  } else {
    takeaway = pick([
      `Bottom line: a stable seat — ${p.winner.party}'s position here changed little between ${p.previousYear} and ${p.currentYear}.`,
      `Net read: status quo. ${p.winner.party}'s hold on ${p.constituency} looks roughly the same as last cycle.`,
      `The takeaway: little movement here — ${p.winner.party}'s position is essentially stable across the two cycles.`,
    ]);
  }
  ruParts.push(takeaway);
  paras.push(ruParts.join('. ') + '.');

  return paras.join('\n\n');
}

/**
 * Calls a free public LLM endpoint (Pollinations.ai) to produce a richer
 * narrative. No API key required. Falls back to localSummary on any error.
 *
 * @param {object} payload — output of buildAnalysisPayload
 * @param {AbortSignal} [signal] — optional fetch abort signal
 */
export async function remoteSummary(payload, signal) {
  const facts = JSON.stringify({
    constituency: payload.constituency,
    state: payload.state,
    election_type: payload.type,
    current_year: payload.currentYear,
    previous_year: payload.previousYear,
    party_changed: payload.flipped,
    current_winner: { name: payload.winner.name, party: payload.winner.party, vote_share: payload.winner.voteShare, margin: payload.currentMargin },
    previous_winner: { name: payload.prevWinner.name, party: payload.prevWinner.party, margin: payload.previousMargin },
    runner_up_current: payload.runnerUp ? { name: payload.runnerUp.name, party: payload.runnerUp.party, vote_share: payload.runnerUp.voteShare } : null,
    runner_up_previous: payload.prevRunnerUp ? { name: payload.prevRunnerUp.name, party: payload.prevRunnerUp.party, vote_share: payload.prevRunnerUp.voteShare } : null,
    margin_delta_votes: payload.marginDelta,
    margin_percent_current: payload.marginPct,
    turnout_current: payload.currentTurnout,
    turnout_previous: payload.previousTurnout,
    turnout_delta: payload.turnoutDelta,
    total_votes_current: payload.voteTotalCurrent,
    total_votes_previous: payload.voteTotalPrevious,
    biggest_party_gain: payload.biggestGainer ? { party: payload.biggestGainer.party, votes_delta: payload.biggestGainer.delta, share_delta: payload.biggestGainer.shareDelta } : null,
    biggest_party_loss: payload.biggestLoser ? { party: payload.biggestLoser.party, votes_delta: payload.biggestLoser.delta, share_delta: payload.biggestLoser.shareDelta } : null,
    full_vote_transfer: payload.voteTransfer.map(v => ({ party: v.party, prev_votes: v.prevVotes, curr_votes: v.currVotes, prev_share: v.prevShare, curr_share: v.currShare })),
  }, null, 2);

  const prompt = `You are an analyst for an Indian election research firm. Given the structured facts below about ONE constituency, write a 4-paragraph analytical summary aimed at a political strategist. Be concrete and use the actual numbers from the data. Cover (1) the headline result with margin context, (2) turnout and vote-volume changes, (3) which parties gained or lost ground in vote transfer, and (4) the runner-up dynamic plus one strategic takeaway. Do not invent any facts not present in the data. Keep it under 280 words. Use plain prose — no bullet points, no markdown headings.

FACTS:
${facts}

ANALYSIS:`;

  try {
    const resp = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: 'You are an analyst for an Indian election research firm. You write precise, fact-grounded analysis using only the numbers provided.' },
          { role: 'user', content: prompt },
        ],
        // Higher temperature + a fresh seed every call so "Regenerate" actually
        // produces a meaningfully different summary each time.
        temperature: 0.7 + Math.random() * 0.15,
        seed: Math.floor(Math.random() * 1_000_000),
      }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response');
    return text;
  } catch (err) {
    // Network issue, rate-limit, or any other error → graceful fallback.
    return null;
  }
}
