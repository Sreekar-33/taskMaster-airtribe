const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');
const { createUser, createTask } = require('./helpers');

const TEST_FILE_PATH = path.join(__dirname, 'test-upload.txt');

beforeAll(() => {
    fs.writeFileSync(TEST_FILE_PATH, 'This is a test file for upload.');
});

afterAll(() => {
    if (fs.existsSync(TEST_FILE_PATH)) fs.unlinkSync(TEST_FILE_PATH);
});

describe('Attachment Endpoints', () => {
    describe('POST /api/tasks/:taskId/attachments', () => {
        it('should upload a file', async () => {
            const { token } = await createUser();
            const task = await createTask(token);

            const res = await request(app)
                .post(`/api/tasks/${task._id}/attachments`)
                .set('Authorization', `Bearer ${token}`)
                .attach('file', TEST_FILE_PATH);

            expect(res.status).toBe(201);
            expect(res.body.attachment.originalName).toBe('test-upload.txt');
            expect(res.body.attachment.mimeType).toBe('text/plain');
            expect(res.body.attachment.size).toBeGreaterThan(0);
        });

        it('should deny upload from unrelated user', async () => {
            const { token: creatorToken } = await createUser();
            const { token: otherToken } = await createUser();
            const task = await createTask(creatorToken);

            const res = await request(app)
                .post(`/api/tasks/${task._id}/attachments`)
                .set('Authorization', `Bearer ${otherToken}`)
                .attach('file', TEST_FILE_PATH);

            expect(res.status).toBe(403);
        });

        it('should return 404 for nonexistent task', async () => {
            const { token } = await createUser();
            const res = await request(app)
                .post('/api/tasks/507f1f77bcf86cd799439011/attachments')
                .set('Authorization', `Bearer ${token}`)
                .attach('file', TEST_FILE_PATH);

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/tasks/:taskId/attachments', () => {
        it('should list attachments for a task', async () => {
            const { token } = await createUser();
            const task = await createTask(token);

            await request(app)
                .post(`/api/tasks/${task._id}/attachments`)
                .set('Authorization', `Bearer ${token}`)
                .attach('file', TEST_FILE_PATH);

            const res = await request(app)
                .get(`/api/tasks/${task._id}/attachments`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.attachments.length).toBe(1);
        });

        it('should deny listing to unrelated user', async () => {
            const { token: creatorToken } = await createUser();
            const { token: otherToken } = await createUser();
            const task = await createTask(creatorToken);

            const res = await request(app)
                .get(`/api/tasks/${task._id}/attachments`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/tasks/:taskId/attachments/:attachmentId/download', () => {
        it('should download an attachment', async () => {
            const { token } = await createUser();
            const task = await createTask(token);

            const uploadRes = await request(app)
                .post(`/api/tasks/${task._id}/attachments`)
                .set('Authorization', `Bearer ${token}`)
                .attach('file', TEST_FILE_PATH);

            const attachmentId = uploadRes.body.attachment._id;

            const res = await request(app)
                .get(`/api/tasks/${task._id}/attachments/${attachmentId}/download`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.headers['x-content-type-options']).toBe('nosniff');
            expect(res.headers['content-disposition']).toContain('test-upload.txt');
        });

        it('should deny download to unrelated user', async () => {
            const { token: creatorToken } = await createUser();
            const { token: otherToken } = await createUser();
            const task = await createTask(creatorToken);

            const uploadRes = await request(app)
                .post(`/api/tasks/${task._id}/attachments`)
                .set('Authorization', `Bearer ${creatorToken}`)
                .attach('file', TEST_FILE_PATH);

            const attachmentId = uploadRes.body.attachment._id;

            const res = await request(app)
                .get(`/api/tasks/${task._id}/attachments/${attachmentId}/download`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('DELETE /api/tasks/:taskId/attachments/:attachmentId', () => {
        it('should delete own attachment', async () => {
            const { token } = await createUser();
            const task = await createTask(token);

            const uploadRes = await request(app)
                .post(`/api/tasks/${task._id}/attachments`)
                .set('Authorization', `Bearer ${token}`)
                .attach('file', TEST_FILE_PATH);

            const attachmentId = uploadRes.body.attachment._id;

            const res = await request(app)
                .delete(`/api/tasks/${task._id}/attachments/${attachmentId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Attachment deleted.');
        });

        it('should deny deleting another users attachment', async () => {
            const { token: creatorToken } = await createUser();
            const { token: assigneeToken, user: assignee } = await createUser();
            const task = await createTask(creatorToken, { assignee: assignee._id });

            const uploadRes = await request(app)
                .post(`/api/tasks/${task._id}/attachments`)
                .set('Authorization', `Bearer ${creatorToken}`)
                .attach('file', TEST_FILE_PATH);

            const attachmentId = uploadRes.body.attachment._id;

            const res = await request(app)
                .delete(`/api/tasks/${task._id}/attachments/${attachmentId}`)
                .set('Authorization', `Bearer ${assigneeToken}`);

            expect(res.status).toBe(403);
        });
    });
});
