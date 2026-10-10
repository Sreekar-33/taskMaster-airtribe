const request = require('supertest');
const app = require('../src/app');
const { createUser, createTask, createTeam } = require('./helpers');

describe('Team Endpoints', () => {
    describe('POST /api/teams', () => {
        it('should create a team', async () => {
            const { token } = await createUser();
            const res = await request(app)
                .post('/api/teams')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Dev Team', description: 'Developers' });

            expect(res.status).toBe(201);
            expect(res.body.team.name).toBe('Dev Team');
            expect(res.body.team.inviteCode).toBeDefined();
            expect(res.body.team.members.length).toBe(1);
            expect(res.body.team.members[0].role).toBe('admin');
        });

        it('should reject team without name', async () => {
            const { token } = await createUser();
            const res = await request(app)
                .post('/api/teams')
                .set('Authorization', `Bearer ${token}`)
                .send({ description: 'No name' });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/teams', () => {
        it('should list user teams', async () => {
            const { token } = await createUser();
            await createTeam(token, { name: 'Team A' });
            await createTeam(token, { name: 'Team B' });

            const res = await request(app)
                .get('/api/teams')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.teams.length).toBe(2);
        });

        it('should not list teams user is not a member of', async () => {
            const { token: token1 } = await createUser();
            const { token: token2 } = await createUser();
            await createTeam(token1, { name: 'Private Team' });

            const res = await request(app)
                .get('/api/teams')
                .set('Authorization', `Bearer ${token2}`);

            expect(res.status).toBe(200);
            expect(res.body.teams.length).toBe(0);
        });
    });

    describe('GET /api/teams/:id', () => {
        it('should get team details for member', async () => {
            const { token } = await createUser();
            const team = await createTeam(token);

            const res = await request(app)
                .get(`/api/teams/${team._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.team.name).toBe('Test Team');
        });

        it('should deny access to non-member', async () => {
            const { token: ownerToken } = await createUser();
            const { token: otherToken } = await createUser();
            const team = await createTeam(ownerToken);

            const res = await request(app)
                .get(`/api/teams/${team._id}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('POST /api/teams/join', () => {
        it('should join team with valid invite code', async () => {
            const { token: ownerToken } = await createUser();
            const { token: joinerToken } = await createUser();
            const team = await createTeam(ownerToken);

            const res = await request(app)
                .post('/api/teams/join')
                .set('Authorization', `Bearer ${joinerToken}`)
                .send({ inviteCode: team.inviteCode });

            expect(res.status).toBe(200);
            expect(res.body.team.members.length).toBe(2);
        });

        it('should reject invalid invite code', async () => {
            const { token } = await createUser();
            const res = await request(app)
                .post('/api/teams/join')
                .set('Authorization', `Bearer ${token}`)
                .send({ inviteCode: 'INVALID' });

            expect(res.status).toBe(404);
        });

        it('should reject already a member', async () => {
            const { token } = await createUser();
            const team = await createTeam(token);

            const res = await request(app)
                .post('/api/teams/join')
                .set('Authorization', `Bearer ${token}`)
                .send({ inviteCode: team.inviteCode });

            expect(res.status).toBe(409);
        });
    });

    describe('PUT /api/teams/:id', () => {
        it('should update team as owner', async () => {
            const { token } = await createUser();
            const team = await createTeam(token);

            const res = await request(app)
                .put(`/api/teams/${team._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Renamed Team' });

            expect(res.status).toBe(200);
            expect(res.body.team.name).toBe('Renamed Team');
        });

        it('should deny update to non-owner member', async () => {
            const { token: ownerToken } = await createUser();
            const { token: memberToken } = await createUser();
            const team = await createTeam(ownerToken);

            await request(app)
                .post('/api/teams/join')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ inviteCode: team.inviteCode });

            const res = await request(app)
                .put(`/api/teams/${team._id}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ name: 'Hijacked' });

            expect(res.status).toBe(403);
        });
    });

    describe('DELETE /api/teams/:id/members/:userId', () => {
        it('should remove member as owner', async () => {
            const { token: ownerToken } = await createUser();
            const { token: memberToken, user: member } = await createUser();
            const team = await createTeam(ownerToken);

            await request(app)
                .post('/api/teams/join')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ inviteCode: team.inviteCode });

            const res = await request(app)
                .delete(`/api/teams/${team._id}/members/${member._id}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
        });

        it('should not allow removing the owner', async () => {
            const { token: ownerToken, user: owner } = await createUser();
            const team = await createTeam(ownerToken);

            const res = await request(app)
                .delete(`/api/teams/${team._id}/members/${owner._id}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/teams/:id/tasks', () => {
        it('should get team tasks for member', async () => {
            const { token } = await createUser();
            const team = await createTeam(token);
            await createTask(token, { title: 'Team Task 1', team: team._id });
            await createTask(token, { title: 'Team Task 2', team: team._id });

            const res = await request(app)
                .get(`/api/teams/${team._id}/tasks`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.tasks.length).toBe(2);
        });

        it('should deny team tasks to non-member', async () => {
            const { token: ownerToken } = await createUser();
            const { token: otherToken } = await createUser();
            const team = await createTeam(ownerToken);

            const res = await request(app)
                .get(`/api/teams/${team._id}/tasks`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('DELETE /api/teams/:id', () => {
        it('should delete team as owner', async () => {
            const { token } = await createUser();
            const team = await createTeam(token);

            const res = await request(app)
                .delete(`/api/teams/${team._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Team deleted.');
        });

        it('should deny delete to non-owner', async () => {
            const { token: ownerToken } = await createUser();
            const { token: memberToken } = await createUser();
            const team = await createTeam(ownerToken);

            await request(app)
                .post('/api/teams/join')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ inviteCode: team.inviteCode });

            const res = await request(app)
                .delete(`/api/teams/${team._id}`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.status).toBe(403);
        });
    });
});
