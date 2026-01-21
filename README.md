# kredereAssignment

A backend architecture for handling background jobs, using a **FastAPI (Python)** producer and a **Hono (TypeScript/Bun)** consumer, orchestrated via **Docker Compose**.

## Features
- **Distributed Locking:** Uses PostgreSQL `SKIP LOCKED` to safely handle concurrent workers.
- **Priority Queuing:** Jobs are processed based on priority (1-5) and creation time.
- **Retry Logic:** Failed jobs are automatically retried up to 3 times.
- **Polyglot Stack:** Demonstrates interoperability between Python and TypeScript services.

## Tech Stack
- **Producer:** Python 3.11, FastAPI, SQLModel (Async SQLAlchemy)
- **Consumer:** TypeScript, Bun, Hono, Postgres.js
- **Database:** PostgreSQL 15
- **Infrastructure:** Docker Compose

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.x (optional, for running the seed script)

### 1. Launch the System
```bash
docker compose up --build
```

This starts the Database, API, and Worker services.

- **API Documentation (Swagger UI):** http://localhost:8000/docs
- **Worker Queue Stats:** http://localhost:3000/stats

### 2. Seed Test Data
To populate the queue with 20 random jobs:

```bash
python seed.py
```

## API Endpoints

### Producer Service (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/jobs` | Create a new job |
| GET | `/jobs` | List jobs (filters: status, type) |
| GET | `/jobs/{id}` | Get job details |
| DELETE | `/jobs/{id}` | Cancel a pending job |

### Consumer Service (Port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/process` | Atomic fetch & lock of highest priority job |
| POST | `/complete/{id}` | Mark job as completed |
| POST | `/fail/{id}` | Mark job as failed (triggers retry if < 3 attempts) |
| GET | `/stats` | View queue statistics |