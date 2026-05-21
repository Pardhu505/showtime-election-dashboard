# ShowTime Consulting · Election Dashboard

Indian election results explorer with real ECI constituency boundaries,
party-level comparisons, AI-generated constituency analysis, and caste
demographics. Built on MongoDB Atlas + Node/Express + React.

---

## ⚠️ Security first

The `backend/.env` file in this zip contains a live MongoDB connection string.
Anyone with this zip has read/write access to your cluster.

1. **Rotate the password now**: MongoDB Atlas → Database Access → Edit user → reset password.
2. Open `backend/.env` and replace the `MONGO_URI` with the new connection string.
3. Never commit `backend/.env` to git — it's listed in `backend/.gitignore`.

---

## Architecture

Three logical databases on one MongoDB Atlas cluster:

| Database     | Collection   | Holds                                          |
| ------------ | ------------ | ---------------------------------------------- |
| `loksabha_db`| `elections`  | All Lok Sabha (PC) election records            |
| `assembly_db`| `elections`  | All Assembly (AC) election records             |
| `caste_db`   | `castes`     | `{state, district, caste, populationPct}` rows |

The backend opens a single connection to the cluster and uses
`mongoose.useDb()` to switch databases. Database names can be overridden
via environment variables (`DB_LOKSABHA` / `DB_ASSEMBLY` / `DB_CASTE`).

The frontend always tries the API first and falls back to bundled mock
data if Mongo is unreachable, so the dashboard never breaks.

---

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Confirm `.env` looks right (the seed and server both read from it):

```
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DB_LOKSABHA=loksabha_db
DB_ASSEMBLY=assembly_db
DB_CASTE=caste_db
PORT=5000
```

### 2. Seed the three databases

```bash
npm run seed
```

This reads the real election + caste data from `backend/seed_data/` and
upserts it into all three databases. The bundled data covers:

- **Lok Sabha** — 35 states/UTs × 2019 + 2024 (~9,000 candidate records)
- **Assembly** — 31 states × 2 most-recent election years each (~95,000
  candidate records, covering elections from 2014 through 2026)
- **Caste demographics** — 19 states, 538 districts, 7 caste/community
  categories (SC, ST, Muslim, Christian, Sikh, Buddhist, Jain) — ~3,700 rows

The seed is **re-runnable** — it upserts so existing rows are overwritten,
never duplicated. Expected runtime: 30–90 seconds on Atlas free tier.

Output looks like:

```
✅ Connected. Target databases: loksabha_db, assembly_db, caste_db

📥 Seeding 133 election files…
  Lok Sabha  | 2019 | Andhra Pradesh         | 25 seats   → loksabha_db
  Lok Sabha  | 2024 | Andhra Pradesh         | 25 seats   → loksabha_db
  Assembly   | 2019 | Andhra Pradesh         | 175 seats  → assembly_db
  Assembly   | 2024 | Andhra Pradesh         | 175 seats  → assembly_db
  ...
  Elections seeded in 47.3s — 13,652 constituencies, 102,431 candidate records.

📥 Seeding 3,684 caste rows…
  Caste seeded: 3,684 new, 0 updated.
```

### 3. Start the API

```bash
npm run dev    # nodemon, auto-reloads
# or
npm start
```

Health check: `http://localhost:5000/api/health` →

```json
{
  "status": "OK",
  "mode": "mongodb",
  "dbs": { "loksabha": "loksabha_db", "assembly": "assembly_db", "caste": "caste_db" }
}
```

### 4. Frontend

```bash
cd ../frontend
npm install
npm start
```

The dashboard runs on `http://localhost:3000` and talks to the API at
`http://localhost:5000`. The Caste Demographics section will show a green
`● Live from caste_db` badge once the backend is up.

---

## API reference

### Elections (auto-routes by `type=`)

| Method | Path                                          | Returns |
| ------ | --------------------------------------------- | ------- |
| GET    | `/api/elections/years`                        | Distinct years across both dbs |
| GET    | `/api/elections/states?year&type`             | Distinct states for that year+type |
| GET    | `/api/elections/constituencies?year&type&state&cType` | List of constituencies |
| GET    | `/api/elections/summary?year&type&state`      | Full election (party summary + all constituencies) |
| GET    | `/api/elections/constituency?year&type&state&name` | Single constituency detail |
| GET    | `/api/elections/heatmap?year&type&state`      | Compact heatmap payload |

`type` is `Lok Sabha` or `Assembly`. The router picks `loksabha_db` or
`assembly_db` automatically.

### Caste demographics

| Method | Path                                          | Returns |
| ------ | --------------------------------------------- | ------- |
| GET    | `/api/caste/states`                           | `[ "Uttar Pradesh", ... ]` |
| GET    | `/api/caste/districts?state=...`              | `[ "Lucknow", "Varanasi", ... ]` |
| GET    | `/api/caste/data?state=...&district=...`      | `[ {state, district, caste, populationPct}, ... ]` sorted desc |
| GET    | `/api/caste/all`                              | All rows (debug) |

### Uploads

| Method | Path                       | Body |
| ------ | -------------------------- | ---- |
| POST   | `/api/upload/election`     | multipart `file` + form fields `year`, `type`, `state` |
| POST   | `/api/upload/caste`        | multipart `file` only (CSV/XLSX/JSON) |

#### Caste upload format

CSV or XLSX with these columns (case-insensitive, several aliases accepted):

| Column          | Accepted names                                        |
| --------------- | ----------------------------------------------------- |
| State           | `state`, `State`, `STATE`                             |
| District        | `district`, `District`, `DISTRICT`                    |
| Caste / group   | `caste`, `Caste`, `Caste Name`, `CASTE`               |
| Population %    | `populationPct`, `Population (%)`, `Population%`, etc.|

Bulk-upserted by `(state, district, caste)` — re-uploading the same row
just updates the percentage.

#### Example with curl

```bash
curl -X POST http://localhost:5000/api/upload/caste \
  -F "file=@my-caste-data.xlsx"
```

---

## Notes

- The Caste Demographics section on the homepage always tries the backend
  first. If it can't reach `caste_db`, it falls back to the bundled sample
  in `frontend/src/data/casteData.js` and shows a small amber `Bundled
  sample` badge instead of the green `Live from caste_db` one.
- All three databases auto-create on first write — no manual setup needed
  in Atlas beyond the cluster + DB user.
- Indexes:
  - `elections`: unique on `(year, type, state)`
  - `castes`:    unique on `(state, district, caste)`

---
