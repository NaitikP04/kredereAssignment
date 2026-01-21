import { Hono } from 'hono';
import sql from './db';

const app = new Hono();

// Define what a Job looks like in TypeScript
interface Job {
  id: string;
  type: string;
  status: string;
  priority: number;
  payload: any;
}

// GET /stats endpoint (Required by assignment)
app.get('/stats', async (c) => {
  const stats = await sql`
    SELECT status, COUNT(*) as count 
    FROM job 
    GROUP BY status
  `;
  return c.json(stats);
});

// POST /process endpoint (The Core Logic)
app.post('/process', async (c) => {
  try {
    // This is the atomic "Find and Lock" query
    const jobs = await sql<Job[]>`
      UPDATE job
      SET status = 'processing', 
          updated_at = NOW(),
          attempts = attempts + 1
      WHERE id = (
        SELECT id
        FROM job
        WHERE status = 'pending'
        ORDER BY priority DESC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *;
    `;

    // Handle case: No jobs found
    if (jobs.length === 0) {
      return c.json({ message: 'No pending jobs found' }, 404);
    }

    const job = jobs[0]!;
    
    return c.json({
      message: 'Job picked up',
      job_id: job.id,
      type: job.type,
      payload: job.payload
    });

  } catch (error) {
    console.error(error);
    return c.json({ error: 'Database error' }, 500);
  }
});

export default { 
  port: 3000, 
  fetch: app.fetch, 
};

// POST /complete/{id} - Mark job as success
app.post('/complete/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json(); // Get the result payload
  const result = body.result;

  const updated = await sql`
    UPDATE job
    SET status = 'completed',
        result = ${result},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;

  if (updated.length === 0) {
    return c.json({ error: 'Job not found' }, 404);
  }

  return c.json({ message: 'Job completed', job: updated[0] });
});

// POST /fail/{id} - Mark job as failed (with Retry Logic)
app.post('/fail/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const error = body.error;

  // First, check the job's current attempts
  const jobs = await sql`SELECT attempts FROM job WHERE id = ${id}`;
  if (jobs.length === 0) return c.json({ error: 'Job not found' }, 404);
  
  const currentAttempts = jobs[0]!.attempts;
  
  // LOGIC: If attempts < 3, retry. Else, fail permanently.
  // Note: We already incremented 'attempts' when we picked it up in /process
  let newStatus = 'failed';
  if (currentAttempts < 3) {
    newStatus = 'pending'; // Reset to pending so it gets picked up again
  }

  const updated = await sql`
    UPDATE job
    SET status = ${newStatus},
        error = ${error},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;

  return c.json({ 
    message: newStatus === 'pending' ? 'Job scheduled for retry' : 'Job failed permanently', 
    job: updated[0]
  });
});