# SPEC: DataLens

This SPEC documents the product goals, scope, and acceptance criteria for DataLens — a generic CSV analytics dashboard web app — plus dataset-specific guidance for Dataset 10: Hotel Booking Demand (`data/hotel_booking.csv`). Follow this spec-driven process before writing implementation code.

---

## 1. Objective

- **What is DataLens?** DataLens is a lightweight, generic web application for uploading CSV files, profiling and cleaning the data, and interactively exploring it through dashboards and a conversational query interface.
- **Target user:** A data-savvy product manager or operations analyst at a small-to-medium organization who needs fast, exploratory analytics from CSV exports (persona: "Operations Analyst — familiar with spreadsheets, comfortable with simple filters and charts").
- **Success (high-level):** A user can upload a CSV (≤ 50MB), get an automated profile and cleaned dataset, view at least four interactive visualizations, and ask the system domain questions via chat and receive accurate, testable answers.

### User stories

- As an Operations Analyst, I want to upload a CSV and see an automated data profile so I can understand schema and issues quickly.
- As an Analyst, I want to filter and slice the dataset and see visualizations update interactively so I can explore patterns.
- As a Product Manager, I want to ask natural-language questions about the dataset and receive concise, supported answers so I can make decisions.
- As a Data Steward, I want deterministic cleaning rules (documented) so I can reproduce analytics reliably.

### Assumptions

1. Uploaded files are CSV and UTF-8 encoded (agent will detect and warn otherwise).
2. Dataset sizes for interactive use are typically under 50MB; larger files will be processed in batches or sampled.
3. The initial implementation targets single-user local use (no auth) and SQLite persistence.

---

## 2. Tech Stack (locked for this project)

- Frontend: React + Vite
- Styling: Tailwind CSS
- Charting: Recharts (preferred) or Plotly as a fallback (document ADR)
- Backend: FastAPI
- Data validation: Pydantic
- Python: 3.11+
- DB: SQLite for persistence during a session
- Data processing: pandas
- LLM provider: pluggable; default to an env-configured provider with function-call integration
- Testing: pytest (backend), Vitest (frontend)

---

## 3. Commands

The developer commands that must be kept up-to-date in README and CI:

- Setup (Python env, install deps): `python -m pip install -r requirements.txt` (or `pip install .` if using pyproject)
- Backend dev server: `uvicorn backend.app.main:app --reload --port 8000`
- Frontend dev server: `npm install && npm run dev` (run in `frontend/`)
- Run backend tests: `pytest backend/tests` (from repo root)
- Run frontend tests: `cd frontend && npm test` (Vitest)
- Lint/format (Python): `ruff check . && black .`
- Lint/format (frontend): `cd frontend && npm run lint && npm run format`
- Build production frontend: `cd frontend && npm run build`

Notes: Commands are examples — exact package manager commands should match project manifests (`pyproject.toml`, `package.json`).

---

## 4. Project Structure

Top-level layout (existing):

```
GETTING_STARTED.md
pyproject.toml
README.md
SPEC.md
backend/
  app/
  tests/
data/
  hotel_booking.csv
docs/
  report.md
  adrs/
frontend/
  src/
  tests/
tasks/
  plan.md
  todo.md
```

Implementation conventions:
- `backend/app/` — FastAPI app, routers, services, and pydantic models.
- `backend/tests/` — pytest tests for parsing, cleaning, profiling, and API endpoints.
- `frontend/src/` — React components, pages, hooks, and utilities.
- `data/` — ship seed CSVs for experiments (not secrets).
- `docs/adrs/` — record architectural decisions (e.g., charting library choice).

---

## 5. Code Style

- Python: `snake_case`, type hints required for public functions, format with `black`, lint with `ruff`.
- React/TypeScript: `camelCase` for variables and props, `PascalCase` for components, prefer functional components and hooks, use strict TypeScript settings when practical.
- Data models: Use Pydantic models to define the canonical dataset schema used by the backend.
- Commit style: Conventional commits recommended but not enforced.

Examples (kept in repo docs, do not implement yet):
- Pydantic model for a row sample (documented in docs, not yet code)

---

## 6. Testing Strategy

- Unit tests: data parsing, cleaning rules, profiling functions, utility functions.
- Integration tests: end-to-end CSV upload → cleaning → profile generation → analytics endpoints.
- Frontend tests: component rendering, interaction tests for filters and chart updates (Vitest + React Testing Library).
- Test data: use small fixtures in `backend/tests/fixtures/` derived from `data/hotel_booking.csv`.
- CI: run `pytest` and frontend tests on pull requests.

Coverage goals for MVP:
- Backend: key parsing/cleaning/profiling functions covered by unit tests (≥ 70% for changed modules).
- Frontend: critical components (upload, viz, chat) have smoke tests.

TDD discipline: For any non-trivial function, add a failing test first, then implement.

---

## 7. Boundaries

### Always do
- Run backend unit tests before merging changes that touch data processing.
- Document any data-cleaning rule changes in `SPEC.md` and an ADR if they are permanent.
- Use Pydantic validation for every data boundary crossing (API inputs/outputs).

### Ask first
- Adding new runtime dependencies (Python or JS).
- Changing the canonical dataset schema or persisting new fields to the DB.
- Modifying public API routes or response shapes.

