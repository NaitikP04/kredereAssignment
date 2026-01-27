const BASE_URL = 'http://localhost:3000';

// Helper to make requests
async function post(endpoint: string, body?: object): Promise<any> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    return response.json();
}

// Test the retry logic: job should retry 3 times then fail permanently
async function testRetryLogic() {
    console.log('\n=== Testing Retry Logic ===\n');

    // Step 1: Pick up a pending job
    console.log('Step 1: Picking up a pending job...');
    const processResult = await post('/process');
    
    if (processResult.error || !processResult.job_id) {
        console.log('No pending jobs available. Create some jobs first using seed.py');
        return;
    }
    
    const jobId = processResult.job_id;
    console.log(`Picked up job: ${jobId}`);
    console.log(`Job type: ${processResult.type}`);

    // Step 2: Fail the job multiple times to test retry
    for (let attempt = 1; attempt <= 4; attempt++) {
        console.log(`\n--- Attempt ${attempt} ---`);
        
        // Fail the current job
        const failResult = await post(`/fail/${jobId}`, { 
            error: `Test failure #${attempt}` 
        });
        
        console.log(`Status after fail: ${failResult.job.status}`);
        console.log(`Attempts so far: ${failResult.job.attempts}`);
        console.log(`Message: ${failResult.message}`);

        // If job is still pending, we need to process it again to simulate worker picking it up
        if (failResult.job.status === 'pending') {
            console.log('Job reset to pending - picking it up again...');
            
            // Pick up the same job again (it should be the highest priority pending)
            const retryProcess = await post('/process');
            
            if (retryProcess.job_id !== jobId) {
                console.log(`Warning: Different job picked up. Expected ${jobId}, got ${retryProcess.job_id}`);
            }
        } else if (failResult.job.status === 'failed') {
            console.log('\n✓ Job failed permanently after max retries!');
            break;
        }
    }

    console.log('\n=== Retry Logic Test Complete ===\n');
}

// Run the tests
async function main() {
    try {
        await testRetryLogic();
    } catch (error) {
        console.error('Test error:', error);
    }
}

// Run with bun run test.ts
main();