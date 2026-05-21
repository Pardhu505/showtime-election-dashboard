import React, { useState, useMemo } from 'react';
import { buildConstituencyComparisons, fmt } from '../utils/comparison';
import ConstituencyCompareDetail from './ConstituencyCompareDetail';
import './ConstituencyAnalysis.css';

const SORT_FIELDS = [
  { id: 'name',       label: 'Constituency' },
  { id: 'partyChange',label: 'Party Change' },
  { id: 'margin',     label: 'Margin Δ' },
  { id: 'turnout',    label: 'Turnout Δ' },
  { id: 'voteTotal',  label: 'Total Votes Δ' },
];

export default function ConstituencyAnalysis({ currentElection, previousElection }) {
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | changed | held

  const comparisons = useMemo(
    () => buildConstituencyComparisons(currentElection, previousElection),
    [currentElection, previousElection]
  );

  const filtered = useMemo(() => {
    let list = comparisons;
    if (filter === 'changed') list = list.filter(r => r.comparison?.partyChanged === true);
    else if (filter === 'held') list = list.filter(r => r.comparison?.partyChanged === false);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r => r.current.constituencyName.toLowerCase().includes(q));
    }
    const sorted = [...list].sort((a, b) => {
      const ca = a.comparison, cb = b.comparison;
      let av, bv;
      switch (sortBy) {
        case 'partyChange':
          av = ca?.partyChanged ? 1 : 0; bv = cb?.partyChanged ? 1 : 0; break;
        case 'margin':
          av = ca?.marginDelta || 0; bv = cb?.marginDelta || 0; break;
        case 'turnout':
          av = ca?.turnoutDelta || 0; bv = cb?.turnoutDelta || 0; break;
        case 'voteTotal':
          av = ca?.voteTotalDelta || 0; bv = cb?.voteTotalDelta || 0; break;
        default:
          av = a.current.constituencyName; bv = b.current.constituencyName;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [comparisons, sortBy, sortDir, search, filter]);

  const changedCount = comparisons.filter(c => c.comparison?.partyChanged).length;
  const heldCount    = comparisons.filter(c => c.comparison && !c.comparison.partyChanged).length;
  const noPrevCount  = comparisons.filter(c => !c.comparison).length;

  // No previous data — show graceful empty state
  if (!previousElection) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <h3>No previous-election data available</h3>
          <p>
            Comparison requires a prior {currentElection.type.toLowerCase()} election for {currentElection.state}.
            Try a state/year combo with historical data — e.g. Madhya Pradesh Assembly 2023 (vs 2018) or
            Uttar Pradesh Lok Sabha 2024 (vs 2019).
          </p>
        </div>
      </div>
    );
  }

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  return (
    <div className="constituency-analysis">
      {/* Header KPIs */}
      <div className="ca-kpis">
        <div className="ca-kpi-tile">
          <div className="ca-kpi-label">Comparing</div>
          <div className="ca-kpi-value">
            {currentElection.year} <span className="ca-vs">vs</span> {previousElection.year}
          </div>
          <div className="ca-kpi-sub">{currentElection.type} · {currentElection.state}</div>
        </div>
        <div className="ca-kpi-tile">
          <div className="ca-kpi-label">Seats Changed Hands</div>
          <div className="ca-kpi-value" style={{ color: 'var(--saffron)' }}>{changedCount}</div>
          <div className="ca-kpi-sub">of {comparisons.length} constituencies</div>
        </div>
        <div className="ca-kpi-tile">
          <div className="ca-kpi-label">Seats Retained</div>
          <div className="ca-kpi-value" style={{ color: 'var(--india-green)' }}>{heldCount}</div>
          <div className="ca-kpi-sub">held by same party</div>
        </div>
        <div className="ca-kpi-tile">
          <div className="ca-kpi-label">No Prior Data</div>
          <div className="ca-kpi-value" style={{ color: 'var(--text-muted)' }}>{noPrevCount}</div>
          <div className="ca-kpi-sub">unmatched constituencies</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card ca-toolbar-card">
        <div className="ca-toolbar">
          <div className="ca-toolbar-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              placeholder="Search constituency…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs">
            <button className={`tab-btn ${filter==='all' ? 'active':''}`} onClick={() => setFilter('all')}>All ({comparisons.length})</button>
            <button className={`tab-btn ${filter==='changed' ? 'active':''}`} onClick={() => setFilter('changed')}>Changed ({changedCount})</button>
            <button className={`tab-btn ${filter==='held' ? 'active':''}`} onClick={() => setFilter('held')}>Held ({heldCount})</button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th onClick={() => toggleSort('name')} className="sortable">
                  Constituency {sortBy === 'name' && (sortDir==='asc' ? '↑' : '↓')}
                </th>
                <th>Winner ({currentElection.year})</th>
                <th>Winner ({previousElection.year})</th>
                <th onClick={() => toggleSort('partyChange')} className="sortable" style={{ textAlign: 'center' }}>
                  Party Change {sortBy === 'partyChange' && (sortDir==='asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => toggleSort('margin')} className="sortable" style={{ textAlign: 'right' }}>
                  Margin Δ {sortBy === 'margin' && (sortDir==='asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => toggleSort('turnout')} className="sortable" style={{ textAlign: 'right' }}>
                  Turnout Δ {sortBy === 'turnout' && (sortDir==='asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => toggleSort('voteTotal')} className="sortable" style={{ textAlign: 'right' }}>
                  Total Votes Δ {sortBy === 'voteTotal' && (sortDir==='asc' ? '↑' : '↓')}
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ current, comparison }) => (
                <tr
                  key={current.constituencyNo}
                  className="ca-row"
                  onClick={() => comparison && setSelected({ current, comparison })}
                >
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{current.constituencyNo}</td>
                  <td>
                    <div className="seat-name">{current.constituencyName}</div>
                    {current.parentConstituency && <div className="seat-parent">↳ {current.parentConstituency}</div>}
                  </td>
                  <td>
                    <span className="ca-winner-chip">
                      <span className="party-dot" style={{ background: current.winner.partyColor }} />
                      {current.winner.party}
                    </span>
                  </td>
                  <td>
                    {comparison ? (
                      <span className="ca-winner-chip">
                        <span className="party-dot" style={{ background: comparison.previousWinner.partyColor }} />
                        {comparison.previousWinner.party}
                      </span>
                    ) : <span className="ca-na">—</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {!comparison ? <span className="ca-na">—</span> : comparison.partyChanged
                      ? <span className="ca-pill ca-pill-changed">🔄 Changed</span>
                      : <span className="ca-pill ca-pill-held">✓ Held</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {comparison ? <Delta value={comparison.marginDelta} format={fmt} /> : <span className="ca-na">—</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {comparison ? <Delta value={comparison.turnoutDelta} unit="%" /> : <span className="ca-na">—</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {comparison ? <Delta value={comparison.voteTotalDelta} format={fmt} /> : <span className="ca-na">—</span>}
                  </td>
                  <td>
                    {comparison && (
                      <button
                        className="details-btn"
                        onClick={e => { e.stopPropagation(); setSelected({ current, comparison }); }}
                      >View</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign:'center', padding: 30, color:'var(--text-muted)' }}>No constituencies match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ConstituencyCompareDetail
          current={selected.current}
          comparison={selected.comparison}
          currentElection={currentElection}
          previousElection={previousElection}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Delta({ value, unit, format }) {
  if (value == null || isNaN(value)) return <span className="ca-na">—</span>;
  const isZero = value === 0;
  const color = isZero ? 'var(--text-muted)' : value > 0 ? 'var(--india-green)' : 'var(--sp)';
  const sign = isZero ? '' : value > 0 ? '+' : '−';
  const abs = format ? format(Math.abs(value)) : Math.abs(value).toFixed(unit ? 1 : 0);
  return <span style={{ color, fontWeight: 600 }}>{sign}{abs}{unit || ''}</span>;
}
