const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const attachmentController = require('../controllers/attachmentController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(auth);

router.get('/my-tasks', taskController.getMyTasks);

router.post('/', [
    body('title').trim().notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('status').optional().isIn(['open', 'in_progress', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date')
], taskController.createTask);

router.get('/', taskController.getTasks);

router.get('/:id', taskController.getTaskById);

router.put('/:id', [
    body('title').optional().trim().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('status').optional().isIn(['open', 'in_progress', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601()
], taskController.updateTask);

router.delete('/:id', taskController.deleteTask);

router.put('/:id/assign', taskController.assignTask);

router.post('/:taskId/comments', [
    body('content').trim().notEmpty().withMessage('Comment content is required')
        .isLength({ max: 1000 }).withMessage('Comment must be under 1000 characters')
], commentController.addComment);

router.get('/:taskId/comments', commentController.getComments);

router.put('/:taskId/comments/:commentId', [
    body('content').trim().notEmpty().withMessage('Comment content is required')
], commentController.updateComment);

router.delete('/:taskId/comments/:commentId', commentController.deleteComment);

router.post('/:taskId/attachments', upload.single('file'), attachmentController.uploadAttachment);

router.get('/:taskId/attachments', attachmentController.getAttachments);

router.get('/:taskId/attachments/:attachmentId/download', attachmentController.downloadAttachment);

router.delete('/:taskId/attachments/:attachmentId', attachmentController.deleteAttachment);

module.exports = router;
