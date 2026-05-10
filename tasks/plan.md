# Implementation Plan

> **Template instructions:** This plan describes the overall approach to building DataLens — the order of work, the major phases, the risks, and the checkpoints. It is produced after the spec is complete, by invoking the `planning-and-task-breakdown` skill. The task-level detail goes in `todo.md`.
>
> **Delete this instruction block when the plan is complete.**

---

## Plan Summary

[TODO — One paragraph describing the overall build strategy. Example: "We will build DataLens in thin vertical slices, starting with a minimal upload-and-display flow, then adding visualization, then filters, then chat, and finally the executive summary. Each slice is shippable (the app runs) before we move to the next. We estimate X total tasks across 3 weeks of work."]

---

## Major Phases and Milestones

### Phase 1: Foundation (Week 1)

**Goal:** Spec is solid. Plan is solid. Task breakdown is solid. Minimal scaffolding exists.

- Clone starter template, confirm it builds
- Complete SPEC.md
- Complete plan.md (this document) and todo.md
- Set up the agent with skills properly discoverable
- Confirm development environment works end-to-end (agent can run tests, agent can commit)

**Checkpoint:** Can we run `pytest` and `vitest` and have empty test suites pass? Is the skills folder correctly installed?

### Phase 2: Core Upload and Profiling (early Week 2)

**Goal:** User can upload a CSV and see it profiled.

- CSV upload endpoint (FastAPI) with Pydantic validation
- SQLite schema and persistence
- Data profiling logic (column types, nulls, basic stats)
- Frontend upload component
- Frontend profile display

**Checkpoint:** Upload a real CSV, see column stats on the page.

### Phase 3: Dashboard Visualizations (mid Week 2)

**Goal:** Dashboard with 4-6 auto-generated visualizations.

- Chart component architecture
- Auto-selection logic (pick chart types based on column types)
- Render 4-6 visualizations from uploaded data

**Checkpoint:** Upload a CSV, see meaningful visualizations render.

### Phase 4: Global Filters (late Week 2)

**Goal:** Filters apply across all dashboard visualizations.

- Filter UI (dropdowns, date pickers, sliders)
- Shared filter state
- Dashboard responds to filter changes

**Checkpoint:** Change a filter, all charts update together.

### Phase 5: LLM Chat Interface (end of Week 2 / early Week 3)

**Goal:** User can ask questions in natural language and get data-grounded answers.

- Backend tool-use setup (expose query functions to LLM)
- LLM provider abstraction
- Frontend chat component
- End-to-end chat flow

**Checkpoint:** Ask "which X has the highest Y?" and get a correct, data-grounded answer.

### Phase 6: Executive Summary (mid Week 3)

**Goal:** Auto-generated narrative summary of the dataset.

- Summary generation endpoint
- Prompt engineering for business-analyst tone
- Frontend summary display

**Checkpoint:** Uploaded dataset produces a sensible executive summary.

### Phase 7: Polish and Documentation (Week 3)

**Goal:** The app is demo-ready and the docs are complete.

- Bug fixes from mid-project video feedback
- UI polish
- README completion
- ADRs (minimum 3)
- Final report
- Dry-run setup on a clean machine

**Checkpoint:** A classmate can clone the repo and run it without help.

---

## Risks and Mitigations

[TODO — Be realistic about what could go wrong. For each risk, note how you'll mitigate it.]

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
