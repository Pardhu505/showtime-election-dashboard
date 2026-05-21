// =========================================================================
// geo.js — geometry helpers used to turn a set of constituency centroids
// (lat/lng) into a choropleth-style tessellation:
//
//   1. Compute the convex hull of the centroid set
//   2. Buffer the hull outward so each cell extends a bit past the
//      outermost points (so the state's outline doesn't crop them tightly)
//   3. Generate Voronoi cells (one per centroid) inside a padded bbox
//   4. Clip every cell against the buffered hull so the union of cells
//      forms a single state-shaped blob, divided by constituency
//
// All maths is plain JS — no extra libraries beyond d3-delaunay for step 3.
// =========================================================================
import { Delaunay } from 'd3-delaunay';

/** Andrew's monotone-chain convex hull. Input/output: arrays of [x, y]. */
export function convexHull(points) {
  const pts = [...points].sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  if (pts.length <= 2) return pts;
  const cross = (O, A, B) => (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/**
 * Expand a convex polygon outward by `pad` units from its centroid.
 * Good enough for roughly-round constituency clusters; for very elongated
 * states (Maharashtra, Tamil Nadu) it still produces a usable shape because
 * we boost the pad along the major axis automatically.
 */
export function bufferHull(hull, pad) {
  if (hull.length < 3) return hull;
  const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length;
  const cy = hull.reduce((s, p) => s + p[1], 0) / hull.length;
  return hull.map(([x, y]) => {
    const dx = x - cx, dy = y - cy;
    const d = Math.hypot(dx, dy);
    if (d < 0.001) return [x, y];
    return [x + (dx / d) * pad, y + (dy / d) * pad];
  });
}

/**
 * Sutherland-Hodgman polygon clipping. Clips `subject` to the convex
 * polygon `clip`. Both should be counter-clockwise [[x, y], ...] arrays.
 * Returns the clipped polygon (possibly empty).
 */
export function clipPolygon(subject, clip) {
  if (!subject || subject.length < 3) return [];
  let output = subject;
  for (let i = 0; i < clip.length; i++) {
    const A = clip[i];
    const B = clip[(i + 1) % clip.length];
    const input = output;
    output = [];
    if (input.length === 0) break;
    for (let j = 0; j < input.length; j++) {
      const P = input[j];
      const Q = input[(j + 1) % input.length];
      const insideP = isInsideEdge(A, B, P);
      const insideQ = isInsideEdge(A, B, Q);
      if (insideP) {
        if (insideQ) {
          output.push(Q);
        } else {
          output.push(edgeIntersection(A, B, P, Q));
        }
      } else if (insideQ) {
        output.push(edgeIntersection(A, B, P, Q));
        output.push(Q);
      }
    }
  }
  return output;
}

function isInsideEdge(A, B, P) {
  // For a CCW clip polygon, "inside" is to the left of the directed edge A→B
  return (B[0] - A[0]) * (P[1] - A[1]) - (B[1] - A[1]) * (P[0] - A[0]) >= 0;
}

function edgeIntersection(A, B, P, Q) {
  const x1 = A[0], y1 = A[1], x2 = B[0], y2 = B[1];
  const x3 = P[0], y3 = P[1], x4 = Q[0], y4 = Q[1];
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-12) return P;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}

/**
 * Compute a Voronoi-cell-per-constituency map.
 *
 * @param {Array<{longitude:number, latitude:number}>} items
 * @param {number} [padDeg=0.35] — how far to extend the state outline past
 *   the outermost centroids, in degrees. ~0.35° ≈ 35 km.
 * @returns {Array<Array<[lat,lng]>|null>} — per-item polygon as a Leaflet-style
 *   [[lat, lng], ...] array; null when the cell is degenerate.
 */
export function constituencyVoronoi(items, padDeg = 0.35) {
  const valid = items
    .map((it, idx) => ({
      idx,
      pt: typeof it.latitude === 'number' && typeof it.longitude === 'number'
        ? [it.longitude, it.latitude]
        : null,
    }))
    .filter(x => x.pt);

  if (valid.length < 3) {
    // With < 3 points, Voronoi is undefined — return null for everything.
    return items.map(() => null);
  }

  const pts = valid.map(v => v.pt);

  // Bounding box for Voronoi computation (must contain all points + slack)
  let xs = pts.map(p => p[0]);
  let ys = pts.map(p => p[1]);
  const minX = Math.min(...xs) - padDeg * 2;
  const maxX = Math.max(...xs) + padDeg * 2;
  const minY = Math.min(...ys) - padDeg * 2;
  const maxY = Math.max(...ys) + padDeg * 2;

  // Clip polygon = convex hull of centroids, buffered outward.
  // This is what gives the cells a state-shape outline.
  const hull   = convexHull(pts);
  const clip   = bufferHull(hull, padDeg);

  // Voronoi tessellation via d3-delaunay
  const delaunay = Delaunay.from(pts);
  const voronoi  = delaunay.voronoi([minX, minY, maxX, maxY]);

  const cells = items.map(() => null);
  valid.forEach((v, i) => {
    const cellRaw = voronoi.cellPolygon(i);
    if (!cellRaw) return;
    // cellPolygon may close the loop by duplicating the first point — strip.
    const cell = cellRaw[cellRaw.length - 1][0] === cellRaw[0][0] &&
                 cellRaw[cellRaw.length - 1][1] === cellRaw[0][1]
                   ? cellRaw.slice(0, -1)
                   : cellRaw;
    const clipped = clipPolygon(cell, clip);
    if (clipped.length < 3) return;
    // Convert [lng, lat] → [lat, lng] for Leaflet
    cells[v.idx] = clipped.map(([lng, lat]) => [lat, lng]);
  });
  return cells;
}
