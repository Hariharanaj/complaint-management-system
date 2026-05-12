require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db/database');

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());




// Database connection middleware for Serverless
app.use(async (req, res, next) => {
    if (process.env.VERCEL) {
        try {
            await connectDB();
        } catch (err) {
            console.error('DB connection error in middleware:', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }
    }
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});



if (!process.env.VERCEL) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📁 Frontend served from: ${path.join(__dirname, '..', 'frontend')}`);
        });
    });
}

// Export for serverless environments (like Vercel)
module.exports = app;
