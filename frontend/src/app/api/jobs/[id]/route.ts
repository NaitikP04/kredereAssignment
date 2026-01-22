import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000';

// GET /api/jobs/:id -> Proxies to GET http://localhost:8000/jobs/:id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/jobs/${params.id}`, { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: 'Job not found' }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Backend error' }, { status: 500 });
  }
}

// DELETE /api/jobs/:id -> Proxies to DELETE http://localhost:8000/jobs/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/jobs/${params.id}`, { method: 'DELETE' });
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Backend error' }, { status: 500 });
  }
}