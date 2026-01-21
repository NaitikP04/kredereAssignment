import postgres from 'postgres';

// Database connection string
// Same database URL the Python service uses
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/taskqueue';

// Create the connection object
const sql = postgres(connectionString);

export default sql;