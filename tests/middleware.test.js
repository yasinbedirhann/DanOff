const request = require('supertest');
const express = require('express');

jest.mock('../db', () => ({ query: jest.fn() }));
// web-push is loaded when routes/push.js is required; mock it to avoid real VAPID setup.
jest.mock('web-push', () => ({
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn()
}));

const pool = require('../db');
const requireAuth = require('../middleware/auth');
const { router: pushRouter } = require('../routes/push');

// A minimal protected route to test the middleware in isolation
const authApp = express();
authApp.use(express.json());
authApp.get('/protected', requireAuth, (req, res) => res.json({ user: req.user }));

// App for push-notification endpoint tests
const pushApp = express();
pushApp.use(express.json());
pushApp.use('/api/push', pushRouter);

// ---------------------------------------------------------------------------
describe('requireAuth middleware', () => {
    beforeEach(() => jest.clearAllMocks());

    it('1. Returns 401 when the x-user-id header is missing', async () => {
        const res = await request(authApp).get('/protected');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Unauthorized');
    });

    it('2. Calls next() and attaches the user object to req when x-user-id resolves to a real user', async () => {
        pool.query.mockResolvedValueOnce({ rows: [{ id: 1, role: 'employee' }] });

        const res = await request(authApp)
            .get('/protected')
            .set('x-user-id', '1');

        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({ id: 1, role: 'employee' });
    });

    it('3. Returns 401 when x-user-id does not match any record in the database', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(authApp)
            .get('/protected')
            .set('x-user-id', '9999');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Unauthorized');
    });

    it('4. Returns 500 when the database throws an error during the auth check', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB connection lost'));

        const res = await request(authApp)
            .get('/protected')
            .set('x-user-id', '1');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});

// ---------------------------------------------------------------------------
describe('Push notification endpoints', () => {
    beforeEach(() => jest.clearAllMocks());

    it('5. POST /api/push/subscribe saves the subscription and returns success', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(pushApp)
            .post('/api/push/subscribe')
            .send({
                employee_id: 1,
                subscription: {
                    endpoint: 'https://push.example.com/endpoint/abc',
                    keys: { p256dh: 'key123abc', auth: 'auth456xyz' }
                }
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('6. GET /api/push/vapidPublicKey returns a non-empty VAPID public key string', async () => {
        const res = await request(pushApp).get('/api/push/vapidPublicKey');

        expect(res.status).toBe(200);
        expect(typeof res.body.key).toBe('string');
        expect(res.body.key.length).toBeGreaterThan(10);
    });
});
