const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/complaints
 * USER creates a new complaint
 */
router.post('/', authorize('USER'), async (req, res) => {
    try {
        const { title, description, category } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required.' });
        }

        if (title.length < 5) {
            return res.status(400).json({ error: 'Title must be at least 5 characters.' });
        }

        if (description.length < 10) {
            return res.status(400).json({ error: 'Description must be at least 10 characters.' });
        }

        const complaint = new Complaint({
            user_id: req.user.id,
            title,
            description,
            category: category || 'General'
        });

        await complaint.save();

        res.status(201).json({
            message: 'Complaint submitted successfully.',
            complaint: { ...complaint.toObject(), id: complaint._id, created_at: complaint.createdAt, updated_at: complaint.updatedAt }
        });
    } catch (err) {
        console.error('Create complaint error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /api/complaints
 * USER: gets own complaints | SUPPORT: gets all complaints
 */
router.get('/', async (req, res) => {
    try {
        let complaintsRaw;

        if (req.user.role === 'SUPPORT') {
            complaintsRaw = await Complaint.find()
                .populate('user_id', 'username email')
                .sort('-createdAt')
                .lean();
        } else {
            complaintsRaw = await Complaint.find({ user_id: req.user.id })
                .sort('-createdAt')
                .lean();
        }

        const complaints = await Promise.all(complaintsRaw.map(async (c) => {
            const fb = await Feedback.findOne({ complaint_id: c._id });

            const mapped = {
                ...c,
                id: c._id.toString(),
                created_at: c.createdAt,
                updated_at: c.updatedAt,
                has_feedback: fb ? 1 : 0
            };

            if (c.user_id && typeof c.user_id === 'object') {
                mapped.username = c.user_id.username;
                mapped.user_email = c.user_id.email;
                mapped.user_id = c.user_id._id.toString();
            } else {
                mapped.user_id = c.user_id.toString();
            }

            return mapped;
        }));

        res.json({ complaints });
    } catch (err) {
        console.error('Get complaints error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /api/complaints/:id
 * Get single complaint detail
 */
router.get('/:id', async (req, res) => {
    try {
        const complaintRaw = await Complaint.findById(req.params.id)
            .populate('user_id', 'username email')
            .lean();

        if (!complaintRaw) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        // USER can only view their own complaints
        if (req.user.role === 'USER' && complaintRaw.user_id._id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied.' });
        }

        // Get feedback if exists
        const feedbackRaw = await Feedback.findOne({ complaint_id: req.params.id }).lean();
        const feedback = feedbackRaw ? { ...feedbackRaw, id: feedbackRaw._id, created_at: feedbackRaw.createdAt } : null;

        const mappedComplaint = {
            ...complaintRaw,
            id: complaintRaw._id.toString(),
            created_at: complaintRaw.createdAt,
            updated_at: complaintRaw.updatedAt,
            username: complaintRaw.user_id.username,
            user_email: complaintRaw.user_id.email,
            user_id: complaintRaw.user_id._id.toString()
        };

        res.json({ complaint: mappedComplaint, feedback });
    } catch (err) {
        console.error('Get complaint error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * PUT /api/complaints/:id/status
 * SUPPORT updates complaint status
 */
router.put('/:id/status', authorize('SUPPORT'), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['OPEN', 'IN_PROGRESS', 'CLOSED'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
        }

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        complaint.status = status;
        await complaint.save();

        res.json({
            message: `Complaint status updated to ${status}.`,
            complaint: { ...complaint.toObject(), id: complaint._id, created_at: complaint.createdAt, updated_at: complaint.updatedAt }
        });
    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * POST /api/complaints/:id/feedback
 * USER submits feedback — ONLY if complaint is CLOSED
 */
router.post('/:id/feedback', authorize('USER'), async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const complaintId = req.params.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
        }

        // Get complaint
        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        // Ensure the complaint belongs to the user
        if (complaint.user_id.toString() !== req.user.id) {
            return res.status(403).json({ error: 'You can only provide feedback on your own complaints.' });
        }

        // ⚠ BUSINESS RULE: Feedback only after CLOSED
        if (complaint.status !== 'CLOSED') {
            return res.status(400).json({
                error: 'Feedback can only be submitted after the complaint is marked as CLOSED.'
            });
        }

        // Check if feedback already exists
        const existingFeedback = await Feedback.findOne({ complaint_id: complaintId });
        if (existingFeedback) {
            return res.status(409).json({ error: 'Feedback has already been submitted for this complaint.' });
        }

        const feedback = new Feedback({
            complaint_id: complaintId,
            user_id: req.user.id,
            rating,
            comment: comment || ''
        });

        await feedback.save();

        res.status(201).json({
            message: 'Feedback submitted successfully.',
            feedback: { ...feedback.toObject(), id: feedback._id, created_at: feedback.createdAt }
        });
    } catch (err) {
        console.error('Submit feedback error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
