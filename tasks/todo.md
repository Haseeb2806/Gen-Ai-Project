# Task Breakdown: DataLens Implementation

Each task is small (~5 files), has explicit acceptance criteria, and includes test verification steps. Tasks follow the thin vertical slice approach across 3 weeks.

---

## Phase 1: Foundation and Setup (Days 1–3)

### T001: Verify project setup and dependencies
- **Goal:** Confirm the starter template builds, Python and Node environments are correct, and empty test suites run.
- **Files:** None (verification only)
- **Acceptance criteria:**
  - `python --version` shows 3.11+
  - `node --version` shows 18+
  - `pytest --version` shows a working pytest installation
  - `npm --version` shows a working npm installation
  - `pytest` (with no tests) exits with code 0
  - `npm test` in `frontend/` (with no tests) exits with code 0
- **Tests:** Run both test commands and verify exit codes
- **Git commit:** `chore: verify development environment and dependencies`

---

### T002: Add backend health check endpoint
- **Goal:** Add a simple `/health` endpoint to the FastAPI app that returns status 200 and JSON.
- **Files:** `backend/app/main.py`, `backend/app/routers/health.py`, `backend/tests/test_health.py`
- **Acceptance criteria:**
  - GET `/health` returns 200 and JSON: `{"status": "ok"}`
  - Endpoint is documented in docstring
  - Unit test covers the endpoint
  - App runs with `uvicorn backend.app.main:app --reload` without errors
- **Tests:** `pytest backend/tests/test_health.py` passes
- **Git commit:** `feat: add health check endpoint to FastAPI app`

---

## Phase 2: Core Upload and Profiling (Days 4–6)

### T003: Design and implement CSV upload endpoint
- **Goal:** Create a FastAPI endpoint that accepts a CSV file (multipart), validates it, stores it on disk, and returns an upload ID.
- **Files:** `backend/app/routers/upload.py`, `backend/app/models/upload.py`, `backend/tests/test_upload.py`
- **Acceptance criteria:**
  - POST `/upload` accepts multipart CSV file (max 50MB)
  - Returns 200 and JSON: `{"upload_id": "uuid", "filename": "..."}`
  - Rejects non-CSV files with 400
  - Rejects files >50MB with 413
  - Pydantic model validates CSV structure (at least 1 row, 1 column)
  - Tests cover valid CSV, invalid file, size limit
- **Tests:** `pytest backend/tests/test_upload.py` passes (≥3 test cases)
- **Git commit:** `feat: add CSV upload endpoint with validation`

---

### T004: Set up SQLite persistence schema
- **Goal:** Create SQLite schema to persist uploaded datasets, profiles, and metadata; initialize DB connection in FastAPI.
- **Files:** `backend/app/db/models.py`, `backend/app/db/connection.py`, `backend/app/db/__init__.py`, `backend/tests/test_db.py`
- **Acceptance criteria:**
  - SQLite database file created at `data/datalens.db`
  - Tables: `uploads` (id, filename, upload_time, original_csv_path), `profiles` (upload_id, schema_json, stats_json, cleaning_log)
  - FastAPI app initializes DB on startup
  - DB connection is available to routers
  - Tests verify table creation and queries work
- **Tests:** `pytest backend/tests/test_db.py` passes (create, query, cleanup)
- **Git commit:** `feat: add SQLite schema and database initialization`

---

### T005: Implement CSV profiling logic
- **Goal:** Build a profiling service that analyzes uploaded CSV: detect column types, count nulls, compute basic stats, and return a profile object.
- **Files:** `backend/app/services/profiling.py`, `backend/tests/test_profiling.py`
- **Acceptance criteria:**
  - `profile_csv(csv_path)` returns: `{"columns": [...], "rows": N, "nulls": {...}, "stats": {...}}`
  - Column types detected: string, int, float, datetime, boolean
  - Null counts per column computed
  - Basic stats (min, max, mean, median) for numeric columns
  - Deterministic output (same CSV → same profile)
  - Tests cover various CSV structures (empty, 1 row, mixed types, all nulls)
