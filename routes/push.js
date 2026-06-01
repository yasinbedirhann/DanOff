const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const pool = require('../db');

const VAPID_PUBLIC  = 'BBA9A5PR1Srbhlp4ebUm2-gizrq5-b_fZCpc6bx-Isc4208s0KuYmM4j0PobaDhclHuk39weMhU-gWkm7_d1hVU';
const VAPID_PRIVATE = 'PuDR1i_EGZ7gd4jk35NfYUr59X-1XCrPIx-HlrTMwV0';

webpush.setVapidDetails('mailto:admin@danoff.ba', VAPID_PUBLIC, VAPID_PRIVATE);

// POST /api/push/subscribe
router.post('/subscribe', async (req, res) => {
    const { employee_id, subscription } = req.body;
    const { endpoint, keys } = subscription;
    try {
        await pool.query(
            `INSERT INTO push_subscriptions (employee_id, endpoint, p256dh, auth)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (endpoint) DO UPDATE SET employee_id = $1, p256dh = $3, auth = $4`,
            [employee_id, endpoint, keys.p256dh, keys.auth]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/push/vapidPublicKey
router.get('/vapidPublicKey', (req, res) => {
    res.json({ key: VAPID_PUBLIC });
});

async function sendToSubscription(row, payload) {
    const sub = { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } };
    await webpush.sendNotification(sub, JSON.stringify(payload)).catch(err => {
        if (err.statusCode === 410) {
            pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [row.endpoint]);
        }
    });
}

async function notifyEmployee(employeeId, payload) {
    try {
        const result = await pool.query(
            'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE employee_id = $1',
            [employeeId]
        );
        for (const row of result.rows) await sendToSubscription(row, payload);
    } catch (err) {
        console.error('Push error:', err.message);
    }
}

async function notifyManagers(payload) {
    try {
        const result = await pool.query(
            `SELECT ps.endpoint, ps.p256dh, ps.auth
             FROM push_subscriptions ps
             JOIN employees e ON ps.employee_id = e.id
             WHERE e.role IN ('manager', 'admin')`
        );
        for (const row of result.rows) await sendToSubscription(row, payload);
    } catch (err) {
        console.error('Push error:', err.message);
    }
}

module.exports = { router, notifyEmployee, notifyManagers };
