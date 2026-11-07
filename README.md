# ParkPilot 🚗🅿️

**ParkPilot** is a smart parking finder web application that predicts the availability of metered street parking and parking facilities across San Diego using the City of San Diego's open municipal dataset.

By analyzing millions of historical parking meter transactions, ParkPilot transforms raw civic data into real-time, empirical availability predictions—helping drivers quickly find available spots, cut down cruising time, and reduce urban traffic congestion.

---

## 🌟 Key Features

- **Data-Driven Availability Predictions**: Uses historical transaction patterns from `data.sandiego.gov` discretized into 15-minute buckets with recency weighting (8-week half-life) to estimate spot availability bands (`likely`, `possible`, `unlikely`).
- **Interactive Map Experience**: Leaflet-based map with color-coded availability pins, meter details (rates, max durations, street limits), and route walking time estimates.
- **Conversational AI Parking Assistant**: Chat interface powered by Google Gemini with tool calling (`find_parking`, `geocode`), allowing natural language queries like *"Find me a spot near Petco Park for 2 hours tonight"*.
- **Flexible Arrival & Policy Awareness**: Search for current availability or future dates/times (with Day-of-Week profiles and holiday awareness). Automatically detects free/unenforced off-hours and warns if requested parking duration exceeds posted limits.
- **Facility & Destination Discovery**: Integrated place geocoding and off-street parking facility lookup via OpenStreetMap / Nominatim.
- **High-Performance Spatial Engine**: Scikit-Learn `BallTree` spatial indexing combined with DuckDB analytical queries delivering sub-30ms response times.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Data Pipeline (Offline)                       │
│                                                                        │
│   data.sandiego.gov ──► Ingest ──► Clean ──► Sessionize ──► Occupancy  │
│      (Raw CSVs)         (raw)    (parquet)  (parquet)     (parquet)    │
│                                                               │        │
│                                            Profiles Parquet ──┘        │
│                                                   │                    │
│                                                   ▼                    │
│                                      Analytical DuckDB Store           │
└───────────────────────────────────────────────────┬────────────────────┘
                                                    │
┌───────────────────────────────────────────────────▼────────────────────┐
│                         FastAPI Backend                                │
│                                                                        │
│   GET  /v1/spots   ── Spatial BallTree + DuckDB query (Deterministic)  │
│   POST /v1/chat    ── Gemini LLM w/ automated function calling         │
│   GET  /v1/meters  ── Specific pole weekly availability trends         │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                                    │ REST API
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    ParkPilot Frontend (React + Vite)                   │
│                                                                        │
│   • Interactive Leaflet Map        • Color-coded availability bands    │
│   • Natural Language Chat UI       • Distance & duration filters       │
│   • Destination Discovery Proxy    • Responsive desktop & mobile view  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

The project is organized as a monorepo containing both the frontend application and backend service:

```
ParkPilot/
├── Frontend/                 # React + Vite application
│   ├── src/                  # React components (Map, Chat, Details)
│   ├── server/               # Node discovery server for OSM places & lots
│   ├── public/               # Static assets and icons
│   ├── package.json          # Frontend dependencies & scripts
│   └── vite.config.js        # Vite build configuration
│
├── HackForHumanity/          # Backend service & Data Pipeline
│   ├── src/parking/          # Core Python package
│   │   ├── api/              # FastAPI routes (spots, chat, metadata)
│   │   ├── llm/              # Gemini agent, tools, and prompts
│   │   ├── serve/            # DuckDB store & availability ranker
│   │   ├── geo/              # Spatial indexing & geocoding
│   │   └── transform/        # Data cleaning and occupancy modeling
│   ├── data/serving/         # Pre-computed DuckDB database (34 MB)
│   ├── scripts/              # Ingestion, backtesting, and build scripts
│   ├── tests/                # Automated pytest suite
│   ├── pyproject.toml        # Python project configuration
│   └── Dockerfile            # Container definition for deployment
│
├── .gitignore                # Global git ignore configuration
├── .gitattributes           # Git LFS & line ending normalizations
└── README.md                 # Project overview and documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v22.12+` (or modern LTS)
- **Python**: `3.11+`
- **uv** (recommended) or `pip`
- **Google Gemini API Key** (for conversational assistant features)

---

### 1. Setting Up the Backend

Navigate to the backend directory:

```bash
cd HackForHumanity
```

Create a virtual environment and install dependencies:

```bash
# Using uv (fastest)
uv sync

# Or using standard pip
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -e .
```

Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` and provide your Gemini API key:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
```

Start the FastAPI development server:

```bash
uvicorn parking.api.main:app --reload --port 8000
```

The API documentation will be available at `http://localhost:8000/docs`.

---

### 2. Setting Up the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd Frontend
```

Install dependencies:

```bash
npm install
```

Configure environment variables (optional, defaults to local or hosted backend):

```bash
cp .env.example .env
```

Update `VITE_API_URL` to point to your backend:
```ini
VITE_API_URL=http://localhost:8000
```

Start the Vite development server:

```bash
npm run dev
```

Open the printed URL (typically `http://localhost:5173`) in your browser.

---

## 📊 How Predictions Work

1. **Transaction Ingestion**: City of San Diego metered transaction data records meter start time, payment duration, meter type, and location.
2. **Session Reconstruction**: Continuous meter occupancy sessions are reconstructed and mapped across historical weeks.
3. **Occupancy Profile Grid**: Occupancy is aggregated into 15-minute time slots across all days of the week, weighted with an exponential decay favoring recent weeks.
4. **Bayesian/Empirical Availability Probability ($P_{\text{avail}}$)**:
   - For an arrival time $t$, ParkPilot computes the historical probability that a given meter is unoccupied.
   - Categorized into clear user bands:
     - 🟢 **Likely** ($P \ge 60\%$)
     - 🟡 **Possible** ($30\% \le P < 60\%$)
     - 🔴 **Unlikely** ($P < 30\%$)
     - ⚪ **Unmetered / Free** (Outside enforcement windows or on holidays)

---

## 🛠️ API Quick Reference

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Service health status and database connection probe |
| `GET` | `/v1/meta` | Dataset metadata, active meter counts, and bounding box |
| `GET` | `/v1/spots` | Spatial query returning ranked parking spots near coordinates |
| `GET` | `/v1/meters/{id}` | Detailed profile and weekly hourly pattern for a specific meter |
| `POST` | `/v1/chat` | AI conversation endpoint with automatic tool calling |

---

## ⚠️ Disclaimer

ParkPilot provides statistical parking availability estimates derived from historical meter transactions. It does not use live physical space sensors or cameras. Actual street parking availability may vary due to special events, road work, street sweeping, or unmetered vehicle occupancy. Always verify posted city street signs and curb restrictions.

---

## 👥 Authors & Acknowledgments

- Built for **Hack for Humanity**.
- Parking dataset provided by the **City of San Diego Open Data Portal** (`data.sandiego.gov`).
- Maps and place search powered by **OpenStreetMap** and **Nominatim**.
