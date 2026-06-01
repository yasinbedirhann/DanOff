const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');

jest.mock('../db', () => ({ query: jest.fn() }));
jest.mock('bcrypt');

const pool = require('../db');
const usersRouter = require('../routes/users');

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

const mockEmployee = {
    id: 1,
    first_name: 'Ana',
    last_name: 'Kovač',
    email: 'ana@danoff.ba',
    role: 'employee',
    position: 'Developer',
    entity: 'fbih',
    salary: 2500,
    phone: '+38761000000'
};

// ---------------------------------------------------------------------------
describe('GET /api/users', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns a list of all employees', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockEmployee] });

        const res = await request(app).get('/api/users');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].email).toBe('ana@danoff.ba');
    });

    it('does not expose the password field in the response', async () => {
        pool.query.mockResolvedValueOnce({ rows: [mockEmployee] });

        const res = await request(app).get('/api/users');

        expect(res.body[0].password).toBeUndefined();
    });

    it('returns 500 when the database throws an error', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/api/users');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});

// ---------------------------------------------------------------------------
describe('POST /api/users', () => {
    beforeEach(() => jest.clearAllMocks());

    it('creates a new employee and returns the new id', async () => {
        bcrypt.hash.mockResolvedValueOnce('$2b$10$hashed');
        pool.query.mockResolvedValueOnce({ rows: [{ id: 7 }] });

        const res = await request(app)
            .post('/api/users')
            .send({
                first_name: 'Marko',
                last_name: 'Marković',
                email: 'marko@danoff.ba',
                password: 'secret123',
                role: 'employee',
                position: 'Designer',
                entity: 'rs',
                salary: 2000,
                phone: '+38765111111'
            });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(7);
    });

    it('hashes the plain-text password before inserting into the database', async () => {
        bcrypt.hash.mockResolvedValueOnce('$2b$10$hashed');
        pool.query.mockResolvedValueOnce({ rows: [{ id: 8 }] });

        await request(app)
            .post('/api/users')
            .send({
                first_name: 'Test',
                last_name: 'User',
                email: 't@t.com',
                password: 'plaintext',
                role: 'employee',
                position: 'Tester',
                entity: 'fbih'
            });

        expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 10);
        const insertedPassword = pool.query.mock.calls[0][1][3];
        expect(insertedPassword).toBe('$2b$10$hashed');
        expect(insertedPassword).not.toBe('plaintext');
    });

    it('returns 500 when insertion fails (e.g. duplicate email)', async () => {
        bcrypt.hash.mockResolvedValueOnce('$2b$10$hashed');
        pool.query.mockRejectedValueOnce(new Error('duplicate key value'));

        const res = await request(app)
            .post('/api/users')
            .send({
                first_name: 'Ana',
                last_name: 'Kovač',
                email: 'ana@danoff.ba',
                password: 'secret',
                role: 'employee',
                position: 'Dev',
                entity: 'fbih'
            });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});

// ---------------------------------------------------------------------------
describe('PUT /api/users/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    it('updates employee data and returns success', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .put('/api/users/1')
            .send({
                first_name: 'Ana',
                last_name: 'Kovač',
                role: 'manager',
                entity: 'fbih',
                position: 'Team Lead',
                salary: 3500,
                phone: '+38761000000'
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('defaults entity to "fbih" when it is not provided in the request body', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        await request(app)
            .put('/api/users/1')
            .send({ first_name: 'Ana', last_name: 'Kovač', role: 'employee', position: 'Dev' });

        const queryArgs = pool.query.mock.calls[0][1];
        expect(queryArgs[3]).toBe('fbih');
    });

    it('returns 500 when the database throws an error', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app)
            .put('/api/users/1')
            .send({ first_name: 'Ana', last_name: 'Kovač', role: 'employee', entity: 'fbih', position: 'Dev' });

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});

// ---------------------------------------------------------------------------
describe('DELETE /api/users/:id', () => {
    beforeEach(() => jest.clearAllMocks());

    it('deletes an employee and returns success', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).delete('/api/users/1');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 500 when the database throws an error', async () => {
        pool.query.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).delete('/api/users/1');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Server error');
    });
});