- **Tests:** `pytest backend/tests/test_profiling.py` passes (≥5 test cases)
- **Git commit:** `feat: implement CSV profiling and type detection`

---

### T006: Build frontend CSV upload UI
- **Goal:** Create a React component with drag-drop or file picker for CSV upload; show upload progress and handle errors.
- **Files:** `frontend/src/components/UploadForm.tsx`, `frontend/src/hooks/useUpload.ts`, `frontend/tests/UploadForm.test.tsx`
- **Acceptance criteria:**
  - Drag-and-drop area for CSV files
  - File picker button as fallback
  - Progress indicator during upload
  - Error message display (file too large, invalid format)
  - On success, displays upload ID
  - Component is typed with TypeScript
  - Smoke test verifies component renders
- **Tests:** Vitest smoke test (component renders without crashing)
- **Git commit:** `feat: add frontend CSV upload component`

---

### T007: Display profile summary on frontend dashboard
- **Goal:** Create a React page that shows uploaded dataset profile: column names, types, nulls, and basic stats.
- **Files:** `frontend/src/components/ProfileSummary.tsx`, `frontend/src/pages/Dashboard.tsx`, `frontend/tests/ProfileSummary.test.tsx`
- **Acceptance criteria:**
  - After upload, dashboard displays a table: Column | Type | Nulls | Min | Max | Mean
  - Profile fetched from backend `/profile/{upload_id}` endpoint
  - Loading state shown while fetching
  - Error handling for missing upload
  - Responsive table layout
  - Smoke test verifies component renders
- **Tests:** Vitest smoke test
- **Git commit:** `feat: add profile display on dashboard`

---

## Phase 3: Dashboard Visualizations (Days 7–9)

### T008: Implement chart type recommendation logic
- **Goal:** Build a backend service that recommends 4–6 chart types based on dataset profile (e.g., categorical → bar, datetime → line, numeric pairs → scatter).
- **Files:** `backend/app/services/chart_selection.py`, `backend/tests/test_chart_selection.py`
- **Acceptance criteria:**
  - Function `recommend_charts(profile) → List[ChartRecommendation]` returns up to 6 chart specs
  - Categorical columns (cardinality <50) → bar chart
  - Temporal columns → line chart
  - Numeric pairs → scatter plot
  - Numeric distributions → histogram
  - Heatmap for correlation matrix (if multiple numeric columns)
  - Deterministic: same profile → same recommendations
  - Tests cover various column-type combinations
- **Tests:** `pytest backend/tests/test_chart_selection.py` passes (≥5 test cases)
- **Git commit:** `feat: implement chart recommendation engine`

---

### T009: Build generic chart components in React
- **Goal:** Create reusable React components for each chart type (bar, line, scatter, histogram, heatmap) using Recharts.
- **Files:** `frontend/src/components/BarChart.tsx`, `frontend/src/components/LineChart.tsx`, `frontend/src/components/ScatterChart.tsx`, `frontend/src/components/Heatmap.tsx`, `frontend/tests/ChartComponents.test.tsx`
- **Acceptance criteria:**
  - Each component accepts `data` and `config` props
  - Responsive to container size (CSS Grid/Flex)
  - Loads data from backend API
  - Smoke tests verify each component renders
  - TypeScript strict mode enabled
  - Consistent styling (Tailwind CSS)
- **Tests:** Vitest smoke tests (each component renders)
- **Git commit:** `feat: add generic Recharts components`

---

### T010: Integrate visualizations into dashboard
- **Goal:** Wire up the dashboard to fetch chart recommendations, fetch data for each chart, and render all charts on the page after CSV upload.
- **Files:** `frontend/src/pages/Dashboard.tsx`, `frontend/src/hooks/useCharts.ts`, `backend/app/routers/charts.py`
- **Acceptance criteria:**
  - After upload completes, dashboard calls `/charts/recommend/{upload_id}`
  - For each chart rec, fetches aggregated data from `/charts/data/{upload_id}/{chart_id}`
  - Dashboard renders 4–6 charts in a responsive grid
  - Loading state shown while fetching
  - Error handling for missing data
