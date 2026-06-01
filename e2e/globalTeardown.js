// Global teardown — runs once after all Playwright tests.
// Removes all E2E test users and their associated leave requests.
const { Pool } = require('pg');

module.exports = async function globalTeardown() {
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: 'MojasifrazaSQL01_@',
        port: 5432,
    });

    await pool.query(
        `DELETE FROM leave_requests
         WHERE employee_id IN (SELECT id FROM employees WHERE email LIKE 'e2e\\_%@danoff.ba' ESCAPE '\\')`
    );
    await pool.query(
        `DELETE FROM employees WHERE email LIKE 'e2e\\_%@danoff.ba' ESCAPE '\\'`
    );

    // Remove leave requests seeded for FBiH tests (notes-tagged rows)
    await pool.query(
        `DELETE FROM leave_requests
         WHERE notes IN ('approve-test','reject-test','admin-approve-test')`
    );

    await pool.end();
};
