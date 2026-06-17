import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './ConstituencyDetail.css';

const fmt = n => n >= 10000000 ? (n/10000000).toFixed(2)+'Cr' : n >= 100000 ? (n/100000).toFixed(2)+'L' : n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n);

export default function ConstituencyDetail({ constituency: c, onClose }) {
  if (!c) return null;
  const winner = c.candidates?.find(x => x.isWinner) || c.winner;
  const runnerUp = c.candidates?.filter(x => !x.isWinner)?.[0];
  const totalVotes = c.candidates?.reduce((s, x) => s + x.votes, 0) || c.totalVotesCast;

  return (
    <div className="detail-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="detail-panel fade-in">
        {/* Header */}
        <div className="detail-header">
          <div>
            <div className="detail-type-badge">
              {c.constituencyType === 'PC' ? '🏛 Parliament' : '🏠 Assembly'} Constituency
            </div>
            <h2 className="detail-title">{c.constituencyName}</h2>
            {c.parentConstituency && <p className="detail-parent">Part of {c.parentConstituency} PC · {c.state}</p>}
          </div>
          <button className="detail-close" onClick={onClose}>✕</button>
        </div>

        {/* Summary stats */}
        <div className="detail-stats">
          <StatBox label="Total Voters" value={fmt(c.totalVoters || 0)} icon="👥" />
          <StatBox label="Votes Cast" value={fmt(totalVotes)} icon="🗳️" />
          <StatBox label="Voter Turnout" value={(c.turnout||0).toFixed(1)+'%'} icon="📊" color="#0047AB" />
          <StatBox label="Candidates" value={c.candidates?.length || 0} icon="👤" />
          <StatBox label="Victory Margin" value={fmt(winner?.margin || 0)} icon="🏆" color="#138808" />
        </div>

        {/* Winner banner */}
        {winner && (
          <div className="winner-banner" style={{ '--wc': winner.partyColor || '#FF6B00' }}>
            <div className="wb-crown">🏆 Winner</div>
            <div className="wb-name">{winner.name}</div>
            <div className="wb-party">
              <span className="party-dot" style={{ background: winner.partyColor || '#666', width: 10, height: 10 }} />
              {winner.party}
            </div>
            <div className="wb-votes">
              <span>{fmt(winner.votes)} votes</span>
              <span className="wb-vs">({winner.voteShare}%)</span>
            </div>
            {runnerUp && (
              <div className="wb-margin">
                Won by {fmt(winner.margin)} over {runnerUp.name} ({runnerUp.party})
              </div>
            )}
          </div>
        )}

        {/* Bar chart */}
        {c.candidates && c.candidates.length > 0 && (
          <div className="detail-chart-section">
            <div className="section-title" style={{ marginBottom: 12 }}>Votes by Candidate</div>
            <div style={{ height: Math.max(200, c.candidates.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={c.candidates} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 10 }}>
                  <XAxis type="number" tick={{ fill: '#000000', fontSize: 10 }} tickFormatter={fmt} stroke="#cbd5e0" />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#000000', fontSize: 10 }} width={130} tickFormatter={v => v.length > 18 ? v.slice(0, 17)+'…' : v} stroke="#cbd5e0" />
                  <Tooltip
                    formatter={(v, n, { payload: p }) => [`${fmt(v)} (${p.voteShare}%)`, 'Votes']}
                    contentStyle={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 6, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                    {c.candidates.map((cand, i) => (
                      <Cell key={i} fill={cand.partyColor || '#666'} opacity={cand.isWinner ? 1 : 0.65} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Candidate table */}
        <div className="detail-table-section">
          <div className="section-title" style={{ marginBottom: 12 }}>All Candidates</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>Party</th>
                  <th>Votes</th>
                  <th>Vote %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {c.candidates?.map((cand, i) => (
                  <tr key={i} style={{ background: cand.isWinner ? 'rgba(19,136,8,0.05)' : undefined }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ fontWeight: cand.isWinner ? 700 : 400 }}>{cand.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="party-dot" style={{ background: cand.partyColor || '#666' }} />
                        <span style={{ fontSize: 12 }}>{cand.party}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{fmt(cand.votes)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{cand.voteShare}%</span>
                        <div className="progress-bar" style={{ width: 70 }}>
                          <div className="progress-fill" style={{ width: `${cand.voteShare}%`, background: cand.partyColor || '#666' }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      {cand.isWinner
                        ? <span className="badge badge-win">✓ Won</span>
                        : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lost</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, color }) {
  return (
    <div className="stat-box">
      <span className="sb-icon">{icon}</span>
      <span className="sb-value" style={{ color: color || 'var(--text-primary)' }}>{value}</span>
      <span className="sb-label">{label}</span>
    </div>
  );
}
