const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');

jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('bcrypt');
jest.mock('../routes/push', () => ({
    notifyEmployee: jest.fn().mockResolvedValue(undefined),
    notifyManagers: jest.fn().mockResolvedValue(undefined)
}));

const pool = require('../db');
const { employees, leaveRequests } = require('./helpers/seedData');
const usersRouter = require('../routes/users');
const requestsRouter = require('../routes/requests');

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);
app.use('/api/requests', requestsRouter);

const newEmployeeBase = {
    first_name: 'Test', last_name: 'Korisnik',
    email: 'test@danoff.ba', password: 'testpass123',
    position: 'Tester', salary: 2000, phone: '+38761000000'
};

// ---------------------------------------------------------------------------
describe('Admin — employee management', () => {
    beforeEach(() => jest.clearAllMocks());

    it('1. Admin can view all employees', async () => {
        pool.query.mockResolvedValueOnce({ rows: Object.values(employees) });

        const res = await request(app).get('/api/users');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(9);
    });

    it('2. Admin can create a new employee in FBiH', async () => {
        bcrypt.hash.mockResolvedValueOnce('$2b$10$hashed');
        pool.query.mockResolvedValueOnce({ rows: [{ id: 20 }] });

        const res = await request(app)
            .post('/api/users')
            .send({ ...newEmployeeBase, role: 'employee', entity: 'fbih' });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(20);
    });

    it('3. Admin can create a new employee in Republika Srpska', async () => {
        bcrypt.hash.mockResolvedValueOnce('$2b$10$hashed');
        pool.query.mockResolvedValueOnce({ rows: [{ id: 21 }] });

        const res = await request(app)
            .post('/api/users')
            .send({ ...newEmployeeBase, email: 'test_rs@danoff.ba', role: 'employee', entity: 'rs' });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(21);
    });

    it('4. Admin can create a new employee in Brčko Distrikt', async () => {
        bcrypt.hash.mockResolvedValueOnce('$2b$10$hashed');
        pool.query.mockResolvedValueOnce({ rows: [{ id: 22 }] });

        const res = await request(app)
            .post('/api/users')
            .send({ ...newEmployeeBase, email: 'test_brcko@danoff.ba', role: 'employee', entity: 'brcko' });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(22);
    });

    it('5. Admin can update an existing employee\'s details', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .put(`/api/users/${employees.employee_fbih.id}`)
            .send({
                first_name: 'Amar', last_name: 'Hodžić',
                role: 'employee', entity: 'fbih',
                position: 'Senior Developer', salary: 3000, phone: '+38761111111'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('6. Admin can delete an employee', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .delete(`/api/users/${employees.employee_fbih.id}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('7. Creating an employee with a duplicate email returns 500', async () => {
        bcrypt.hash.mockResolvedValueOnce('$2b$10$hashed');
        pool.query.mockRejectedValueOnce(new Error('duplicate key value violates unique constraint "employees_email_key"'));

        const res = await request(app)
            .post('/api/users')
            .send({ ...newEmployeeBase, role: 'employee', entity: 'fbih' }); // same email as test 2

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });

    it('12. The password is bcrypt-hashed before being stored — plain text never reaches the database', async () => {
        bcrypt.hash.mockResolvedValueOnce('$2b$10$securehash');
        pool.query.mockResolvedValueOnce({ rows: [{ id: 30 }] });

        await request(app)
            .post('/api/users')
            .send({ ...newEmployeeBase, role: 'employee', entity: 'fbih' });

        expect(bcrypt.hash).toHaveBeenCalledWith('testpass123', 10);
        const insertedPassword = pool.query.mock.calls[0][1][3]; // 4th parameter in INSERT
        expect(insertedPassword).toBe('$2b$10$securehash');
        expect(insertedPassword).not.toBe('testpass123');
    });

    it('13. Admin can create a manager account', async () => {
        bcrypt.hash.mockResolvedValueOnce('$2b$10$hashed');
        pool.query.mockResolvedValueOnce({ rows: [{ id: 31 }] });

        const res = await request(app)
            .post('/api/users')
            .send({ ...newEmployeeBase, email: 'mgr@danoff.ba', role: 'manager', entity: 'fbih' });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(31);
    });

    it('14. Admin can create another admin account', async () => {
        bcrypt.hash.mockResolvedValueOnce('$2b$10$hashed');
        pool.query.mockResolvedValueOnce({ rows: [{ id: 32 }] });

        const res = await request(app)
            .post('/api/users')
            .send({ ...newEmployeeBase, email: 'admin2@danoff.ba', role: 'admin', entity: 'fbih' });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(32);
    });

    it('15. Database error on any admin operation returns 500', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB connection lost'));

        const res = await request(app).get('/api/users');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});

// ---------------------------------------------------------------------------
describe('Admin — leave request management', () => {
    beforeEach(() => jest.clearAllMocks());

    it('8. Admin can view all leave requests across all entities', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [leaveRequests.pending_annual, leaveRequests.approved_annual, leaveRequests.pending_sick_rs]
        });

        const res = await request(app).get('/api/requests');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // Requests from both FBiH and RS employees are returned
        const employeeIds = res.body.map(r => r.employee_id);
        expect(employeeIds).toContain(employees.employee_fbih.id);  // FBiH
        expect(employeeIds).toContain(employees.employee_rs.id);    // RS
    });

    it('9. Admin can approve any leave request', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ employee_id: employees.employee_rs.id, leave_type: 'sick', days: 3 }] });

        const res = await request(app)
            .put(`/api/requests/${leaveRequests.pending_sick_rs.id}`)
            .send({ status: 'approved', approved_by: employees.admin_fbih.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('10. Admin can reject any leave request', async () => {
        pool.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ employee_id: employees.employee_fbih.id, leave_type: 'annual', days: 6 }] });

        const res = await request(app)
            .put(`/api/requests/${leaveRequests.pending_annual.id}`)
            .send({ status: 'rejected', approved_by: employees.admin_fbih.id });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('11. Admin can delete any leave request', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .delete(`/api/requests/${leaveRequests.approved_annual.id}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
