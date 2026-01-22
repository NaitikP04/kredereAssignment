import { NextResponse } from 'next/server';

// Note: Pointing to the WORKER service for stats
const WORKER_URL = 'http://localhost:3000'; 

export async function GET() {
  try {
    const response = await fetch(`${WORKER_URL}/stats`, { cache: 'no-store' });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}