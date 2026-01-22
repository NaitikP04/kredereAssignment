import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000'; // Your Python API

// GET /api/jobs -> Proxies to GET http://localhost:8000/jobs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Forward query params (status, limit, offset) to Python
    const response = await fetch(`${BACKEND_URL}/jobs?${searchParams.toString()}`, {
      cache: 'no-store', // Never cache this, we want fresh data
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 500 });
  }
}

// POST /api/jobs -> Proxies to POST http://localhost:8000/jobs
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}