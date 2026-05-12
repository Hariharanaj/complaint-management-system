const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'General'
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'],
        default: 'OPEN'
    }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
