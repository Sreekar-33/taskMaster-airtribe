const request = require('supertest');
const app = require('../src/app');

const createUser = async (overrides = {}) => {
    const userData = {
        name: 'Test User',
        email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
        password: 'password123',
        ...overrides
    };
    const res = await request(app).post('/api/auth/register').send(userData);
    return { user: res.body.user, token: res.body.token, password: userData.password };
};

const createTask = async (token, overrides = {}) => {
    const taskData = {
        title: 'Test Task',
        description: 'Test description',
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        ...overrides
    };
    const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(taskData);
    return res.body.task;
};

const createTeam = async (token, overrides = {}) => {
    const teamData = {
        name: 'Test Team',
        description: 'A test team',
        ...overrides
    };
    const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .send(teamData);
    return res.body.team;
};

module.exports = { createUser, createTask, createTeam };
