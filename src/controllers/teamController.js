const { validationResult } = require('express-validator');
const Team = require('../models/Team');
const Task = require('../models/Task');

exports.createTeam = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description } = req.body;

        const team = await Team.create({
            name,
            description,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'admin' }]
        });

        await team.populate('members.user', 'name email');

        res.status(201).json({ message: 'Team created.', team });
    } catch (error) {
        next(error);
    }
};

exports.getTeams = async (req, res, next) => {
    try {
        const teams = await Team.find({ 'members.user': req.user._id })
            .populate('owner', 'name email')
            .populate('members.user', 'name email');

        res.json({ teams });
    } catch (error) {
        next(error);
    }
};

exports.getTeamById = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('members.user', 'name email');

        if (!team) {
            return res.status(404).json({ error: 'Team not found.' });
        }

        const isMember = team.members.some(m => m.user._id.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ error: 'You are not a member of this team.' });
        }

        res.json({ team });
    } catch (error) {
        next(error);
    }
};

exports.joinTeam = async (req, res, next) => {
    try {
        const { inviteCode } = req.body;
        if (!inviteCode) {
            return res.status(400).json({ error: 'Invite code is required.' });
        }

        const team = await Team.findOne({ inviteCode: inviteCode.toLowerCase() });
        if (!team) {
            return res.status(404).json({ error: 'Invalid invite code.' });
        }

        const alreadyMember = team.members.some(m => m.user.toString() === req.user._id.toString());
        if (alreadyMember) {
            return res.status(409).json({ error: 'You are already a member of this team.' });
        }

        team.members.push({ user: req.user._id, role: 'member' });
        await team.save();
        await team.populate('members.user', 'name email');

        res.json({ message: 'Joined team successfully.', team });
    } catch (error) {
        next(error);
    }
};

exports.updateTeam = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ error: 'Team not found.' });
        }

        if (team.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the team owner can update team details.' });
        }

        const { name, description } = req.body;
        if (name) team.name = name;
        if (description !== undefined) team.description = description;

        await team.save();
        await team.populate('members.user', 'name email');

        res.json({ message: 'Team updated.', team });
    } catch (error) {
        next(error);
    }
};

exports.removeMember = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ error: 'Team not found.' });
        }

        if (team.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the team owner can remove members.' });
        }

        const { userId } = req.params;
        if (userId === team.owner.toString()) {
            return res.status(400).json({ error: 'Cannot remove the team owner.' });
        }

        team.members = team.members.filter(m => m.user.toString() !== userId);
        await team.save();

        res.json({ message: 'Member removed.', team });
    } catch (error) {
        next(error);
    }
};

exports.getTeamTasks = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ error: 'Team not found.' });
        }

        const isMember = team.members.some(m => m.user.toString() === req.user._id.toString());
        if (!isMember) {
            return res.status(403).json({ error: 'You are not a member of this team.' });
        }

        const { status, priority } = req.query;
        const filter = { team: req.params.id };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const tasks = await Task.find(filter)
            .populate('creator', 'name email')
            .populate('assignee', 'name email')
            .sort({ createdAt: -1 });

        res.json({ tasks });
    } catch (error) {
        next(error);
    }
};

exports.deleteTeam = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ error: 'Team not found.' });
        }

        if (team.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the team owner can delete this team.' });
        }

        await Task.updateMany({ team: req.params.id }, { $unset: { team: 1 } });
        await Team.findByIdAndDelete(req.params.id);

        res.json({ message: 'Team deleted.' });
    } catch (error) {
        next(error);
    }
};
