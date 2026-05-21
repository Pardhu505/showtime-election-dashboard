# Dataset Format Reference

This document lists every column header the upload endpoints accept, for all
three datasets. Use the matching template CSV in this folder as a starting
point — open it in Excel, replace the example rows with your data, and save
back as `.csv` (or `.xlsx`).

> **One CSV/XLSX = one election** for Lok Sabha and Assembly uploads. Submit
> separate files for separate (year, type, state) combinations, with the
> election context supplied as form fields at upload time.
>
> Caste uploads are the opposite — **one file can contain any number of
> states and districts**. The file *is* the dataset.

---

## 1) Lok Sabha Dataset

**Template:** `template_lok_sabha.csv`
**Endpoint:** `POST /api/upload/election`
**Goes to:** `loksabha_db.elections`

### Form fields (sent alongside the file)

| Field   | Required | Example         | Notes                          |
| ------- | -------- | --------------- | ------------------------------ |
| `year`  | yes      | `2024`          | Election year                  |
| `type`  | yes      | `Lok Sabha`     | **Must be exactly `Lok Sabha`** — this is how the backend routes to `loksabha_db` |
| `state` | yes      | `Uttar Pradesh` | Full state name                |
| `phase` | no       | `1`             | Polling phase if applicable    |

### Columns in the file (one row per **candidate**, multiple rows per constituency)

| Column                    | Required | Type    | Example          | Aliases accepted                          | Notes |
| ------------------------- | -------- | ------- | ---------------- | ----------------------------------------- | ----- |
| `Constituency Name`       | **yes**  | text    | `Varanasi`       | `constituency_name`, `CONSTITUENCY`       | Must repeat identically for every candidate in that seat |
| `Constituency Type`       | yes      | text    | `PC`             | `constituency_type`                       | Always `PC` for Lok Sabha |
| `Parliament Constituency` | no       | text    | *(leave blank)*  | `parent_constituency`                     | Used only for Assembly mapping — empty for PC files |
| `Total Voters`            | no       | int     | `1958835`        | `total_voters`                            | Eligible voters on the roll |
| `Total Votes Cast`        | no       | int     | `1399372`        | `total_votes_cast`                        | Auto-summed from candidate votes if omitted |
| `Turnout`                 | no       | decimal | `71.44`          | `turnout`                                 | Percentage (0–100); auto-computed if omitted |
| `Latitude`                | yes      | decimal | `25.3176`        | `lat`                                     | **Required** for the choropleth map |
| `Longitude`               | yes      | decimal | `82.9739`        | `lng`, `lon`                              | **Required** for the choropleth map |
| `Candidate Name`          | **yes**  | text    | `Narendra Modi`  | `candidate_name`, `CANDIDATE`             |       |
| `Party`                   | **yes**  | text    | `Bharatiya Janata Party` | `party`, `PARTY`                  | Full or short name — used as the legend label |
| `Party Abbr`              | yes      | text    | `BJP`            | `party_abbr`                              | 3-5 char code — used in tight UI spots |
| `Party Color`             | no       | hex     | `#FF6B00`        | `party_color`                             | Auto-filled from a built-in table for major parties |
| `Votes`                   | **yes**  | int     | `612000`         | `votes`, `VOTES`                          | Vote count for this candidate |
| `Vote Share`              | no       | decimal | `43.74`          | `vote_share`                              | Percentage (0–100); recomputed if missing |
| `Winner`                  | yes\*    | text    | `Yes` or `No`    | `winner`                                  | \*Either this OR a `Position` column with `1` for the winner |
| `Gender`                  | no       | text    | `M` or `F`       | `gender`                                  |       |
| `Age`                     | no       | int     | `73`             | `age`                                     |       |
| `Criminal Cases`          | no       | int     | `0`              | `criminal_cases`                          | Count of pending criminal cases declared in nomination affidavit |

### Example upload (curl)

```bash
curl -X POST http://localhost:5000/api/upload/election \
  -F "file=@up_lok_sabha_2024.csv" \
  -F "year=2024" \
  -F "type=Lok Sabha" \
  -F "state=Uttar Pradesh"
```

