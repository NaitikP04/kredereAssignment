import postgres from 'postgres';

// The "Shared Brain" connection string
// Notice it is the exact same database URL the Python service uses
const connectionString = 'postgres://postgres:postgres@localhost:5432/taskqueue';

// Create the connection object
const sql = postgres(connectionString);

export default sql;