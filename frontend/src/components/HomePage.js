import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../utils/api';
import CasteDataPanel from './CasteDataPanel';
import AllianceMapPanel from './AllianceMapPanel';
import './HomePage.css';

const fmtPct = v => (v == null ? '—' : Number(v).toFixed(1));
const fmt = n => n >= 10000000 ? (n / 10000000).toFixed(1) + 'Cr' : n >= 100000 ? (n / 100000).toFixed(1) + 'L' : n >= 1000 ? (n / 1000).toFixed(0) + 'K' : String(n);

const ALL_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

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
  const [psError, setPsError] = useState('');

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

  const psStates = useMemo(() => {
    const fromBackend = psYear ? (statesBy[`${psYear}|${psType}`] || []) : [];
    // For booth data, always show all states to allow searching for manually imported data
    const merged = Array.from(new Set([...fromBackend, ...ALL_STATES])).sort();
    return merged;
  }, [psYear, psType, statesBy]);
  const psYears = useMemo(() => years, [years]);

  const handlePsGetResult = () => {
    if (psYear && psState && psType) {
      setShowLoginModal(true);
      setPsData(null);
      setPsError('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginEmail === 'contact@showtimeconsulting.in' && loginPassword === 'Welcome@123') {
      setIsLoggedIn(true);
      setLoginError('');

      // Fetch booth data upon successful login
      setPsLoading(true);
      setPsError('');
      try {
        const data = await api.getBoothData(psYear, psType, psState);
        setPsData(data);
      } catch (err) {
        console.error('Failed to fetch booth data:', err);
        setPsError(err.message || 'Failed to fetch booth data');
        setPsData([]);
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
      {/* ============ HERO SECTION: PC 2024 Snapshot ============ */}
      <section className="hp-hero">
        <div className="hp-hero-content">
          <div className="hp-hero-text">
            <h1 className="hp-hero-title">
              <span className="blue">PC {nationalSummary?.year || 2024}</span> Summary
            </h1>
            <p className="hp-hero-sub">Comprehensive analysis of India's parliamentary elections</p>
            <div className="hp-hero-quick-stats">
              <div className="hp-h-stat">
                <span className="hp-h-val">{nationalSummary?.totalSeats || 543}</span>
                <span className="hp-h-lab">Total Seats</span>
              </div>
              <div className="hp-h-stat">
                <span className="hp-h-val">{nationalSummary?.turnout ?? 65.8}%</span>
                <span className="hp-h-lab">Voter Turnout</span>
              </div>
            </div>
          </div>

          <div className="hp-hero-visual">
            <div className="hp-pie-card">
              <div className="hp-pie-container">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius={85}
                      innerRadius={60}
                      paddingAngle={4}
                    >
                      {pieData.map((p, i) => <Cell key={i} fill={p.color} />)}
                    </Pie>
                    <Tooltip content={<PieTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="hp-pie-center">
                  <span className="hp-center-num">543</span>
                  <span className="hp-center-lab">Seats</span>
                </div>
              </div>
              <div className="hp-pie-legend-grid">
                {pieData.map(p => (
                  <div key={p.name} className="hp-legend-item">
                    <span className="hp-legend-dot" style={{ background: p.color }} />
                    <span className="hp-legend-name">{p.name}</span>
                    <span className="hp-legend-val">{p.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MAIN GRID ============ */}
      <div className="hp-main-grid">
        {/* LEFT COLUMN */}
        <div className="hp-col hp-col-left">
          {/* Alliance Tables */}
          <section className="hp-card-section">
            <div className="hp-card-header">
              <h3 className="hp-card-title">National Alliance Standings</h3>
              <button
                className="hp-toggle-btn"
                onClick={() => setShowDetailedResults(s => !s)}
              >
                {showDetailedResults ? 'Show Alliances' : 'Show Partywise'}
              </button>
            </div>

            <div className="hp-card-body">
              {!showDetailedResults ? (
                <div className="hp-alliances-list">
                  <div className="hp-alliance-group">
                    <div className="hp-group-label">Lok Sabha — Majority: 272</div>
                    <div className="table-wrap">
                      <table className="hp-modern-table">
                        <thead>
                          <tr>
                            <th>Alliance</th>
                            <th className="txt-rt">Seats</th>
                            <th className="txt-rt">Vote %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(nationalSummary?.alliances || []).map(a => (
                            <tr key={a.name}>
                              <td><b style={{ color: a.color }}>{a.name}</b></td>
                              <td className="txt-rt font-bold">{a.seats}</td>
                              <td className="txt-rt">{fmtPct(a.voteShare)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {nationalSummary?.rajyaSabha && (
                    <div className="hp-alliance-group" style={{ marginTop: '20px' }}>
                      <div className="hp-group-label">Rajya Sabha — 245 seats</div>
                      <div className="table-wrap">
                        <table className="hp-modern-table">
                          <thead>
                            <tr>
                              <th>Alliance</th>
                              <th className="txt-rt">Seats</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nationalSummary.rajyaSabha.map(a => (
                              <tr key={a.name}>
                                <td><b style={{ color: a.color }}>{a.name}</b></td>
                                <td className="txt-rt font-bold">{a.seats}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hp-partywise-list fade-in">
                  <div className="table-wrap">
                    <table className="hp-modern-table">
                      <thead>
                        <tr>
                          <th>Party</th>
                          <th className="txt-rt">Seats</th>
                          <th className="txt-rt">Vote %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fullParties.map(p => (
                          <tr key={p.name}>
                            <td>
                              <div className="hp-party-cell">
                                <span className="party-dot" style={{ background: p.color }} />
                                {p.name}
                              </div>
                            </td>
                            <td className="txt-rt font-bold">{p.seats ?? '—'}</td>
                            <td className="txt-rt">{p.value}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <button className="hp-link-btn">View Full Alliances Partywise Details ›</button>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="hp-col hp-col-right">
          {/* ELECTION NAVIGATOR */}
          <section className="hp-card-section hp-nav-card">
            <div className="hp-card-header">
              <h3 className="hp-card-title">Election Navigator</h3>
            </div>
            <div className="hp-card-body">
              <div className="hp-nav-tabs">
                <div className="hp-nav-tab active">Results</div>
                <div className="hp-nav-tab">Booth Data</div>
              </div>

              <div className="hp-nav-content">
                <div className="hp-nav-row">
                  <div className="hp-nav-col">
                    <span className="hp-nav-label">PC Elections (Lok Sabha)</span>
                    <div className="hp-nav-inputs">
                      <select value={pcYear} onChange={e => { setPcYear(e.target.value); setPcState(''); }}>
                        <option value="">Year</option>
                        {pcYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select value={pcState} onChange={e => setPcState(e.target.value)} disabled={!pcYear}>
                        <option value="">Select State</option>
                        {pcStates.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className="hp-go-btn" onClick={handlePcGo} disabled={!pcYear || !pcState}>GO</button>
                    </div>
                  </div>
                </div>

                <div className="hp-nav-divider" />

                <div className="hp-nav-row">
                  <div className="hp-nav-col">
                    <span className="hp-nav-label">AC Elections (Vidhan Sabha)</span>
                    <div className="hp-nav-inputs">
                      <select value={acYear} onChange={e => { setAcYear(e.target.value); setAcState(''); }}>
                        <option value="">Year</option>
                        {acYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select value={acState} onChange={e => setAcState(e.target.value)} disabled={!acYear}>
                        <option value="">Select State</option>
                        {acStates.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className="hp-go-btn" onClick={handleAcGo} disabled={!acYear || !acState}>GO</button>
                    </div>
                  </div>
                </div>

                <div className="hp-nav-divider" />

                <div className="hp-nav-row">
                  <div className="hp-nav-col">
                    <span className="hp-nav-label">Polling Station Details</span>
                    <div className="hp-nav-inputs hp-grid-inputs">
                      <select value={psYear} onChange={e => { setPsYear(e.target.value); setPsState(''); }}>
                        <option value="">Year</option>
                        {psYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select value={psType} onChange={e => { setPsType(e.target.value); setPsState(''); }}>
                        <option value="Lok Sabha">LS</option>
                        <option value="Assembly">AS</option>
                      </select>
                      <select value={psState} onChange={e => setPsState(e.target.value)} disabled={!psYear}>
                        <option value="">State</option>
                        {psStates.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className="hp-search-btn" onClick={handlePsGetResult} disabled={!psYear || !psState}>Search</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ============ ALLIANCE MAP (India) ============ */}
      <AllianceMapPanel />

      {/* ============ CASTE DEMOGRAPHICS ============ */}
      <CasteDataPanel />

      {/* ============ RECENT ASSEMBLY ELECTIONS ============ */}
      <section className="hp-section hp-recent-section">
        <h2 className="iv-title">
          <span className="iv-title-blue">Recent</span>
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
          <span className="iv-title-blue">National</span>
          <span className="iv-title-gold">Snapshot</span>
        </h2>
        <div className="hp-stats-grid">
          <StatTile label="Total Lok Sabha Seats" value={nationalSummary?.totalSeats || 543} accent="var(--blue)" />
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
      <div className={`hp-login-modal-content ${isLoggedIn ? 'hp-modal-large' : ''}`} style={{ backgroundImage: !isLoggedIn ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' : 'none', backgroundColor: 'white' }}>
        <div className={isLoggedIn ? 'hp-data-box' : 'hp-login-auth-box'}>
              {isLoggedIn ? (
                <div className="hp-login-success">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'var(--blue)', margin: 0 }}>
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
                <div style={{ padding: '40px', textAlign: 'center', color: psError ? 'var(--sp)' : 'var(--text-muted)' }}>
                  {psError || 'No booth-level data found for this selection.'}
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
