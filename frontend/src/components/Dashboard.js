import React, { useState } from 'react';
import PartySummary from './PartySummary';
import SeatSummary from './SeatSummary';
import HeatmapView from './HeatmapView';
import ConstituencyDetail from './ConstituencyDetail';
import ConstituencyAnalysis from './ConstituencyAnalysis';
import './Dashboard.css';

const TABS = [
  { id: 'party',    label: 'Party Summary',          icon: '🏛️' },
  { id: 'seats',    label: 'Seat Results',           icon: '🗳️' },
  { id: 'compare',  label: 'Constituency Analysis',  icon: '🆚' },
  { id: 'heatmap',  label: 'Heatmap',                icon: '🗺️' },
];

export default function Dashboard({ filters, electionData, previousElection, loading, selectedConstituency, setSelectedConstituency }) {
  const [activeTab, setActiveTab] = useState('party');

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-spinner">
          <div className="spinner" />
          <span>Loading election data…</span>
        </div>
      </div>
    );
  }

  if (!electionData) {
    return (
      <div className="dashboard">
        <div className="empty-state">
          <div className="empty-state-icon">🗳️</div>
          <h3>Select an Election</h3>
          <p>Choose Year, Election Type, and State above to explore results, party summaries, and heatmaps.</p>
          <div className="empty-hint-pills">
            <span>Lok Sabha 2024 — Uttar Pradesh</span>
            <span>Lok Sabha 2024 — Maharashtra</span>
            <span>Assembly 2023 — Madhya Pradesh</span>
          </div>
        </div>
      </div>
    );
  }

  // Both `filters.pc` and `filters.ac` accept either a single string (legacy)
  // or an array (new multi-select). Normalise to an array of strings.
  const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const pcSel = asList(filters.pc);
  const acSel = asList(filters.ac);

  let filtered = electionData.constituencies;
  if (pcSel.length) {
    filtered = filtered.filter(c =>
      pcSel.includes(c.constituencyName) || pcSel.includes(c.parentConstituency)
    );
  }
  if (acSel.length) {
    filtered = filtered.filter(c => acSel.includes(c.constituencyName));
  }

  const filteredData = { ...electionData, constituencies: filtered };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title-block">
          <h2 className="dashboard-title">
            {electionData.type} Elections — {electionData.state} {electionData.year}
          </h2>
          <p className="dashboard-subtitle">
            {filtered.length} of {electionData.totalSeats} constituencies shown
            {previousElection && <> · Compared with {previousElection.year}</>}
          </p>
        </div>
        <div className="dashboard-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`dash-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="dash-tab-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-body">
        {selectedConstituency && (
          <ConstituencyDetail
            constituency={selectedConstituency}
            onClose={() => setSelectedConstituency(null)}
          />
        )}

        {activeTab === 'party' && (
          <PartySummary electionData={filteredData} previousElection={previousElection} />
        )}
        {activeTab === 'seats' && (
          <SeatSummary
            electionData={filteredData}
            onSelectConstituency={setSelectedConstituency}
          />
        )}
        {activeTab === 'compare' && (
          <ConstituencyAnalysis
            currentElection={filteredData}
            previousElection={previousElection}
          />
        )}
        {activeTab === 'heatmap' && (
          <HeatmapView
            electionData={filteredData}
            onSelectConstituency={setSelectedConstituency}
          />
        )}
      </div>
    </div>
  );
}
