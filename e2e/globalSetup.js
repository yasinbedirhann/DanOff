// Global setup — runs once before all Playwright tests.
// Seeds the database with E2E test users and pre-approved requests for document tests.
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

module.exports = async function globalSetup() {
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: 'MojasifrazaSQL01_@',
        port: 5432,
    });

    // Wipe any leftovers from a previous run
    await pool.query(
        `DELETE FROM leave_requests
         WHERE employee_id IN (SELECT id FROM employees WHERE email LIKE 'e2e\\_%@danoff.ba' ESCAPE '\\')`
    );
    await pool.query(
        `DELETE FROM employees WHERE email LIKE 'e2e\\_%@danoff.ba' ESCAPE '\\'`
    );

    const hash = await bcrypt.hash('pass123', 10);

    // ---------- Test employees ----------
    const rsResult = await pool.query(
        `INSERT INTO employees (first_name, last_name, email, password, role, entity, position, salary, phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        ['Petra', 'Testić', 'e2e_rs@danoff.ba', hash, 'employee', 'rs', 'RS Analyst', 2200, '+38765444444']
    );
    const rsId = rsResult.rows[0].id;

    const brckoResult = await pool.query(
        `INSERT INTO employees (first_name, last_name, email, password, role, entity, position, salary, phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        ['Lejla', 'Begić', 'e2e_brcko@danoff.ba', hash, 'employee', 'brcko', 'BD Specialist', 2300, '+38761777777']
    );
    const brckoId = brckoResult.rows[0].id;

    // Manager (FBiH) — used to supply approved_by FK below (id=2 = menadzer@danoff.ba)
    const managerId = 2;

    // ---------- Approved requests for document tests ----------
    // FBiH annual (Amar Hodžić, id=1)
    await pool.query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, status, notes, approved_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [1, 'annual', '2026-08-03', '2026-08-07', 5, 'approved', '', managerId]
    );
    // FBiH unpaid (Amar)
    await pool.query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, status, notes, approved_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [1, 'other', '2026-09-01', '2026-09-03', 3, 'approved', '', managerId]
    );

    // RS annual (Petra Testić)
    await pool.query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, status, notes, approved_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [rsId, 'annual', '2026-08-03', '2026-08-06', 4, 'approved', '', managerId]
    );
    // RS paid/sick (Petra)
    await pool.query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, status, notes, approved_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [rsId, 'sick', '2026-09-01', '2026-09-02', 2, 'approved', '', managerId]
    );

    // Brčko annual (Lejla Begić)
    await pool.query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, status, notes, approved_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [brckoId, 'annual', '2026-08-03', '2026-08-06', 4, 'approved', '', managerId]
    );

    // ---------- Pending requests for manager approval/rejection tests ----------
    // pending_approve: will be approved by test 25
    await pool.query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [1, 'annual', '2026-10-05', '2026-10-09', 5, 'pending', 'approve-test']
    );
    // pending_reject: will be rejected by test 26
    await pool.query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [1, 'annual', '2026-11-02', '2026-11-06', 5, 'pending', 'reject-test']
    );
    // pending_admin: for admin approval test (test 40)
    await pool.query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [1, 'annual', '2026-12-01', '2026-12-05', 5, 'pending', 'admin-approve-test']
    );

    await pool.end();
};
