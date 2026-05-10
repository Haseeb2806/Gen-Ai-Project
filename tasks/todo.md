# Task Breakdown

> **Template instructions:** This file is the operational checklist for the project. Each task must be small enough that it:
>
> - Touches ~5 files or fewer
> - Can be completed in a single focused session
> - Has explicit acceptance criteria
> - Has a verification step (test, build, or manual check)
>
> The `planning-and-task-breakdown` skill will help you structure these tasks when you ask your agent to break down the plan.
>
> **Delete this instruction block when the task list is complete.**

---

## Format

Each task follows this template:

```
- [ ] TXXX: [Short descriptive title]
  - **Phase:** [Which plan phase does this belong to?]
  - **Description:** [What is being built]
  - **Acceptance:** [What must be true when done]
  - **Verify:** [How to confirm — test command, build, manual check]
  - **Files:** [Which files will be touched — approximate, 5 or fewer]
  - **Dependencies:** [Task IDs that must be done first]
```

---

## Tasks

### Phase 1: Foundation

- [ ] **T001:** Clone starter template and verify scaffolding
  - **Description:** Verify the starter template builds and empty tests pass
  - **Acceptance:** `uv sync` and `npm install` complete without errors; `pytest` runs (even with zero tests); `vitest run` runs (even with zero tests)
  - **Verify:** Run both test commands locally
  - **Files:** None (verification only)
  - **Dependencies:** None

- [ ] **T002:** Set up GitHub repo and confirm agent can commit
  - **Description:** Create remote repo, push starter, verify agent commits work
  - **Acceptance:** Remote repo exists, starter template pushed, agent can make and push a commit
  - **Verify:** Push a trivial README edit commit
  - **Files:** README.md
  - **Dependencies:** None

- [ ] **T003:** Complete SPEC.md
  - **Description:** Invoke the `spec-driven-development` skill. Fill in all six core areas of SPEC.md.
  - **Acceptance:** Every `[TODO]` in SPEC.md is resolved. All six core areas have substantive content. Assumptions are surfaced. Success criteria are testable.
  - **Verify:** Peer-review with partner. Optional: exchange spec review with another team.
  - **Files:** SPEC.md
  - **Dependencies:** T002

- [ ] **T004:** Complete plan.md (this was probably already done if you're editing this file)
  - **Description:** Document the phase plan, risks, parallel work opportunities
  - **Acceptance:** Plan file is complete and mapped to todo.md tasks
  - **Verify:** Peer-review with partner
  - **Files:** tasks/plan.md
  - **Dependencies:** T003

- [ ] **T005:** Complete initial task breakdown (this file)
  - **Description:** Expand task list below with all tasks for Phases 2-7
  - **Acceptance:** All phases have concrete tasks with acceptance criteria
  - **Verify:** Peer-review with partner
  - **Files:** tasks/todo.md
  - **Dependencies:** T004

---

### Phase 2: Core Upload and Profiling

[TODO — Your agent will help break these down. Example starter tasks:]

- [ ] **T010:** Design and implement CSV upload endpoint
  - **Description:** FastAPI endpoint accepting multipart CSV upload, Pydantic validation, max 50MB
  - **Acceptance:** Endpoint accepts valid CSV, returns upload ID; rejects non-CSV with 400; rejects >50MB with 413
  - **Verify:** `pytest backend/tests/test_upload.py`
  - **Files:** backend/app/routers/upload.py, backend/app/models/upload.py, backend/tests/test_upload.py
  - **Dependencies:** T003

[TODO — Add more tasks for this phase: SQLite persistence, profiling logic, frontend upload UI, profile display, etc.]

---

### Phase 3: Dashboard Visualizations

[TODO — Break down into tasks. Example:]

- [ ] **T020:** Auto-select chart type based on column types
  - **Description:** Logic that given a profiled dataset, returns a list of 4-6 recommended (chart_type, columns) combinations
  - **Acceptance:** Categorical columns → bar chart; datetime → line; numeric pairs → scatter; etc.
  - **Verify:** `pytest backend/tests/test_chart_selection.py`
  - **Files:** backend/app/services/chart_selection.py, backend/tests/test_chart_selection.py
  - **Dependencies:** T015 (profiling must exist)

[TODO — Continue for each phase.]

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