- **Tests:** Vitest integration test (mock API, verify dashboard renders charts)
- **Git commit:** `feat: integrate chart recommendations into dashboard`

---

## Phase 4: Global Filters (Days 10–11)

### T011: Build filter UI components
- **Goal:** Create React filter components (dropdowns for categorical, sliders for numeric, date pickers for temporal) and layout them in a sidebar.
- **Files:** `frontend/src/components/FilterSidebar.tsx`, `frontend/src/components/FilterDropdown.tsx`, `frontend/src/components/FilterSlider.tsx`, `frontend/tests/FilterSidebar.test.tsx`
- **Acceptance criteria:**
  - Sidebar displays filters based on dataset profile
  - Categorical: dropdown with distinct values
  - Numeric: range slider (min–max)
  - Temporal: date picker (start–end)
  - "Clear all filters" button
  - Responsive design (collapses on mobile)
  - Smoke tests verify components render
- **Tests:** Vitest smoke tests
- **Git commit:** `feat: add filter UI components`

---

### T012: Implement filter state and backend logic
- **Goal:** Manage filter state across the dashboard; implement backend endpoint to apply filters to analytics queries and update charts.
- **Files:** `frontend/src/hooks/useFilters.ts`, `frontend/src/pages/Dashboard.tsx`, `backend/app/routers/filters.py`, `backend/tests/test_filters.py`
- **Acceptance criteria:**
  - React Context or similar manages global filter state
  - Filters trigger re-fetch of chart data from backend
  - Backend `/data/{upload_id}?filters=...` endpoint applies filters
  - Charts update within 500ms of filter change (responsive)
  - Tests verify filter application and chart data updates
- **Tests:** `pytest backend/tests/test_filters.py` passes; Vitest integration test (filters update charts)
- **Git commit:** `feat: implement global filters and state management`

---

## Phase 5: Hotel Booking Cleaning Rules (Days 12)

### T013: Implement Hotel Booking Demand data cleaning rules
- **Goal:** Add deterministic, hotel-specific cleaning rules to the profiling pipeline: fill children nulls, exclude no-guest rows, handle negative ADR, order months, drop privacy columns.
- **Files:** `backend/app/services/cleaning.py`, `backend/app/services/hotel_rules.py`, `backend/tests/test_cleaning.py`, `backend/tests/test_hotel_rules.py`
- **Acceptance criteria:**
  - Function `clean_hotel_booking_data(df) → (cleaned_df, cleaning_log)` applies all 5 rules
  - Rule 1: Fill `children` NaN with 0
  - Rule 2: Mark rows where occupancy=0 but keep them; exclude from analytics
  - Rule 3: Negative ADR → NaN; extreme ADR (>10k) flagged
  - Rule 4: Month names ordered calendar-wise in aggregations
  - Rule 5: Privacy columns (name, email, phone, credit_card, etc.) dropped, logged
  - Cleaning log includes counts of affected rows per rule
  - Generic fallback if dataset is not Hotel Booking (or user uploads different CSV)
  - Tests cover each rule independently; integration test covers full pipeline
- **Tests:** `pytest backend/tests/test_cleaning.py && pytest backend/tests/test_hotel_rules.py` pass (≥10 test cases total)
- **Git commit:** `feat: add Hotel Booking Demand data cleaning rules and logging`

---

## Phase 6: LLM Chat Interface (Days 13–15)

