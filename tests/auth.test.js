const request = require('supertest');
const app = require('../src/app');
const { createUser } = require('./helpers');

describe('Auth Endpoints', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'John Doe', email: 'john@example.com', password: 'password123' });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('Registration successful.');
            expect(res.body.user).toHaveProperty('_id');
            expect(res.body.user.name).toBe('John Doe');
            expect(res.body.user.email).toBe('john@example.com');
            expect(res.body.user).not.toHaveProperty('password');
            expect(res.body.token).toBeDefined();
        });

        it('should reject duplicate email', async () => {
            await createUser({ email: 'dup@example.com' });
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Dup', email: 'dup@example.com', password: 'password123' });

            expect(res.status).toBe(409);
            expect(res.body.error).toContain('already exists');
        });

        it('should reject missing name', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'x@example.com', password: 'password123' });

            expect(res.status).toBe(400);
        });

        it('should reject invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'X', email: 'notanemail', password: 'password123' });

            expect(res.status).toBe(400);
        });

        it('should reject short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'X', email: 'x@example.com', password: '123' });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            await createUser({ email: 'login@example.com', password: 'password123' });
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'login@example.com', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Login successful.');
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe('login@example.com');
        });

        it('should reject wrong password', async () => {
            await createUser({ email: 'wrong@example.com', password: 'password123' });
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'wrong@example.com', password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body.error).toContain('Invalid');
        });

        it('should reject nonexistent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nobody@example.com', password: 'password123' });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/auth/profile', () => {
        it('should return user profile with valid token', async () => {
            const { token } = await createUser({ name: 'Profile User' });
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.user.name).toBe('Profile User');
            expect(res.body.user).not.toHaveProperty('password');
        });

        it('should reject request without token', async () => {
            const res = await request(app).get('/api/auth/profile');
            expect(res.status).toBe(401);
        });

        it('should reject invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalidtoken');
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/auth/profile', () => {
        it('should update user name', async () => {
            const { token } = await createUser();
            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Updated Name' });

            expect(res.status).toBe(200);
            expect(res.body.user.name).toBe('Updated Name');
        });

        it('should update user email', async () => {
            const { token } = await createUser();
            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ email: 'newemail@example.com' });

            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe('newemail@example.com');
        });
    });

    describe('PUT /api/auth/change-password', () => {
        it('should change password with correct current password', async () => {
            const { token } = await createUser({ email: 'cp@example.com', password: 'oldpass123' });
            const res = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: 'oldpass123', newPassword: 'newpass456' });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Password changed successfully.');

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'cp@example.com', password: 'newpass456' });
            expect(loginRes.status).toBe(200);
        });

        it('should reject wrong current password', async () => {
            const { token } = await createUser({ password: 'mypass123' });
            const res = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: 'wrongpass', newPassword: 'newpass456' });

            expect(res.status).toBe(401);
        });

        it('should reject short new password', async () => {
            const { token } = await createUser({ password: 'mypass123' });
            const res = await request(app)
                .put('/api/auth/change-password')
                .set('Authorization', `Bearer ${token}`)
                .send({ currentPassword: 'mypass123', newPassword: '12' });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const { token } = await createUser();
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Logged out successfully.');
        });
    });
});
