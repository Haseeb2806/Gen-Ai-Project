# Implementation Plan: DataLens with Hotel Booking Demand Dataset

**Build Strategy:** We will build DataLens in thin vertical slices across 3 weeks. Each slice is end-to-end and shippable: (1) Verify setup and add a health check, (2) Add CSV upload and basic profiling, (3) Build a generic dashboard with auto-generated charts, (4) Add global filters, (5) Integrate LLM-based chat with Hotel Booking domain queries, (6) Generate executive summaries, and (7) Complete tests, docs, and ADRs. The app remains CSV-agnostic but includes Hotel Booking Demand–specific cleaning rules and analytics. We estimate 20 focused tasks across Phases 1–7, each touching ≤5 files.

---

## Major Phases and Milestones

### Phase 1: Foundation and Setup (Days 1–3)

**Goal:** Spec complete, environment verified, scaffolding ready.

- ✓ SPEC.md complete with Dataset 10 (Hotel Booking Demand) requirements
- ✓ plan.md and todo.md complete with task breakdown
- Verify that `pytest` and `vitest` run empty test suites successfully
- Add backend health check endpoint and verify it works
- **Checkpoint:** Agent can run tests, push commits, and the app has a `/health` endpoint returning 200.

**Tasks:** T001 (setup verification), T002 (health check endpoint)

---

### Phase 2: Core Upload and Profiling (Days 4–6)

**Goal:** Users can upload a CSV and see automated profiling results.

- CSV upload endpoint (multipart, max 50MB, Pydantic validation)
- SQLite schema for persisting datasets
- Data profiling logic: detect types, calculate nulls, compute basic statistics
- Frontend upload UI (drag-drop, file picker)
- Profile summary display (schema, stats, data quality)
- **Checkpoint:** Upload `data/hotel_booking.csv`, see profile on dashboard with column stats and null counts.

**Tasks:** T003 (upload endpoint), T004 (SQLite setup), T005 (profiling logic), T006 (frontend upload UI), T007 (profile display)

---

### Phase 3: Dashboard Visualizations (Days 7–9)

**Goal:** Dashboard renders 4–6 interactive, auto-selected charts from any CSV.

- Chart type recommendation logic based on column types (e.g., categorical → bar, datetime → line, numeric pairs → scatter)
- Build React chart components using Recharts
- Auto-generate visualizations on upload completion
- Ensure generic behavior works with any CSV, not just Hotel Booking Demand
- **Checkpoint:** Upload a CSV; dashboard auto-shows 4–6 meaningful charts without manual configuration.

**Tasks:** T008 (chart recommendation logic), T009 (chart components), T010 (dashboard integration)

---

### Phase 4: Global Filters (Days 10–11)

**Goal:** Filters update all visualizations in real time.

- Filter UI (dropdowns for categorical, sliders for numeric, date pickers for temporal)
- Shared React state management for filters
- Backend filter endpoint(s) to apply filters to analytics queries
- All charts respond to filter changes instantly
- **Checkpoint:** Change a filter (e.g., select "City Hotel" only); all charts update synchronously.

**Tasks:** T011 (filter UI components), T012 (filter state and backend logic)

---

### Phase 5: Hotel Booking Cleaning Rules (Days 12)

**Goal:** Implement dataset-specific cleaning and analytics rules for Hotel Booking Demand.

- Implement deterministic cleaning rules (fill missing children with 0, exclude no-guest rows, handle negative ADR, order months correctly, drop privacy columns)
- Add logging of cleaning steps in profiling output
- Unit tests for each cleaning rule
- Ensure generic pipeline still works for other CSVs
- **Checkpoint:** After upload and cleaning, profiling output shows cleanliness metrics and counts of rows affected by each rule.

**Tasks:** T013 (Hotel Booking cleaning rules and tests)

---

### Phase 6: LLM Chat Interface (Days 13–15)

**Goal:** Users ask natural-language questions and get data-grounded answers.

