const { validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const canAccessTask = require('../utils/taskAccess');

const verifyTaskAccess = async (req, res) => {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
        res.status(404).json({ error: 'Task not found.' });
        return null;
    }
    const hasAccess = await canAccessTask(task, req.user._id);
    if (!hasAccess) {
        res.status(403).json({ error: 'You do not have access to this task.' });
        return null;
    }
    return task;
};

exports.addComment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const task = await verifyTaskAccess(req, res);
        if (!task) return;

        const comment = await Comment.create({
            content: req.body.content,
            task: req.params.taskId,
            author: req.user._id
        });

        await comment.populate('author', 'name email');

        res.status(201).json({ message: 'Comment added.', comment });
    } catch (error) {
        next(error);
    }
};

exports.getComments = async (req, res, next) => {
    try {
        const task = await verifyTaskAccess(req, res);
        if (!task) return;

        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [comments, total] = await Promise.all([
            Comment.find({ task: req.params.taskId })
                .populate('author', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Comment.countDocuments({ task: req.params.taskId })
        ]);

        res.json({
            comments,
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

exports.updateComment = async (req, res, next) => {
    try {
        const comment = await Comment.findOne({ _id: req.params.commentId, task: req.params.taskId });
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only edit your own comments.' });
        }

        comment.content = req.body.content;
        await comment.save();
        await comment.populate('author', 'name email');

        res.json({ message: 'Comment updated.', comment });
    } catch (error) {
        next(error);
    }
};

exports.deleteComment = async (req, res, next) => {
    try {
        const comment = await Comment.findOne({ _id: req.params.commentId, task: req.params.taskId });
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only delete your own comments.' });
        }

        await Comment.findByIdAndDelete(req.params.commentId);

        res.json({ message: 'Comment deleted.' });
    } catch (error) {
        next(error);
    }
};
