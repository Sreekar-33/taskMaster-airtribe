const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const canAccessTask = require('../utils/taskAccess');
const path = require('path');
const fs = require('fs');

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

exports.uploadAttachment = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const task = await verifyTaskAccess(req, res);
        if (!task) {
            fs.unlinkSync(req.file.path);
            return;
        }

        const attachment = await Attachment.create({
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            task: req.params.taskId,
            uploadedBy: req.user._id
        });

        await attachment.populate('uploadedBy', 'name email');

        res.status(201).json({ message: 'File uploaded.', attachment });
    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
};

exports.getAttachments = async (req, res, next) => {
    try {
        const task = await verifyTaskAccess(req, res);
        if (!task) return;

        const attachments = await Attachment.find({ task: req.params.taskId })
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({ attachments });
    } catch (error) {
        next(error);
    }
};

exports.downloadAttachment = async (req, res, next) => {
    try {
        const task = await verifyTaskAccess(req, res);
        if (!task) return;

        const attachment = await Attachment.findOne({
            _id: req.params.attachmentId,
            task: req.params.taskId
        });
        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found.' });
        }

        const filePath = path.resolve(attachment.path);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server.' });
        }

        res.set('X-Content-Type-Options', 'nosniff');
        res.set('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
        res.download(filePath, attachment.originalName);
    } catch (error) {
        next(error);
    }
};

exports.deleteAttachment = async (req, res, next) => {
    try {
        const attachment = await Attachment.findOne({
            _id: req.params.attachmentId,
            task: req.params.taskId
        });
        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found.' });
        }

        if (attachment.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only delete your own attachments.' });
        }

        const filePath = path.resolve(attachment.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Attachment.findByIdAndDelete(req.params.attachmentId);

        res.json({ message: 'Attachment deleted.' });
    } catch (error) {
        next(error);
    }
};