---

## 2) Assembly Dataset

**Template:** `template_assembly.csv`
**Endpoint:** `POST /api/upload/election` (same endpoint as Lok Sabha)
**Goes to:** `assembly_db.elections`

The file format is **identical** to the Lok Sabha one. Only differences:

- Set `Constituency Type` to `AC` for every row.
- Fill `Parliament Constituency` with the parent Lok Sabha seat name (used
  by the dashboard's "narrow down by PC" filter — leave blank if you don't
  have this mapping).
- Send `type=Assembly` as the form field at upload time.

### Form fields

| Field   | Required | Example         | Notes |
| ------- | -------- | --------------- | ----- |
| `year`  | yes      | `2023`          |       |
| `type`  | yes      | `Assembly`      | **Must be exactly `Assembly`** — routes to `assembly_db` |
| `state` | yes      | `Madhya Pradesh`|       |

### Example upload

```bash
curl -X POST http://localhost:5000/api/upload/election \
  -F "file=@mp_assembly_2023.csv" \
  -F "year=2023" \
  -F "type=Assembly" \
  -F "state=Madhya Pradesh"
```

---

## 3) Caste Dataset

**Template:** `template_caste.csv`
**Endpoint:** `POST /api/upload/caste`
**Goes to:** `caste_db.castes`

No form fields needed — the file itself contains the state/district info.
**One row per (state, district, caste) combination.**

### Columns

| Column          | Required | Type    | Example         | Aliases accepted                                                                                          |
| --------------- | -------- | ------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| `state`         | **yes**  | text    | `Uttar Pradesh` | `State`, `STATE`                                                                                          |
| `district`      | **yes**  | text    | `Lucknow`       | `District`, `DISTRICT`                                                                                    |
| `caste`         | **yes**  | text    | `Brahmin`       | `Caste`, `Caste Name`, `caste_name`, `CASTE`                                                              |
| `populationPct` | **yes**  | decimal | `14.2`          | `population_pct`, `Population%`, `Population (%)`, `Population`, `population%`, `population`              |

### Behaviour

- **Bulk-upsert by `(state, district, caste)`** — re-uploading the same row
  just updates the percentage. No duplicates.
- Rows missing any of the three identifying columns (`state`, `district`,
  `caste`) are silently skipped.
- `populationPct` doesn't have to sum to 100 per district — partial
  breakdowns work fine, but the dashboard's "total %" indicator will reflect
  whatever your numbers add up to.

### Example upload

```bash
curl -X POST http://localhost:5000/api/upload/caste \
  -F "file=@my_caste_data.xlsx"
```

Response:
```json
{
  "success": true,
  "inserted": 67,
  "updated": 5,
  "totalRows": 72,
  "message": "Saved 72 caste rows (67 new, 5 updated)."
}
```

---

## Tips for clean data

- **Spelling consistency.** The frontend matches constituencies to boundary
  polygons by name. Use the official ECI spelling
  (`Allahabad` vs `Prayagraj` — the matcher knows common aliases but exact
  matches are always best).
- **One state per election file.** The upload form treats each file as a
  single `(year, type, state)` triple, so don't mix states.
- **All candidates included.** Even fringe candidates with low votes — they
  shape the runner-up calculations and AI summary.
- **Lat/lng are required for the map.** Get them once per constituency from
  any geocoding service (Google, Nominatim) — the dashboard's choropleth
  fits the map bounds from these points.
- **Upload order doesn't matter.** Lok Sabha 2024 first or last, doesn't
  matter — the year filter is built from whatever's in the database.

---

## File formats supported

All three endpoints accept `.csv`, `.xlsx`, `.xls`, and `.json` files up to
50 MB. Use whatever's easiest:

- **CSV** — universal, easy to diff in git, biggest files.
- **XLSX** — keeps Excel formatting + multiple sheets (only the first sheet
  is read).
- **JSON** — programmatic exports; pass an array of objects with the same
  column names as keys.

---