### Never do
- Commit secrets, API keys, or `.env` containing secrets to the repository.
- Automatically delete original uploaded CSVs without explicit user consent.
- Perform irreversible destructive operations on production-like data without explicit sign-off.

---

## 8. Testable Success Criteria

These are the acceptance criteria for the MVP (must be verifiable with tests or manual checks):

1. A CSV upload endpoint accepts and validates a CSV and returns a profiling summary JSON (fields, types, missing counts).
2. Data cleaning rules (see section below) run deterministically and are covered by unit tests.
3. Dashboard shows at least four automatically-generated visualizations for a typical dataset (e.g., distribution, time series, top-k categories, correlation heatmap).
4. Chat interface answers the dataset-specific chat questions with sources and supporting numbers within 10 seconds for datasets ≤ 10MB on developer machine.
5. Tests for Hotel Booking Demand data (sample fixtures) cover cancellation-rate calculation, top-10 source markets, lead-time correlation, ADR by month, and repeat-guest rates.

---

## 9. Dataset-specific notes — Hotel Booking Demand (Dataset 10)

Location: `data/hotel_booking.csv` — this dataset tracks hotel reservations and includes arrival dates, stay length, ADR (average daily rate), market segment, country, and cancellation flags.

Key fields to surface in the profile:
- `hotel` (City Hotel / Resort Hotel)
- `is_canceled` (0/1)
- `lead_time` (days between booking and arrival)
- `arrival_date_year`, `arrival_date_month`, `arrival_date_day_of_month`
- `adults`, `children`, `babies` (occupancy)
- `adr` (average daily rate)
- `country` (country code)
- `market_segment`, `distribution_channel`, `is_repeated_guest`

Privacy: The dataset may contain privacy-sensitive columns (e.g., name, email, phone-number, credit_card). The app must ignore or drop these columns by default (see Data Cleaning Rules).

Analytics focus areas for the Hotel dataset (covered by tests and the chat interface):
- Overall cancellation rate and comparison between `City Hotel` and `Resort Hotel`.
- Top 10 source markets by booking count.
- Relationship between `lead_time` and cancellation probability (correlation / grouped analysis).
- Average daily rate (`adr`) aggregated by calendar month.
- Repeat guest rates by `market_segment`.

---

## 10. Data Cleaning Rules (must be implemented exactly as specified)

The following deterministic rules are required for analytics and must be unit-tested. They should be part of the backend data pipeline and run after schema detection and before profiling/analytics.

1. Fill missing `children` values with `0`.
2. Exclude rows where `adults + children + babies == 0` from analytical summaries and visualizations (these represent records with no guests). Keep such rows in raw data export but do not include in aggregated summaries.
3. `adr` (average daily rate) handling:
   - Treat negative `adr` values as invalid and set them to `NaN` for aggregation; log a warning in the profiling output with the count of negative values.
   - Treat extremely large `adr` values (greater than a configurable threshold, default 10,000) as outliers: flag them in the profile and exclude them from median/mean calculations unless the user explicitly toggles "include extreme ADRs".
4. `arrival_date_month` ordering: convert month names to a true calendar order (January → December) when producing time-series aggregations.
5. Privacy columns: ignore and do not load into the analytics schema any columns matching these case-insensitive patterns: `name`, `email`, `phone`, `phone-number`, `credit`, `credit_card`, `card_number`. The system should list ignored columns in the profiling report.

Implementation notes:
- All cleaning steps must be logged in the profiling output with counts of affected rows and columns.
- The default analytic dataset is the cleaned dataset (after steps above); raw uploads remain available for download.

---

## 11. Chat questions the system must answer (dataset-specific)

The chat / QA interface must be able to answer these questions for Hotel Booking Demand and provide supporting numbers/plots where appropriate:

1. What is the overall cancellation rate and how does it differ between City Hotel and Resort Hotel?
   - Return overall cancellation percent, cancellation percent for each hotel type, and counts used in the calculation.
2. Which countries are the top 10 source markets?
   - Return a ranked list with counts and percentages; support grouping by month or year if requested.
3. How does lead time correlate with cancellation probability?
   - Provide correlation estimate and a binned analysis (e.g., cancellation rate for lead_time buckets) and sample sizes per bucket.
4. What is the average daily rate by month?
   - Return monthly `adr` (mean and median), sample sizes, and a small time-series chart if possible; ensure months are ordered calendar-wise.
5. Which market segments have the highest repeat guest rates?
   - Return repeat-guest percent by `market_segment` sorted descending, with counts.

Chat answer requirements:
- Every answer must include the numeric values used (counts, percentages), the date range or filter applied, and a link or reference to the underlying aggregation (API route and parameters) so results are reproducible.

---

## 12. Notes on Generic CSV Support

- Design the pipeline so DataLens remains CSV-agnostic: schema detection, null inference, column-type heuristics, and a modular cleaning step list (dataset-specific rules should be configurable and applied only when matched by dataset or user selection).
- The Hotel Booking Demand rules above should be applied only when the dataset matches expected column names (case-insensitive) relevant to hotels; otherwise, fall back to generic profiling.

---

## Change log

- Spec version: 1.0 | Last updated: 2026-05-10 — updated with dataset-specific rules and chat questions for Dataset 10 (Hotel Booking Demand).

