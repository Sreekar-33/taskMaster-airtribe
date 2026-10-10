const express = require('express');
const { body } = require('express-validator');
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.post('/', [
    body('name').trim().notEmpty().withMessage('Team name is required')
        .isLength({ max: 100 }).withMessage('Team name must be under 100 characters'),
    body('description').optional().trim().isLength({ max: 500 })
], teamController.createTeam);

router.get('/', teamController.getTeams);

router.get('/:id', teamController.getTeamById);

router.put('/:id', [
    body('name').optional().trim().isLength({ max: 100 }),
    body('description').optional().trim().isLength({ max: 500 })
], teamController.updateTeam);

router.delete('/:id', teamController.deleteTeam);

router.post('/join', teamController.joinTeam);

router.delete('/:id/members/:userId', teamController.removeMember);

router.get('/:id/tasks', teamController.getTeamTasks);

module.exports = router;
