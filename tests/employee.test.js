const request = require('supertest');
const express = require('express');

jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('../routes/push', () => ({
    notifyEmployee: jest.fn().mockResolvedValue(undefined),
    notifyManagers: jest.fn().mockResolvedValue(undefined)
}));

const pool = require('../db');
const { notifyEmployee } = require('../routes/push');
const { employees, leaveRequests } = require('./helpers/seedData');
const entities = require('../config/entities');
const requestsRouter = require('../routes/requests');

const app = express();
app.use(express.json());
app.use('/api/requests', requestsRouter);

const basePayload = {
    employee_id: employees.employee_fbih.id,
    start_date: '2026-07-01',
    end_date: '2026-07-08',
    days: 6,
    notes: 'Summer holiday'
};

// ---------------------------------------------------------------------------
describe('Leave request submission', () => {
    beforeEach(() => jest.clearAllMocks());

    it('1. Employee can submit an annual leave request', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 10 }] })
            .mockResolvedValueOnce({ rows: [{ first_name: 'Amar', last_name: 'Hodžić' }] });

        const res = await request(app)
            .post('/api/requests')
            .send({ ...basePayload, leave_type: 'annual' });

        expect(res.status).toBe(200);
        expect(res.body.id).toBeDefined();
    });

    it('2. Employee can submit a paid leave (sick) request', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 11 }] })
            .mockResolvedValueOnce({ rows: [{ first_name: 'Amar', last_name: 'Hodžić' }] });

        const res = await request(app)
            .post('/api/requests')
            .send({ ...basePayload, leave_type: 'sick', days: 3, notes: 'Medical appointment' });

        expect(res.status).toBe(200);
        expect(res.body.id).toBeDefined();
    });

    it('3. Employee can submit an unpaid leave (other) request', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 12 }] })
            .mockResolvedValueOnce({ rows: [{ first_name: 'Amar', last_name: 'Hodžić' }] });

        const res = await request(app)
            .post('/api/requests')
            .send({ ...basePayload, leave_type: 'other', notes: 'Personal reasons' });

        expect(res.status).toBe(200);
        expect(res.body.id).toBeDefined();
    });

    it('4. Submitting a request with missing required fields returns 500 (DB constraint violation)', async () => {
        pool.query.mockRejectedValueOnce(new Error('null value in column "employee_id"'));

        const res = await request(app)
            .post('/api/requests')
            .send({ leave_type: 'annual' }); // missing employee_id, dates, days

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});

// ---------------------------------------------------------------------------
describe('Viewing requests', () => {
    beforeEach(() => jest.clearAllMocks());

    it('5. Employee can retrieve their own leave request history', async () => {
        pool.query.mockResolvedValueOnce({ rows: [leaveRequests.pending_annual] });

        const res = await request(app)
            .get(`/api/requests/employee/${employees.employee_fbih.id}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].employee_id).toBe(employees.employee_fbih.id);
    });

    it('6. The API returns requests for any employee ID without access restriction (no server-side auth on this endpoint)', async () => {
        // Documents current behavior: there is no per-user access control enforced on
        // GET /api/requests/employee/:id — any caller can read any employee's history.
        pool.query.mockResolvedValueOnce({ rows: [leaveRequests.pending_annual] });

        const res = await request(app)
            .get(`/api/requests/employee/${employees.employee_fbih.id}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
describe('Editing requests', () => {
    beforeEach(() => jest.clearAllMocks());

    it('7. Employee can edit their own pending request', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .patch(`/api/requests/${leaveRequests.pending_annual.id}`)
            .send({ leave_type: 'sick', start_date: '2026-07-05', end_date: '2026-07-07', days: 3, notes: 'Updated' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('8. The API does not block editing of an approved request (server-side status check absent)', async () => {
        // Documents a security consideration: the PATCH endpoint does not verify
        // the current status before applying changes — approved-request protection
        // is enforced client-side only and is a candidate for a future server-side guard.
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .patch(`/api/requests/${leaveRequests.approved_annual.id}`)
            .send({ leave_type: 'sick', start_date: '2026-07-05', end_date: '2026-07-07', days: 3 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ---------------------------------------------------------------------------
describe('Cancelling requests', () => {
    beforeEach(() => jest.clearAllMocks());

    it('9. Employee can cancel (delete) their own pending request', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .delete(`/api/requests/${leaveRequests.pending_annual.id}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('10. The API does not block cancellation of an approved request (server-side status check absent)', async () => {
        // Same consideration as test 8 — DELETE also lacks a status pre-check.
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .delete(`/api/requests/${leaveRequests.approved_annual.id}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ---------------------------------------------------------------------------
describe('Leave entitlements per entity (config/entities.js)', () => {
    it('11. FBiH employees are entitled to 20 days of annual leave', () => {
        expect(entities.fbih.totalDays).toBe(20);
    });

    it('12. RS employees are entitled to 18 days of annual leave', () => {
        expect(entities.rs.totalDays).toBe(18);
    });

    it('13. Brčko Distrikt employees are entitled to 20 days of annual leave', () => {
        expect(entities.brcko.totalDays).toBe(20);
    });
});

// ---------------------------------------------------------------------------
describe('Push notifications received by employee', () => {
    beforeEach(() => jest.clearAllMocks());

    it('14. Employee receives a push notification when their request is approved', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ employee_id: employees.employee_fbih.id, leave_type: 'annual', days: 6 }] });

        await request(app)
            .put(`/api/requests/${leaveRequests.pending_annual.id}`)
            .send({ status: 'approved', approved_by: employees.manager_fbih.id });

        expect(notifyEmployee).toHaveBeenCalledWith(
            employees.employee_fbih.id,
            expect.objectContaining({ title: 'Leave Request Approved' })
        );
    });

    it('15. Employee receives a push notification when their request is rejected', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ employee_id: employees.employee_fbih.id, leave_type: 'annual', days: 6 }] });

        await request(app)
            .put(`/api/requests/${leaveRequests.pending_annual.id}`)
            .send({ status: 'rejected', approved_by: employees.manager_fbih.id });

        expect(notifyEmployee).toHaveBeenCalledWith(
            employees.employee_fbih.id,
            expect.objectContaining({ title: 'Leave Request Rejected' })
        );
    });
});
