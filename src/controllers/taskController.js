const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Team = require('../models/Team');
const canAccessTask = require('../utils/taskAccess');

exports.createTask = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, status, priority, dueDate, assignee, team, tags } = req.body;

        if (team) {
            const teamDoc = await Team.findById(team);
            if (!teamDoc) {
                return res.status(404).json({ error: 'Team not found.' });
            }
            const isMember = teamDoc.members.some(m => m.user.toString() === req.user._id.toString());
            if (!isMember) {
                return res.status(403).json({ error: 'You are not a member of this team.' });
            }
        }

        const task = await Task.create({
            title,
            description,
            status,
            priority,
            dueDate,
            creator: req.user._id,
            assignee,
            team,
            tags
        });

        await task.populate(['creator', 'assignee']);

        res.status(201).json({ message: 'Task created.', task });
    } catch (error) {
        next(error);
    }
};

exports.getTasks = async (req, res, next) => {
    try {
        const {
            status, priority, assignee, team, search,
            sortBy = 'createdAt', order = 'desc',
            page = 1, limit = 20
        } = req.query;

        const userTeamIds = await Team.find({ 'members.user': req.user._id }).distinct('_id');

        const filter = {
            $or: [
                { creator: req.user._id },
                { assignee: req.user._id },
                { team: { $in: userTeamIds } }
            ]
        };

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (assignee) filter.assignee = assignee;

        if (team) {
            const isMember = userTeamIds.some(id => id.toString() === team);
            if (!isMember) {
                return res.status(403).json({ error: 'You are not a member of this team.' });
            }
            filter.team = team;
        }

        if (search) {
            filter.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === 'asc' ? 1 : -1;

        const [tasks, total] = await Promise.all([
            Task.find(filter)
                .populate('creator', 'name email')
                .populate('assignee', 'name email')
                .populate('team', 'name')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit)),
            Task.countDocuments(filter)
        ]);

        res.json({
            tasks,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getTaskById = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('creator', 'name email')
            .populate('assignee', 'name email')
            .populate('team', 'name');

        if (!task) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        const hasAccess = await canAccessTask(task, req.user._id);
        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have access to this task.' });
        }

        res.json({ task });
    } catch (error) {
        next(error);
    }
};

exports.updateTask = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        const isCreator = task.creator.toString() === req.user._id.toString();
        const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();
        if (!isCreator && !isAssignee) {
            return res.status(403).json({ error: 'You can only update tasks you created or are assigned to.' });
        }

        const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate', 'assignee', 'tags'];
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                task[key] = req.body[key];
            }
        }

        await task.save();
        await task.populate(['creator', 'assignee', 'team']);

        res.json({ message: 'Task updated.', task });
    } catch (error) {
        next(error);
    }
};

exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        if (task.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the task creator can delete this task.' });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.json({ message: 'Task deleted.' });
    } catch (error) {
        next(error);
    }
};

exports.assignTask = async (req, res, next) => {
    try {
        const { assigneeId } = req.body;
        if (!assigneeId) {
            return res.status(400).json({ error: 'Assignee ID is required.' });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found.' });
        }

        if (task.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the task creator can reassign this task.' });
        }

        task.assignee = assigneeId;
        await task.save();
        await task.populate(['creator', 'assignee']);

        res.json({ message: 'Task assigned.', task });
    } catch (error) {
        next(error);
    }
};

exports.getMyTasks = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = { assignee: req.user._id };
        if (status) filter.status = status;

        const tasks = await Task.find(filter)
            .populate('creator', 'name email')
            .populate('team', 'name')
            .sort({ dueDate: 1 });

        res.json({ tasks });
    } catch (error) {
        next(error);
    }
};