### T014: Implement Hotel Booking–specific analytics tools
- **Goal:** Build backend functions that answer the 5 required Hotel Booking questions; these functions will be exposed as LLM tools.
- **Files:** `backend/app/services/hotel_analytics.py`, `backend/tests/test_hotel_analytics.py`
- **Acceptance criteria:**
  - Function `get_cancellation_rate(df) → {overall: %, by_hotel_type: {...}}`
  - Function `get_top_markets(df, n=10) → List[{country, count, pct}]`
  - Function `get_lead_time_correlation(df) → {correlation: float, binned_rates: [...], sample_sizes: [...]}`
  - Function `get_adr_by_month(df) → List[{month, mean, median, n}]`
  - Function `get_repeat_guest_rates(df) → List[{segment, repeat_pct, n}]`
  - Each function returns structured data with counts and methodology
  - Unit tests verify calculations against fixture data
- **Tests:** `pytest backend/tests/test_hotel_analytics.py` passes (≥5 test cases)
- **Git commit:** `feat: implement Hotel Booking analytics functions for chat`

---

### T015: Build LLM backend integration and tool-calling setup
- **Goal:** Create a pluggable LLM provider abstraction; implement tool-calling so the LLM can invoke hotel analytics functions.
- **Files:** `backend/app/services/llm_provider.py`, `backend/app/services/llm_tools.py`, `backend/app/routers/chat.py`, `backend/tests/test_llm_integration.py`
- **Acceptance criteria:**
  - LLM provider interface supports Gemini, Claude, Groq, OpenAI (configurable via env)
  - Tool definitions registered (functions from T014)
  - POST `/chat` endpoint accepts user message and upload_id
  - LLM receives user query + available tools + dataset context
  - LLM can call tools and return structured response with data and methodology
  - Response includes: answer, supporting data, and tool call details
  - Error handling for LLM failures, API rate limits, tool execution errors
  - Tests mock LLM responses and verify tool invocation
- **Tests:** `pytest backend/tests/test_llm_integration.py` passes (mocked LLM calls)
- **Git commit:** `feat: implement LLM tool-calling for hotel analytics`

---

### T016: Build chat interface frontend
- **Goal:** Create a React chat component with message history, user input, and LLM responses; display data and sources.
- **Files:** `frontend/src/components/ChatInterface.tsx`, `frontend/src/hooks/useChat.ts`, `frontend/tests/ChatInterface.test.tsx`
- **Acceptance criteria:**
  - Chat messages display in a scrollable list (user left, bot right)
  - User input field with send button
  - Loading indicator while waiting for response
  - Responses include data tables or charts (data grounding)
  - Source link or reference to underlying query
  - Error messages for failed requests
  - Smoke tests verify component renders
- **Tests:** Vitest smoke test and basic interaction test
- **Git commit:** `feat: add chat interface frontend component`

---

## Phase 7: Executive Summary and Polish (Days 16–18)

### T017: Implement executive summary generation
- **Goal:** Build a backend endpoint that generates a narrative summary of the dataset using the LLM; tone: business-analyst-friendly, concise, data-grounded.
- **Files:** `backend/app/services/summary_generation.py`, `backend/app/routers/summary.py`, `backend/tests/test_summary.py`
- **Acceptance criteria:**
  - GET `/summary/{upload_id}` returns JSON: `{"summary": "narrative text", "key_findings": [...]}`
  - Summary includes: dataset size, key statistics, top categories, outliers, data quality notes
  - For Hotel Booking: mentions cancellation rate, top markets, ADR trends
  - Summary is under 500 words
  - Tone is professional and actionable
  - Tests verify summary generation and content structure
- **Tests:** `pytest backend/tests/test_summary.py` passes
- **Git commit:** `feat: implement executive summary generation`

---

### T018: Display executive summary on frontend
- **Goal:** Create a React component to display the generated summary; style it professionally.
- **Files:** `frontend/src/components/ExecutiveSummary.tsx`, `frontend/src/pages/Dashboard.tsx`, `frontend/tests/ExecutiveSummary.test.tsx`
- **Acceptance criteria:**
  - Summary displays prominently on dashboard (above or beside charts)
  - Fetches from `/summary/{upload_id}` on dashboard load
  - Key findings displayed as bullet points or cards
  - Loading state while fetching
  - Responsive layout (stacks on mobile)
  - Smoke test verifies component renders
