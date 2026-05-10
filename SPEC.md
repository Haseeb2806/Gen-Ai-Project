# SPEC: DataLens

> **Template instructions:** This is the spec template for your DataLens project. When you invoke the `spec-driven-development` skill (by asking your coding agent to help write a spec), the agent will help you fill in each section. The spec must cover all six core areas below. Do not skip any section.
>
> **Delete this instruction block when your spec is complete.**

---

## 1. Objective

[TODO — Describe what you're building and why. Answer these questions:

- **What is DataLens?** (2-3 sentences)
- **Who is the target user?** (Be specific. "Business analysts" is too broad. Think about a specific persona.)
- **What does success look like?** (Specific, testable conditions. Not "the app is good." Instead: "A business analyst can upload a 10MB CSV, explore the data through a dashboard with at least 4 visualizations, and generate an executive summary within 60 seconds of upload completion.")

### User Stories

- As a [user type], I want to [action], so that [benefit]
- As a [user type], I want to [action], so that [benefit]
- [Add more as needed]

### Assumptions

**Important:** List every assumption you are making. Surface them now so they can be challenged.

1. [Assumption 1]
2. [Assumption 2]
3. [Assumption 3]

]

---

## 2. Tech Stack

[TODO — Reference the locked stack from the Final Project Specification and add specifics:

- **Frontend framework:** React with Vite
- **Styling:** Tailwind CSS
- **UI Components:** [Your choice — e.g., Shadcn, Radix, MUI]
- **Chart library:** [Recharts or Plotly]
- **Backend framework:** FastAPI
- **Data validation:** Pydantic
- **Python version:** 3.11+
- **Package manager:** uv
- **Database:** SQLite
- **Data processing:** Pandas
- **LLM provider:** [Your choice — e.g., Gemini, Claude]
- **LLM integration pattern:** Tool-use / function calling
- **Testing (backend):** pytest
- **Testing (frontend):** Vitest
- **Coding agent:** [Antigravity / Claude Code / Codex / Cursor]

]

---

## 3. Commands

[TODO — List the full executable commands. Not tool names — actual commands with flags.

```
Setup:     [your setup command]
Dev:       [command to start the application]
Test:      [command to run all tests]
Lint:      [command to lint code]
Build:     [command to build for production, if applicable]
```

These commands go in your README too, but they belong here first so the agent knows what to reference.
]

---

## 4. Project Structure

[TODO — Describe your directory layout. Reference the structure laid out in the Final Project Specification, and add any sub-folders specific to your implementation.

```
.
├── .agent/skills/          → Agent Skills
├── docs/
│   ├── adrs/              → Architecture Decision Records
│   └── report.md          → Final reflection
├── tasks/
│   ├── plan.md            → Implementation plan
│   └── todo.md            → Task breakdown
├── backend/
│   ├── app/
│   │   ├── main.py        → FastAPI entry point
│   │   ├── routers/       → API route handlers
│   │   ├── models/        → Pydantic models
│   │   ├── services/      → Business logic
│   │   └── db/            → Database setup and queries
│   └── tests/             → pytest tests
├── frontend/
│   ├── src/
│   │   ├── components/    → React components
│   │   ├── pages/         → Page-level components
│   │   ├── hooks/         → Custom React hooks
│   │   └── lib/           → Utilities
│   └── tests/             → Vitest tests
├── SPEC.md
├── README.md
└── pyproject.toml
```
]

---

## 5. Code Style

[TODO — One real example snippet of your coding style is worth three paragraphs describing it. Show:

- A sample Pydantic model for your data
- A sample FastAPI endpoint handler
- A sample React component

Plus any key conventions:

- **Naming:** snake_case for Python, camelCase for TypeScript/React
- **Formatting:** [black / ruff / prettier — whatever you use]
- **Type hints:** Required on all Python functions
- **TypeScript:** [strict mode on/off]
- **Comments:** [conventions]

]

---

## 6. Testing Strategy

[TODO — Describe:

- **Framework:** pytest (backend), Vitest (frontend)
- **Test locations:** `backend/tests/`, `frontend/tests/`
- **Coverage expectations:** [e.g., at least 10 backend tests covering upload, profiling, chat tool endpoints; at least 5 frontend tests covering key components]
- **Test levels:**
  - Unit tests for: [e.g., data profiling logic, CSV parsing]
  - Integration tests for: [e.g., full upload → profile → query flow]
  - End-to-end tests for: [not required, but noted if used]
- **TDD discipline:** Write tests before the code they test. This is one of the six mandatory skills.

]

---

## 7. Boundaries

Three-tier boundary system. Be explicit.

### Always Do

[TODO — Add any additional "always do" rules specific to your project. Examples:

- Run tests before committing
- Use Pydantic for every data boundary
- Validate uploaded CSV size before processing
- Commit the `.agent/skills/` folder
]

### Ask First

[TODO — List things the agent should ask about before doing. Examples:

- Adding new Python or Node dependencies
- Changing the database schema
- Modifying the public API shape
- Changing the LLM provider
- Adding environment variables
]

### Never Do

[TODO — List things the agent must never do. Examples:

- Commit API keys or secrets
- Commit `.env` files (only `.env.example`)
- Skip tests to ship faster
- Remove failing tests without approval
- Deploy to production (out of scope)
- Edit files in `.agent/skills/` (these come from Addy Osmani's repo)
]

---

## 8. Success Criteria

[TODO — Specific, testable conditions that define "done" for the MVP. These will be checked by the grader. Examples:

- CSV upload accepts files up to 50MB
- Data profiling completes within 5 seconds for files under 10MB
- Dashboard renders at least 4 visualizations automatically
- Filters update all visualizations within 500ms
- Chat interface responds to user questions within 10 seconds
- Executive summary generates within 30 seconds of upload completion
- Multi-dataset support: uploading a different CSV replaces the previous dataset cleanly
- Data persists across page refresh via SQLite
]

---

## 9. Out of Scope

Explicitly excluded from the 3-week build:

- User authentication and multi-user accounts
- Production deployment
- Mobile responsive design
- Custom machine learning models
- Real-time collaborative editing

[TODO — Add any other boundaries specific to your team's scope decisions.]

---

## 10. Open Questions

[TODO — List anything unresolved. Examples:

- Which chart library: Recharts or Plotly? (Decision in ADR-002)
- How to handle very wide CSVs (100+ columns)? (Deferred to post-MVP)
- Should executive summary be editable by the user? (Decision in ADR-003)

Close these questions before starting implementation. Move decisions to ADRs.]

---

*Spec version: 1.0 | Last updated: [date]*
