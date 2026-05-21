// =========================================================================
// alliances.js — buckets each party abbreviation into one of three groups:
//   NDA   — Bharatiya Janata Party-led National Democratic Alliance
//   INDIA — Indian National Developmental Inclusive Alliance (opposition)
//   OTHER — Regional / unaligned / case-specific
//
// Coverage is calibrated against the actual partyAbbr strings found in the
// bundled seed data (e.g. 'SHSUBT', 'NCPSP', 'AAAP', 'JD(U)', 'LJPRV').
// The classifier uppercases the input and *also* strips parentheses so that
// 'JD(U)' and 'JDU' both match. Unrecognised parties default to OTHER, so
// the map is conservative.
// =========================================================================

export const ALLIANCE_COLORS = {
  NDA:   '#FF6B00',
  INDIA: '#138808',
  OTHER: '#94a3b8',
  TIE:   '#fbbf24',
  NODATA:'#e2e8f0',
};

// All keys here are matched against the input AFTER:
//   - uppercase
//   - stripping anything that's not A-Z 0-9
const NDA_PARTIES = new Set([
  'BJP',                                  // Bharatiya Janata Party
  'JDU', 'JANATADAL(UNITED)',             // Janata Dal (United)
  'TDP', 'TELUGUDESAM',                   // Telugu Desam Party
  'SHS', 'SHIVSENA',                      // Shiv Sena (Shinde faction)
  'LJPRV', 'LJP',                         // Lok Janshakti Party (Ram Vilas)
  'NCP',                                  // NCP (Ajit Pawar faction shows up as plain NCP in 2024 data)
  'JNP', 'JANASENA', 'JSP',               // Jana Sena Party
  'RLD',                                  // Rashtriya Lok Dal (joined NDA 2024)
  'AGP',                                  // Asom Gana Parishad
  'AINRC',                                // All India NR Congress
  'NPP',                                  // National People's Party
  'NDPP',                                 // Nationalist Democratic Progressive Party
  'NPF',                                  // Naga People's Front
  'SDF',                                  // Sikkim Democratic Front
  'SKM',                                  // Sikkim Krantikari Morcha
  'BPF',                                  // Bodoland People's Front
  'UPPL',                                 // United People's Party Liberal
  'AD', 'ADS', 'APNADALSONELAL',          // Apna Dal (Sonelal)
  'AJSU', 'AJSUP',                        // All Jharkhand Students Union
  'HAM', 'HAMS', 'HAMSECULAR',            // Hindustani Awam Morcha (Secular)
  'PMK', 'PATTALIMAKKALKATCHI',           // Pattali Makkal Katchi
  'RPI', 'RPIA', 'RPIATHAWALE',           // Republican Party of India (Athawale)
  'JDS',                                  // Janata Dal (Secular) — entered NDA in 2024
  'IPFT',                                 // Indigenous People's Front of Tripura
  'TMCM',                                 // Tamil Maanila Congress (Moopanar)
  'NISHAD',                               // Nishad Party
  'SBSP',                                 // Suheldev Bharatiya Samaj Party
  'MGP',                                  // Maharashtrawadi Gomantak Party
  'NCPSCP',                               // NCP (Sharad Pawar) — NO, this is INDIA. Removed below
]);
NDA_PARTIES.delete('NCPSCP');             // guard against typo

const INDIA_PARTIES = new Set([
  'INC', 'CONG', 'CONGRESS',              // Indian National Congress
  'DMK',                                  // Dravida Munnetra Kazhagam
  'SP', 'SAMAJWADIPARTY',                 // Samajwadi Party
  'TMC', 'AITC', 'TRINAMOOLCONGRESS',     // All India Trinamool Congress
  'AAP', 'AAAP', 'AAMAADMIPARTY',         // Aam Aadmi Party (also seen as AAAP)
  'JMM',                                  // Jharkhand Mukti Morcha
  'RJD',                                  // Rashtriya Janata Dal
  'NCPSP', 'NCPSCP', 'NCPSHARADPAWAR',    // NCP (Sharad Pawar) — opposition
  'SHSUBT', 'SSUBT', 'UBT',               // Shiv Sena (UBT)
  'CPIM', 'CPM',                          // CPI(M)
  'CPI',                                  // Communist Party of India
  'CPIMLL', 'CPIML', 'CPIMLLIBERATION',   // CPI(ML)(L)
  'IUML', 'MUL',                          // Indian Union Muslim League
  'KCM', 'KECM',                          // Kerala Congress (M)
  'NC', 'JKN', 'JKNC',                    // Jammu & Kashmir National Conference
  'RSP',                                  // Revolutionary Socialist Party
  'AIFB', 'FORWARDBLOC',                  // All India Forward Bloc
  'MDMK',                                 // Marumalarchi Dravida Munnetra Kazhagam
  'VCK',                                  // Viduthalai Chiruthaigal Katchi
  'MMK',                                  // Manithaneya Makkal Katchi
  'PWPI', 'PWP',                          // Peasants and Workers Party of India
  'BAP',                                  // Bharat Adivasi Party
  'RLP',                                  // Rashtriya Loktantrik Party (became INDIA-leaning)
]);

const OTHER_PARTIES = new Set([
  'BJD', 'BIJUJANATADAL',                 // Biju Janata Dal — unaligned 2024
  'BSP', 'BAHUJANSAMAJPARTY',             // BSP
  'AIADMK',                               // All India ADMK — neither alliance in 2024
  'YSRCP',                                // YSR Congress Party
  'AIMIM', 'MIM',                         // AIMIM (Owaisi)
  'BRS', 'TRS',                           // Bharat Rashtra Samithi
  'JKPDP', 'PDP', 'PEOPLESDEMOCRATICPARTY', // PDP — withdrew from INDIA
  'AAGP',                                 // misc regional
  'ZPM',                                  // Zoram People's Movement — Mizoram non-aligned
  'IND', 'INDEPENDENT',
  'NOTA',
  'OTH', 'OTHERS',
]);

/**
 * Normalise a party abbreviation for set lookup. Uppercase, strip everything
 * non-alphanumeric (so "JD(U)" → "JDU", "CPI(M)" → "CPIM", "JnP" → "JNP",
 * "AAP-Aam Aadmi" → "AAPAAMAADMI"). Then check membership in each bucket.
 */
function normPartyKey(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function classifyParty(abbr) {
  if (!abbr) return 'OTHER';
  const k = normPartyKey(abbr);
  if (!k) return 'OTHER';
  if (NDA_PARTIES.has(k))   return 'NDA';
  if (INDIA_PARTIES.has(k)) return 'INDIA';
  if (OTHER_PARTIES.has(k)) return 'OTHER';
  return 'OTHER';
}

// ---- state-name canonicalisation (for matching GeoJSON → our data) -------

export const normStateKey = (s) =>
  String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');

/**
 * Pull the state name out of a GeoJSON feature's properties. The Highcharts
 * bundle uses the `name` key — but try a handful of common variants for
 * robustness if the file gets swapped later.
 */
export function readStateProp(props) {
  const candidates = ['name', 'NAME_1', 'name_1', 'ST_NM', 'st_nm', 'state', 'STATE', 'State', 'NAME'];
  for (const k of candidates) {
    if (props && props[k]) return String(props[k]).trim();
  }
  return '';
}
