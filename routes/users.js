const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

// GET /api/users - get all employees
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, first_name, last_name, email, role, position, entity, salary, phone FROM employees ORDER BY last_name'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/users - create new employee
router.post('/', async (req, res) => {
    const { first_name, last_name, email, password, role, position, entity, salary, phone } = req.body;
    try {
        const hashed = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO employees (first_name, last_name, email, password, role, position, entity, salary, phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
            [first_name, last_name, email, hashed, role, position, entity, salary || 0, phone || '']
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/users/:id - update employee
router.put('/:id', async (req, res) => {
    const { first_name, last_name, role, entity, position, salary, phone } = req.body;
    try {
        await pool.query(
            'UPDATE employees SET first_name=$1, last_name=$2, role=$3, entity=$4, position=$5, salary=$6, phone=$7 WHERE id=$8',
            [first_name, last_name, role, entity || 'fbih', position, salary || 0, phone || '', req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/users/:id - delete employee
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
