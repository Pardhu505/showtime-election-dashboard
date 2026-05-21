import React, { useState, useMemo } from 'react';
import './SeatSummary.css';

const fmt = n => n >= 10000000 ? (n/10000000).toFixed(1)+'Cr' : n >= 100000 ? (n/100000).toFixed(1)+'L' : n >= 1000 ? (n/1000).toFixed(0)+'K' : String(n);
const fmtFull = n => Number(n).toLocaleString('en-IN');

export default function SeatSummary({ electionData, onSelectConstituency }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('no');
  const [filterParty, setFilterParty] = useState('');
  const [page, setPage] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const PAGE_SIZE = 25;

  const { constituencies } = electionData;

  // Compute bounds for each numeric column so the range sliders know their min/max
  const bounds = useMemo(() => {
    if (!constituencies.length) return { votes: [0,0], voteShare: [0,0], margin: [0,0], turnout: [0,0] };
    let vMin = Infinity, vMax = -Infinity;
    let sMin = Infinity, sMax = -Infinity;
    let mMin = Infinity, mMax = -Infinity;
    let tMin = Infinity, tMax = -Infinity;
    for (const c of constituencies) {
      const w = c.winner;
      if (w) {
        if (w.votes < vMin) vMin = w.votes;
        if (w.votes > vMax) vMax = w.votes;
        if (w.voteShare < sMin) sMin = w.voteShare;
        if (w.voteShare > sMax) sMax = w.voteShare;
        if (w.margin < mMin) mMin = w.margin;
        if (w.margin > mMax) mMax = w.margin;
      }
      if (c.turnout != null) {
        if (c.turnout < tMin) tMin = c.turnout;
        if (c.turnout > tMax) tMax = c.turnout;
      }
    }
    return {
      votes:     [Math.floor(vMin),         Math.ceil(vMax)],
      voteShare: [Math.floor(sMin * 10)/10, Math.ceil(sMax * 10)/10],
      margin:    [Math.floor(mMin),         Math.ceil(mMax)],
      turnout:   [Math.floor(tMin * 10)/10, Math.ceil(tMax * 10)/10],
    };
  }, [constituencies]);

  // Range filter state — empty string means "no constraint on this side"
  const [rng, setRng] = useState({
    votesMin: '', votesMax: '',
    voteShareMin: '', voteShareMax: '',
    marginMin: '', marginMax: '',
    turnoutMin: '', turnoutMax: '',
  });

  const parties = useMemo(() => {
    const s = new Set(constituencies.map(c => c.winner?.party).filter(Boolean));
    return [...s].sort();
  }, [constituencies]);

  const numOr = (v, fallback) => {
    if (v === '' || v == null) return fallback;
    const n = Number(v);
    return isNaN(n) ? fallback : n;
  };

  const activeRangeCount = useMemo(() => {
    let n = 0;
    if (rng.votesMin     !== '' && +rng.votesMin     > bounds.votes[0])     n++;
    if (rng.votesMax     !== '' && +rng.votesMax     < bounds.votes[1])     n++;
    if (rng.voteShareMin !== '' && +rng.voteShareMin > bounds.voteShare[0]) n++;
    if (rng.voteShareMax !== '' && +rng.voteShareMax < bounds.voteShare[1]) n++;
    if (rng.marginMin    !== '' && +rng.marginMin    > bounds.margin[0])    n++;
    if (rng.marginMax    !== '' && +rng.marginMax    < bounds.margin[1])    n++;
    if (rng.turnoutMin   !== '' && +rng.turnoutMin   > bounds.turnout[0])   n++;
    if (rng.turnoutMax   !== '' && +rng.turnoutMax   < bounds.turnout[1])   n++;
    return n;
  }, [rng, bounds]);

  const filtered = useMemo(() => {
    let cs = [...constituencies];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      cs = cs.filter(c =>
        c.constituencyName.toLowerCase().includes(q) ||
        c.winner?.name?.toLowerCase().includes(q) ||
        c.winner?.party?.toLowerCase().includes(q)
      );
    }

    if (filterParty) cs = cs.filter(c => c.winner?.party === filterParty);

    const vLo = numOr(rng.votesMin,     bounds.votes[0]);
    const vHi = numOr(rng.votesMax,     bounds.votes[1]);
    const sLo = numOr(rng.voteShareMin, bounds.voteShare[0]);
    const sHi = numOr(rng.voteShareMax, bounds.voteShare[1]);
    const mLo = numOr(rng.marginMin,    bounds.margin[0]);
    const mHi = numOr(rng.marginMax,    bounds.margin[1]);
    const tLo = numOr(rng.turnoutMin,   bounds.turnout[0]);
    const tHi = numOr(rng.turnoutMax,   bounds.turnout[1]);

    cs = cs.filter(c => {
      const w = c.winner || {};
      const votes  = w.votes  ?? 0;
      const share  = w.voteShare ?? 0;
      const margin = w.margin ?? 0;
      const turn   = c.turnout ?? 0;
      return (
        votes  >= vLo && votes  <= vHi &&
        share  >= sLo && share  <= sHi &&
        margin >= mLo && margin <= mHi &&
        turn   >= tLo && turn   <= tHi
      );
    });

    switch (sortBy) {
      case 'no':      cs.sort((a, b) => a.constituencyNo - b.constituencyNo); break;
      case 'name':    cs.sort((a, b) => a.constituencyName.localeCompare(b.constituencyName)); break;
      case 'margin':  cs.sort((a, b) => (b.winner?.margin    || 0) - (a.winner?.margin    || 0)); break;
      case 'turnout': cs.sort((a, b) => (b.turnout           || 0) - (a.turnout           || 0)); break;
      case 'votes':   cs.sort((a, b) => (b.winner?.votes     || 0) - (a.winner?.votes     || 0)); break;
      case 'share':   cs.sort((a, b) => (b.winner?.voteShare || 0) - (a.winner?.voteShare || 0)); break;
      default: break;
    }
    return cs;
  }, [constituencies, search, sortBy, filterParty, rng, bounds]);

  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const resetRanges = () => setRng({
    votesMin:'', votesMax:'', voteShareMin:'', voteShareMax:'',
    marginMin:'', marginMax:'', turnoutMin:'', turnoutMax:'',
  });
  const resetAll = () => { resetRanges(); setSearch(''); setFilterParty(''); setPage(0); };

  const totalActive = activeRangeCount + (search ? 1 : 0) + (filterParty ? 1 : 0);

  return (
    <div className="seat-summary fade-in">
      <div className="seat-controls card">
        <div className="seat-search-wrap">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="seat-search"
            placeholder="Search constituency, candidate, party…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <select value={filterParty} onChange={e => { setFilterParty(e.target.value); setPage(0); }} style={{ width: 'auto', minWidth: 160 }}>
          <option value="">All Parties</option>
          {parties.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
          <option value="no">Sort: Seat No.</option>
          <option value="name">Sort: Name</option>
          <option value="margin">Sort: Margin ↓</option>
          <option value="turnout">Sort: Turnout ↓</option>
          <option value="votes">Sort: Votes ↓</option>
          <option value="share">Sort: Vote Share ↓</option>
        </select>
        <button
          className={`btn btn-secondary range-toggle ${filtersOpen ? 'open' : ''}`}
          onClick={() => setFiltersOpen(o => !o)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
          </svg>
          Range Filters
          {activeRangeCount > 0 && <span className="range-pill">{activeRangeCount}</span>}
          <span className="caret">{filtersOpen ? '▲' : '▼'}</span>
        </button>
        {totalActive > 0 && (
          <button className="btn-link-reset" onClick={resetAll}>Reset all</button>
        )}
        <span className="seat-count-badge">{filtered.length} of {constituencies.length} seats</span>
      </div>

      {filtersOpen && (
        <div className="card range-panel fade-in">
          <div className="range-panel-header">
            <div className="section-title">Filter by ranges</div>
            <div className="section-sub">Set min/max for any column to narrow the list. Empty = no constraint on that side.</div>
          </div>
          <div className="range-grid">
            <RangeFilter
              label="Votes (winner)"
              icon="🗳️"
              hint={`${fmt(bounds.votes[0])} – ${fmt(bounds.votes[1])}`}
              min={bounds.votes[0]}  max={bounds.votes[1]}
              valueMin={rng.votesMin} valueMax={rng.votesMax}
              onChange={(lo, hi) => { setRng(r => ({ ...r, votesMin: lo, votesMax: hi })); setPage(0); }}
              fmt={fmt} step={1000}
            />
            <RangeFilter
              label="Vote Share %"
              icon="📊"
              hint={`${bounds.voteShare[0]}% – ${bounds.voteShare[1]}%`}
              min={bounds.voteShare[0]} max={bounds.voteShare[1]}
              valueMin={rng.voteShareMin} valueMax={rng.voteShareMax}
              onChange={(lo, hi) => { setRng(r => ({ ...r, voteShareMin: lo, voteShareMax: hi })); setPage(0); }}
              fmt={v => `${Number(v).toFixed(1)}%`} step={0.5}
            />
            <RangeFilter
              label="Margin"
              icon="📏"
              hint={`${fmt(bounds.margin[0])} – ${fmt(bounds.margin[1])}`}
              min={bounds.margin[0]} max={bounds.margin[1]}
              valueMin={rng.marginMin} valueMax={rng.marginMax}
              onChange={(lo, hi) => { setRng(r => ({ ...r, marginMin: lo, marginMax: hi })); setPage(0); }}
              fmt={fmt} step={1000}
            />
            <RangeFilter
              label="Turnout %"
              icon="📈"
              hint={`${bounds.turnout[0]}% – ${bounds.turnout[1]}%`}
              min={bounds.turnout[0]} max={bounds.turnout[1]}
              valueMin={rng.turnoutMin} valueMax={rng.turnoutMax}
              onChange={(lo, hi) => { setRng(r => ({ ...r, turnoutMin: lo, turnoutMax: hi })); setPage(0); }}
              fmt={v => `${Number(v).toFixed(1)}%`} step={0.5}
            />
          </div>
          {activeRangeCount > 0 && (
            <div className="range-panel-footer">
              <button className="btn btn-secondary" onClick={resetRanges}>Clear ranges</button>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Constituency</th>
                <th>Winner</th>
                <th>Party</th>
                <th>Votes</th>
                <th>Vote Share</th>
                <th>Margin</th>
                <th>Runner-up</th>
                <th>Turnout</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((c, i) => {
                const w = c.winner;
                const ru = c.candidates?.find(cand => !cand.isWinner);
                return (
                  <tr key={c.constituencyName} className="seat-row" onClick={() => onSelectConstituency(c)}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{c.constituencyNo || (page * PAGE_SIZE + i + 1)}</td>
                    <td>
                      <div className="seat-name">{c.constituencyName}</div>
                      {c.parentConstituency && <div className="seat-parent">{c.parentConstituency}</div>}
                    </td>
                    <td><div className="cand-name">{w?.name || '—'}</div></td>
                    <td>
                      {w && (
                        <div className="party-tag" style={{ '--pc': w.partyColor || '#666' }}>
                          <span className="party-dot" style={{ background: w.partyColor || '#666' }} />
                          {w.party}
                        </div>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }} title={w ? fmtFull(w.votes) : ''}>
                      {w ? fmt(w.votes) : '—'}
                    </td>
                    <td>
                      {w && (
                        <div className="vs-cell">
                          <span>{w.voteShare}%</span>
                          <div className="progress-bar" style={{ width: 50 }}>
                            <div className="progress-fill" style={{ width: `${w.voteShare}%`, background: w.partyColor || '#666' }} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`margin-badge ${(w?.margin || 0) > 50000 ? 'big' : (w?.margin || 0) > 20000 ? 'medium' : 'small'}`}
                        title={w ? fmtFull(w.margin) : ''}
                      >
                        {w ? fmt(w.margin) : '—'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {ru && (
                        <span>
                          <span className="party-dot" style={{ background: ru.partyColor || '#666', marginRight: 5 }} />
                          {ru.name?.split(' ').slice(-1)[0]} ({ru.party})
                        </span>
                      )}
                    </td>
                    <td><div className="turnout-cell"><span>{c.turnout?.toFixed(1)}%</span></div></td>
                    <td>
                      <button className="details-btn" onClick={(e) => { e.stopPropagation(); onSelectConstituency(c); }}>
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pageData.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign:'center', padding: 28, color: 'var(--text-muted)' }}>
                  No constituencies match the current filters.{' '}
                  <button className="btn-link-reset" onClick={resetAll}>Reset filters</button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="pagination">
            <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Page {page + 1} of {pages}</span>
            <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function RangeFilter({ label, icon, hint, min, max, valueMin, valueMax, onChange, fmt, step }) {
  const span = max - min;
  const safeStep = step || (span > 100 ? Math.max(1, Math.round(span / 200)) : 1);

  const handleMin = (v) => {
    const n = v === '' ? '' : Math.min(Number(v), valueMax === '' ? max : Number(valueMax));
    onChange(n === '' ? '' : String(n), valueMax);
  };
  const handleMax = (v) => {
    const n = v === '' ? '' : Math.max(Number(v), valueMin === '' ? min : Number(valueMin));
    onChange(valueMin, n === '' ? '' : String(n));
  };

  const sliderLo = valueMin === '' ? min : Number(valueMin);
  const sliderHi = valueMax === '' ? max : Number(valueMax);

  return (
    <div className="range-filter">
      <div className="range-filter-label">
        <span className="range-filter-icon">{icon}</span>
        <span>{label}</span>
        <span className="range-filter-hint">{hint}</span>
      </div>
      <div className="range-filter-inputs">
        <input
          type="number"
          placeholder={fmt ? fmt(min) : String(min)}
          value={valueMin}
          step={safeStep}
          onChange={e => handleMin(e.target.value)}
        />
        <span className="range-dash">–</span>
        <input
          type="number"
          placeholder={fmt ? fmt(max) : String(max)}
          value={valueMax}
          step={safeStep}
          onChange={e => handleMax(e.target.value)}
        />
      </div>
      <div className="range-slider-row">
        <input
          type="range"
          min={min} max={max} step={safeStep}
          value={sliderLo}
          onChange={e => handleMin(e.target.value)}
          aria-label={`${label} minimum`}
        />
        <input
          type="range"
          min={min} max={max} step={safeStep}
          value={sliderHi}
          onChange={e => handleMax(e.target.value)}
          aria-label={`${label} maximum`}
        />
      </div>
      <div className="range-slider-readout">
        <span>{fmt ? fmt(sliderLo) : sliderLo}</span>
        <span>{fmt ? fmt(sliderHi) : sliderHi}</span>
      </div>
    </div>
  );
}