- **Tests:** Vitest smoke test
- **Git commit:** `feat: add executive summary display to dashboard`

---

## Phase 8: Testing and Documentation (Days 19–21)

### T019: Write comprehensive backend pytest tests
- **Goal:** Add pytest test suite for all backend modules: upload, profiling, filtering, cleaning, hotel analytics, LLM integration, summary generation.
- **Files:** `backend/tests/` (all test files created in earlier tasks; consolidate and add missing coverage)
- **Acceptance criteria:**
  - Unit tests for each service (profiling, cleaning, chart selection, hotel analytics, summary)
  - Integration tests: CSV upload → profiling → cleaning → analytics flow
  - Fixture data: `backend/tests/fixtures/sample_hotel.csv`, `backend/tests/fixtures/generic.csv`
  - Test utilities for mocking LLM, DB
  - Coverage ≥70% for backend/app/services/
  - All tests pass: `pytest backend/tests` without warnings
- **Tests:** `pytest backend/tests --cov=backend/app/services --cov-report=term-missing` shows ≥70%
- **Git commit:** `test: add comprehensive pytest backend test suite`

---

### T020: Write comprehensive frontend Vitest tests
- **Goal:** Add Vitest test suite for React components: upload, profile, charts, filters, chat, summary.
- **Files:** `frontend/tests/` (all test files; consolidate and add missing coverage)
- **Acceptance criteria:**
  - Smoke tests for all components (render without crashing)
  - Interaction tests: filters update, chart click handlers, chat send
  - API mocking: mock fetch calls to backend
  - Snapshot tests for complex components (optional but helpful)
  - All tests pass: `npm test` (Vitest) in frontend/ without warnings
- **Tests:** `npm test -- --coverage` in frontend/ shows tests passing
- **Git commit:** `test: add comprehensive Vitest frontend test suite`

---

### T021: Write 3 Architecture Decision Records (ADRs)
- **Goal:** Document 3 key architectural decisions in `docs/adrs/` using the template format.
- **Files:** `docs/adrs/001-*.md`, `docs/adrs/002-*.md`, `docs/adrs/003-*.md`
- **Suggested ADRs:**
  - **ADR-001:** Chart Library Choice (Recharts vs. Plotly) — rationale, tradeoffs, alternatives
  - **ADR-002:** LLM Provider Abstraction and Tool-Calling Pattern — pluggability, function schema, error handling
  - **ADR-003:** Filter State Management (React Context vs. Redux vs. URL params) — scalability, testing, debugging
- **Acceptance criteria:**
  - Each ADR follows the template: Title, Status, Context, Decision, Consequences, Alternatives
  - Clear rationale for choice
  - Tradeoffs documented
  - Reviewable by partner
- **Tests:** Markdown linting (optional: check for broken links, spelling)
- **Git commit:** `docs: add 3 ADRs documenting architecture decisions`

---

### T022: Complete README with setup and usage
- **Goal:** Write a comprehensive README covering project purpose, prerequisites, setup, commands, usage examples, and troubleshooting.
- **Files:** `README.md`
- **Acceptance criteria:**
  - Team and dataset info filled in
  - Prerequisites: Python 3.11+, Node 18+, uv, Git, LLM API key
  - Step-by-step setup: clone, install, env config
  - Commands: backend dev, frontend dev, tests, build
  - Usage example: upload a CSV, filter, chat, see summary
  - Troubleshooting section (common errors)
  - Link to SPEC.md for detailed requirements
  - Link to ADRs for architecture
  - Quality: professional, clear, no TODOs
- **Tests:** Manual test: follow README on a clean machine; app runs
- **Git commit:** `docs: complete README with setup and usage guide`

---

