const express = require('express');
const router = express.Router();
const pool = require('../db');
const { notifyEmployee, notifyManagers } = require('./push');

// GET /api/requests
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, e.first_name, e.last_name, e.position
             FROM leave_requests r
             JOIN employees e ON r.employee_id = e.id
             ORDER BY r.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/requests/employee/:id
router.get('/employee/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, e.first_name, e.last_name, e.position
             FROM leave_requests r
             JOIN employees e ON r.employee_id = e.id
             WHERE r.employee_id = $1
             ORDER BY r.created_at DESC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/requests - submit new request
router.post('/', async (req, res) => {
    const { employee_id, leave_type, start_date, end_date, days, notes } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [employee_id, leave_type, start_date, end_date, days, notes]
        );

        const emp = await pool.query('SELECT first_name, last_name FROM employees WHERE id = $1', [employee_id]);
        const name = emp.rows[0] ? `${emp.rows[0].first_name} ${emp.rows[0].last_name}` : 'An employee';

        notifyManagers({
            title: 'New Leave Request',
            body: `${name} submitted a ${leave_type} request for ${days} day(s).`
        });

        res.json({ id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/requests/:id - approve or reject
router.put('/:id', async (req, res) => {
    const { status, approved_by } = req.body;
    try {
        await pool.query(
            'UPDATE leave_requests SET status = $1, approved_by = $2 WHERE id = $3',
            [status, approved_by, req.params.id]
        );

        const reqResult = await pool.query(
            'SELECT employee_id, leave_type, days FROM leave_requests WHERE id = $1',
            [req.params.id]
        );
        if (reqResult.rows.length > 0) {
            const { employee_id, leave_type, days } = reqResult.rows[0];
            const label = status === 'approved' ? 'approved' : 'rejected';
            notifyEmployee(employee_id, {
                title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                body: `Your ${leave_type} request for ${days} day(s) has been ${label}.`
            });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/requests/:id - edit request details (employee edits pending request)
router.patch('/:id', async (req, res) => {
    const { leave_type, start_date, end_date, days, notes } = req.body;
    try {
        await pool.query(
            'UPDATE leave_requests SET leave_type=$1, start_date=$2, end_date=$3, days=$4, notes=$5 WHERE id=$6',
            [leave_type, start_date, end_date, days, notes, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/requests/:id - delete a request
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM leave_requests WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
