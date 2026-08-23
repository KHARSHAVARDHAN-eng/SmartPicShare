# SmartSharePhoto — AI Event Photo Distribution Web App

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB)](https://react.dev/)
[![pgvector](https://img.shields.io/badge/PostgreSQL-pgvector-336791)](https://github.com/pgvector/pgvector)
[![License](https://img.shields.io/badge/License-MIT-green)](#)

**SmartSharePhoto** is an AI-powered event photo-sharing web application. Event photographers upload event photographs (up to 150 photos per event), and guests scan a QR code or shared public link, authenticate via Google, and upload a selfie to automatically receive a personalized gallery of their photos using facial recognition.

Designed around a **₹0 / $0 per month** free-tier infrastructure budget (Supabase Auth + PostgreSQL `pgvector` + Cloudflare R2 + Render/Vercel static hosting).

---

## Architecture Blueprint & Design

The complete system architecture specification is available at [ARCHITECTURE.md](ARCHITECTURE.md).

```
┌─────────────────────────────────────────────────────────────┐
│                      GUEST / PHOTOGRAPHER                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Vercel / Netlify Static Hosting)                 │
│  - React + Vite + Tailwind CSS                              │
│  - 0% Cold start, 100% public availability                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (Bearer JWT)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI on Render Free Web Service)               │
│  - Python 3.10 + InsightFace ONNX CPU                       │
│  - Tolerates idle sleep, wakes on incoming request          │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐┌─────────────────────────────┐
│ DATABASE & VECTOR STORE      ││ OBJECT STORAGE              │
│ Supabase Free PostgreSQL     ││ Cloudflare R2 / Supabase    │
│ (pgvector 512-dim Cosine)    ││ (Original Event Photos)     │
└──────────────────────────────┘└─────────────────────────────┘
```

---

## Feature Matrix

- 📸 **Photographer Event Management**: Create events, manage galleries, track real-time face processing progress.
- ⚡ **Automated Face Indexing**: InsightFace ONNX CPU engine extracts 512-dimensional facial embeddings on photo upload.
- 🔍 **Cosine Vector Similarity**: Search face embeddings natively in PostgreSQL via `pgvector` (`1 - (embedding <=> query_embedding)`).
- 🔒 **Privacy & Event Isolation**: Strict server-side event isolation prevents cross-event photo access.
- 📱 **Printable QR Code Generator**: Downloadable PNG QR code for easy phone scanning at live events.
- 🚀 **Server-side V1 Limit Enforcement**: Hard limit of 150 photos per event enforced at the API layer.

---

## Local Setup & Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 16+ (with `pgvector` extension enabled for production, or standard PostgreSQL / SQLite for dev)

### 1. Repository Clone
```bash
git clone https://github.com/KHARSHAVARDHAN-eng/SmartPicShare.git
cd SmartPicShare
```

### 2. Backend Setup
```bash
# Create virtual environment
python3 -m venv backend/.venv
source backend/.venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Setup environment variables
cp backend/.env.example backend/.env

# Run database migrations
cd backend
PYTHONPATH=. .venv/bin/alembic upgrade head

# Start FastAPI server
PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8000
```

FastAPI server runs at `http://localhost:8000`  
Swagger API Docs available at `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start React dev server
npm run dev
```

React App runs at `http://localhost:5173`

---

## Environment Variables Configuration Guide

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Async PostgreSQL connection string | `postgresql+asyncpg://postgres:postgres@localhost:5432/smartsharephoto_dev` |
| `SYNC_DATABASE_URL` | Sync PostgreSQL connection string for Alembic | `postgresql+psycopg2://postgres:postgres@localhost:5432/smartsharephoto_dev` |
| `SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` |
| `SUPABASE_JWT_SECRET` | Secret key for verifying Supabase JWT tokens | `dev-secret-key-change-in-production-min-32-chars` |
| `R2_ACCOUNT_ID` | Cloudflare Account ID | `your-cloudflare-account-id` |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 S3 Access Key ID | `your-r2-access-key-id` |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 S3 Secret Access Key | `your-r2-secret-access-key` |
| `R2_BUCKET_NAME` | Cloudflare R2 Bucket Name | `smartsharephoto-photos` |
| `STORAGE_PROVIDER` | Object storage provider | `mock` (dev/test) or `r2` (production) |
| `VITE_SUPABASE_URL` | Public Supabase URL for frontend SDK | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase Anon key | `your-supabase-anon-key` |
| `VITE_API_BASE_URL` | FastAPI Backend URL | `http://localhost:8000` |

---

## Running Test Suites

### Backend Unit & Integration Tests (100% Offline Pytest)
```bash
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests
```

### Frontend Production Build Test
```bash
cd frontend && npm run build
```

---

## Authentication Configuration

1. Log into **Supabase Dashboard** > **Authentication** > **Providers**.
2. Enable **Google OAuth** provider.
3. Configure Google OAuth Client ID and Secret from Google Cloud Console.
4. Set Redirect URL to `http://localhost:5173/dashboard` (development) or `https://your-app.vercel.app/dashboard` (production).

---

## Current Known Limitations (V1 MVP)

- Max 150 photos per event (enforced server-side).
- Guest selfie search API and gallery view scheduled for Phase 6.

---

## License

MIT License. Developed for SmartSharePhoto.
