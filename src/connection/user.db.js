
import pg from "pg";
const {Pool} = pg;

const pool = new Pool({
    connectionString:process.env.DB_URL
})

pool.on("error", (err) => {
    console.error("Unexpected database pool error:", err.message);
});

try {
    await pool.query("SELECT 1");
    console.log("Database connected successfully!");
} catch (error) {
    console.error("Database connection failed:", error.message);
}

export default pool;
