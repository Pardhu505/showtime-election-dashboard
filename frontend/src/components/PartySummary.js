import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { buildPartyContestComparison } from '../utils/comparison';
import './PartySummary.css';

const fmt = n => n >= 10000000 ? (n / 10000000).toFixed(1) + 'Cr' : n >= 100000 ? (n / 100000).toFixed(1) + 'L' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : n;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 6, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, color: d.partyColor || '#1a202c', marginBottom: 4 }}>{d.party}</div>
      <div style={{ color: '#4a5568' }}>Seats Won: <b style={{ color: '#1a202c' }}>{d.seatsWon}</b></div>
      <div style={{ color: '#4a5568' }}>Contested: {d.seatsContested}</div>
      <div style={{ color: '#4a5568' }}>Votes: {fmt(d.totalVotes)}</div>
      <div style={{ color: '#4a5568' }}>Vote Share: {d.voteShare}%</div>
    </div>
  );
};

export default function PartySummary({ electionData, previousElection }) {
  const [view, setView] = useState('bar');
  const { partySummary, constituencies, totalSeats } = electionData;

  // Recalculate party summary from filtered constituencies.
  // Defensive: skip any constituency that lacks a candidates array (the
  // backend's slim /summary response may strip it on some routes).
  const pMap = {};
  let grand = 0;
  for (const c of constituencies) {
    if (!Array.isArray(c.candidates) || c.candidates.length === 0) continue;
    for (const cand of c.candidates) {
      if (!pMap[cand.party]) pMap[cand.party] = { party: cand.party, partyAbbr: cand.partyAbbr, partyColor: cand.partyColor, seatsWon: 0, seatsContested: 0, totalVotes: 0, voteShare: 0 };
      pMap[cand.party].seatsContested++;
      pMap[cand.party].totalVotes += cand.votes;
      grand += cand.votes;
      if (cand.isWinner) pMap[cand.party].seatsWon++;
    }
  }
  let summary = Object.values(pMap)
    .map(p => ({ ...p, voteShare: grand ? +((p.totalVotes / grand) * 100).toFixed(2) : 0 }))
    .sort((a, b) => b.seatsWon - a.seatsWon);

  // If recalculation produced nothing (e.g. backend stripped candidates entirely),
  // fall back to the precomputed partySummary shipped in the response.
  if (summary.length === 0 && Array.isArray(partySummary) && partySummary.length) {
    summary = [...partySummary].sort((a, b) => (b.seatsWon || 0) - (a.seatsWon || 0));
  }

  const top10 = summary.slice(0, 10);
  const totalShown = constituencies.length;
  const seatsWonTotal = summary.reduce((s, p) => s + p.seatsWon, 0);

  // Majority line
  const majority = Math.floor(totalSeats / 2) + 1;

  // Cumulative NDA/INDIA alliance estimation (simplistic)
  const ndaParties = ['BJP', 'SS', 'JDU', 'NCP', 'TDP', 'RLD'];
  const indiaParties = ['INC', 'SP', 'AAP', 'TMC', 'DMK', 'NCP(SP)', 'SS(UBT)', 'RJD', 'CPIM', 'CPI(M)'];
  const ndaSeats = summary.filter(p => ndaParties.includes(p.party)).reduce((s, p) => s + p.seatsWon, 0);
  const indiaSeats = summary.filter(p => indiaParties.includes(p.party)).reduce((s, p) => s + p.seatsWon, 0);
  const othersSeats = seatsWonTotal - ndaSeats - indiaSeats;

  return (
    <div className="party-summary fade-in">
      {/* Quick Summary strip — key headlines vs previous election */}
      <QuickSummaryStrip
        summary={summary}
        previousElection={previousElection}
        totalSeats={totalSeats}
        currentYear={electionData.year}
      />

      {/* Alliance Scoreboard */}
      <div className="alliance-board">
        <AllianceCard name="NDA" seats={ndaSeats} total={totalShown} color="#FF6B00" majority={majority} />
        <div className="majority-marker">
          <div className="majority-num">{majority}</div>
          <div className="majority-label">Majority Mark</div>
        </div>
        <AllianceCard name="I.N.D.I.A" seats={indiaSeats} total={totalShown} color="#19AAED" majority={majority} reverse />
        <AllianceCard name="Others" seats={othersSeats} total={totalShown} color="#94a3b8" majority={majority} />
      </div>

      <div className="party-charts-grid">
        {/* Bar Chart */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Seats Won by Party</div>
              <div className="section-sub">Top 10 parties</div>
            </div>
            <div className="tabs" style={{ width: 'auto' }}>
              <button className={`tab-btn ${view === 'bar' ? 'active' : ''}`} onClick={() => setView('bar')}>Bar</button>
              <button className={`tab-btn ${view === 'pie' ? 'active' : ''}`} onClick={() => setView('pie')}>Pie</button>
            </div>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              {view === 'bar' ? (
                <BarChart data={top10} margin={{ top: 4, right: 8, bottom: 24, left: -10 }}>
                  <XAxis dataKey="partyAbbr" tick={{ fill: '#4a5568', fontSize: 11 }} angle={-30} textAnchor="end" stroke="#cbd5e0" />
                  <YAxis tick={{ fill: '#4a5568', fontSize: 11 }} stroke="#cbd5e0" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="seatsWon" radius={[4, 4, 0, 0]}>
                    {top10.map((p, i) => <Cell key={i} fill={p.partyColor || '#666'} />)}
                  </Bar>
                </BarChart>
              ) : (
                <PieChart>
                  <Pie data={top10} dataKey="seatsWon" nameKey="party" cx="50%" cy="50%" outerRadius={100} innerRadius={55}>
                    {top10.map((p, i) => <Cell key={i} fill={p.partyColor || '#666'} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ fontSize: 11, color: '#4a5568' }}>{v}</span>} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vote Share Chart */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Vote Share %</div>
              <div className="section-sub">Top parties by vote %</div>
            </div>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 20 }}>
                <XAxis type="number" tick={{ fill: '#4a5568', fontSize: 11 }} domain={[0, 'auto']} tickFormatter={v => v + '%'} stroke="#cbd5e0" />
                <YAxis type="category" dataKey="partyAbbr" tick={{ fill: '#4a5568', fontSize: 11 }} width={52} stroke="#cbd5e0" />
                <Tooltip formatter={v => v + '%'} contentStyle={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="voteShare" radius={[0, 4, 4, 0]}>
                  {top10.map((p, i) => <Cell key={i} fill={p.partyColor || '#666'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">Party-wise Detailed Results</div>
            <div className="section-sub">{summary.length} parties / {totalShown} constituencies</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Party</th>
                <th>Seats Won</th>
                <th>Contested</th>
                <th>Strike Rate</th>
                <th>Total Votes</th>
                <th>Vote Share</th>
                <th>Vote Share Bar</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((p, i) => (
                <tr key={p.party}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="party-dot" style={{ background: p.partyColor || '#666' }} />
                      <span style={{ fontWeight: 600 }}>{p.party}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: 16, color: p.partyColor || 'inherit', fontFamily: 'var(--font-display)' }}>
                      {p.seatsWon}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.seatsContested}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {p.seatsContested ? ((p.seatsWon / p.seatsContested) * 100).toFixed(0) + '%' : '—'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{fmt(p.totalVotes)}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.voteShare}%</td>
                  <td style={{ minWidth: 100 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(p.voteShare * 2, 100)}%`, background: p.partyColor || '#666' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previousElection && (
        <PartyComparisonCard
          currentSummary={summary}
          previousElection={previousElection}
          currentYear={electionData.year}
        />
      )}

      {/* Pointer to the Constituency Analysis tab — surfaces the deeper drill-down */}
      <ConstituencyAnalysisCallout
        constituencies={constituencies}
        previousElection={previousElection}
        currentYear={electionData.year}
      />
    </div>
  );
}

function PartyComparisonCard({ currentSummary, previousElection, currentYear }) {
  const comparison = buildPartyContestComparison(currentSummary, previousElection.partySummary);
  if (!comparison.length) return null;
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div className="section-title">Party-wise Seats: {currentYear} vs {previousElection.year}</div>
        <div className="section-sub">Contested · Won · Vote-share change between elections.</div>
      </div>
      <div className="table-wrap">
        <table className="table-compact">
          <thead>
            <tr>
              <th>Party</th>
              <th style={{ textAlign: 'right' }}>Contested ({previousElection.year})</th>
              <th style={{ textAlign: 'right' }}>Contested ({currentYear})</th>
              <th style={{ textAlign: 'right' }}>Won ({previousElection.year})</th>
              <th style={{ textAlign: 'right' }}>Won ({currentYear})</th>
              <th style={{ textAlign: 'right' }}>Δ Seats</th>
              <th style={{ textAlign: 'right' }}>Vote % ({previousElection.year})</th>
              <th style={{ textAlign: 'right' }}>Vote % ({currentYear})</th>
              <th style={{ textAlign: 'right' }}>Δ Vote %</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map(p => (
              <tr key={p.party}>
                <td>
                  <span className="party-dot" style={{ background: p.partyColor, marginRight: 6 }} />
                  <span style={{ fontWeight: 600 }}>{p.party}</span>
                </td>
                <td style={{ textAlign: 'right' }}>{p.prevContested}</td>
                <td style={{ textAlign: 'right' }}>{p.currContested}</td>
                <td style={{ textAlign: 'right' }}>{p.prevWon}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: p.partyColor }}>{p.currWon}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: p.wonDelta > 0 ? 'var(--india-green)' : p.wonDelta < 0 ? 'var(--sp)' : 'var(--text-muted)' }}>
                  {p.wonDelta > 0 ? '+' : p.wonDelta < 0 ? '−' : ''}{Math.abs(p.wonDelta)}
                </td>
                <td style={{ textAlign: 'right' }}>{p.prevShare}%</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.currShare}%</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: p.shareDelta > 0 ? 'var(--india-green)' : p.shareDelta < 0 ? 'var(--sp)' : 'var(--text-muted)' }}>
                  {p.shareDelta > 0 ? '+' : p.shareDelta < 0 ? '−' : ''}{Math.abs(p.shareDelta)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllianceCard({ name, seats, total, color, majority, reverse }) {
  const pct = total ? (seats / total) * 100 : 0;
  const got = seats >= majority;
  // Map alliance name → visual identity (silhouette style + party symbol)
  const id = name.toUpperCase().replace(/[^A-Z]/g, '');
  let theme = 'others';
  if (id === 'NDA')           theme = 'nda';
  else if (id.includes('INDIA')) theme = 'india';

  return (
    <div className={`alliance-card alliance-${theme} ${got ? 'is-majority' : ''}`} style={{ '--ac': color }}>
      {/* Faded watermark silhouette + party symbol on the right edge of the card */}
      <div className="alliance-watermark" aria-hidden="true">
        <LeaderSilhouette theme={theme} color={color} />
      </div>

      <div className="alliance-card-content">
        <div className="alliance-name" style={{ color }}>{name}</div>
        <div className="alliance-seats" style={{ color }}>{seats}</div>
        <div className="alliance-label">seats</div>
        <div className="alliance-bar">
          <div className="alliance-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
        </div>
        <div className="alliance-pct" style={{ color: 'var(--text-muted)' }}>
          {pct.toFixed(1)}%{got && <span className="alliance-majority-tag" style={{ color }}> · MAJORITY</span>}
        </div>
      </div>
    </div>
  );
}

// Stylised SVG silhouette + party symbol. No real photographs are used —
// these are abstract representations tinted in the alliance colour so they
// read as a watermark behind the numbers.
function LeaderSilhouette({ theme, color }) {
  // Common silhouette: head + shoulders + suit. Detail varies slightly by theme.
  const Avatar = (
    <g opacity="0.7">
      <ellipse cx="60" cy="44" rx="22" ry="26" fill={color} />
      <path d="M60 70 C 40 70, 22 84, 22 116 L 98 116 C 98 84, 80 70, 60 70 Z" fill={color} />
      {/* Subtle collar / shirt detail in a darker tone */}
      <path d="M50 72 L 60 92 L 70 72 L 70 80 L 60 100 L 50 80 Z" fill="#fff" opacity="0.4" />
    </g>
  );

  // Theme-specific accent (party symbol-ish) at top-right of the watermark
  let symbol = null;
  if (theme === 'nda') {
    // Stylised lotus (8 petals) — represents BJP-led NDA
    symbol = (
      <g transform="translate(112, 30)" opacity="0.55">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
          <ellipse
            key={a}
            cx="0" cy="-14" rx="6" ry="14"
            fill={color}
            transform={`rotate(${a})`}
          />
        ))}
        <circle r="6" fill={color} />
      </g>
    );
  } else if (theme === 'india') {
    // Stylised hand outline — represents INC-led INDIA bloc
    symbol = (
      <g transform="translate(106, 24)" opacity="0.55" fill={color}>
        <path d="M 0 12 L 0 -8 Q 0 -14 5 -14 Q 10 -14 10 -8 L 10 4
                  L 12 -10 Q 12 -16 18 -16 Q 24 -16 24 -10 L 24 6
                  L 26 -6 Q 26 -12 32 -12 Q 38 -12 38 -6 L 38 8
                  L 40 -2 Q 40 -8 46 -8 Q 52 -8 52 -2 L 52 16
                  Q 52 30 38 30 L 12 30 Q 0 30 0 18 Z" />
      </g>
    );
  } else {
    // Others — a neutral circular dot pattern
    symbol = (
      <g transform="translate(110, 32)" opacity="0.45" fill={color}>
        <circle cx="0"  cy="0" r="5" />
        <circle cx="14" cy="-4" r="3" />
        <circle cx="-12" cy="8" r="3" />
      </g>
    );
  }

  return (
    <svg viewBox="0 0 140 140" preserveAspectRatio="xMidYMid meet" className="alliance-silhouette-svg">
      {Avatar}
      {symbol}
    </svg>
  );
}

// =========================================================================
// QuickSummaryStrip — top-of-tab headline row: per-party seats-won this
// election plus the swing vs the previous election (Δ won, Δ contested,
// Δ vote share). Shows the top 4 parties as pill cards.
// =========================================================================
function QuickSummaryStrip({ summary, previousElection, totalSeats, currentYear }) {
  // Top 4 parties by seats won
  const top = summary.slice(0, 4);
  if (!top.length) return null;

  // Map previous-party-summary for quick lookup
  const prevByParty = new Map();
  if (previousElection?.partySummary) {
    for (const p of previousElection.partySummary) prevByParty.set(p.party, p);
  }

  return (
    <div className="quick-summary-strip">
      <div className="qs-header">
        <div className="qs-title">
          Quick Summary
          {previousElection && (
            <span className="qs-vs"> · {currentYear} vs {previousElection.year}</span>
          )}
        </div>
        <div className="qs-total">{totalSeats} total seats</div>
      </div>
      <div className="qs-grid">
        {top.map(p => {
          const prev = prevByParty.get(p.party);
          const wonDelta = prev ? p.seatsWon - prev.seatsWon : null;
          const contestedDelta = prev ? p.seatsContested - prev.seatsContested : null;
          const shareDelta = prev ? +(p.voteShare - prev.voteShare).toFixed(1) : null;
          const strikeRate = p.seatsContested ? Math.round((p.seatsWon / p.seatsContested) * 100) : 0;
          return (
            <div className="qs-card" key={p.party} style={{ borderTopColor: p.partyColor }}>
              <div className="qs-card-header">
                <span className="party-dot" style={{ background: p.partyColor }} />
                <span className="qs-party-name">{p.party}</span>
              </div>
              <div className="qs-headline">
                <span className="qs-won" style={{ color: p.partyColor }}>{p.seatsWon}</span>
                <span className="qs-of-contested">/ {p.seatsContested} contested</span>
              </div>
              <div className="qs-rows">
                <div className="qs-row">
                  <span className="qs-row-label">Seats won</span>
                  <DeltaBadge value={wonDelta} />
                </div>
                <div className="qs-row">
                  <span className="qs-row-label">Contested</span>
                  <DeltaBadge value={contestedDelta} />
                </div>
                <div className="qs-row">
                  <span className="qs-row-label">Vote share</span>
                  <DeltaBadge value={shareDelta} suffix="%" />
                </div>
                <div className="qs-row">
                  <span className="qs-row-label">Strike rate</span>
                  <span className="qs-strike">{strikeRate}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {previousElection?.synthesized && (
        <div className="qs-note">
          <span>ⓘ</span>
          Previous-election figures for this state aren't in the bundled mock dataset — values shown are plausible estimates derived from the current results, so deltas are illustrative.
        </div>
      )}
    </div>
  );
}

function DeltaBadge({ value, suffix = '' }) {
  if (value === null || value === undefined) return <span className="qs-delta neutral">—</span>;
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const cls = value > 0 ? 'pos' : value < 0 ? 'neg' : 'neutral';
  return <span className={`qs-delta ${cls}`}>{sign}{Math.abs(value)}{suffix}</span>;
}

// =========================================================================
// ConstituencyAnalysisCallout — a teaser block under the party-wise details
// that previews the per-seat comparison (flipped seats, biggest margin
// swings, turnout changes) and links to the dedicated tab.
// =========================================================================
function ConstituencyAnalysisCallout({ constituencies, previousElection, currentYear }) {
  if (!previousElection) {
    return (
      <div className="card constituency-callout" style={{ padding: '14px 16px' }}>
        <div className="section-title">Constituency-wise Analysis</div>
        <div className="section-sub" style={{ marginTop: 4 }}>
          Per-seat comparison with the previous election will appear here once previous-year data is loaded.
        </div>
      </div>
    );
  }

  // Quick stats: how many seats flipped, biggest margin swing, biggest turnout change
  const prevByName = new Map();
  for (const c of previousElection.constituencies) prevByName.set(c.constituencyName, c);

  let flipped = 0, held = 0, sumTurnoutDelta = 0, n = 0;
  let biggestMarginSwing = null;
  let biggestTurnoutChange = null;

  for (const curr of constituencies) {
    const prev = prevByName.get(curr.constituencyName);
    if (!prev) continue;
    n++;
    if (curr.winner.party !== prev.winner.party) flipped++; else held++;
    const marginDelta = curr.winner.margin - prev.winner.margin;
    const turnoutDelta = +(curr.turnout - prev.turnout).toFixed(2);
    sumTurnoutDelta += turnoutDelta;
    if (!biggestMarginSwing || Math.abs(marginDelta) > Math.abs(biggestMarginSwing.delta)) {
      biggestMarginSwing = { name: curr.constituencyName, delta: marginDelta, from: prev.winner.party, to: curr.winner.party };
    }
    if (!biggestTurnoutChange || Math.abs(turnoutDelta) > Math.abs(biggestTurnoutChange.delta)) {
      biggestTurnoutChange = { name: curr.constituencyName, delta: turnoutDelta };
    }
  }

  return (
    <div className="card constituency-callout">
      <div className="cc-header">
        <div>
          <div className="section-title">Constituency-wise Analysis</div>
          <div className="section-sub">
            Per-seat drill-down comparing {currentYear} vs {previousElection.year} — party flips, margin & turnout swings, vote transfer, runner-up shifts.
          </div>
        </div>
        <div className="cc-tab-hint">
          See full breakdown in the <b>Constituency Analysis</b> tab above ↑
        </div>
      </div>

      <div className="cc-stat-grid">
        <div className="cc-stat-card">
          <div className="cc-stat-value cc-flip">{flipped}</div>
          <div className="cc-stat-label">Seats flipped party</div>
          <div className="cc-stat-sub">{n ? Math.round((flipped/n)*100) : 0}% of {n} compared seats</div>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-value cc-hold">{held}</div>
          <div className="cc-stat-label">Seats held by same party</div>
          <div className="cc-stat-sub">{n ? Math.round((held/n)*100) : 0}% of compared seats</div>
        </div>
        <div className="cc-stat-card">
          <div className="cc-stat-value cc-turnout">{n ? (sumTurnoutDelta/n).toFixed(2) : '—'}%</div>
          <div className="cc-stat-label">Avg turnout change</div>
          <div className="cc-stat-sub">{currentYear} vs {previousElection.year}</div>
        </div>
        {biggestMarginSwing && (
          <div className="cc-stat-card">
            <div className="cc-stat-value cc-swing">{biggestMarginSwing.delta > 0 ? '+' : '−'}{fmt(Math.abs(biggestMarginSwing.delta))}</div>
            <div className="cc-stat-label">Biggest margin swing</div>
            <div className="cc-stat-sub">{biggestMarginSwing.name} {biggestMarginSwing.from !== biggestMarginSwing.to ? `· ${biggestMarginSwing.from} → ${biggestMarginSwing.to}` : ''}</div>
          </div>
        )}
        {biggestTurnoutChange && (
          <div className="cc-stat-card">
            <div className="cc-stat-value cc-turnout">{biggestTurnoutChange.delta > 0 ? '+' : ''}{biggestTurnoutChange.delta}%</div>
            <div className="cc-stat-label">Biggest turnout change</div>
            <div className="cc-stat-sub">{biggestTurnoutChange.name}</div>
          </div>
        )}
      </div>
    </div>
  );
}
