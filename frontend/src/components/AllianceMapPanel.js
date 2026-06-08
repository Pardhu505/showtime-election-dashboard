import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../utils/api';
import { ALLIANCE_COLORS, classifyParty, normStateKey, readStateProp } from '../data/alliances';
import './AllianceMapPanel.css';

// India states GeoJSON — bundled in /public/geo/ so no external network
// dependency. The file ships with the dashboard and is served by the dev
// server / build output at /geo/india-states.geojson.
const STATE_GEO_URLS = [
  `${process.env.PUBLIC_URL || ''}/geo/india-states.geojson`,
  '/geo/india-states.geojson',
];

let _geoCache = null;
async function fetchStateGeo() {
  if (_geoCache) return _geoCache;
  let lastErr;
  for (const url of STATE_GEO_URLS) {
    try {
      const r = await fetch(url);
      if (!r.ok) { lastErr = new Error(`HTTP ${r.status} on ${url}`); continue; }
      const data = await r.json();
      if (data?.features?.length) {
        _geoCache = data;
        return data;
      }
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Bundled state-GeoJSON not found');
}

// Map raw state names from the GeoJSON to our canonical form.
const STATE_ALIASES = {
  'orissa': 'odisha',
  'pondicherry': 'puducherry',
  'jammuandkashmir': 'jammuandkashmir',
  'andamannicobar': 'andamanandnicobarislands',
  'andamanandnicobar': 'andamanandnicobarislands',
  'dadraandnagarhaveli': 'dadraandnagarhaveli',
  'damananddiu': 'damananddiu',
  'arunanchalpradesh': 'arunachalpradesh',
};

function alias(key) {
  return STATE_ALIASES[key] || key;
}

const fmt = (n) => n >= 100000 ? (n/100000).toFixed(2)+'L' : n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n);

export default function AllianceMapPanel() {
  const [geo, setGeo] = useState(null);
  const [rollup, setRollup] = useState(null);
  const [status, setStatus] = useState('loading');   // loading | ready | failed
  const [year, setYear] = useState(2024);
  const [hover, setHover] = useState(null);
  const layerKey = useRef(0);  // forces GeoJSON re-mount when data changes

  // Fetch both pieces in parallel
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    Promise.all([
      fetchStateGeo().catch(() => null),
      api.getStateRollup(year, 'Lok Sabha').catch(() => null),
    ]).then(([g, r]) => {
      if (cancelled) return;
      if (!g) { setStatus('failed'); return; }
      setGeo(g);
      setRollup(Array.isArray(r) ? r : []);
      setStatus('ready');
      layerKey.current += 1;
    });
    return () => { cancelled = true; };
  }, [year]);

  // Build alliance tally per state (keyed on normStateKey)
  const allianceByState = useMemo(() => {
    const out = new Map();
    if (!rollup) return out;
    for (const doc of rollup) {
      const buckets = { NDA: { seats: 0, votes: 0 }, INDIA: { seats: 0, votes: 0 }, OTHER: { seats: 0, votes: 0 } };
      let totalVotes = 0;
      for (const p of doc.partySummary || []) {
        const a = classifyParty(p.partyAbbr || p.party, doc.state, year);
        buckets[a].seats += p.seatsWon || 0;
        buckets[a].votes += p.totalVotes || 0;
        totalVotes += p.totalVotes || 0;
      }
      // Vote shares
      for (const k of ['NDA', 'INDIA', 'OTHER']) {
        buckets[k].voteShare = totalVotes ? (buckets[k].votes * 100) / totalVotes : 0;
      }
      // Winning alliance for this state
      const ranked = [['NDA', buckets.NDA.seats], ['INDIA', buckets.INDIA.seats], ['OTHER', buckets.OTHER.seats]]
        .sort((a, b) => b[1] - a[1]);
      let winner = 'NODATA';
      if (ranked[0][1] > 0) {
        winner = ranked[0][1] === ranked[1][1] ? 'TIE' : ranked[0][0];
      }
      out.set(alias(normStateKey(doc.state)), {
        state: doc.state,
        totalSeats: doc.totalSeats || 0,
        winner,
        ndaSeats:    buckets.NDA.seats,
        indiaSeats:  buckets.INDIA.seats,
        otherSeats:  buckets.OTHER.seats,
        ndaShare:    buckets.NDA.voteShare,
        indiaShare:  buckets.INDIA.voteShare,
        otherShare:  buckets.OTHER.voteShare,
      });
    }
    return out;
  }, [rollup]);

  const totals = useMemo(() => {
    let nda = 0, indi = 0, other = 0;
    for (const v of allianceByState.values()) {
      nda += v.ndaSeats; indi += v.indiaSeats; other += v.otherSeats;
    }
    return { nda, indi, other };
  }, [allianceByState]);

  // Styling each polygon — based on which alliance won most seats
  const style = (feature) => {
    const sname = readStateProp(feature.properties);
    const info = allianceByState.get(alias(normStateKey(sname)));
    const winner = info?.winner || 'NODATA';
    return {
      fillColor: ALLIANCE_COLORS[winner],
      weight: 0.7,
      opacity: 0.7,
      color: '#1a202c',
      fillOpacity: winner === 'NODATA' ? 0.5 : 0.78,
    };
  };

  const onEachFeature = (feature, layer) => {
    const sname = readStateProp(feature.properties);
    const info = allianceByState.get(alias(normStateKey(sname)));
    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ weight: 2.5, color: '#000', fillOpacity: 0.92 });
        setHover({ name: sname, info });
      },
      mouseout: (e) => {
        e.target.setStyle({ weight: 0.7, color: '#1a202c', fillOpacity: info?.winner === 'NODATA' ? 0.5 : 0.78 });
        setHover(null);
      },
    });
  };

  return (
    <section className="alliance-section">
      <div className="alliance-header">
        <h2 className="iv-title">
          <span className="iv-title-teal">Alliance</span>
          <span className="iv-title-gold">Map · India</span>
        </h2>
        <div className="alliance-year-toggle">
          <span className="alliance-year-label">Lok Sabha</span>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))}>
            <option value={2024}>2024</option>
            <option value={2019}>2019</option>
          </select>
        </div>
      </div>

      <div className="alliance-legend-row">
        <span className="alliance-legend-item"><span className="alliance-dot" style={{ background: ALLIANCE_COLORS.NDA }} /> NDA <b>{totals.nda}</b></span>
        <span className="alliance-legend-item"><span className="alliance-dot" style={{ background: ALLIANCE_COLORS.INDIA }} /> I.N.D.I.A. <b>{totals.indi}</b></span>
        <span className="alliance-legend-item"><span className="alliance-dot" style={{ background: ALLIANCE_COLORS.OTHER }} /> Others <b>{totals.other}</b></span>
        <span className="alliance-hint">Hover any state for details. Colour = alliance winning the most seats in that state.</span>
      </div>

      <div className="alliance-map-wrap card">
        {status === 'loading' && (
          <div className="alliance-loading">
            <span className="bs-spinner" /> Loading India state map…
          </div>
        )}
        {status === 'failed' && (
          <div className="alliance-failed">
            Couldn't load the state-map GeoJSON. Showing alliance tallies only.
            <div className="alliance-fallback-totals">
              <div><span style={{ background: ALLIANCE_COLORS.NDA }} /> NDA: <b>{totals.nda}</b></div>
              <div><span style={{ background: ALLIANCE_COLORS.INDIA }} /> I.N.D.I.A.: <b>{totals.indi}</b></div>
              <div><span style={{ background: ALLIANCE_COLORS.OTHER }} /> Others: <b>{totals.other}</b></div>
            </div>
          </div>
        )}
        {status === 'ready' && geo && (
          <MapContainer
            center={[22.5, 80.0]}
            zoom={4}
            scrollWheelZoom={false}
            zoomControl={true}
            className="alliance-leaflet"
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap &copy; CARTO"
            />
            <GeoJSON key={layerKey.current} data={geo} style={style} onEachFeature={onEachFeature} />
          </MapContainer>
        )}

        {hover && (
          <div className="alliance-hover-card">
            <div className="alliance-hover-title">{hover.info?.state || hover.name}</div>
            {hover.info ? (
              <>
                <div className="alliance-hover-winner" style={{ color: ALLIANCE_COLORS[hover.info.winner] }}>
                  {hover.info.winner === 'TIE'    ? 'Tied'
                   : hover.info.winner === 'NODATA' ? 'No data'
                   : hover.info.winner + ' led'}
                  <span className="alliance-hover-total">· {hover.info.totalSeats} total seats</span>
                </div>
                <div className="alliance-hover-row">
                  <span><span className="alliance-dot" style={{ background: ALLIANCE_COLORS.NDA }} /> NDA</span>
                  <span><b>{hover.info.ndaSeats}</b> seats · {hover.info.ndaShare.toFixed(1)}%</span>
                </div>
                <div className="alliance-hover-row">
                  <span><span className="alliance-dot" style={{ background: ALLIANCE_COLORS.INDIA }} /> I.N.D.I.A.</span>
                  <span><b>{hover.info.indiaSeats}</b> seats · {hover.info.indiaShare.toFixed(1)}%</span>
                </div>
                <div className="alliance-hover-row">
                  <span><span className="alliance-dot" style={{ background: ALLIANCE_COLORS.OTHER }} /> Others</span>
                  <span><b>{hover.info.otherSeats}</b> seats · {hover.info.otherShare.toFixed(1)}%</span>
                </div>
              </>
            ) : (
              <div className="alliance-hover-empty">No election data for {year}</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
