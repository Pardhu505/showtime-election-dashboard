// =========================================================================
// casteData.js — sample caste demographics dataset.
//
// Source: a placeholder sample so the dashboard renders out of the box.
// REPLACE THIS with your real Excel data — the shape is exactly:
//
//   { state: string, district: string, caste: string, populationPct: number }
//
// You can convert your Excel sheet ("State, District, Caste Name, Population%")
// to this array by:
//   1. Save the Excel as CSV
//   2. Run `node scripts/csv-to-caste-data.js path/to/file.csv > out.js`
//   3. Replace the array below
// Or, drop the CSV in `frontend/public/data/caste.csv` and call
// `loadCasteCSV()` from CasteDataPanel — see the bottom of this file.
// =========================================================================

export const CASTE_DATA = [
  // Uttar Pradesh — Lucknow district
  { state: 'Uttar Pradesh', district: 'Lucknow',     caste: 'Brahmin',        populationPct: 14.2 },
  { state: 'Uttar Pradesh', district: 'Lucknow',     caste: 'Thakur (Rajput)', populationPct: 9.6 },
  { state: 'Uttar Pradesh', district: 'Lucknow',     caste: 'Yadav',          populationPct: 11.4 },
  { state: 'Uttar Pradesh', district: 'Lucknow',     caste: 'Kurmi',          populationPct: 5.8 },
  { state: 'Uttar Pradesh', district: 'Lucknow',     caste: 'Other OBC',      populationPct: 18.7 },
  { state: 'Uttar Pradesh', district: 'Lucknow',     caste: 'Jatav (SC)',     populationPct: 12.3 },
  { state: 'Uttar Pradesh', district: 'Lucknow',     caste: 'Other SC',       populationPct: 8.5 },
  { state: 'Uttar Pradesh', district: 'Lucknow',     caste: 'Muslim',         populationPct: 16.4 },
  { state: 'Uttar Pradesh', district: 'Lucknow',     caste: 'Others',         populationPct: 3.1 },

  // Uttar Pradesh — Varanasi district
  { state: 'Uttar Pradesh', district: 'Varanasi',    caste: 'Brahmin',        populationPct: 16.8 },
  { state: 'Uttar Pradesh', district: 'Varanasi',    caste: 'Thakur (Rajput)', populationPct: 7.4 },
  { state: 'Uttar Pradesh', district: 'Varanasi',    caste: 'Yadav',          populationPct: 10.9 },
  { state: 'Uttar Pradesh', district: 'Varanasi',    caste: 'Kurmi',          populationPct: 4.6 },
  { state: 'Uttar Pradesh', district: 'Varanasi',    caste: 'Patel/Kushwaha', populationPct: 6.2 },
  { state: 'Uttar Pradesh', district: 'Varanasi',    caste: 'Other OBC',      populationPct: 15.1 },
  { state: 'Uttar Pradesh', district: 'Varanasi',    caste: 'Jatav (SC)',     populationPct: 11.2 },
  { state: 'Uttar Pradesh', district: 'Varanasi',    caste: 'Other SC',       populationPct: 6.8 },
  { state: 'Uttar Pradesh', district: 'Varanasi',    caste: 'Muslim',         populationPct: 17.4 },
  { state: 'Uttar Pradesh', district: 'Varanasi',    caste: 'Others',         populationPct: 3.6 },

  // Uttar Pradesh — Agra district
  { state: 'Uttar Pradesh', district: 'Agra',        caste: 'Brahmin',        populationPct: 11.4 },
  { state: 'Uttar Pradesh', district: 'Agra',        caste: 'Thakur (Rajput)', populationPct: 10.2 },
  { state: 'Uttar Pradesh', district: 'Agra',        caste: 'Vaishya/Bania',  populationPct: 8.7 },
  { state: 'Uttar Pradesh', district: 'Agra',        caste: 'Yadav',          populationPct: 9.3 },
  { state: 'Uttar Pradesh', district: 'Agra',        caste: 'Other OBC',      populationPct: 17.8 },
  { state: 'Uttar Pradesh', district: 'Agra',        caste: 'Jatav (SC)',     populationPct: 19.5 },
  { state: 'Uttar Pradesh', district: 'Agra',        caste: 'Other SC',       populationPct: 7.1 },
  { state: 'Uttar Pradesh', district: 'Agra',        caste: 'Muslim',         populationPct: 12.4 },
  { state: 'Uttar Pradesh', district: 'Agra',        caste: 'Others',         populationPct: 3.6 },

  // Madhya Pradesh — Bhopal district
  { state: 'Madhya Pradesh', district: 'Bhopal',     caste: 'Brahmin',        populationPct: 8.4 },
  { state: 'Madhya Pradesh', district: 'Bhopal',     caste: 'Thakur (Rajput)', populationPct: 5.2 },
  { state: 'Madhya Pradesh', district: 'Bhopal',     caste: 'Vaishya',        populationPct: 6.1 },
  { state: 'Madhya Pradesh', district: 'Bhopal',     caste: 'OBC',            populationPct: 35.7 },
  { state: 'Madhya Pradesh', district: 'Bhopal',     caste: 'SC',             populationPct: 14.8 },
  { state: 'Madhya Pradesh', district: 'Bhopal',     caste: 'ST',             populationPct: 4.6 },
  { state: 'Madhya Pradesh', district: 'Bhopal',     caste: 'Muslim',         populationPct: 21.2 },
  { state: 'Madhya Pradesh', district: 'Bhopal',     caste: 'Others',         populationPct: 4.0 },

  // Madhya Pradesh — Indore district
  { state: 'Madhya Pradesh', district: 'Indore',     caste: 'Brahmin',        populationPct: 9.8 },
  { state: 'Madhya Pradesh', district: 'Indore',     caste: 'Vaishya',        populationPct: 10.6 },
  { state: 'Madhya Pradesh', district: 'Indore',     caste: 'Maratha',        populationPct: 5.2 },
  { state: 'Madhya Pradesh', district: 'Indore',     caste: 'OBC',            populationPct: 34.1 },
  { state: 'Madhya Pradesh', district: 'Indore',     caste: 'SC',             populationPct: 16.5 },
  { state: 'Madhya Pradesh', district: 'Indore',     caste: 'ST',             populationPct: 6.4 },
  { state: 'Madhya Pradesh', district: 'Indore',     caste: 'Muslim',         populationPct: 14.1 },
  { state: 'Madhya Pradesh', district: 'Indore',     caste: 'Others',         populationPct: 3.3 },

  // Maharashtra — Mumbai district
  { state: 'Maharashtra', district: 'Mumbai',        caste: 'Maratha',        populationPct: 32.4 },
  { state: 'Maharashtra', district: 'Mumbai',        caste: 'Brahmin',        populationPct: 4.1 },
  { state: 'Maharashtra', district: 'Mumbai',        caste: 'OBC',            populationPct: 18.6 },
  { state: 'Maharashtra', district: 'Mumbai',        caste: 'SC (Mahar/Buddhist)', populationPct: 13.8 },
  { state: 'Maharashtra', district: 'Mumbai',        caste: 'Other SC',       populationPct: 4.5 },
  { state: 'Maharashtra', district: 'Mumbai',        caste: 'ST',             populationPct: 2.7 },
  { state: 'Maharashtra', district: 'Mumbai',        caste: 'Muslim',         populationPct: 20.5 },
  { state: 'Maharashtra', district: 'Mumbai',        caste: 'Christian',      populationPct: 2.6 },
  { state: 'Maharashtra', district: 'Mumbai',        caste: 'Others',         populationPct: 0.8 },

  // Maharashtra — Pune district
  { state: 'Maharashtra', district: 'Pune',          caste: 'Maratha',        populationPct: 41.7 },
  { state: 'Maharashtra', district: 'Pune',          caste: 'Brahmin',        populationPct: 6.2 },
  { state: 'Maharashtra', district: 'Pune',          caste: 'OBC (Kunbi etc.)', populationPct: 17.8 },
  { state: 'Maharashtra', district: 'Pune',          caste: 'SC',             populationPct: 13.2 },
  { state: 'Maharashtra', district: 'Pune',          caste: 'ST',             populationPct: 3.4 },
  { state: 'Maharashtra', district: 'Pune',          caste: 'Muslim',         populationPct: 14.1 },
  { state: 'Maharashtra', district: 'Pune',          caste: 'Others',         populationPct: 3.6 },

  // Bihar — Patna district
  { state: 'Bihar', district: 'Patna',               caste: 'Bhumihar',       populationPct: 8.4 },
  { state: 'Bihar', district: 'Patna',               caste: 'Brahmin',        populationPct: 6.8 },
  { state: 'Bihar', district: 'Patna',               caste: 'Rajput',         populationPct: 5.1 },
  { state: 'Bihar', district: 'Patna',               caste: 'Kayastha',       populationPct: 2.8 },
  { state: 'Bihar', district: 'Patna',               caste: 'Yadav',          populationPct: 14.2 },
  { state: 'Bihar', district: 'Patna',               caste: 'Kurmi',          populationPct: 4.1 },
  { state: 'Bihar', district: 'Patna',               caste: 'Other OBC',      populationPct: 16.7 },
  { state: 'Bihar', district: 'Patna',               caste: 'Dusadh (SC)',    populationPct: 9.2 },
  { state: 'Bihar', district: 'Patna',               caste: 'Other SC',       populationPct: 11.6 },
  { state: 'Bihar', district: 'Patna',               caste: 'Muslim',         populationPct: 18.9 },
  { state: 'Bihar', district: 'Patna',               caste: 'Others',         populationPct: 2.2 },
];

