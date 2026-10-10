const request = require('supertest');
const app = require('../src/app');
const { createUser, createTask } = require('./helpers');

describe('Comment Endpoints', () => {
    describe('POST /api/tasks/:taskId/comments', () => {
        it('should add a comment as task creator', async () => {
            const { token } = await createUser();
            const task = await createTask(token);

            const res = await request(app)
                .post(`/api/tasks/${task._id}/comments`)
                .set('Authorization', `Bearer ${token}`)
                .send({ content: 'Great progress!' });

            expect(res.status).toBe(201);
            expect(res.body.comment.content).toBe('Great progress!');
            expect(res.body.comment.author).toBeDefined();
        });

        it('should add a comment as task assignee', async () => {
            const { token: creatorToken } = await createUser();
            const { token: assigneeToken, user: assignee } = await createUser();
            const task = await createTask(creatorToken, { assignee: assignee._id });

            const res = await request(app)
                .post(`/api/tasks/${task._id}/comments`)
                .set('Authorization', `Bearer ${assigneeToken}`)
                .send({ content: 'Working on it.' });

            expect(res.status).toBe(201);
        });

        it('should deny comment from unrelated user', async () => {
            const { token: creatorToken } = await createUser();
            const { token: otherToken } = await createUser();
            const task = await createTask(creatorToken);

            const res = await request(app)
                .post(`/api/tasks/${task._id}/comments`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ content: 'Snooping' });

            expect(res.status).toBe(403);
        });

        it('should reject empty comment', async () => {
            const { token } = await createUser();
            const task = await createTask(token);

            const res = await request(app)
                .post(`/api/tasks/${task._id}/comments`)
                .set('Authorization', `Bearer ${token}`)
                .send({ content: '' });

            expect(res.status).toBe(400);
        });

        it('should return 404 for nonexistent task', async () => {
            const { token } = await createUser();
            const res = await request(app)
                .post('/api/tasks/507f1f77bcf86cd799439011/comments')
                .set('Authorization', `Bearer ${token}`)
                .send({ content: 'Hello' });

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/tasks/:taskId/comments', () => {
        it('should list comments with pagination', async () => {
            const { token } = await createUser();
            const task = await createTask(token);

            for (let i = 0; i < 3; i++) {
                await request(app)
                    .post(`/api/tasks/${task._id}/comments`)
                    .set('Authorization', `Bearer ${token}`)
                    .send({ content: `Comment ${i}` });
            }

            const res = await request(app)
                .get(`/api/tasks/${task._id}/comments?page=1&limit=2`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.comments.length).toBe(2);
            expect(res.body.pagination.total).toBe(3);
            expect(res.body.pagination.pages).toBe(2);
        });
    });

    describe('PUT /api/tasks/:taskId/comments/:commentId', () => {
        it('should update own comment', async () => {
            const { token } = await createUser();
            const task = await createTask(token);

            const commentRes = await request(app)
                .post(`/api/tasks/${task._id}/comments`)
                .set('Authorization', `Bearer ${token}`)
                .send({ content: 'Original' });

            const res = await request(app)
                .put(`/api/tasks/${task._id}/comments/${commentRes.body.comment._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ content: 'Edited' });

            expect(res.status).toBe(200);
            expect(res.body.comment.content).toBe('Edited');
        });

        it('should deny editing another users comment', async () => {
            const { token: creatorToken } = await createUser();
            const { token: assigneeToken, user: assignee } = await createUser();
            const task = await createTask(creatorToken, { assignee: assignee._id });

            const commentRes = await request(app)
                .post(`/api/tasks/${task._id}/comments`)
                .set('Authorization', `Bearer ${creatorToken}`)
                .send({ content: 'Creators comment' });

            const res = await request(app)
                .put(`/api/tasks/${task._id}/comments/${commentRes.body.comment._id}`)
                .set('Authorization', `Bearer ${assigneeToken}`)
                .send({ content: 'Hijacked' });

            expect(res.status).toBe(403);
        });
    });

    describe('DELETE /api/tasks/:taskId/comments/:commentId', () => {
        it('should delete own comment', async () => {
            const { token } = await createUser();
            const task = await createTask(token);

            const commentRes = await request(app)
                .post(`/api/tasks/${task._id}/comments`)
                .set('Authorization', `Bearer ${token}`)
                .send({ content: 'To be deleted' });

            const res = await request(app)
                .delete(`/api/tasks/${task._id}/comments/${commentRes.body.comment._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Comment deleted.');
        });

        it('should deny deleting another users comment', async () => {
            const { token: creatorToken } = await createUser();
            const { token: assigneeToken, user: assignee } = await createUser();
            const task = await createTask(creatorToken, { assignee: assignee._id });

            const commentRes = await request(app)
                .post(`/api/tasks/${task._id}/comments`)
                .set('Authorization', `Bearer ${creatorToken}`)
                .send({ content: 'Not yours' });

            const res = await request(app)
                .delete(`/api/tasks/${task._id}/comments/${commentRes.body.comment._id}`)
                .set('Authorization', `Bearer ${assigneeToken}`);

            expect(res.status).toBe(403);
        });
    });
});
