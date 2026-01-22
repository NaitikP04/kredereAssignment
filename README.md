# kredereAssignment

A distributed job processing system with a **FastAPI (Python)** producer API, a **Hono (TypeScript/Bun)** worker service, and a **Next.js** dashboard frontend. Orchestrated via **Docker Compose**.

## Architecture Overview

```
+-------------------+     +-------------------+     +-------------------+
|   Next.js         |     |   FastAPI         |     |   Hono/Bun        |
|   Dashboard       |---->|   Producer API    |     |   Worker Service  |
|   (Port 3001)     |     |   (Port 8000)     |     |   (Port 3000)     |
+-------------------+     +-------------------+     +-------------------+
                                   |                         |
                                   v                         v
                          +----------------------------------+
                          |         PostgreSQL 15            |
                          |         (Port 5432)              |
                          +----------------------------------+
```

## Features

### Backend (Assignment 1)
- **Distributed Locking:** Uses PostgreSQL `SELECT FOR UPDATE SKIP LOCKED` for safe concurrent job processing
- **Priority Queuing:** Jobs processed by priority (1-5, highest first) then by creation time
- **Retry Logic:** Failed jobs automatically retry up to 3 times before permanent failure
- **Polyglot Stack:** Python producer + TypeScript consumer sharing PostgreSQL

### Frontend (Assignment 2)
- **Dashboard:** Real-time stats, trend charts, recent jobs overview
- **Jobs Management:** Search, filter, sort, paginate, bulk actions
- **Job Details:** Timeline visualization, collapsible JSON viewer, context-sensitive actions
- **Create Jobs:** Dynamic forms with Zod validation based on job type

## Tech Stack

| Layer | Technology |
|-------|------------|
| Producer API | Python 3.11, FastAPI, SQLModel (Async SQLAlchemy) |
| Worker Service | TypeScript, Bun, Hono, Postgres.js |
| Frontend | Next.js 14+, TypeScript, TanStack Query, Zustand |
| Database | PostgreSQL 15 |
| Styling | Tailwind CSS, shadcn/ui |
| Infrastructure | Docker Compose |

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.x (optional, for seed script)

### 1. Launch Backend Services
```bash
docker compose up --build
```

This starts:
- PostgreSQL database (port 5432)
- FastAPI producer API (port 8000)
- Hono worker service (port 3000)

### 2. Start Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3001

### 3. Seed Test Data (Optional)
```bash
python seed.py
```

Creates 20 random jobs with proper payloads for each type.

## API Documentation

### Producer Service (FastAPI - Port 8000)

Swagger UI available at: http://localhost:8000/docs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/jobs` | Create a new job |
| GET | `/jobs` | List jobs with filters and pagination |
| GET | `/jobs/{id}` | Get job details |
| DELETE | `/jobs/{id}` | Cancel a pending job |

#### Create Job Example
```bash
curl -X POST http://localhost:8000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "priority": 3,
    "payload": {
      "to": "user@example.com",
      "subject": "Welcome",
      "body": "Hello world"
    }
  }'
```

#### List Jobs with Filters
```bash
curl "http://localhost:8000/jobs?status=pending&type=email&limit=10&offset=0"
```

### Worker Service (Hono/Bun - Port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/process` | Atomically pick up highest priority pending job |
| POST | `/complete/{id}` | Mark job as completed with result |
| POST | `/fail/{id}` | Mark job as failed (triggers retry if attempts < 3) |
| GET | `/stats` | Get job counts grouped by status |

#### Process Next Job
```bash
curl -X POST http://localhost:3000/process
```

#### Complete a Job
```bash
curl -X POST http://localhost:3000/complete/{job_id} \
  -H "Content-Type: application/json" \
  -d '{"result": {"status": "sent", "timestamp": "2026-01-22T10:00:00Z"}}'
```

## Frontend Architecture

### Pages
- `/` - Dashboard with stats cards, trend chart, recent jobs
- `/jobs` - Paginated job list with search, filters, sorting, bulk actions
- `/jobs/[id]` - Job detail with timeline, JSON viewer, action buttons
- `/jobs/new` - Create job form with dynamic payload fields

### State Management
- **Server State:** TanStack Query for API data fetching and caching
- **Global State:** Zustand with localStorage persistence for filter preferences
- **Form State:** React Hook Form with Zod validation
- **URL State:** Filters persisted in query parameters

### Component Structure
```
src/
  app/
    api/            # Next.js API routes (proxy to backend)
    jobs/           # Job pages (list, detail, create)
    page.tsx        # Dashboard
  components/
    ui/             # shadcn/ui components
    dashboard-*.tsx # Dashboard-specific components
  hooks/            # Custom hooks (useDebounce)
  store/            # Zustand store
  types/            # TypeScript interfaces
```

## Data Model

### Job Interface
```typescript
interface Job {
  id: string;
  type: "email" | "report" | "notification";
  status: "pending" | "processing" | "completed" | "failed";
  priority: 1 | 2 | 3 | 4 | 5;
  payload: EmailPayload | ReportPayload | NotificationPayload;
  result?: Record<string, unknown>;
  error?: string;
  attempts: number;
  created_at: string;
  updated_at: string;
  scheduled_for?: string;
  completed_at?: string;
}
```

### Payload Types by Job Type
| Type | Fields |
|------|--------|
| email | to (email), subject, body |
| report | report_type, format (pdf/csv), date_range |
| notification | user_id, channel (push/sms/email), message |

## Environment Variables

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

See `.env.example` for available configuration options.

## Database Schema

The `job` table includes indexes on:
- `status` - For filtering pending jobs
- `type` - For filtering by job type
- `priority` - For ordering by priority

## Design Decisions

1. **Separate Services:** Producer and consumer are separate services to allow independent scaling and different technology choices.

2. **SKIP LOCKED:** Using PostgreSQL's `FOR UPDATE SKIP LOCKED` prevents multiple workers from picking up the same job without blocking.

3. **Retry Logic:** Jobs retry up to 3 times before permanent failure, with attempt count incremented on pickup rather than on failure.

4. **UUID Primary Keys:** Using UUIDs instead of sequential integers for better distribution and security in distributed systems.

5. **Server-Side Pagination:** Frontend uses server-side sorting and pagination to handle large datasets efficiently.

6. **URL State Persistence:** Filter state persisted in URL allows bookmarking and sharing filtered views.