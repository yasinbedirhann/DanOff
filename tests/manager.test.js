const request = require('supertest');
const express = require('express');

jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('../routes/push', () => ({
    notifyEmployee: jest.fn().mockResolvedValue(undefined),
    notifyManagers: jest.fn().mockResolvedValue(undefined)
}));

const pool = require('../db');
const { notifyEmployee, notifyManagers } = require('../routes/push');
const { employees, leaveRequests } = require('./helpers/seedData');
const requestsRouter = require('../routes/requests');
const usersRouter = require('../routes/users');

const app = express();
app.use(express.json());
app.use('/api/requests', requestsRouter);
app.use('/api/users', usersRouter);

// ---------------------------------------------------------------------------
describe('Manager — viewing requests', () => {
    beforeEach(() => jest.clearAllMocks());

    it('1. Manager can view all leave requests across all employees and statuses', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [leaveRequests.pending_annual, leaveRequests.approved_annual, leaveRequests.pending_sick_rs]
        });

        const res = await request(app).get('/api/requests');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(3);
    });

    it('7. Manager can filter requests by a specific employee', async () => {
        pool.query.mockResolvedValueOnce({ rows: [leaveRequests.pending_annual] });

        const res = await request(app)
            .get(`/api/requests/employee/${employees.employee_fbih.id}`);

        expect(res.status).toBe(200);
        expect(res.body[0].employee_id).toBe(employees.employee_fbih.id);
    });
});

// ---------------------------------------------------------------------------
describe('Manager — approving and rejecting requests', () => {
    beforeEach(() => jest.clearAllMocks());

    it('2. Manager can approve a pending request', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ employee_id: employees.employee_fbih.id, leave_type: 'annual', days: 6 }] });

        const res = await request(app)
            .put(`/api/requests/${leaveRequests.pending_annual.id}`)
            .send({ status: 'approved', approved_by: employees.manager_fbih.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('3. Manager can reject a pending request', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ employee_id: employees.employee_fbih.id, leave_type: 'annual', days: 6 }] });

        const res = await request(app)
            .put(`/api/requests/${leaveRequests.pending_annual.id}`)
            .send({ status: 'rejected', approved_by: employees.manager_fbih.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('4. Approving an already-approved request succeeds — the API overwrites status without checking the current state', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ employee_id: employees.employee_fbih.id, leave_type: 'annual', days: 5 }] });

        const res = await request(app)
            .put(`/api/requests/${leaveRequests.approved_annual.id}`)
            .send({ status: 'approved', approved_by: employees.manager_fbih.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('8. Approving a request triggers a push notification to the employee', async () => {
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

    it('9. Rejecting a request triggers a push notification to the employee', async () => {
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

    it('10. Database error during approve/reject returns 500', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
            .put('/api/requests/999')
            .send({ status: 'approved', approved_by: employees.manager_fbih.id });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});

// ---------------------------------------------------------------------------
describe('Manager — team visibility and notifications', () => {
    beforeEach(() => jest.clearAllMocks());

    it('5. Manager can view all team members via GET /api/users', async () => {
        pool.query.mockResolvedValueOnce({ rows: Object.values(employees) });

        const res = await request(app).get('/api/users');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(9);
    });

    it('6. Submitting a new leave request triggers a push notification to all managers/admins', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [{ id: 50 }] })
            .mockResolvedValueOnce({ rows: [{ first_name: 'Amar', last_name: 'Hodžić' }] });

        await request(app)
            .post('/api/requests')
            .send({
                employee_id: employees.employee_fbih.id,
                leave_type: 'annual',
                start_date: '2026-08-01',
                end_date: '2026-08-05',
                days: 4,
                notes: ''
            });

        expect(notifyManagers).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'New Leave Request' })
        );
    });
});
