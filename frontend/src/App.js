import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import FilterPanel from './components/FilterPanel';
import Dashboard from './components/Dashboard';
import UploadPanel from './components/UploadPanel';
import PardhuChat from './components/PardhuChat';
import {
  MOCK_DB, STATES_BY as MOCK_STATES_BY, YEARS as MOCK_YEARS,
  NATIONAL_PC_2024, RECENT_ASSEMBLY_ELECTIONS, findPreviousElection,
} from './data/mockData';
import { api } from './utils/api';
import './App.css';

const TYPES = ['Lok Sabha', 'Assembly'];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const [filters, setFilters] = useState({ year: '', type: '', state: '', pc: [], ac: [] });
  const [electionData, setElectionData] = useState(null);
  const [previousElection, setPreviousElection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedConstituency, setSelectedConstituency] = useState(null);

  // Connection state — null = unknown (still checking), true = live, false = offline
  const [useBackend, setUseBackend] = useState(null);

  // Live filter options fetched from the API.
  // Shape mirrors the mock-data exports so HomePage + FilterPanel don't care
  // about the source.
  const [apiYears, setApiYears] = useState(null);                // Array<number> or null
  const [apiStatesByKey, setApiStatesByKey] = useState({});      // { "year|type": ["state", ...] }
  const [apiRecent, setApiRecent] = useState(null);              // Array<RecentCard> or null

  // ---------------------------------------------------------------------
  // 1. Detect backend on mount. If alive, prefetch the full filter index.
  // ---------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let backendLive = false;
      try {
        const h = await fetch('/api/health').then(r => r.json()).catch(() => null);
        backendLive = h?.status === 'OK' && h?.mode === 'mongodb';
      } catch { /* ignore */ }

      if (cancelled) return;
      setUseBackend(backendLive);
      if (!backendLive) return;

      // Fetch full filter index: years + states-per-(year,type)
      try {
        const years = await api.getYears();
        if (cancelled) return;
        if (!Array.isArray(years) || !years.length) return;
        setApiYears(years);

        // Build the per-(year,type) state map in parallel
        const tasks = [];
        for (const y of years) {
          for (const t of TYPES) {
            tasks.push((async () => {
              const states = await api.getStates(y, t).catch(() => []);
              return [`${y}|${t}`, states];
            })());
          }
        }
        const entries = await Promise.all(tasks);
        if (cancelled) return;
        const map = {};
        for (const [k, v] of entries) if (v.length) map[k] = v;
        setApiStatesByKey(map);

        // Recent assembly elections — shown on home page
        try {
          const recent = await api.getRecentElections('Assembly', 6);
          if (!cancelled && Array.isArray(recent) && recent.length) setApiRecent(recent);
        } catch (err) {
          console.warn('Recent assembly fetch failed:', err);
        }
      } catch (err) {
        console.error('Filter index fetch failed, falling back to mock filter index:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // The effective filter index — live API if available, otherwise mock.
  const years    = apiYears   || MOCK_YEARS;
  const statesBy = useMemo(
    () => (apiYears ? apiStatesByKey : MOCK_STATES_BY),
    [apiYears, apiStatesByKey]
  );
  const recentAssembly = apiRecent || RECENT_ASSEMBLY_ELECTIONS;

  // ---------------------------------------------------------------------
  // 2. Fetch election data when filters change
  // ---------------------------------------------------------------------
  const fetchData = useCallback(async (f) => {
    if (!f.year || !f.type || !f.state) {
      setElectionData(null); setPreviousElection(null); return;
    }
    setLoading(true);
    try {
      if (useBackend) {
        const [data, prev] = await Promise.all([
          api.getSummary(f.year, f.type, f.state),
          api.getPrevious(f.year, f.type, f.state),  // null if not found, no throw
        ]);
        setElectionData(data);
        setPreviousElection(prev);
      } else {
        // brief artificial delay so the spinner is visible
        await new Promise(r => setTimeout(r, 250));
        const key = `${f.year}|${f.type}|${f.state}`;
        setElectionData(MOCK_DB[key] || null);
        setPreviousElection(findPreviousElection(f.year, f.type, f.state));
      }
    } catch (err) {
      console.error('Failed to fetch election data, falling back to mock:', err);
      const key = `${f.year}|${f.type}|${f.state}`;
      setElectionData(MOCK_DB[key] || null);
      setPreviousElection(findPreviousElection(f.year, f.type, f.state));
    }
    setLoading(false);
  }, [useBackend]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setSelectedConstituency(null);
    fetchData(newFilters);
  }, [fetchData]);

  const handleHomeGo = (year, type, state) => {
    const next = { year: String(year), type, state, pc: [], ac: [] };
    setActiveTab('results');
    handleFilterChange(next);
  };

  // Live availableStates for the FilterPanel — keyed on the current selection.
  const availableStates = filters.year && filters.type
    ? (statesBy[`${filters.year}|${filters.type}`] || [])
    : [];

  return (
    <div className="app">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Status badge — only shown when we have a definitive answer */}
      {useBackend !== null && (
        <div className={`app-source-banner ${useBackend ? 'app-source-live' : 'app-source-mock'}`}>
          {useBackend
            ? <>● <b>Live data</b> · MongoDB connected · {years.length} years × {Object.values(statesBy).reduce((s, a) => s + a.length, 0)} state-elections indexed</>
            : <>● <b>Offline mode</b> · backend unreachable, showing bundled sample data</>}
        </div>
      )}

      <main className="main-content">
        {activeTab === 'home' && (
          <HomePage
            nationalSummary={NATIONAL_PC_2024}
            recentAssembly={recentAssembly}
            years={years}
            statesBy={statesBy}
            onGo={handleHomeGo}
          />
        )}

        {activeTab === 'results' && (
          <>
            <FilterPanel
              filters={filters}
              years={years}
              availableStates={availableStates}
              onFilterChange={handleFilterChange}
              electionData={electionData}
            />
            <Dashboard
              filters={filters}
              electionData={electionData}
              previousElection={previousElection}
              loading={loading}
              selectedConstituency={selectedConstituency}
              setSelectedConstituency={setSelectedConstituency}
            />
          </>
        )}

        {activeTab === 'upload' && <UploadPanel />}
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <span>© {new Date().getFullYear()} ShowTime Consulting · Indian Election Dashboard</span>
          <span className="footer-dot">·</span>
          <span>Data sources: Election Commission of India</span>
        </div>
      </footer>

      {/* Floating AI assistant — sits bottom-right on every page */}
      <PardhuChat />
    </div>
  );
}
