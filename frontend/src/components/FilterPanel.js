import React, { useState, useEffect, useRef } from 'react';
import './FilterPanel.css';

const ELECTION_TYPES = ['Lok Sabha', 'Assembly'];

// Normalise an old single-string filter value into a uniform array form.
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

export default function FilterPanel({ filters, years, availableStates, onFilterChange, electionData }) {
  const [local, setLocal] = useState(filters);

  useEffect(() => { setLocal(filters); }, [filters]);

  const update = (key, value) => {
    let next = { ...local, [key]: value };
    // Reset downstream when an upstream filter changes
    if (key === 'year')  next = { ...next, type: '', state: '', pc: [], ac: [] };
    if (key === 'type')  next = { ...next, state: '', pc: [], ac: [] };
    if (key === 'state') next = { ...next, pc: [], ac: [] };
    if (key === 'pc')    next = { ...next, ac: [] };
    setLocal(next);
    onFilterChange(next);
  };

  const pcList = electionData
    ? [...new Set(electionData.constituencies.filter(c => c.constituencyType === 'PC').map(c => c.constituencyName))].sort()
    : [];

  const selectedPCs = asList(local.pc);
  const acList = electionData
    ? (selectedPCs.length
        ? electionData.constituencies.filter(c => c.constituencyType === 'AC' && selectedPCs.includes(c.parentConstituency)).map(c => c.constituencyName).sort()
        : electionData.constituencies.filter(c => c.constituencyType === 'AC').map(c => c.constituencyName).sort())
    : [];

  const hasData = !!electionData;
  const statusColor = { Declared: '#138808', Counting: '#FF6B00', Polling: '#0047AB', Upcoming: '#8B9CC8' };

  return (
    <div className="filter-panel">
      <div className="filter-panel-inner">
        <div className="filter-title-row">
          <div className="filter-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filter Elections
          </div>
          {hasData && (
            <div className="filter-status-badge" style={{ background: statusColor[electionData.status] + '22', color: statusColor[electionData.status], border: `1px solid ${statusColor[electionData.status]}44` }}>
              <span className="status-dot" style={{ background: statusColor[electionData.status] }} />
              {electionData.status}
            </div>
          )}
        </div>

        <div className="filter-grid">
          <div className="filter-group">
            <label className="filter-label">Election Year</label>
            <select value={local.year} onChange={e => update('year', e.target.value)}>
              <option value="">— Select Year —</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Election Type</label>
            <select value={local.type} onChange={e => update('type', e.target.value)} disabled={!local.year}>
              <option value="">— Select Type —</option>
              {ELECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">State / UT</label>
            <select value={local.state} onChange={e => update('state', e.target.value)} disabled={!local.type}>
              <option value="">— Select State —</option>
              {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {local.type === 'Lok Sabha' && pcList.length > 0 && (
            <div className="filter-group">
              <label className="filter-label">Parliament Constituency</label>
              <MultiSelectDropdown
                options={pcList}
                value={selectedPCs}
                onChange={v => update('pc', v)}
                allLabel="All PCs"
                singularLabel="PC"
                pluralLabel="PCs"
                disabled={!hasData}
              />
            </div>
          )}

          {acList.length > 0 && (
            <div className="filter-group">
              <label className="filter-label">Assembly Constituency</label>
              <MultiSelectDropdown
                options={acList}
                value={asList(local.ac)}
                onChange={v => update('ac', v)}
                allLabel="All ACs"
                singularLabel="AC"
                pluralLabel="ACs"
                disabled={!hasData}
              />
            </div>
          )}
        </div>

        {hasData && (
          <div className="filter-summary-row">
            <div className="filter-summary-item">
              <span className="fsi-label">Total Seats</span>
              <span className="fsi-value">{electionData.totalSeats}</span>
            </div>
            <div className="filter-summary-item">
              <span className="fsi-label">Declared</span>
              <span className="fsi-value" style={{ color: '#138808' }}>
                {electionData.constituencies.filter(c => c.winner?.name).length}
              </span>
            </div>
            <div className="filter-summary-item">
              <span className="fsi-label">Parties</span>
              <span className="fsi-value">{electionData.partySummary.length}</span>
            </div>
            <div className="filter-summary-item">
              <span className="fsi-label">Avg Turnout</span>
              <span className="fsi-value" style={{ color: '#0047AB' }}>
                {(electionData.constituencies.reduce((s, c) => s + (c.turnout || 0), 0) / electionData.constituencies.length).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// MultiSelectDropdown — a select-like control with a checkbox menu so
// multiple options can be chosen. The button shows "All PCs", "Saharanpur",
// or "3 PCs selected" depending on state. Selecting nothing = no filter
// (treated as "All").
// =========================================================================
function MultiSelectDropdown({ options, value, onChange, allLabel, singularLabel, pluralLabel, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  // Reset search when closing
  useEffect(() => { if (!open) setSearch(''); }, [open]);

  const toggle = (opt) => {
    const has = value.includes(opt);
    const next = has ? value.filter(v => v !== opt) : [...value, opt];
    onChange(next);
  };

  const selectAll = () => onChange([]);          // empty = "all"
  const selectVisible = () => onChange([...new Set([...value, ...filteredOpts])]);
  const clear = () => onChange([]);

  const q = search.trim().toLowerCase();
  const filteredOpts = q ? options.filter(o => o.toLowerCase().includes(q)) : options;

  let buttonLabel;
  if (value.length === 0)       buttonLabel = `— ${allLabel} —`;
  else if (value.length === 1)  buttonLabel = value[0];
  else                          buttonLabel = `${value.length} ${pluralLabel} selected`;

  return (
    <div ref={wrapRef} className={`ms-wrap ${disabled ? 'is-disabled' : ''}`}>
      <button
        type="button"
        className={`ms-button ${open ? 'open' : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        <span className={value.length === 0 ? 'ms-placeholder' : 'ms-value'}>
          {buttonLabel}
        </span>
        {value.length > 0 && (
          <span className="ms-clear" onClick={(e) => { e.stopPropagation(); clear(); }} title="Clear selection">×</span>
        )}
        <span className={`ms-caret ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="ms-menu">
          <div className="ms-search-wrap">
            <input
              type="search"
              className="ms-search"
              placeholder={`Search ${pluralLabel.toLowerCase()}…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="ms-toolbar">
            <button type="button" className="ms-link" onClick={selectAll}>
              {allLabel}
            </button>
            {q && filteredOpts.length > 0 && (
              <button type="button" className="ms-link" onClick={selectVisible}>
                Select all matches
              </button>
            )}
            <span className="ms-count">
              {value.length}/{options.length} selected
            </span>
          </div>
          <div className="ms-options" role="listbox" aria-multiselectable="true">
            {filteredOpts.length === 0 && (
              <div className="ms-empty">No matches</div>
            )}
            {filteredOpts.map(opt => {
              const checked = value.includes(opt);
              return (
                <label key={opt} className={`ms-option ${checked ? 'is-checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(opt)}
                  />
                  <span className="ms-checkbox-visual">
                    {checked && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </span>
                  <span className="ms-option-label">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
