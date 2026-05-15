# DataLens — Hotel Booking Demand Dashboard

A lightweight, full-stack web application for uploading CSV files, profiling and cleaning data, and exploring it interactively through auto-generated dashboards and a conversational AI chat interface.

## Team

- **Member 1:** Affan Abdul Rahim Khan
- **Member 2:** Hassaan Bin kamran
- **Member 3:** Haseeb Ahsan
- **Assigned Dataset:** Dataset 10 — Hotel Booking Demand
- **Dataset File:** `data/hotel_booking.csv` (119,390 hotel booking records)

## Project Purpose

DataLens is a generic CSV analytics dashboard designed for operations analysts and product managers who need fast, exploratory insights from data exports. Upload any CSV file, and DataLens automatically profiles it, suggests relevant visualizations, and lets you ask natural-language questions to uncover patterns and anomalies. The application is built to work with any tabular data but includes specialized support for hotel booking analytics.

## Prerequisites

Before running this project, ensure you have the following installed on your machine:

- **Python 3.11 or higher** — [Download here](https://www.python.org/downloads/)
- **Node.js 18 or higher** — [Download here](https://nodejs.org/)
- **uv** (Python package manager) — Install with:
  - **macOS/Linux:** `curl -LsSf https://astral.sh/uv/install.sh | sh`
  - **Windows (PowerShell):** `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`
- **Git** — [Download here](https://git-scm.com/)

To verify your setup, run:
```bash
python --version      # Should show 3.11 or higher
node --version        # Should show 18 or higher
uv --version          # Should show the uv version
```

## LLM API Key Setup

DataLens uses a large language model for the chat interface and executive summary generation. You must configure at least one LLM provider by obtaining an API key:

### Recommended: Google Gemini (Free Tier Available)
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Get API Key"
3. Create a new project or use an existing one
4. Copy your API key
5. Paste it into `.env` as `GEMINI_API_KEY`

### Alternative Providers

**Anthropic Claude:**
- Visit [Anthropic Console](https://console.anthropic.com/)
- Go to API Keys and create a new key
- Paste into `.env` as `ANTHROPIC_API_KEY`

**OpenAI:**
- Visit [OpenAI Platform](https://platform.openai.com/api-keys)
- Create a new API key
- Paste into `.env` as `OPENAI_API_KEY`

**Groq (Free Tier Available):**
- Visit [Groq Console](https://console.groq.com/keys)
- Create a new API key
- Paste into `.env` as `GROQ_API_KEY`

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd datalens-hotel-booking
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` in your text editor and configure:

```env
# Choose your LLM provider: gemini, anthropic, openai, or groq
LLM_PROVIDER=gemini

# Add your API key for the chosen provider (uncomment the one you use)
GEMINI_API_KEY=your_key_here
# ANTHROPIC_API_KEY=your_key_here
# OPENAI_API_KEY=your_key_here
# GROQ_API_KEY=your_key_here

# Database (optional — defaults to data/datalens.db)
DATABASE_URL=sqlite:///data/datalens.db

# Backend server (optional — defaults to 8000)
BACKEND_PORT=8000

# Frontend server (optional — defaults to 5173)
FRONTEND_PORT=5173
```

**Important:** Never commit your `.env` file; it contains secrets. The `.env.example` file shows the template.

### 3. Install dependencies

```bash
uv sync
```

This installs Python dependencies via uv. Node.js dependencies are installed automatically when you start the frontend.

### 4. Start the application

**Combined startup (both backend and frontend):**

```bash
# From the repo root, run the startup script or command:
./start.sh        # macOS/Linux
# or
npm run dev       # Windows (from repo root with npm configured)
```

**Or start services separately:**

Terminal 1 — Backend:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Terminal 2 — Frontend:
```bash
cd frontend
npm install       # First time only
npm run dev
```

### 5. Open the application

Once both services are running, open your browser and visit:
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger documentation)

## Usage Walkthrough

### 1. Upload a CSV File

- Click the **Upload** button on the home page
- Drag and drop a CSV file or click to browse
- Select `data/hotel_booking.csv` for testing, or upload your own CSV (max 50MB)
- Wait for profiling to complete

### 2. Explore the Data Profile

After upload, you'll see an automated profile showing:
- Column names and detected data types
- Null counts and data quality metrics
- Basic statistics (min, max, mean) for numeric columns
- Categorical distributions for text columns

### 3. View Auto-Generated Dashboard

The dashboard automatically recommends and renders 4–6 charts based on your data:
- **Bar charts** for categorical data (e.g., hotel type, market segment)
- **Line charts** for time-series data (e.g., bookings by month)
- **Scatter plots** for relationships between numeric columns
- **Histograms** for distributions
- **Heatmaps** for correlations (if multiple numeric columns exist)

### 4. Use Filters

- **Dropdowns:** Filter categorical columns (e.g., "City Hotel" only)
- **Sliders:** Narrow numeric ranges (e.g., lead time 0–90 days)
- **Date pickers:** Restrict temporal data

All charts update instantly as you adjust filters.

### 5. Ask Questions in the Chat Panel

Type questions in natural language:
- "What is the overall cancellation rate?"
- "Which countries are the top 10 source markets?"
- "How does lead time correlate with cancellation probability?"
- "What is the average daily rate by month?"
- "Which market segments have the highest repeat guest rates?"

The chat uses the LLM to understand your question, queries the dataset, and returns a data-grounded answer with supporting numbers.

### 6. Read the Executive Summary

A narrative summary is automatically generated when you upload data. It highlights:
- Key insights and anomalies
- Data quality issues and cleaning steps
- Recommended next steps for analysis

## Running Tests

### Backend Tests

Run the pytest suite to verify data profiling, cleaning, and API functionality:

```bash
cd backend
uv run pytest
```

Or run specific test suites:

```bash
uv run pytest tests/test_upload.py           # CSV upload tests
uv run pytest tests/test_profiling.py        # Data profiling tests
uv run pytest tests/test_cleaning.py         # Data cleaning tests
uv run pytest tests/test_hotel_analytics.py  # Hotel booking analytics
uv run pytest tests/ -v                      # All tests with verbose output
```

For coverage report:
```bash
uv run pytest tests/ --cov=app --cov-report=html
```

### Frontend Tests

Run the Vitest test suite for React components:

```bash
cd frontend
npm test
```

Or in watch mode:
```bash
npm test -- --watch
```

## Troubleshooting

### Port Already in Use

**Problem:** `Address already in use — port 8000 (or 5173)`

**Fix:**
- **macOS/Linux:** Find and stop the process:
  ```bash
  lsof -i :8000   # Find process using port 8000
  kill -9 <PID>   # Replace <PID> with the process ID
  ```
- **Windows (PowerShell):**
  ```powershell
  netstat -ano | findstr :8000
  taskkill /PID <PID> /F
  ```

### Python Version Mismatch

**Problem:** `Error: Python 3.11+ required, but found Python 3.9`

**Fix:** Install Python 3.11 or higher and update your PATH. Verify with `python --version`.

### Node Version Mismatch

**Problem:** `npm ERR! The node version is too old`

**Fix:** Install Node.js 18 or higher from [nodejs.org](https://nodejs.org/). Verify with `node --version`.

### LLM API Key Error

**Problem:** `API key invalid` or `Authentication failed`

**Fix:**
1. Verify your API key is correct (no extra spaces or quotes)
2. Check that `.env` specifies the correct `LLM_PROVIDER`
3. Ensure the corresponding API key variable is set (e.g., `GEMINI_API_KEY`)
4. Check your API key's rate limits or usage quota in your provider's dashboard
5. Restart the backend after updating `.env`: `Ctrl+C` and re-run

### CSV Upload Fails

**Problem:** `File too large` or `Invalid CSV format`

**Fix:**
- Verify file is under 50MB
- Ensure file is valid UTF-8 CSV (not Excel `.xlsx` or other format)
- Check that CSV has at least one row and one column
- View backend logs for detailed error messages

### Missing Dependencies

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`

**Fix:** Reinstall dependencies:
```bash
uv sync --refresh    # Force reinstall all Python packages
cd frontend && npm install --force
```

## Project Structure

```
.
├── .agent/                  # Coding agent configuration (skills, instructions)
├── data/
│   └── hotel_booking.csv   # Assigned dataset (119,390 records)
├── docs/
│   ├── adrs/               # Architecture Decision Records
│   ├── report.md           # Final project reflection
│   └── demo_checklist.md   # Demo verification checklist
├── tasks/
│   ├── plan.md             # Implementation plan and milestones
│   └── todo.md             # Detailed task breakdown (24 tasks)
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI application entry point
│   │   ├── routers/        # API route handlers
│   │   ├── models/         # Pydantic data models
│   │   ├── services/       # Business logic (profiling, cleaning, analytics)
│   │   └── db/             # Database initialization and queries
│   ├── tests/              # pytest test suites
│   │   ├── fixtures/       # Test data (sample CSVs)
│   │   ├── test_upload.py
│   │   ├── test_profiling.py
│   │   ├── test_cleaning.py
│   │   ├── test_hotel_analytics.py
│   │   └── test_*.py       # Additional test modules
│   └── pyproject.toml      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page-level components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and helpers
│   ├── tests/              # Vitest test suites
│   ├── package.json        # Node.js dependencies
│   └── vite.config.ts      # Vite configuration
├── SPEC.md                 # Project specification and requirements
├── README.md               # This file
├── .env.example            # Environment variable template
└── GETTING_STARTED.md      # Quick start guide
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite, TypeScript | User interface and client-side logic |
| **Styling** | Tailwind CSS | Responsive, utility-first styling |
| **Charts** | Recharts | Interactive data visualizations |
| **Testing** | Vitest, React Testing Library | Frontend component and integration tests |
| **Backend** | FastAPI, Python 3.11+ | RESTful API and data processing |
| **Validation** | Pydantic | Data model validation and serialization |
| **Data Processing** | Pandas, NumPy | CSV parsing, cleaning, profiling |
| **Database** | SQLite | Session persistence |
| **Testing** | pytest | Backend unit and integration tests |
| **LLM Integration** | LangChain (optional) | Tool-calling and chat orchestration |
| **Package Mgmt** | uv, npm | Fast Python and Node.js dependency management |

## Key Features

✅ **CSV Upload & Profiling**
- Upload any CSV file (up to 50MB)
- Automatic type detection and data quality analysis
- Null handling and statistics computation

✅ **Interactive Dashboard**
- 4–6 auto-recommended charts based on data types
- Real-time filter interactions (dropdowns, sliders, date pickers)
- Responsive grid layout for various screen sizes

✅ **Natural Language Chat**
- Ask questions about your data in plain English
- LLM-powered responses with data grounding
- Reproducible results with methodology documentation

✅ **Executive Summary**
- Auto-generated narrative insights
- Key findings and anomalies highlighted
- Actionable recommendations

✅ **Hotel Booking Specialization**
- Deterministic data cleaning rules for hotel datasets
- Analytics answering 5 key hotel business questions
- Privacy column detection and removal

✅ **Comprehensive Testing**
- ≥70% backend test coverage
- Unit, integration, and component tests
- Fixtures for reproducible testing

## Contribution Summary

### Development Roles

- **[Member 1 Name]:** [Primary responsibilities — e.g., backend data pipeline, CSV upload, profiling]
- **[Member 2 Name]:** [Primary responsibilities — e.g., frontend UI, React components, dashboard]
- **[Member 3 Name (if applicable)]:** [Primary responsibilities — e.g., testing, LLM integration, documentation]

### Key Contributions

- Specification: Detailed requirements for generic CSV analytics and Hotel Booking Demand specialization
- Planning: 3-week implementation roadmap with 24 focused tasks
- Architecture: TDD discipline, tool-calling LLM pattern, clean separation of backend/frontend
- Testing: Comprehensive pytest and Vitest suites with ≥70% coverage
- Documentation: SPEC.md, README, 3 ADRs, and final project report

## Acknowledgments

This project was built as part of a full-stack software engineering course. Special thanks to:

- **Course instructors** for the project specification and grading framework
- **FastAPI community** for excellent documentation and examples
- **React and Vite** teams for modern frontend tooling
- **Recharts** for accessible, composable charting components
- **LLM providers** (Gemini, Claude, OpenAI, Groq) for powerful natural language capabilities

## Getting Help

- **README questions:** See the [Troubleshooting](#troubleshooting) section above
- **API documentation:** Visit [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI) when the backend is running
- **Project spec:** See [SPEC.md](SPEC.md) for detailed requirements and dataset-specific notes
- **Implementation plan:** See [tasks/plan.md](tasks/plan.md) for architecture and milestones
- **Task breakdown:** See [tasks/todo.md](tasks/todo.md) for individual task details

---

**Last updated:** May 10, 2026 | **Status:** In Development | **Version:** 1.0

## Acknowledgments

This project was developed as part of the Spring 2026 Strategic Generative AI for Business course. We used [Antigravity / Claude Code / Codex / Cursor] as our coding agent, guided by the Agent Skills framework authored by Addy Osmani (MIT licensed, available at [https://github.com/addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)).

## License

[TODO — Choose a license or remove this section.]
