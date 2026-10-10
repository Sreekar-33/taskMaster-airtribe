const request = require('supertest');
const app = require('../src/app');
const { createUser, createTask, createTeam } = require('./helpers');

describe('Task Endpoints', () => {
    describe('POST /api/tasks', () => {
        it('should create a task', async () => {
            const { token } = await createUser();
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'New Task',
                    description: 'Task description',
                    priority: 'high',
                    dueDate: '2025-12-31T00:00:00.000Z'
                });

            expect(res.status).toBe(201);
            expect(res.body.task.title).toBe('New Task');
            expect(res.body.task.priority).toBe('high');
            expect(res.body.task.status).toBe('open');
        });

        it('should reject task without title', async () => {
            const { token } = await createUser();
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ description: 'no title' });

            expect(res.status).toBe(400);
        });

        it('should reject unauthenticated request', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .send({ title: 'Task' });

            expect(res.status).toBe(401);
        });

        it('should create task within a team', async () => {
            const { token } = await createUser();
            const team = await createTeam(token);
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Team Task', team: team._id });

            expect(res.status).toBe(201);
            expect(res.body.task.team).toBe(team._id);
        });

        it('should reject task in team user is not a member of', async () => {
            const { token: ownerToken } = await createUser();
            const { token: otherToken } = await createUser();
            const team = await createTeam(ownerToken);

            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ title: 'Sneaky Task', team: team._id });

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/tasks', () => {
        it('should list user tasks', async () => {
            const { token } = await createUser();
            await createTask(token, { title: 'Task A' });
            await createTask(token, { title: 'Task B' });

            const res = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.tasks.length).toBe(2);
            expect(res.body.pagination.total).toBe(2);
        });

        it('should filter tasks by status', async () => {
            const { token } = await createUser();
            await createTask(token, { title: 'Open Task' });
            const task = await createTask(token, { title: 'Done Task' });
            await request(app)
                .put(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'completed' });

            const res = await request(app)
                .get('/api/tasks?status=completed')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.tasks.length).toBe(1);
            expect(res.body.tasks[0].title).toBe('Done Task');
        });

        it('should filter tasks by priority', async () => {
            const { token } = await createUser();
            await createTask(token, { title: 'Low', priority: 'low' });
            await createTask(token, { title: 'High', priority: 'high' });

            const res = await request(app)
                .get('/api/tasks?priority=high')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.tasks.length).toBe(1);
            expect(res.body.tasks[0].title).toBe('High');
        });

        it('should not return tasks from other users', async () => {
            const { token: token1 } = await createUser();
            const { token: token2 } = await createUser();
            await createTask(token1, { title: 'User1 Task' });

            const res = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${token2}`);

            expect(res.status).toBe(200);
            expect(res.body.tasks.length).toBe(0);
        });

        it('should paginate results', async () => {
            const { token } = await createUser();
            for (let i = 0; i < 5; i++) {
                await createTask(token, { title: `Task ${i}` });
            }

            const res = await request(app)
                .get('/api/tasks?page=1&limit=2')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.tasks.length).toBe(2);
            expect(res.body.pagination.total).toBe(5);
            expect(res.body.pagination.pages).toBe(3);
        });

        it('should sort tasks', async () => {
            const { token } = await createUser();
            await createTask(token, { title: 'A Task' });
            await createTask(token, { title: 'B Task' });

            const res = await request(app)
                .get('/api/tasks?sortBy=title&order=asc')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.tasks[0].title).toBe('A Task');
            expect(res.body.tasks[1].title).toBe('B Task');
        });
    });

    describe('GET /api/tasks/my-tasks', () => {
        it('should return tasks assigned to user', async () => {
            const { token: creatorToken, user: creator } = await createUser();
            const { token: assigneeToken, user: assignee } = await createUser();

            await createTask(creatorToken, { title: 'Assigned', assignee: assignee._id });
            await createTask(creatorToken, { title: 'Not Assigned' });

            const res = await request(app)
                .get('/api/tasks/my-tasks')
                .set('Authorization', `Bearer ${assigneeToken}`);

            expect(res.status).toBe(200);
            expect(res.body.tasks.length).toBe(1);
            expect(res.body.tasks[0].title).toBe('Assigned');
        });
    });

    describe('GET /api/tasks/:id', () => {
        it('should get task by id for creator', async () => {
            const { token } = await createUser();
            const task = await createTask(token);

            const res = await request(app)
                .get(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.task._id).toBe(task._id);
        });

        it('should deny access to unrelated user', async () => {
            const { token: ownerToken } = await createUser();
            const { token: otherToken } = await createUser();
            const task = await createTask(ownerToken);

            const res = await request(app)
                .get(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
        });

        it('should return 404 for nonexistent task', async () => {
            const { token } = await createUser();
            const res = await request(app)
                .get('/api/tasks/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
        });
    });

    describe('PUT /api/tasks/:id', () => {
        it('should update task as creator', async () => {
            const { token } = await createUser();
            const task = await createTask(token);

            const res = await request(app)
                .put(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'Updated Title', status: 'completed' });

            expect(res.status).toBe(200);
            expect(res.body.task.title).toBe('Updated Title');
            expect(res.body.task.status).toBe('completed');
        });

        it('should update task as assignee', async () => {
            const { token: creatorToken } = await createUser();
            const { token: assigneeToken, user: assignee } = await createUser();
            const task = await createTask(creatorToken, { assignee: assignee._id });

            const res = await request(app)
                .put(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${assigneeToken}`)
                .send({ status: 'in_progress' });

            expect(res.status).toBe(200);
            expect(res.body.task.status).toBe('in_progress');
        });

        it('should deny update to unrelated user', async () => {
            const { token: ownerToken } = await createUser();
            const { token: otherToken } = await createUser();
            const task = await createTask(ownerToken);

            const res = await request(app)
                .put(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ title: 'Hacked' });

            expect(res.status).toBe(403);
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        it('should delete task as creator', async () => {
            const { token } = await createUser();
            const task = await createTask(token);

            const res = await request(app)
                .delete(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Task deleted.');

            const getRes = await request(app)
                .get(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(getRes.status).toBe(404);
        });

        it('should deny delete to non-creator', async () => {
            const { token: ownerToken } = await createUser();
            const { token: otherToken, user: other } = await createUser();
            const task = await createTask(ownerToken, { assignee: other._id });

            const res = await request(app)
                .delete(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('PUT /api/tasks/:id/assign', () => {
        it('should assign task to another user', async () => {
            const { token: creatorToken } = await createUser();
            const { user: assignee } = await createUser();
            const task = await createTask(creatorToken);

            const res = await request(app)
                .put(`/api/tasks/${task._id}/assign`)
                .set('Authorization', `Bearer ${creatorToken}`)
                .send({ assigneeId: assignee._id });

            expect(res.status).toBe(200);
            expect(res.body.task.assignee._id).toBe(assignee._id);
        });

        it('should deny assign by non-creator', async () => {
            const { token: creatorToken } = await createUser();
            const { token: otherToken, user: other } = await createUser();
            const task = await createTask(creatorToken, { assignee: other._id });

            const res = await request(app)
                .put(`/api/tasks/${task._id}/assign`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ assigneeId: other._id });

            expect(res.status).toBe(403);
        });
    });

    describe('Team task access', () => {
        it('should allow team members to view team tasks', async () => {
            const { token: ownerToken } = await createUser();
            const { token: memberToken } = await createUser();
            const team = await createTeam(ownerToken);

            await request(app)
                .post('/api/teams/join')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ inviteCode: team.inviteCode });

            await createTask(ownerToken, { title: 'Team Task', team: team._id });

            const res = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.status).toBe(200);
            expect(res.body.tasks.length).toBe(1);
            expect(res.body.tasks[0].title).toBe('Team Task');
        });
    });
});
