import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polygon, Tooltip as LTooltip, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { constituencyVoronoi } from '../utils/geo';
import { loadBoundariesForState, matchFeatures, geometryToPositions, resetBoundaryCache } from '../utils/boundaries';
import './HeatmapView.css';

const fmt = n => n >= 10000000 ? (n/10000000).toFixed(2)+'Cr' : n >= 100000 ? (n/100000).toFixed(2)+'L' : n >= 1000 ? (n/1000).toFixed(0)+'K' : String(n);

export default function HeatmapView({ electionData, onSelectConstituency }) {
  const [colorMode, setColorMode] = useState('party');
  const [mapStyle, setMapStyle]   = useState('light');
  const [viewMode, setViewMode]   = useState('polygons');
  const [sizeMode, setSizeMode]   = useState('margin');

  // Boundary-loading state — only relevant for Lok Sabha PCs.
  // status: 'idle' | 'loading' | 'loaded' | 'failed' | 'unsupported'
  const [boundaries, setBoundaries] = useState({ status: 'idle', matched: null, message: '' });
  const [retryToken, setRetryToken] = useState(0);

  const { constituencies, state, type } = electionData;

  const plottable = useMemo(
    () => constituencies.filter(c => typeof c.latitude === 'number' && typeof c.longitude === 'number'),
    [constituencies]
  );
  const noCoords = plottable.length === 0;

  // -----------------------------------------------------------------
  // Try to fetch real boundaries whenever state/type changes.
  // Works for both Lok Sabha (PC) and Assembly (AC). Falls back to Voronoi
  // automatically when the source has no file for that state.
  // -----------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    if (!state) { setBoundaries({ status: 'idle' }); return; }
    setBoundaries({ status: 'loading', matched: null });
    loadBoundariesForState(state, type)
      .then(({ features, source }) => {
        if (cancelled) return;
        if (!features.length) {
          setBoundaries({ status: 'failed', matched: null,
            message: `No boundaries found for "${state}" in the source.` });
          return;
        }
        const matched = matchFeatures(plottable, features, type);
        const hitCount = matched.filter(m => m.feature).length;
        const kindLabel = type === 'Lok Sabha' ? 'PC' : 'AC';
        setBoundaries({
          status: 'loaded', matched, source,
          message: `${hitCount} of ${plottable.length} ${kindLabel}s matched to ${source}.`,
        });
      })
      .catch(err => {
        if (cancelled) return;
        const kindLabel = type === 'Lok Sabha' ? 'PC' : 'AC';
        const reason = err.code === 'NOT_FOUND'
          ? `${state} ${kindLabel} boundaries aren't in the bundled open-data source.`
          : `Couldn't load boundary file: ${err.message}.`;
        setBoundaries({ status: 'failed', matched: null,
          message: `${reason} Using Voronoi approximation instead.` });
      });
    return () => { cancelled = true; };
  }, [state, type, plottable, retryToken]);

  // -----------------------------------------------------------------
  // Voronoi fallback (also used when "Choropleth" is on but real boundaries
  // aren't available)
  // -----------------------------------------------------------------
  const voronoiPolys = useMemo(() => {
    if (viewMode !== 'polygons' || plottable.length < 3) return null;
    return constituencyVoronoi(plottable, 0.45);
  }, [plottable, viewMode]);

  const useReal = viewMode === 'polygons' && boundaries.status === 'loaded';

  // ---- Colour / size ----
  const getColor = (c) => {
    if (colorMode === 'party') return c.winner?.partyColor || '#94a3b8';
    if (colorMode === 'turnout') {
      const t = c.turnout || 0;
      if (t >= 75) return '#1A237E';
      if (t >= 65) return '#1565C0';
      if (t >= 55) return '#1976D2';
      if (t >= 45) return '#42A5F5';
      return '#90CAF9';
    }
    const m = c.winner?.margin || 0;
    if (m >= 200000) return '#1B5E20';
    if (m >= 100000) return '#2E7D32';
    if (m >= 50000)  return '#388E3C';
    if (m >= 20000)  return '#FFA000';
    return '#D32F2F';
  };

  const sizeRange = useMemo(() => {
    if (!plottable.length) return [1, 1];
    const vals = plottable.map(c =>
      sizeMode === 'margin'  ? Math.abs(c.winner?.margin || 0) :
      sizeMode === 'turnout' ? (c.turnout || 0) :
                               (c.winner?.votes || 0)
    );
    return [Math.min(...vals), Math.max(...vals)];
  }, [plottable, sizeMode]);

  const getRadius = (c) => {
    const v = sizeMode === 'margin'  ? Math.abs(c.winner?.margin || 0) :
              sizeMode === 'turnout' ? (c.turnout || 0) :
                                       (c.winner?.votes || 0);
    const [lo, hi] = sizeRange;
    const t = hi === lo ? 0.5 : (v - lo) / (hi - lo);
    return 7 + t * 16;
  };

  // ---- Legend / stats ----
  const parties = useMemo(() => {
    const pm = {};
    for (const c of plottable) {
      const p = c.winner?.party;
      if (!p) continue;
      if (!pm[p]) pm[p] = { party: p, color: c.winner.partyColor || '#666', count: 0 };
      pm[p].count++;
    }
    return Object.values(pm).sort((a, b) => b.count - a.count);
  }, [plottable]);

  const stats = useMemo(() => {
    if (!plottable.length) return null;
    const turnouts = plottable.map(c => c.turnout || 0);
    const margins  = plottable.map(c => c.winner?.margin || 0);
    return {
      seats:          plottable.length,
      avgTurnout:     (turnouts.reduce((s, x) => s + x, 0) / turnouts.length).toFixed(1),
      highestMargin:  Math.max(...margins),
      closestContest: Math.min(...margins),
      totalVotes:     plottable.reduce((s, c) => s + (c.totalVotesCast || c.winner?.votes || 0), 0),
    };
  }, [plottable]);

  // ---- Map setup ----
  const TILES = {
    light: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
             attr: '&copy; OpenStreetMap &copy; CARTO' },
    osm:   { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
             attr: '&copy; OpenStreetMap contributors' },
    dark:  { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
             attr: '&copy; OpenStreetMap &copy; CARTO' },
  };

  const center = useMemo(() => {
    if (plottable.length) {
      const lat = plottable.reduce((s, c) => s + c.latitude, 0) / plottable.length;
      const lng = plottable.reduce((s, c) => s + c.longitude, 0) / plottable.length;
      return [lat, lng];
    }
    return [22.5, 79];
  }, [plottable]);

  const retry = () => {
    resetBoundaryCache();
    setRetryToken(t => t + 1);
  };

  return (
    <div className="heatmap-view fade-in">
      {/* Controls */}
      <div className="heatmap-controls card">
        <ControlGroup label="View">
          <SegBtn active={viewMode === 'polygons'} onClick={() => setViewMode('polygons')}>Choropleth</SegBtn>
          <SegBtn active={viewMode === 'markers'}  onClick={() => setViewMode('markers')}>Markers</SegBtn>
        </ControlGroup>
        <ControlGroup label="Colour by">
          <SegBtn active={colorMode === 'party'}   onClick={() => setColorMode('party')}>Party</SegBtn>
          <SegBtn active={colorMode === 'margin'}  onClick={() => setColorMode('margin')}>Margin</SegBtn>
          <SegBtn active={colorMode === 'turnout'} onClick={() => setColorMode('turnout')}>Turnout</SegBtn>
        </ControlGroup>
        {viewMode === 'markers' && (
          <ControlGroup label="Size by">
            <SegBtn active={sizeMode === 'margin'}  onClick={() => setSizeMode('margin')}>Margin</SegBtn>
            <SegBtn active={sizeMode === 'turnout'} onClick={() => setSizeMode('turnout')}>Turnout</SegBtn>
            <SegBtn active={sizeMode === 'votes'}   onClick={() => setSizeMode('votes')}>Votes</SegBtn>
          </ControlGroup>
        )}
        <ControlGroup label="Map">
          <SegBtn active={mapStyle === 'light'} onClick={() => setMapStyle('light')}>Light</SegBtn>
          <SegBtn active={mapStyle === 'osm'}   onClick={() => setMapStyle('osm')}>Street</SegBtn>
          <SegBtn active={mapStyle === 'dark'}  onClick={() => setMapStyle('dark')}>Dark</SegBtn>
        </ControlGroup>
        <span className="heatmap-count">
          {plottable.length} of {constituencies.length} seats mapped
        </span>
      </div>

      {/* Boundary status banner */}
      {viewMode === 'polygons' && (
        <div className={`boundary-status boundary-${boundaries.status}`}>
          {boundaries.status === 'loading' && (
            <><span className="bs-spinner" /> Loading real ECI {type === 'Lok Sabha' ? 'Parliament' : 'Assembly'} constituency boundaries for {state}…</>
          )}
          {boundaries.status === 'loaded' && (
            <>
              <span className="bs-dot bs-dot-green" />
              <span><b>Real boundaries loaded.</b> {boundaries.message}</span>
            </>
          )}
          {boundaries.status === 'failed' && (
            <>
              <span className="bs-dot bs-dot-amber" />
              <span>{boundaries.message} <button className="bs-link" onClick={retry}>Retry</button></span>
            </>
          )}
        </div>
      )}

      <div className="heatmap-layout">
        <div className="card heatmap-grid-card heatmap-map-card">
          {noCoords ? (
            <div className="heatmap-no-coords">
              <div className="empty-state-icon">🗺️</div>
              <h3>No coordinates available</h3>
              <p>
                None of the {constituencies.length} constituencies in this dataset have latitude/longitude values,
                so they can't be plotted on a map.
              </p>
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={6}
              scrollWheelZoom
              zoomControl={false}
              className="heatmap-leaflet"
              key={`${electionData.state}-${electionData.year}-${electionData.type}`}
            >
              <TileLayer url={TILES[mapStyle].url} attribution={TILES[mapStyle].attr} />
              <ZoomControl position="topright" />
              <FitBounds points={plottable} polygons={useReal
                ? boundaries.matched.map(m => m.feature ? geometryToPositions(m.feature.geometry) : null).flat(2).filter(Array.isArray)
                : voronoiPolys}
              />

              {/* === REAL BOUNDARIES === */}
              {useReal && boundaries.matched.map(({ constituency: c, feature }, i) => {
                if (!feature) return null;
                const positions = geometryToPositions(feature.geometry);
                if (!positions) return null;
                const color = getColor(c);
                return (
                  <Polygon
                    key={`real-${c.constituencyName}-${i}`}
                    positions={positions}
                    pathOptions={{
                      color: '#1a202c',
                      weight: 0.6,
                      opacity: 0.55,
                      fillColor: color,
                      fillOpacity: 0.78,
                    }}
                    eventHandlers={{
                      click: () => onSelectConstituency(c),
                      mouseover: (e) => e.target.setStyle({ weight: 2.5, opacity: 1, fillOpacity: 0.92, color: '#000' }),
                      mouseout:  (e) => e.target.setStyle({ weight: 0.6, opacity: 0.55, fillOpacity: 0.78, color: '#1a202c' }),
                    }}
                  >
                    <Tip c={c} />
                  </Polygon>
                );
              })}

              {/* Unmatched constituencies — drop a small marker so they're still clickable */}
              {useReal && boundaries.matched.map(({ constituency: c, feature }, i) => {
                if (feature) return null;
                return (
                  <CircleMarker
                    key={`unmatched-${c.constituencyName}`}
                    center={[c.latitude, c.longitude]}
                    radius={8}
                    pathOptions={{ color: getColor(c), fillColor: getColor(c), fillOpacity: 0.85, weight: 1.5, opacity: 0.9, dashArray: '3 2' }}
                    eventHandlers={{ click: () => onSelectConstituency(c) }}
                  >
                    <Tip c={c} />
                  </CircleMarker>
                );
              })}

              {/* === VORONOI FALLBACK === */}
              {!useReal && viewMode === 'polygons' && voronoiPolys && plottable.map((c, i) => {
                const poly = voronoiPolys[i];
                if (!poly) return null;
                return (
                  <Polygon
                    key={`voro-${c.constituencyName}`}
                    positions={poly}
                    pathOptions={{
                      color: '#1a202c',
                      weight: 0.8,
                      opacity: 0.6,
                      fillColor: getColor(c),
                      fillOpacity: 0.78,
                    }}
                    eventHandlers={{
                      click: () => onSelectConstituency(c),
                      mouseover: (e) => e.target.setStyle({ weight: 2.5, opacity: 1, fillOpacity: 0.92, color: '#000' }),
                      mouseout:  (e) => e.target.setStyle({ weight: 0.8, opacity: 0.6, fillOpacity: 0.78, color: '#1a202c' }),
                    }}
                  >
                    <Tip c={c} />
                  </Polygon>
                );
              })}

              {/* === MARKERS === */}
              {viewMode === 'markers' && plottable.map(c => (
                <CircleMarker
                  key={`cm-${c.constituencyName}`}
                  center={[c.latitude, c.longitude]}
                  radius={getRadius(c)}
                  pathOptions={{
                    color: '#1a202c', weight: 1, opacity: 0.5,
                    fillColor: getColor(c), fillOpacity: 0.75,
                  }}
                  eventHandlers={{
                    click: () => onSelectConstituency(c),
                    mouseover: (e) => e.target.setStyle({ weight: 2.5, opacity: 1, fillOpacity: 0.95 }),
                    mouseout:  (e) => e.target.setStyle({ weight: 1, opacity: 0.5, fillOpacity: 0.75 }),
                  }}
                >
                  <Tip c={c} />
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        <div className="heatmap-sidebar">
          {colorMode === 'party' && (
            <div className="card">
              <div className="section-title">Party Legend</div>
              <div className="section-sub" style={{ marginBottom: 10 }}>{state}</div>
              <div className="party-legend-list">
                {parties.map(p => (
                  <div key={p.party} className="legend-item">
                    <span className="legend-swatch" style={{ background: p.color }} />
                    <span className="legend-party">{p.party}</span>
                    <span className="legend-count">{p.count}</span>
                  </div>
                ))}
                {parties.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No data</div>}
              </div>
            </div>
          )}

          {colorMode === 'margin' && (
            <div className="card">
              <div className="section-title">Margin Scale</div>
              <div className="section-sub" style={{ marginBottom: 10 }}>Winning margin</div>
              <ScaleSwatch swatches={[
                { c: '#1B5E20', l: '≥ 2L' },
                { c: '#2E7D32', l: '1L – 2L' },
                { c: '#388E3C', l: '50K – 1L' },
                { c: '#FFA000', l: '20K – 50K' },
                { c: '#D32F2F', l: '< 20K' },
              ]} />
            </div>
          )}

          {colorMode === 'turnout' && (
            <div className="card">
              <div className="section-title">Turnout Scale</div>
              <div className="section-sub" style={{ marginBottom: 10 }}>% of voters who polled</div>
              <ScaleSwatch swatches={[
                { c: '#1A237E', l: '≥ 75%' },
                { c: '#1565C0', l: '65 – 75%' },
                { c: '#1976D2', l: '55 – 65%' },
                { c: '#42A5F5', l: '45 – 55%' },
                { c: '#90CAF9', l: '< 45%' },
              ]} />
            </div>
          )}

          <div className="card">
            <div className="section-title">Quick Stats</div>
            <div className="hm-stats">
              <div className="stat-item"><span className="stat-label">Seats</span><span className="stat-value">{stats?.seats ?? 0}</span></div>
              <div className="stat-item"><span className="stat-label">Avg Turnout</span><span className="stat-value" style={{ color: 'var(--india-blue)' }}>{stats?.avgTurnout ?? '—'}%</span></div>
              <div className="stat-item"><span className="stat-label">Highest Margin</span><span className="stat-value" style={{ color: 'var(--india-green)' }}>{stats ? fmt(stats.highestMargin) : '—'}</span></div>
              <div className="stat-item"><span className="stat-label">Closest Contest</span><span className="stat-value" style={{ color: 'var(--sp)' }}>{stats ? fmt(stats.closestContest) : '—'}</span></div>
              <div className="stat-item"><span className="stat-label">Total Votes Cast</span><span className="stat-value">{stats ? fmt(stats.totalVotes) : '—'}</span></div>
            </div>
          </div>

          <div className="card heatmap-hint">
            <strong>Tip:</strong> {viewMode === 'polygons'
              ? <>Hover any region for details, click for full results.</>
              : <>Hover a marker for details, click for full results. Marker <em>size</em> reflects {sizeMode}, <em>colour</em> reflects {colorMode}.</>}
          </div>

          {viewMode === 'polygons' && (
            <details className="card heatmap-about">
              <summary>Data source &amp; method</summary>
              <p>
                Constituency boundaries come from{' '}
                <a href="https://github.com/HindustanTimesLabs/shapefiles" target="_blank" rel="noreferrer">HindustanTimesLabs/shapefiles</a>{' '}
                (MIT, scraped from the Election Commission of India for AC and PC) and{' '}
                <a href="https://github.com/datameet/maps" target="_blank" rel="noreferrer">DataMeet/maps</a>{' '}
                (CC-BY-SA 2.5 India, fallback for PC). Per-state files are downloaded once on first use and cached in your browser.
              </p>
              <p>
                When boundaries can't be fetched (offline / state not in the source), the map falls back
                to a <b>Voronoi tessellation</b> from each constituency's lat/lng centroid — an approximation
                that still reads as a state-shaped choropleth.
              </p>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
function FitBounds({ points, polygons }) {
  const map = useMap();
  const lastSig = useRef('');

  useEffect(() => {
    if (!points || !points.length) return;
    const sig = points.length + ':' + points[0].constituencyName + ':' + points[0].state + ':' + (polygons ? 'p' : 'm');
    if (sig === lastSig.current) return;
    lastSig.current = sig;

    let lats = points.map(p => p.latitude);
    let lngs = points.map(p => p.longitude);
    if (polygons && polygons.length) {
      for (const ring of polygons) {
        if (!ring || !ring.length) continue;
        for (const pt of ring) {
          if (Array.isArray(pt) && pt.length >= 2) { lats.push(pt[0]); lngs.push(pt[1]); }
        }
      }
    }
    if (!lats.length || !lngs.length) return;
    const bounds = [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]];
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
  }, [points, polygons, map]);

  return null;
}

function Tip({ c }) {
  return (
    <LTooltip direction="top" offset={[0, -4]} opacity={1} sticky className="heatmap-leaflet-tooltip">
      <div className="ht-leaflet-tt">
        <div className="ht-leaflet-tt-name">{c.constituencyName}</div>
        <div className="ht-leaflet-tt-row">
          <span className="party-dot" style={{ background: c.winner?.partyColor }} />
          <b>{c.winner?.party}</b> · {c.winner?.name}
        </div>
        <div className="ht-leaflet-tt-stats">
          <div><span>Votes</span><b>{fmt(c.winner?.votes || 0)}</b></div>
          <div><span>Margin</span><b>{fmt(c.winner?.margin || 0)}</b></div>
          <div><span>Share</span><b>{c.winner?.voteShare}%</b></div>
          <div><span>Turnout</span><b>{c.turnout?.toFixed(1)}%</b></div>
        </div>
        <div className="ht-leaflet-tt-hint">Click for full results →</div>
      </div>
    </LTooltip>
  );
}

function ControlGroup({ label, children }) {
  return (
    <div className="hm-control-group">
      <span className="heatmap-ctrl-label">{label}</span>
      <div className="hm-seg">{children}</div>
    </div>
  );
}

function SegBtn({ active, onClick, children }) {
  return <button className={`hm-seg-btn ${active ? 'active' : ''}`} onClick={onClick}>{children}</button>;
}

function ScaleSwatch({ swatches }) {
  return (
    <div className="hm-scale">
      {swatches.map((s, i) => (
        <div key={i} className="hm-scale-row">
          <span className="legend-swatch" style={{ background: s.c }} />
          <span className="legend-party">{s.l}</span>
        </div>
      ))}
    </div>
  );
}
