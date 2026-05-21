import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { fmt } from '../utils/comparison';
import { buildAnalysisPayload, localSummary, remoteSummary } from '../utils/aiAgent';
import './ConstituencyCompareDetail.css';

export default function ConstituencyCompareDetail({ current, comparison, currentElection, previousElection, onClose }) {
  // Build vote-share comparison chart data
  const voteShareData = comparison.voteTransfer.map(v => ({
    party: v.party,
    Previous: +v.prevShare.toFixed(2),
    Current: +v.currShare.toFixed(2),
    color: v.partyColor,
  }));

  // Margin comparison data
  const marginData = [
    { name: `${previousElection.year}`, value: comparison.previousMargin, color: comparison.previousWinner.partyColor },
    { name: `${currentElection.year}`, value: comparison.currentMargin, color: comparison.currentWinner.partyColor },
  ];

  // Turnout comparison data
  const turnoutData = [
    { name: `${previousElection.year}`, value: +comparison.previousTurnout.toFixed(1), color: '#94a3b8' },
    { name: `${currentElection.year}`, value: +comparison.currentTurnout.toFixed(1), color: 'var(--teal)' },
  ];

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel ccd-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-header">
          <div>
            <div className="detail-type-badge">🆚 Constituency Comparison</div>
            <div className="detail-title">{current.constituencyName}</div>
            <div className="detail-parent">
              {currentElection.type} · {currentElection.state} · {previousElection.year} → {currentElection.year}
            </div>
          </div>
          <button className="detail-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Party Change banner */}
        <div className={`ccd-banner ${comparison.partyChanged ? 'changed' : 'held'}`}>
          <div className="ccd-banner-icon">
            {comparison.partyChanged ? '🔄' : '✓'}
          </div>
          <div className="ccd-banner-text">
            <div className="ccd-banner-title">
              {comparison.partyChanged ? 'Party Changed' : 'Seat Held'}
            </div>
            <div className="ccd-banner-detail">
              <span style={{ color: comparison.previousWinner.partyColor, fontWeight: 700 }}>
                {comparison.previousWinner.party}
              </span>
              {' '}
              <span style={{ color: 'var(--text-muted)' }}>({previousElection.year})</span>
              <span style={{ margin: '0 8px' }}>→</span>
              <span style={{ color: comparison.currentWinner.partyColor, fontWeight: 700 }}>
                {comparison.currentWinner.party}
              </span>
              {' '}
              <span style={{ color: 'var(--text-muted)' }}>({currentElection.year})</span>
            </div>
          </div>
        </div>

        {/* Headline KPIs */}
        <div className="ccd-kpi-grid">
          <KpiBox label="Vote Difference"   value={fmt(comparison.voteTotalDelta)} sub={`${comparison.voteTotalDelta >= 0 ? '+' : ''}${comparison.voteTotalDeltaRatio}% change`} sign={comparison.voteTotalDelta} />
          <KpiBox label="Margin Δ"           value={fmt(comparison.marginDelta)} sub={`${fmt(comparison.previousMargin)} → ${fmt(comparison.currentMargin)}`} sign={comparison.marginDelta} />
          <KpiBox label="Turnout Δ"          value={`${comparison.turnoutDelta > 0 ? '+' : ''}${comparison.turnoutDelta}%`} sub={`${comparison.previousTurnout}% → ${comparison.currentTurnout}%`} sign={comparison.turnoutDelta} />
          <KpiBox label="Total Votes (Now)"  value={fmt(comparison.voteTotalCurrent)} sub={`Previous: ${fmt(comparison.voteTotalPrevious)}`} sign={0} />
        </div>

        {/* AI Analysis */}
        <AIAgentPanel
          current={current}
          comparison={comparison}
          currentElection={currentElection}
          previousElection={previousElection}
        />

        {/* Vote Share Comparison Chart */}
        <section className="ccd-section">
          <h3 className="ccd-section-title">Vote Share Comparison</h3>
          <p className="ccd-section-sub">Side-by-side party vote share, previous vs current.</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={voteShareData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
              <XAxis dataKey="party" tick={{ fill: '#4a5568', fontSize: 11 }} stroke="#cbd5e0" />
              <YAxis tickFormatter={v => v + '%'} tick={{ fill: '#4a5568', fontSize: 11 }} stroke="#cbd5e0" />
              <Tooltip
                formatter={v => Number(v).toFixed(2) + '%'}
                contentStyle={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 6, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Previous" fill="#94a3b8" radius={[3,3,0,0]} />
              <Bar dataKey="Current" radius={[3,3,0,0]}>
                {voteShareData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* Vote Transfer Table */}
        <section className="ccd-section">
          <h3 className="ccd-section-title">Vote Transfer</h3>
          <p className="ccd-section-sub">Party-by-party gains and losses in absolute votes and vote-share %.</p>
          <div className="table-wrap">
            <table className="table-compact">
              <thead>
                <tr>
                  <th>Party</th>
                  <th style={{ textAlign: 'right' }}>{previousElection.year} Votes</th>
                  <th style={{ textAlign: 'right' }}>{currentElection.year} Votes</th>
                  <th style={{ textAlign: 'right' }}>Δ Votes</th>
                  <th style={{ textAlign: 'right' }}>Δ Share</th>
                </tr>
              </thead>
              <tbody>
                {comparison.voteTransfer.map(v => (
                  <tr key={v.party}>
                    <td>
                      <span className="party-dot" style={{ background: v.partyColor, marginRight: 6 }} />
                      <span style={{ fontWeight: 600 }}>{v.party}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>{fmt(v.prevVotes)} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({v.prevShare.toFixed(1)}%)</span></td>
                    <td style={{ textAlign: 'right' }}>{fmt(v.currVotes)} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({v.currShare.toFixed(1)}%)</span></td>
                    <td style={{ textAlign: 'right', color: deltaColor(v.delta), fontWeight: 600 }}>
                      {v.delta > 0 ? '+' : v.delta < 0 ? '−' : ''}{fmt(Math.abs(v.delta))}
                    </td>
                    <td style={{ textAlign: 'right', color: deltaColor(v.shareDelta), fontWeight: 600 }}>
                      {v.shareDelta > 0 ? '+' : v.shareDelta < 0 ? '−' : ''}{Math.abs(v.shareDelta)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Margin & Turnout side-by-side charts */}
        <section className="ccd-section">
          <h3 className="ccd-section-title">Margin & Turnout</h3>
          <div className="ccd-dual-chart">
            <div className="ccd-dual-chart-item">
              <h4 className="ccd-dual-title">Winning Margin</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={marginData} margin={{ top: 6, right: 8, bottom: 6, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#4a5568', fontSize: 11 }} stroke="#cbd5e0" />
                  <YAxis tickFormatter={fmt} tick={{ fill: '#4a5568', fontSize: 11 }} stroke="#cbd5e0" />
                  <Tooltip
                    formatter={v => fmt(v) + ' votes'}
                    contentStyle={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 6, fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {marginData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="ccd-dual-chart-item">
              <h4 className="ccd-dual-title">Turnout %</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={turnoutData} margin={{ top: 6, right: 8, bottom: 6, left: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#4a5568', fontSize: 11 }} stroke="#cbd5e0" />
                  <YAxis domain={[0, 100]} tickFormatter={v => v + '%'} tick={{ fill: '#4a5568', fontSize: 11 }} stroke="#cbd5e0" />
                  <Tooltip
                    formatter={v => v + '%'}
                    contentStyle={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 6, fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {turnoutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Top 3 candidates comparison */}
        <section className="ccd-section">
          <h3 className="ccd-section-title">Top 3 Candidates: Then vs Now</h3>
          <p className="ccd-section-sub">Winner and the next two runners-up for each election.</p>
          <div className="ccd-runnerups-grid">
            <RunnerupColumn title={`${previousElection.year} — ${previousElection.type}`} candidates={comparison.runnerUps.previous} />
            <RunnerupColumn title={`${currentElection.year} — ${currentElection.type}`} candidates={comparison.runnerUps.current} highlight />
          </div>
        </section>
      </div>
    </div>
  );
}

function RunnerupColumn({ title, candidates, highlight }) {
  return (
    <div className={`ccd-ru-col ${highlight ? 'highlight' : ''}`}>
      <h4 className="ccd-ru-title">{title}</h4>
      {candidates.map((c, i) => (
        <div key={i} className="ccd-ru-row">
          <div className="ccd-ru-rank">#{i + 1}</div>
          <div className="ccd-ru-info">
            <div className="ccd-ru-name">{c.name}</div>
            <div className="ccd-ru-party">
              <span className="party-dot" style={{ background: c.partyColor }} />
              <span>{c.party}</span>
              <span className="ccd-ru-share">{c.voteShare}%</span>
            </div>
          </div>
          <div className="ccd-ru-votes">{fmt(c.votes)}</div>
        </div>
      ))}
    </div>
  );
}

function KpiBox({ label, value, sub, sign }) {
  const color = sign > 0 ? 'var(--india-green)' : sign < 0 ? 'var(--sp)' : 'var(--text-primary)';
  return (
    <div className="ccd-kpi">
      <div className="ccd-kpi-label">{label}</div>
      <div className="ccd-kpi-value" style={{ color }}>{value}</div>
      {sub && <div className="ccd-kpi-sub">{sub}</div>}
    </div>
  );
}

function deltaColor(v) {
  if (v > 0) return 'var(--india-green)';
  if (v < 0) return 'var(--sp)';
  return 'var(--text-muted)';
}

// =========================================================================
// AIAgentPanel — produces an analytical narrative for the constituency.
//
// "Local Analyst" runs a deterministic rule-based summarizer (always works,
//   offline, instant).
// "Cloud AI" calls Pollinations.ai — a free public LLM endpoint that
//   requires no API key. Falls back to local if the call fails.
// =========================================================================
function AIAgentPanel({ current, comparison, currentElection, previousElection }) {
  const [mode, setMode] = useState('local'); // 'local' | 'cloud'
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fellBack, setFellBack] = useState(false);
  const [generated, setGenerated] = useState(false);
  // Incremented on every Generate / Regenerate click. Used by the local
  // analyst to rotate template variants (so the text changes) and as a
  // re-trigger key in the cloud path.
  const [regenCount, setRegenCount] = useState(0);
  const abortRef = useRef(null);

  // Pre-compute the analysis payload once per render of this constituency
  const payload = useMemo(
    () => buildAnalysisPayload({ current, comparison, currentElection, previousElection }),
    [current, comparison, currentElection, previousElection]
  );

  // Abort any in-flight remote call when the panel unmounts or constituency changes
  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [current.constituencyName]);

  // Clear output whenever the user navigates to a different constituency
  useEffect(() => {
    setOutput('');
    setGenerated(false);
    setError('');
    setFellBack(false);
    setRegenCount(0);
  }, [current.constituencyName]);

  const generate = async () => {
    // Increment first — both paths use the new value
    const nextCount = regenCount + 1;
    setRegenCount(nextCount);

    setError('');
    setFellBack(false);
    setOutput('');
    setLoading(true);

    if (mode === 'local') {
      // Small artificial delay so the "thinking" indicator is perceptible
      // and the user clearly sees the panel refresh.
      await new Promise(r => setTimeout(r, 300));
      setOutput(localSummary(payload, nextCount));
      setGenerated(true);
      setLoading(false);
      return;
    }

    // Cloud mode — try Pollinations, fall back to local on any failure
    abortRef.current = new AbortController();
    const remote = await remoteSummary(payload, abortRef.current.signal);
    if (remote) {
      setOutput(remote);
    } else {
      setOutput(localSummary(payload, nextCount));
      setFellBack(true);
    }
    setGenerated(true);
    setLoading(false);
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(output); }
    catch { /* ignore — clipboard isn't available in some browsers */ }
  };

  return (
    <section className="ccd-section ccd-ai-section">
      <div className="ccd-ai-header">
        <div className="ccd-ai-title-block">
          <h3 className="ccd-section-title">
            <span className="ccd-ai-badge">AI</span>
            Constituency Analysis
          </h3>
          <p className="ccd-section-sub">
            Auto-generated analytical summary of {payload.constituency}'s {payload.previousYear} → {payload.currentYear} comparison.
          </p>
        </div>
        <div className="ccd-ai-modes">
          <button
            className={`ccd-ai-mode ${mode === 'local' ? 'active' : ''}`}
            onClick={() => { setMode('local'); }}
            title="Deterministic rule-based summary. Runs offline."
          >
            <span className="ccd-ai-mode-dot" /> Local Analyst
          </button>
          <button
            className={`ccd-ai-mode ${mode === 'cloud' ? 'active' : ''}`}
            onClick={() => { setMode('cloud'); }}
            title="Calls a free public LLM (Pollinations.ai) for richer prose. No API key needed."
          >
            <span className="ccd-ai-mode-dot" /> Cloud AI <span className="ccd-ai-free">FREE</span>
          </button>
        </div>
      </div>

      {!generated && !loading && (
        <div className="ccd-ai-cta">
          <p>
            Click <b>Generate Analysis</b> to produce a written summary covering the headline result,
            turnout & vote-volume change, vote transfer between parties, and runner-up dynamics.
          </p>
          <button className="btn btn-primary ccd-ai-generate" onClick={generate}>
            ✨ Generate Analysis
          </button>
        </div>
      )}

      {loading && (
        <div className="ccd-ai-loading">
          <div className="spinner" />
          <span>
            {mode === 'cloud'
              ? 'Calling the AI service… (this is a free public endpoint and may take a few seconds)'
              : 'Analysing comparison data…'}
          </span>
        </div>
      )}

      {output && !loading && (
        <div className="ccd-ai-output-wrap fade-in">
          {fellBack && (
            <div className="ccd-ai-fallback-note">
              ⚠ The cloud AI service was unreachable — showing the local analyst's summary instead.
            </div>
          )}
          <div className="ccd-ai-output">
            {output.split(/\n\n+/).map((para, i) => (
              <p key={i}>{para.trim()}</p>
            ))}
          </div>
          <div className="ccd-ai-actions">
            <button className="btn btn-secondary" onClick={generate} disabled={loading}>
              ↻ Regenerate
            </button>
            <button className="btn btn-secondary" onClick={handleCopy}>
              ⧉ Copy
            </button>
            <span className="ccd-ai-meta">
              {fellBack ? 'Local Analyst (fallback)' : mode === 'local' ? 'Local Analyst' : 'Cloud AI · Pollinations.ai'}
            </span>
          </div>
        </div>
      )}

      {error && <div className="ccd-ai-error">{error}</div>}
    </section>
  );
}
