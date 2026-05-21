import React from 'react';
import './Header.css';

const SHOWTIME_LOGO = 'https://showtimeconsulting.in/images/settings/2fd13f50.png';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 001 1h3v-7h6v7h3a1 1 0 001-1V10"/>
    </svg>
  )},
  { id: 'results', label: 'Election Results', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { id: 'upload', label: 'Upload Data', icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )},
];

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="header">
      <div className="header-tricolor-bar">
        <span /><span /><span />
      </div>
      <div className="header-inner">
        <button className="header-brand" onClick={() => setActiveTab('home')} aria-label="Go to home">
          <img
            src={SHOWTIME_LOGO}
            alt="ShowTime Consulting"
            className="brand-logo"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="brand-text">
            <h1 className="brand-name">
              <span className="brand-line-1">ShowTime Consulting</span>
              <span className="brand-line-2">Indian Election Dashboard</span>
            </h1>
          </div>
        </button>

        <nav className="header-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
