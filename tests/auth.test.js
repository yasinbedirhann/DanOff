const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');

jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('bcrypt');

const pool = require('../db');
const { employees } = require('./helpers/seedData');
const authRouter = require('../routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('POST /api/auth/login', () => {
    beforeEach(() => jest.clearAllMocks());

    // --- Positive cases ---

    it('1. Returns 200 and correct user data for valid employee credentials', async () => {
        pool.query.mockResolvedValueOnce({ rows: [employees.employee_fbih] });
        bcrypt.compare.mockResolvedValueOnce(true);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: employees.employee_fbih.email, password: 'pass123', role: 'employee' });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            id: employees.employee_fbih.id,
            name: 'Amar Hodžić',
            email: employees.employee_fbih.email,
            role: 'employee',
            entity: 'fbih'
        });
    });

    it('2. Returns 200 and correct user data for valid manager credentials', async () => {
        pool.query.mockResolvedValueOnce({ rows: [employees.manager_fbih] });
        bcrypt.compare.mockResolvedValueOnce(true);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: employees.manager_fbih.email, password: 'pass123', role: 'manager' });

        expect(res.status).toBe(200);
        expect(res.body.role).toBe('manager');
        expect(res.body.name).toBe('Emina Hadžić');
    });

    it('3. Returns 200 and correct user data for valid admin credentials', async () => {
        pool.query.mockResolvedValueOnce({ rows: [employees.admin_fbih] });
        bcrypt.compare.mockResolvedValueOnce(true);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: employees.admin_fbih.email, password: 'admin123', role: 'admin' });

        expect(res.status).toBe(200);
        expect(res.body.role).toBe('admin');
    });

    it('4. Never returns the password hash in the response body', async () => {
        pool.query.mockResolvedValueOnce({ rows: [employees.employee_fbih] });
        bcrypt.compare.mockResolvedValueOnce(true);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: employees.employee_fbih.email, password: 'pass123', role: 'employee' });

        expect(res.body.password).toBeUndefined();
    });

    // --- Negative cases ---

    it('5. Returns 401 when the email does not exist in the database', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'ghost@danoff.ba', password: 'pass123', role: 'employee' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });

    it('6. Returns 401 when the password is incorrect', async () => {
        pool.query.mockResolvedValueOnce({ rows: [employees.employee_fbih] });
        bcrypt.compare.mockResolvedValueOnce(false);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: employees.employee_fbih.email, password: 'wrongpassword', role: 'employee' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });

    it('7. Returns 401 when an employee tries to log in under the manager role', async () => {
        pool.query.mockResolvedValueOnce({ rows: [employees.employee_fbih] });
        bcrypt.compare.mockResolvedValueOnce(true);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: employees.employee_fbih.email, password: 'pass123', role: 'manager' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Role mismatch');
    });

    it('8. Returns 401 when the email field is missing from the request body', async () => {
        // Query with undefined email finds no user
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: 'pass123', role: 'employee' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });

    it('9. Returns 500 when the password field is missing (bcrypt cannot compare undefined)', async () => {
        pool.query.mockResolvedValueOnce({ rows: [employees.employee_fbih] });
        bcrypt.compare.mockRejectedValueOnce(new Error('data and encrypted must be strings'));

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: employees.employee_fbih.email, role: 'employee' });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });

    it('10. Returns 500 when the database throws an error', async () => {
        pool.query.mockRejectedValueOnce(new Error('Connection refused'));

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'any@danoff.ba', password: 'pass123', role: 'employee' });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});
