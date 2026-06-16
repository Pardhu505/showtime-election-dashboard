import React, { useState, useRef, useMemo } from 'react';
import './UploadPanel.css';

const ELECTION_TYPES = ['Lok Sabha', 'Assembly'];

const ALL_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const CSV_TEMPLATE = `Constituency Name,Constituency Type,Parliament Constituency,Candidate Name,Party,Party Abbr,Party Color,Votes,Vote Share,Winner,Gender,Age,Criminal Cases,Latitude,Longitude
Varanasi,PC,,Narendra Modi,BJP,BJP,#FF6B00,612000,54.2,Yes,M,73,0,25.32,82.97
Varanasi,PC,,Ajay Rai,INC,INC,#00A651,467000,41.3,No,M,58,0,25.32,82.97
Varanasi,PC,,Sanjay Chaurasiya,SP,SP,#E53935,231000,4.5,No,M,52,0,25.32,82.97`;

export default function UploadPanel({ years = [], statesBy = {} }) {
  const [activeMode, setActiveMode] = useState('election'); // 'election' | 'booth'
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ year: '', type: '', state: '', phase: '1' });

  const availableStates = useMemo(() => {
    const fromBackend = (form.year && form.type) ? (statesBy[`${form.year}|${form.type}`] || []) : [];
    // For Booth data, always show all states. For Election results, show all as well to allow new uploads.
    // We merge and de-dupe just in case.
    const merged = Array.from(new Set([...fromBackend, ...ALL_STATES])).sort();
    return merged;
  }, [form.year, form.type, statesBy]);
  const [status, setStatus] = useState(null); // null | 'uploading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'json'].includes(ext)) {
      setMessage('Only CSV, Excel (.xlsx/.xls), or JSON files are supported.');
      setStatus('error');
      return;
    }
    setFile(f);
    setStatus(null);
    setMessage('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) { setMessage('Please select a file.'); setStatus('error'); return; }
    if (!form.year || !form.type || !form.state) { setMessage('Please fill in Year, Type, and State.'); setStatus('error'); return; }

    setStatus('uploading');
    setMessage('');

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('year', form.year);
      fd.append('type', form.type);
      fd.append('state', form.state);

      const BASE = process.env.REACT_APP_API_URL || '/api';
      let endpoint = `${BASE}/upload/election`;
      if (activeMode === 'election') {
        fd.append('phase', form.phase);
      } else {
        endpoint = `${BASE}/elections/upload-booth`;
      }

      const res = await fetch(endpoint, { method: 'POST', body: fd });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: text || res.statusText };
      }

      if (res.ok) {
        setStatus('success');
        setMessage(`✅ Successfully uploaded ${data.message || 'data'}.`);
        setFile(null);
      } else {
        setStatus('error');
        if (res.status === 413) {
          setMessage(`❌ Payload Too Large: The file is too big for the server or hosting platform (e.g. Vercel's 4.5MB limit).`);
        } else {
          setMessage(`❌ Upload failed: ${data.error || 'Unknown error'}`);
        }
      }
    } catch (err) {
      setStatus('error');
      setMessage(`❌ Network error — make sure the backend is running on port 5000.`);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'election_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="upload-panel fade-in">
      <div className="upload-hero">
        <div className="upload-hero-icon">📂</div>
        <h2 className="upload-hero-title">Data Upload Center</h2>
        <p className="upload-hero-sub">Populate the election dashboard with results or booth-level details</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <button
          className={`btn ${activeMode === 'election' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveMode('election'); setStatus(null); setMessage(''); }}
        >
          Election Results
        </button>
        <button
          className={`btn ${activeMode === 'booth' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveMode('booth'); setStatus(null); setMessage(''); }}
        >
          Booth Level Data
        </button>
      </div>

      <div className="upload-grid">
        {/* Upload Form */}
        <div className="card upload-form-card">
          <div className="section-title" style={{ marginBottom: 20 }}>
            {activeMode === 'election' ? 'Election Dataset Details' : 'Booth Level Data Details'}
          </div>

          <div className="upload-form-grid">
            <div className="filter-group">
              <label className="filter-label">Election Year *</label>
              <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value, state: '' }))}>
                <option value="">— Select Year —</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Election Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value, state: '' }))}>
                <option value="">— Select —</option>
                {ELECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">State / UT *</label>
              <select
                value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                disabled={!form.year || !form.type}
              >
                <option value="">— Select State —</option>
                {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {activeMode === 'election' && (
              <div className="filter-group">
                <label className="filter-label">Phase (optional)</label>
                <input
                  className="upload-input"
                  type="number"
                  placeholder="1"
                  value={form.phase}
                  onChange={e => setForm(f => ({ ...f, phase: e.target.value }))}
                  min="1" max="7"
                />
              </div>
            )}
          </div>

          {/* Drop zone */}
          <div
            className={`drop-zone ${drag ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept={activeMode === 'election' ? ".csv,.xlsx,.xls,.json" : ".json"}
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            {file ? (
              <>
                <div className="dz-icon">✅</div>
                <div className="dz-filename">{file.name}</div>
                <div className="dz-filesize">{(file.size / 1024).toFixed(1)} KB · Click to change</div>
              </>
            ) : (
              <>
                <div className="dz-icon">📁</div>
                <div className="dz-text">Drop your file here or <span className="dz-link">browse</span></div>
                <div className="dz-formats">{activeMode === 'election' ? 'CSV · XLSX · XLS · JSON' : 'JSON Only'}</div>
              </>
            )}
          </div>

          {status && (
            <div className={`upload-msg ${status}`}>
              {status === 'uploading' ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Uploading…</> : message}
            </div>
          )}

          <div className="upload-actions">
            <button className="btn btn-secondary" onClick={downloadTemplate}>
              ⬇ Download CSV Template
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={status === 'uploading'}>
              {status === 'uploading' ? 'Uploading…' : '⬆ Upload Dataset'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="upload-instructions">
          {activeMode === 'election' ? (
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>📋 Required CSV Columns</div>
              <div className="col-list">
                {[
                  ['Constituency Name', 'required', 'Name of the constituency'],
                  ['Constituency Type', 'required', 'PC (Parliament) or AC (Assembly)'],
                  ['Parliament Constituency', 'optional', 'Parent PC name for AC seats'],
                  ['Candidate Name', 'required', 'Full name of the candidate'],
                  ['Party', 'required', 'Party name (e.g. BJP, INC)'],
                  ['Party Abbr', 'optional', 'Short form (e.g. BJP)'],
                  ['Party Color', 'optional', 'Hex color code (e.g. #FF6B00)'],
                  ['Votes', 'required', 'Total votes received'],
                  ['Vote Share', 'optional', 'Percentage (e.g. 54.2)'],
                  ['Winner', 'optional', 'Yes/No — if omitted, highest votes wins'],
                  ['Latitude', 'optional', 'For map positioning'],
                  ['Longitude', 'optional', 'For map positioning'],
                ].map(([col, req, desc]) => (
                  <div key={col} className="col-item">
                    <div className="col-name">{col} <span className={`col-req ${req}`}>{req}</span></div>
                    <div className="col-desc">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>📋 JSON Data Format</div>
              <div className="col-desc" style={{ marginBottom: 12 }}>
                Booth level data should be an array of objects. Each object represents a polling station (booth).
              </div>
              <pre style={{
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                border: '1px solid var(--border)',
                overflowX: 'auto',
                color: 'var(--text-primary)'
              }}>
{`[
  {
    "Booth No": 1,
    "Booth Name": "Govt Primary School",
    "Constituency": "Varanasi",
    "Candidate A": 450,
    "Candidate B": 380,
    "NOTA": 12,
    "Total": 842
  },
  ...
]`}
              </pre>
              <div className="col-desc" style={{ marginTop: 12, fontSize: '11px', fontStyle: 'italic' }}>
                Note: The dashboard will dynamically generate table columns based on the keys in your JSON objects.
              </div>
            </div>
          )}

          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>⚙️ Data Sources</div>
            <div className="sources-list">
              {[
                ['Election Commission of India', 'https://eci.gov.in'],
                ['Lok Dhaba (IIT Bombay)', 'https://lokdhaba.ashoka.edu.in'],
                ['Voter Turnout Data App', 'https://results.eci.gov.in'],
              ].map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noreferrer" className="source-link">
                  <span>🔗 {name}</span>
                  <span className="source-arrow">↗</span>
                </a>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>🚀 Direct MongoDB Upload (for large files)</div>
            <div className="col-desc" style={{ marginBottom: 10 }}>
              If your file exceeds platform limits (like Vercel's 4.5MB), you can upload it directly to your MongoDB:
            </div>
            <div className="mongo-steps">
              <div className="mongo-step">1. Connect to <b>Booth_level_data</b></div>
              <div className="mongo-step">2. Create collection: <code>{form.state && form.year && form.type ? `${form.state.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${form.year}_${form.type.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}` : "state_year_type"}</code></div>
              <div className="mongo-step">3. Import your JSON array</div>
            </div>
          </div>

          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>🗄️ MongoDB Setup</div>
            <div className="mongo-steps">
              <div className="mongo-step"><code>mongod --dbpath /data/db</code></div>
              <div className="mongo-step"><code>cp backend/.env.example backend/.env</code></div>
              <div className="mongo-step"><code>cd backend && npm install && npm start</code></div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
              Default connection: <code style={{ fontSize: 11 }}>mongodb://localhost:27017/indiavotes</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
