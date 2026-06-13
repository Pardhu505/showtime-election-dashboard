import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import CasteDataPanel from './CasteDataPanel';
import AllianceMapPanel from './AllianceMapPanel';
import './HomePage.css';

const fmtPct = v => (v == null ? '—' : Number(v).toFixed(1));
const fmt = n => n >= 10000000 ? (n / 10000000).toFixed(1) + 'Cr' : n >= 100000 ? (n / 100000).toFixed(1) + 'L' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);

export default function HomePage({ nationalSummary, recentAssembly, years, statesBy, onGo }) {
  // PC Elections dropdown state
  const [pcYear, setPcYear] = useState('');
  const [pcState, setPcState] = useState('');
  // AC Elections dropdown state
  const [acYear, setAcYear] = useState('');
  const [acState, setAcState] = useState('');
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  // Polling Station dropdown state
  const [psYear, setPsYear] = useState('');
  const [psState, setPsState] = useState('');
  const [psType, setPsType] = useState('Lok Sabha');
  const [psData, setPsData] = useState(null);
  const [psLoading, setPsLoading] = useState(false);

  // Login Modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const pcStates = useMemo(() => pcYear ? (statesBy[`${pcYear}|Lok Sabha`] || []) : [], [pcYear, statesBy]);
  const acStates = useMemo(() => acYear ? (statesBy[`${acYear}|Assembly`] || []) : [], [acYear, statesBy]);

  // Available years for PC and AC
  const pcYears = useMemo(
    () => years.filter(y => Object.keys(statesBy).some(k => k.startsWith(`${y}|Lok Sabha`))),
    [years, statesBy]
  );
  const acYears = useMemo(
    () => years.filter(y => Object.keys(statesBy).some(k => k.startsWith(`${y}|Assembly`))),
    [years, statesBy]
  );

  // Full detailed list for the table
  const fullParties = nationalSummary?.parties || [];

  // Derived simplified data for the Pie chart (Top 5 + others)
  const pieData = useMemo(() => {
    if (fullParties.length <= 6) return fullParties;
    const top = fullParties.slice(0, 5);
    const rest = fullParties.slice(5);
    const oVal = rest.reduce((s, p) => s + p.value, 0);
    const oSeats = rest.reduce((s, p) => s + (p.seats || 0), 0);
    return [
      ...top,
      { name: 'OTHERS', value: Number(oVal.toFixed(2)), seats: oSeats, color: '#94a3b8' }
    ];
  }, [fullParties]);

  const handlePcGo = () => {
    if (pcYear && pcState) onGo(pcYear, 'Lok Sabha', pcState);
  };
  const handleAcGo = () => {
    if (acYear && acState) onGo(acYear, 'Assembly', acState);
  };

  const psStates = useMemo(() => psYear ? (statesBy[`${psYear}|${psType}`] || []) : [], [psYear, psType, statesBy]);
  const psYears = useMemo(() => years, [years]);

  const handlePsGetResult = () => {
    if (psYear && psState && psType) {
      setShowLoginModal(true);
      setPsData(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginEmail === 'contact@showtimeconsulting.in' && loginPassword === 'Welcome@123') {
      setIsLoggedIn(true);
      setLoginError('');

      // Fetch booth data upon successful login
      setPsLoading(true);
      try {
        const data = await api.getBoothData(psYear, psType, psState);
        setPsData(data);
      } catch (err) {
        console.error('Failed to fetch booth data:', err);
        setPsData([]); // Empty array to show "no data" message
      } finally {
        setPsLoading(false);
      }
    } else {
      setLoginError('Invalid email or password');
    }
  };

  // Custom pie tooltip
  const PieTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="hp-tip">
        <div className="hp-tip-name" style={{ color: d.color }}>{d.name}</div>
        <div className="hp-tip-row">Vote Share: <b>{d.value}%</b></div>
        {d.seats != null && <div className="hp-tip-row">Seats: <b>{d.seats}</b></div>}
      </div>
    );
  };

  return (
    <div className="homepage fade-in">
      {/* ============ TOP ROW: PC 2024 Summary + Election Data ============ */}
      <div className="hp-top-row">
        {/* LEFT: PC 2024 Summary (pie + alliance table) */}
        <section className="hp-section hp-summary-section">
          <h2 className="iv-title">
            <span className="iv-title-teal">PC {nationalSummary?.year || 2024}</span>
            <span className="iv-title-gold">Summary</span>
          </h2>

          <div className="hp-summary-body">
            {/* Pie chart */}
            <div className="hp-pie-wrap">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    outerRadius={90}
                    innerRadius={0}
                    paddingAngle={1}
                    label={({ value }) => `${value}%`}
                    labelLine={{ stroke: '#999', strokeWidth: 1 }}
                  >
                    {pieData.map((p, i) => <Cell key={i} fill={p.color} stroke="#fff" strokeWidth={1.5} />)}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="hp-pie-legend">
                {pieData.map(p => (
                  <span key={p.name} className="hp-legend-pill">
                    <span className="hp-legend-dot" style={{ background: p.color }} />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Detailed results expandable link */}
            <button
              className="hp-detailed-link"
              onClick={() => setShowDetailedResults(s => !s)}
            >
              PC {nationalSummary?.year || 2024} Detailed Results {showDetailedResults ? '▲' : '▼'}
            </button>

            {showDetailedResults && (
              <div className="hp-detailed-table table-wrap fade-in">
                <table className="table-compact">
                  <thead>
                    <tr>
                      <th>Party</th>
                      <th style={{ textAlign: 'right' }}>Seats</th>
                      <th style={{ textAlign: 'right' }}>Vote %</th>
                      <th style={{ textAlign: 'right' }}>Contested</th>
                      <th style={{ textAlign: 'right' }}>Total Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullParties.map(p => (
                      <tr key={p.name}>
                        <td>
                          <span className="party-dot" style={{ background: p.color, marginRight: 6 }} />
                          {p.name}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.seats ?? '—'}</td>
                        <td style={{ textAlign: 'right' }}>{p.value}%</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{p.contested ?? '—'}</td>
                        <td style={{ textAlign: 'right' }}>{p.totalVotes ? fmt(p.totalVotes) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Alliance Tables */}
            <div className="hp-alliances-container">
              {/* Lok Sabha */}
              <div className="hp-alliance-table table-wrap">
                <h3 className="hp-table-title">Lok Sabha — 543 seats (majority mark: 272)</h3>
                <table className="table-compact">
                  <thead>
                    <tr>
                      <th>Alliance</th>
                      <th style={{ textAlign: 'right' }}>Seats</th>
                      <th style={{ textAlign: 'right' }}>Votes %</th>
                      <th style={{ textAlign: 'right' }}>Contested Voteshare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(nationalSummary?.alliances || []).map(a => (
                      <tr key={a.name}>
                        <td style={{ fontWeight: 600, color: a.color }}>{a.name}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{a.seats}</td>
                        <td style={{ textAlign: 'right' }}>{fmtPct(a.voteShare)}</td>
                        <td style={{ textAlign: 'right' }}>{fmtPct(a.contestedVoteShare)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Rajya Sabha */}
              {nationalSummary?.rajyaSabha && (
                <div className="hp-alliance-table table-wrap" style={{ marginTop: '1.5rem' }}>
                  <h3 className="hp-table-title">Rajya Sabha — 245 seats</h3>
                  <table className="table-compact">
                    <thead>
                      <tr>
                        <th>Alliance</th>
                        <th style={{ textAlign: 'right' }}>Seats</th>
                        <th style={{ textAlign: 'right' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nationalSummary.rajyaSabha.map(a => (
                        <tr key={a.name}>
                          <td style={{ fontWeight: 600, color: a.color }}>{a.name}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>~{a.seats}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{a.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button className="hp-alliance-link">Alliances Partywise Details ›</button>
            </div>

          </div>
        </section>

        {/* RIGHT: Election Data (PC / AC selectors + search) */}
        <section className="hp-section hp-election-data">
          <h2 className="iv-title">
            <span className="iv-title-teal">Election</span>
            <span className="iv-title-gold">Data</span>
          </h2>

          <div className="hp-ed-body">
            {/* PC Elections row */}
            <div className="hp-ed-group">
              <label className="hp-ed-label">PC Elections (Lok Sabha)</label>
              <div className="hp-ed-row">
                <select value={pcYear} onChange={e => { setPcYear(e.target.value); setPcState(''); }}>
                  <option value="">Year</option>
                  {pcYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="hp-required">*</span>
                <select value={pcState} onChange={e => setPcState(e.target.value)} disabled={!pcYear}>
                  <option value="">States</option>
                  {pcStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  className="btn-go"
                  onClick={handlePcGo}
                  disabled={!pcYear || !pcState}
                  title="View results"
                >GO</button>
              </div>
            </div>

            {/* AC Elections row */}
            <div className="hp-ed-group">
              <label className="hp-ed-label">AC Elections (Vidhan Sabha)</label>
              <div className="hp-ed-row">
                <select value={acYear} onChange={e => { setAcYear(e.target.value); setAcState(''); }}>
                  <option value="">Year</option>
                  {acYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="hp-required">*</span>
                <select value={acState} onChange={e => setAcState(e.target.value)} disabled={!acYear}>
                  <option value="">States</option>
                  {acStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  className="btn-go"
                  onClick={handleAcGo}
                  disabled={!acYear || !acState}
                  title="View results"
                >GO</button>
              </div>
            </div>

            {/* Polling Station group */}
            <div className="hp-ed-group" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <label className="hp-ed-label">Polling Station Wise Detail Results</label>
              <div className="hp-ed-row">
                <select value={psYear} onChange={e => { setPsYear(e.target.value); setPsState(''); }}>
                  <option value="">Year</option>
                  {psYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={psType} onChange={e => { setPsType(e.target.value); setPsState(''); }}>
                  <option value="Lok Sabha">Lok Sabha</option>
                  <option value="Assembly">Assembly</option>
                </select>
                <select value={psState} onChange={e => setPsState(e.target.value)} disabled={!psYear}>
                  <option value="">States</option>
                  {psStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  className="btn-go"
                  style={{ minWidth: '100px' }}
                  onClick={handlePsGetResult}
                  disabled={!psYear || !psState}
                >Get Result</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============ ALLIANCE MAP (India) ============ */}
      <AllianceMapPanel />

      {/* ============ CASTE DEMOGRAPHICS ============ */}
      <CasteDataPanel />

      {/* ============ RECENT ASSEMBLY ELECTIONS ============ */}
      <section className="hp-section hp-recent-section">
        <h2 className="iv-title">
          <span className="iv-title-teal">Recent</span>
          <span className="iv-title-gold">Assembly Elections</span>
        </h2>

        <div className="hp-recent-grid">
          {recentAssembly.map(card => (
            <button
              key={`${card.state}-${card.year}`}
              className="hp-recent-card"
              onClick={() => onGo(card.year, 'Assembly', card.state)}
            >
              <div className="hp-recent-card-banner">
                <span className="hp-recent-state">{card.state}</span>
                <span className="hp-recent-year">{card.year}</span>
              </div>
              <div className="hp-recent-map" style={{ background: `linear-gradient(135deg, ${card.bannerFrom || '#fff5e6'} 0%, ${card.bannerTo || '#ffe9c2'} 100%)` }}>
                <div className="hp-recent-map-icon">
                  <svg viewBox="0 0 64 64" width="40" height="40" aria-hidden="true">
                    <path d="M32 6 L52 26 Q55 32 50 38 L36 56 Q33 60 30 56 L14 38 Q9 32 12 26 Z"
                      fill="rgba(255,107,0,0.22)" stroke="rgba(255,107,0,0.55)" strokeWidth="1.5"/>
                    <circle cx="32" cy="28" r="5" fill="rgba(0,71,171,0.55)" />
                  </svg>
                </div>
              </div>
              <div className="hp-recent-table">
                <div className="hp-recent-row hp-recent-head">
                  <span>Party</span>
                  <span>Won</span>
                  <span>Swing</span>
                </div>
                {card.rows.slice(0, 3).map(r => (
                  <div className="hp-recent-row" key={r.party}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="party-dot" style={{ background: r.color }} />
                      {r.party}
                    </span>
                    <span style={{ fontWeight: 700, color: r.color }}>{r.won}</span>
                    <span style={{ color: r.swing > 0 ? 'var(--india-green)' : 'var(--sp)', fontWeight: 600 }}>
                      {r.swing > 0 ? '+' : ''}{r.swing}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ============ AT-A-GLANCE METRICS ============ */}
      <section className="hp-section hp-stats-section">
        <h2 className="iv-title iv-title-sm">
          <span className="iv-title-teal">National</span>
          <span className="iv-title-gold">Snapshot</span>
        </h2>
        <div className="hp-stats-grid">
          <StatTile label="Total Lok Sabha Seats" value={nationalSummary?.totalSeats || 543} accent="var(--teal)" />
          <StatTile label="Total Rajya Sabha Seats" value={245} accent="var(--india-blue)" />
          <StatTile label="Total States / UTs" value={nationalSummary?.totalStates || 36} accent="var(--gold)" />
          <StatTile label="Total Eligible Voters" value={nationalSummary?.totalVoters ? fmt(nationalSummary.totalVoters) : '96.8Cr'} accent="var(--india-blue)" />
          <StatTile label="Voter Turnout" value={`${nationalSummary?.turnout ?? 65.8}%`} accent="var(--india-green)" />
          <StatTile label="Total Candidates" value={nationalSummary?.totalCandidates ? fmt(nationalSummary.totalCandidates) : '8.36K'} accent="var(--saffron)" />
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="hp-login-modal-overlay">
      <div className={`hp-login-modal-content ${isLoggedIn ? 'hp-modal-large' : ''}`} style={{ backgroundImage: !isLoggedIn ? `url('https://media.gettyimages.com/id/1488650824/video/…20&c=GR6SbIyVsC7E5VMVX48QJcudQ1-jtoP3m5R9htBm45U=')` : 'none', backgroundColor: 'white' }}>
        <div className={isLoggedIn ? 'hp-data-box' : 'hp-login-auth-box'}>
              {isLoggedIn ? (
                <div className="hp-login-success">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'var(--teal)', margin: 0 }}>
                  Booth Level Results: {psState} ({psYear} {psType})
                </h3>
                <button className="btn-go" style={{ minWidth: '80px' }} onClick={() => { setShowLoginModal(false); setIsLoggedIn(false); setLoginEmail(''); setLoginPassword(''); setPsData(null); }}>Close</button>
              </div>

              {psLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 10px' }} />
                  Loading booth data...
                </div>
              ) : psData && psData.length > 0 ? (
                <div className="table-wrap" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <table className="table-compact">
                    <thead>
                      <tr>
                        {Object.keys(psData[0]).filter(k => k !== '_id' && k !== '__v' && k !== 'createdAt' && k !== 'updatedAt').map(key => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {psData.map((row, idx) => (
                        <tr key={idx}>
                          {Object.keys(psData[0]).filter(k => k !== '_id' && k !== '__v' && k !== 'createdAt' && k !== 'updatedAt').map(key => (
                            <td key={key}>{row[key]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No booth-level data found for this selection.
                </div>
              )}
                </div>
              ) : (
                <form onSubmit={handleLogin} className="hp-login-form">
                  <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>User Login</h3>
                  <div className="hp-form-group" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Email Address</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="contact@showtimeconsulting.in"
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
                      required
                    />
                  </div>
                  <div className="hp-form-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Password</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}
                      required
                    />
                  </div>
                  {loginError && <div style={{ color: 'var(--sp)', fontSize: '13px', marginBottom: '1rem', fontWeight: 600 }}>{loginError}</div>}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="btn-go" style={{ flex: 1 }}>Login</button>
                    <button type="button" className="btn-go" style={{ flex: 1, background: 'var(--text-muted)' }} onClick={() => setShowLoginModal(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, accent }) {
  return (
    <div className="hp-stat-tile">
      <span className="hp-stat-value" style={{ color: accent }}>{value}</span>
      <span className="hp-stat-label">{label}</span>
    </div>
  );
}
