import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CASTE_DATA, CASTE_COLORS } from '../data/casteData';
import { api } from '../utils/api';
import './CasteDataPanel.css';

const colorFor = (name) => CASTE_COLORS[name] || '#94a3b8';

export default function CasteDataPanel({ data: dataProp }) {
  const [stateSel, setStateSel] = useState('');
  const [districtSel, setDistrictSel] = useState('');
  const [submitted, setSubmitted] = useState(null);

  // Backend state — we prefer it over the bundled mock when reachable.
  const [backendStates, setBackendStates] = useState(null);          // null = unknown / not reached
  const [backendDistricts, setBackendDistricts] = useState(null);
  const [backendRows, setBackendRows] = useState(null);
  const [loadingRows, setLoadingRows] = useState(false);
  const [source, setSource] = useState('mock');                       // 'mock' | 'api'

  // Try to hit the backend on mount. If it answers, switch to live mode.
  useEffect(() => {
    let cancelled = false;
    api.getCasteStates()
      .then(states => { if (!cancelled && Array.isArray(states) && states.length) { setBackendStates(states); setSource('api'); } })
      .catch(() => { /* stay on mock — that's fine */ });
    return () => { cancelled = true; };
  }, []);

  // When user picks a state, fetch districts from the backend (or use mock).
  useEffect(() => {
    if (!stateSel) { setBackendDistricts(null); return; }
    if (source !== 'api') return;
    let cancelled = false;
    api.getCasteDistricts(stateSel)
      .then(ds => { if (!cancelled) setBackendDistricts(ds); })
      .catch(() => { if (!cancelled) setBackendDistricts(null); });
    return () => { cancelled = true; };
  }, [stateSel, source]);

  // Derive dropdown options — backend wins when present, mock otherwise.
  const mockData = dataProp || CASTE_DATA;
  const states = useMemo(() => {
    if (backendStates && backendStates.length) return backendStates;
    return [...new Set(mockData.map(d => d.state).filter(Boolean))].sort();
  }, [backendStates, mockData]);

  const districts = useMemo(() => {
    if (!stateSel) return [];
    if (backendDistricts && backendDistricts.length) return backendDistricts;
    return [...new Set(mockData.filter(d => d.state === stateSel).map(d => d.district))].sort();
  }, [backendDistricts, mockData, stateSel]);

  const handleGo = useCallback(async () => {
    if (!stateSel || !districtSel) return;
    setSubmitted({ state: stateSel, district: districtSel });
    setBackendRows(null);
    if (source === 'api') {
      setLoadingRows(true);
      try {
        const rows = await api.getCasteData(stateSel, districtSel);
        setBackendRows(rows);
      } catch (_) {
        setBackendRows(null);  // fall back to mock display
      }
      setLoadingRows(false);
    }
  }, [stateSel, districtSel, source]);

  const rows = useMemo(() => {
    if (!submitted) return [];
    const raw = (source === 'api' && backendRows)
      ? backendRows
      : mockData.filter(d => d.state === submitted.state && d.district === submitted.district);
    return raw
      .map(d => ({ ...d, color: colorFor(d.caste) }))
      .sort((a, b) => b.populationPct - a.populationPct);
  }, [submitted, source, backendRows, mockData]);

  const total = useMemo(() => rows.reduce((s, r) => s + (r.populationPct || 0), 0), [rows]);

  return (
    <section className="caste-section">
      <h2 className="iv-title">
        <span className="iv-title-teal">Caste</span>
        <span className="iv-title-gold">Demographics</span>
      </h2>
      <p className="caste-sub">
        District-level caste population share. Useful for understanding the
        social composition behind any constituency's vote.
        {source === 'api'
          ? <span className="caste-source-tag caste-source-api">● Live from caste_db</span>
          : <span className="caste-source-tag caste-source-mock">● Bundled sample (backend unreachable)</span>}
      </p>

      {/* Form */}
      <div className="caste-form">
        <div className="caste-form-row">
          <div className="caste-form-group">
            <label className="caste-label">State</label>
            <select
              value={stateSel}
              onChange={(e) => { setStateSel(e.target.value); setDistrictSel(''); }}
            >
              <option value="">— Select State —</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="caste-form-group">
            <label className="caste-label">District</label>
            <select
              value={districtSel}
              onChange={(e) => setDistrictSel(e.target.value)}
              disabled={!stateSel}
            >
              <option value="">— Select District —</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button
            className="btn-go caste-btn-go"
            onClick={handleGo}
            disabled={!stateSel || !districtSel || loadingRows}
            title={!stateSel || !districtSel ? 'Pick a state and district first' : 'Show caste breakdown'}
          >
            {loadingRows ? '…' : 'GO'}
          </button>
        </div>
        {!submitted && (
          <div className="caste-hint">
            Pick a state, then a district, then hit <b>GO</b> to see the caste-wise population share.
          </div>
        )}
      </div>

      {/* Results */}
      {submitted && !loadingRows && rows.length === 0 && (
        <div className="caste-empty">
          No caste data found for <b>{submitted.district}, {submitted.state}</b>.
          {source === 'api'
            ? <> Upload data for this district via the <code>POST /api/upload/caste</code> endpoint.</>
            : <> Try a different district or add this district to <code>frontend/src/data/casteData.js</code>.</>}
        </div>
      )}

      {submitted && rows.length > 0 && (
        <div className="caste-results fade-in">
          <div className="caste-results-header">
            <div>
              <h3 className="caste-results-title">{submitted.district}</h3>
              <div className="caste-results-meta">{submitted.state} · {rows.length} groups · total {total.toFixed(1)}%</div>
            </div>
            <div className="caste-results-bigstat">
              <div className="caste-bigstat-value" style={{ color: rows[0].color }}>{rows[0].populationPct.toFixed(1)}%</div>
              <div className="caste-bigstat-label">{rows[0].caste}<br/><span>largest group</span></div>
            </div>
          </div>

          <div className="caste-results-grid">
            <div className="caste-card">
              <div className="caste-card-title">Population share</div>
              <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 26)}>
                <BarChart
                  data={rows}
                  layout="vertical"
                  margin={{ top: 6, right: 28, left: 8, bottom: 6 }}
                  barCategoryGap={4}
                >
                  <XAxis type="number" domain={[0, 'auto']}
                    tick={{ fill: '#4a5568', fontSize: 11 }} stroke="#cbd5e0"
                    tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="caste" width={140}
                    tick={{ fill: '#1a202c', fontSize: 11, fontWeight: 500 }} stroke="#cbd5e0" />
                  <Tooltip
                    cursor={{ fill: 'rgba(15,138,140,0.06)' }}
                    formatter={(v) => [`${v}%`, 'Population']}
                    contentStyle={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 6, fontSize: 12 }}
                  />
                  <Bar dataKey="populationPct" radius={[0, 3, 3, 0]}>
                    {rows.map((r, i) => <Cell key={i} fill={r.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="caste-card">
              <div className="caste-card-title">Detailed breakdown</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Caste / Group</th><th style={{ textAlign: 'right' }}>Population %</th><th>Share</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.caste}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>{i + 1}</td>
                        <td>
                          <span className="caste-swatch" style={{ background: r.color }} />
                          {r.caste}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                          {r.populationPct.toFixed(1)}%
                        </td>
                        <td style={{ width: 110 }}>
                          <div className="progress-bar" style={{ width: '100%' }}>
                            <div className="progress-fill" style={{
                              width: `${Math.min(r.populationPct * 2, 100)}%`,
                              background: r.color,
                            }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="caste-disclaimer">
            <strong>Note:</strong> {source === 'api'
              ? <>Live data from <code>caste_db.castes</code> on your MongoDB cluster. Upload more rows via <code>POST /api/upload/caste</code> with a CSV/XLSX file (columns: <code>state, district, caste, populationPct</code>).</>
              : <>Bundled sample data — connect the backend to load real data from MongoDB.</>}
          </div>
        </div>
      )}
    </section>
  );
}
