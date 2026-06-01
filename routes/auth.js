const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM employees WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.role !== role) {
            return res.status(401).json({ error: 'Role mismatch' });
        }

        res.json({
            id: user.id,
            name: user.first_name + ' ' + user.last_name,
            email: user.email,
            role: user.role,
            position: user.position,
            entity: user.entity
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
