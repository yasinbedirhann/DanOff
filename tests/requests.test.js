const request = require('supertest');
const express = require('express');

jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('../routes/push', () => ({
    notifyEmployee: jest.fn().mockResolvedValue(undefined),
    notifyManagers: jest.fn().mockResolvedValue(undefined)
}));

const pool = require('../db');
const requestsRouter = require('../routes/requests');

const app = express();
app.use(express.json());
app.use('/api/requests', requestsRouter);

const mockLeaveRequest = {
    id: 1,
    employee_id: 10,
    leave_type: 'annual',
    start_date: '2026-06-01',
    end_date: '2026-06-05',
    days: 5,
    notes: 'Summer vacation',
    status: 'pending',
    first_name: 'Ana',
    last_name: 'Kovač',
    position: 'Developer'
};

// ---------------------------------------------------------------------------
describe('GET /api/requests', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns all leave requests', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockLeaveRequest] });

        const res = await request(app).get('/api/requests');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe(1);
    });

    it('returns 500 when the database throws an error', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/api/requests');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});

// ---------------------------------------------------------------------------
describe('GET /api/requests/employee/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns leave requests for a specific employee', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockLeaveRequest] });

        const res = await request(app).get('/api/requests/employee/10');

        expect(res.status).toBe(200);
        expect(res.body[0].employee_id).toBe(10);
    });

    it('returns an empty array when the employee has no requests', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/api/requests/employee/999');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
describe('POST /api/requests', () => {
    beforeEach(() => jest.clearAllMocks());

    it('creates a new leave request and returns its id', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 5 }] })
            .mockResolvedValueOnce({ rows: [{ first_name: 'Ana', last_name: 'Kovač' }] });

        const res = await request(app)
            .post('/api/requests')
            .send({
                employee_id: 10,
                leave_type: 'annual',
                start_date: '2026-06-01',
                end_date: '2026-06-05',
                days: 5,
                notes: 'Summer vacation'
            });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(5);
    });

    it('returns 500 when the database insert fails', async () => {
        pool.query.mockRejectedValueOnce(new Error('Insert failed'));

        const res = await request(app)
            .post('/api/requests')
            .send({
                employee_id: 10,
                leave_type: 'annual',
                start_date: '2026-06-01',
                end_date: '2026-06-05',
                days: 5,
                notes: ''
            });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});

// ---------------------------------------------------------------------------
describe('PUT /api/requests/:id  (approve / reject)', () => {
    beforeEach(() => jest.clearAllMocks());

    it('approves a leave request and returns success', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ employee_id: 10, leave_type: 'annual', days: 5 }] });

        const res = await request(app)
            .put('/api/requests/1')
            .send({ status: 'approved', approved_by: 2 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('rejects a leave request and returns success', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ employee_id: 10, leave_type: 'annual', days: 5 }] });

        const res = await request(app)
            .put('/api/requests/1')
            .send({ status: 'rejected', approved_by: 2 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 500 when the database throws an error', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
            .put('/api/requests/999')
            .send({ status: 'approved', approved_by: 2 });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});

// ---------------------------------------------------------------------------
describe('PATCH /api/requests/:id  (edit pending request)', () => {
    beforeEach(() => jest.clearAllMocks());

    it('edits a pending request and returns success', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .patch('/api/requests/1')
            .send({
                leave_type: 'sick',
                start_date: '2026-06-10',
                end_date: '2026-06-12',
                days: 3,
                notes: 'Flu'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 500 when the database throws an error', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
            .patch('/api/requests/1')
            .send({ leave_type: 'sick', start_date: '2026-06-10', end_date: '2026-06-12', days: 3 });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});

// ---------------------------------------------------------------------------
describe('DELETE /api/requests/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    it('deletes a request and returns success', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).delete('/api/requests/1');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 500 when the database throws an error', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).delete('/api/requests/1');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});