- Backend tool-calling setup: expose query functions (e.g., `get_cancellation_rate`, `top_markets`, `correlation_analysis`) as LLM tools
- LLM provider abstraction layer (pluggable: Gemini, Claude, Groq, etc.)
- Chat endpoint that receives user questions and returns LLM responses with data grounding
- Frontend chat UI (message history, input field, loading states)
- Implement Hotel Booking–specific chat tools: answer the 5 required questions (cancellation rates, top markets, lead-time correlation, ADR by month, repeat guest rates)
- **Checkpoint:** Ask "What is the cancellation rate?" and receive a numeric answer with methodology.

**Tasks:** T014 (Hotel Booking analytics tools), T015 (LLM backend integration), T016 (chat frontend UI)

---

### Phase 7: Executive Summary and Polish (Days 16–18)

**Goal:** Auto-generate narrative summaries; polish the app.

- Executive summary generation endpoint (LLM-powered, uses profiling and analytics)
- Frontend summary display
- Bug fixes from user feedback
- UI polish and responsiveness
- **Checkpoint:** Upload dataset; see a business-friendly narrative summary describing key insights.

**Tasks:** T017 (executive summary generation), T018 (summary frontend display)

---

### Phase 8: Testing and Documentation (Days 19–21)

**Goal:** Complete test coverage, ADRs, README, and final report.

- Backend pytest suite (data parsing, cleaning, profiling, analytics endpoints, chat tools)
- Frontend Vitest suite (upload UI, chart rendering, filter interactions, chat messages)
- Write 3 ADRs (e.g., charting library choice, LLM provider selection, filter state management)
- Complete README with setup, commands, and usage examples
- Write final docs/report.md reflection
- Prepare and execute final demo
- **Checkpoint:** A classmate can clone the repo, follow README, and run the app without help.

**Tasks:** T019 (pytest backend tests), T020 (Vitest frontend tests), T021 (ADRs), T022 (README), T023 (report), T024 (demo checklist)

---

## Implementation Strategy: Thin Vertical Slice Approach

**Slice 1 (Health Check):** Endpoint works, basic test passes.
- **T001, T002:** Verify setup and add `/health` endpoint.
- **Time:** ~1 hour.

**Slice 2 (Upload & Profile):** User uploads CSV → sees profile stats on dashboard.
- **T003–T007:** Upload endpoint, DB, profiling logic, frontend UI.
- **Time:** ~6 hours. **Shippable:** Yes — the app runs and displays data.

**Slice 3 (Visualizations):** Charts auto-generate from uploaded data.
- **T008–T010:** Chart logic, components, dashboard integration.
- **Time:** ~4 hours. **Shippable:** Yes — the app is useful for exploratory analysis.

**Slice 4 (Filters):** Filters update all charts in real time.
- **T011–T012:** Filter UI, state, backend.
- **Time:** ~3 hours. **Shippable:** Yes — the app supports interactive drill-down.

**Slice 5 (Hotel Rules + Chat):** Hotel Booking–specific cleaning and chat answers the 5 required questions.
- **T013–T016:** Cleaning rules, chat backend, chat UI.
- **Time:** ~8 hours. **Shippable:** Yes — the app answers domain questions.

**Slice 6 (Summary & Docs):** Executive summary, tests, ADRs, README.
- **T017–T024:** Summary generation, test suites, documentation, demo.
- **Time:** ~6 hours. **Shippable:** Yes — production-ready and reproducible.

---

## Testing Discipline

- **TDD:** For any non-trivial function (profiling, cleaning, analytics, chart selection), write a failing test first.
- **Unit tests:** Data parsing, cleaning rules, profiling functions, analytics queries, chart recommendation logic.
- **Integration tests:** End-to-end CSV upload → cleaning → profiling → analytics → chat flow.
- **Fixtures:** Small test CSVs in `backend/tests/fixtures/` (minimal hotel booking CSV, generic test CSV).
- **Coverage goals:** ≥70% for backend modules; smoke tests for critical frontend components.
- **CI:** Run `pytest backend/tests` and `npm test` (Vitest) on every commit.