### T023: Write final project report
- **Goal:** Reflect on the project: what was built, what worked, what didn't, lessons learned, and recommendations for future work.
- **Files:** `docs/report.md`
- **Acceptance criteria:**
  - Summary of what was built (features, lines of code, test coverage)
  - Wins: what went well and why
  - Challenges: what was hard and how we overcame it
  - Lessons learned: insights about data engineering, full-stack dev, testing, LLM integration
  - Recommendations: if we had 2 more weeks, what's next?
  - Reflection on spec-driven development process
  - Length: 500–1000 words
- **Tests:** Peer review for clarity and reflection depth
- **Git commit:** `docs: write final project report`

---

### T024: Prepare and execute final demo
- **Goal:** Create a demo checklist; execute the demo; verify all features work end-to-end on a fresh machine or environment.
- **Files:** `docs/demo_checklist.md` (document the checklist), terminal execution
- **Acceptance criteria:**
  - Demo checklist includes all 5 Hotel Booking chat questions
  - Checklist items: upload CSV, filter, view charts, ask questions, get summary
  - Execute demo on fresh environment (or at least restart app fresh)
  - All features work without errors
  - Demo completes in under 5 minutes
  - Screenshots or recording captured (optional but encouraged)
  - Classmate can follow and use the app
- **Tests:** Live demo execution; peer feedback
- **Git commit:** `docs: add demo checklist and final verification`

---

## Summary

- **Total tasks:** 24
- **Estimated duration:** 3 weeks (21 days)
- **Phase breakdown:**
  - Phase 1 (Foundation): 2 tasks (1 day)
  - Phase 2 (Upload & Profiling): 5 tasks (3 days)
  - Phase 3 (Visualizations): 3 tasks (3 days)
  - Phase 4 (Filters): 2 tasks (2 days)
  - Phase 5 (Hotel Cleaning): 1 task (1 day)
  - Phase 6 (Chat): 3 tasks (3 days)
  - Phase 7 (Summary): 2 tasks (2 days)
  - Phase 8 (Tests & Docs): 6 tasks (6 days)
- **Key success metrics:** All tasks complete with acceptance criteria met; ≥70% backend test coverage; app works on clean machine; Hotel Booking chat answers all 5 questions correctly

---

### Phase 4: Global Filters

[TODO]

---

### Phase 5: LLM Chat Interface

[TODO]

---

### Phase 6: Executive Summary

[TODO]

---

### Phase 7: Polish and Documentation

- [ ] **T090:** Complete README with actual setup steps
  - **Description:** Replace all `[TODO]` placeholders in README
  - **Acceptance:** Classmate can clone and run the app using only README
  - **Verify:** Clean-clone dry run on a different machine
  - **Files:** README.md
  - **Dependencies:** All previous tasks

- [ ] **T091:** Write ADR-001: [Your first architectural decision]
  - **Description:** [e.g., How we store arbitrary CSVs in SQLite]
  - **Acceptance:** ADR covers Context, Options, Decision, Trade-offs
  - **Verify:** Partner review
  - **Files:** docs/adrs/001-*.md
  - **Dependencies:** [Task where the decision was actually made]

- [ ] **T092:** Write ADR-002
- [ ] **T093:** Write ADR-003
- [ ] **T094:** Write final report (docs/report.md)
- [ ] **T095:** Dry-run setup on clean machine
- [ ] **T096:** Record mid-project video (Day 14)
- [ ] **T097:** Prepare for live demo

---

## Task Sizing Discipline

Re-check before committing to this list:

- [ ] Every task touches 5 or fewer files
- [ ] Every task has acceptance criteria that can be tested
- [ ] Every task has a specific verification step (not just "looks right")
- [ ] No task requires more than one focused session to complete
- [ ] Dependencies are explicit and the order is correct

If any task fails these checks, break it down further. It is almost always better to have more, smaller tasks than fewer, larger ones.

---

*Task breakdown version: 1.0 | Last updated: [date]*