// Caste-name → swatch colour. Falls back to a stable per-category colour.
export const CASTE_COLORS = {
  'Brahmin':              '#7c3aed',  // purple
  'Thakur (Rajput)':      '#dc2626',  // red
  'Rajput':               '#dc2626',
  'Bhumihar':             '#b91c1c',  // dark red
  'Kayastha':             '#9333ea',
  'Vaishya':              '#f59e0b',  // amber
  'Vaishya/Bania':        '#f59e0b',
  'Maratha':              '#FF6B00',  // saffron
  'Yadav':                '#16a34a',  // green
  'Kurmi':                '#65a30d',
  'Patel/Kushwaha':       '#84cc16',
  'OBC':                  '#22c55e',
  'OBC (Kunbi etc.)':     '#22c55e',
  'Other OBC':            '#10b981',
  'SC':                   '#1d4ed8',  // blue family
  'SC (Mahar/Buddhist)':  '#1e40af',
  'Jatav (SC)':           '#2563eb',
  'Dusadh (SC)':          '#3b82f6',
  'Other SC':             '#60a5fa',
  'ST':                   '#0891b2',  // teal
  'Muslim':               '#059669',  // emerald
  'Christian':            '#7c2d12',  // brown
  'Others':               '#94a3b8',  // grey
};

/**
 * Optional CSV loader — drop a CSV file at `public/data/caste.csv` with the
 * columns `state,district,caste,populationPct` (header row included) and
 * call this from your component to use it instead of CASTE_DATA.
 */
export async function loadCasteCSV(path = '/data/caste.csv') {
  const resp = await fetch(path);
  if (!resp.ok) throw new Error(`Failed to load caste CSV: ${resp.status}`);
  const text = await resp.text();
  const [header, ...rows] = text.trim().split(/\r?\n/);
  const cols = header.split(',').map(s => s.trim().toLowerCase());
  return rows.filter(Boolean).map(line => {
    const cells = line.split(',').map(s => s.trim());
    const rec = {};
    cols.forEach((c, i) => { rec[c] = cells[i]; });
    return {
      state: rec.state,
      district: rec.district,
      caste: rec.caste || rec['caste name'],
      populationPct: Number(rec.populationpct || rec['population%'] || rec['population (%)'] || 0),
    };
  });
}