---

## Git Commit Discipline

- **Conventional commits:** `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`
- **Atomic commits:** Each task should be 1–2 commits; each commit should be reviewable and testable.
- **Example flow for T003 (upload endpoint):**
  1. `feat: add CSV upload endpoint with validation` — implements the endpoint and Pydantic model
  2. `test: add tests for upload endpoint` — adds pytest cases for valid/invalid inputs
- **Commit early and often:** Small, focused commits are easier to debug and review.

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| LLM API fails or rate-limits during chat | Medium | High | Implement LLM provider abstraction; use free tier provider (Gemini/Groq) with fallback; cache common queries |
| Large CSV files (>50MB) cause memory pressure or slow profiling | Medium | Medium | Implement chunked reading; set max file size to 50MB; add progress indicators |
| Generic cleaning rules break Hotel Booking analytics | Low | High | Unit-test all cleaning rules against real hotel CSV; keep generic pipeline separate; log all cleaning steps |
| Chart recommendations give poor results for some datasets | Medium | Low | Curate heuristics; show user a dropdown to change chart type; prioritize common chart types (bar, line, scatter) |
| Frontend and backend get out of sync on schema | Low | High | Use shared Pydantic models in backend; auto-generate frontend types from OpenAPI schema; document API contracts in ADR-001 |
| Tests flake due to timing or randomness | Low | Medium | Use deterministic test data; mock LLM responses; avoid sleep() in tests; use Vitest snapshot tests for UI |
| Setup takes too long on a clean machine | Medium | Medium | Pre-test setup on a clean environment; document troubleshooting steps in README; provide `setup.sh` script |

---

## Parallel Work Opportunities

- **Frontend and backend can develop in parallel** after T002 (health check). Backend works on upload/profiling; frontend scaffolds upload UI.
- **Chart recommendations and chat tools can develop in parallel** after T010 (dashboard). Backend works on chat tools while frontend polishes visualizations.
- **Tests and documentation can run in parallel** in Phase 8 — one person writes tests, another writes ADRs/README.

---

## Success Metrics

- All 20 tasks completed with acceptance criteria met
- ≥70% backend test coverage; smoke tests for frontend
- App works on a clean machine following README setup
- Hotel Booking dataset loads, profiles, and answers all 5 required chat questions with correct numbers
- 3 ADRs documenting key architectural decisions
- Demo runs without errors

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| [e.g., LLM API rate limits during development] | [Med] | [Use free tier initially, have backup provider ready] |
| [e.g., Dataset has unexpected data quality issues] | [Med] | [Spend Day 2 thoroughly exploring the dataset before speccing] |
| [e.g., Uneven teammate availability during Week 2] | [Low] | [Pair-program core features; async for polish tasks] |
| [e.g., Agent generates code that doesn't work with our stack choice] | [Low] | [Review agent output before running; use ADRs to lock decisions] |

---

## Parallel Work Opportunities

[TODO — In a pair, one person can work on backend while the other works on frontend, once the interface contract is clear. Identify which tasks can run in parallel vs must be sequential.]

- [Task A] and [Task B] can be done in parallel because they don't share files.
- [Task C] must come after [Task A] because it depends on the API shape defined there.

---

## Dependency Notes

[TODO — Critical dependencies between tasks. Example:

- Frontend upload component depends on backend upload endpoint interface being defined in ADR-001
- Chart auto-selection depends on data profiling output format
- LLM chat tool-use depends on SQLite query helpers being in place
]

---

## Verification Checkpoints

Between phases, we verify:

1. All tests pass (`pytest` and `vitest`)
2. The app runs without errors
3. The git log shows atomic commits for this phase's work
4. No TODOs or placeholders have accidentally shipped

If any of these fail, we stop and fix before moving to the next phase.

---

*Plan version: 1.0 | Last updated: [date]*
