const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required.' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        }

        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passRegex.test(password)) {
            return res.status(400).json({ error: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.' });
        }

        const emailRegex = /^[^\s@]+@gmail\.com$/;
        if (!emailRegex.test(email.toLowerCase())) {
            return res.status(400).json({ error: 'Only a valid @gmail.com address is allowed.' });
        }

        // Check if user already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({ error: 'Username is already taken.' });
        }
        
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({ error: 'This email is already registered.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Determine role (only allow USER and SUPPORT)
        const userRole = role === 'SUPPORT' ? 'SUPPORT' : 'USER';

        // Insert user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role: userRole
        });
        await user.save();

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, username, email, role: userRole },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'Registration successful.',
            token,
            user: { id: user._id, username, email, role: userRole }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { loginId, password } = req.body;

        if (!loginId || !password) {
            return res.status(400).json({ error: 'Email/Username and password are required.' });
        }

        // Find user by either email or username
        const user = await User.findOne({ 
            $or: [{ email: loginId.toLowerCase() }, { username: loginId }] 
        });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful.',
            token,
            user: { id: user._id, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            // Prevent enumeration
            return res.json({ message: 'If that email exists, an email has been sent with a reset link.' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        // In a standalone environment (frontend/backend bound differently), host headers can be tricky.
        // We'll hardcode local client url since this is locally run, or use req.protocol.
        const resetUrl = `http://localhost:5050/?token=${resetToken}`;

        console.log('\n=============================================');
        console.log('           PASSWORD RESET REQUEST            ');
        console.log(` LINK: ${resetUrl} `);
        console.log('=============================================\n');
        
        res.json({ message: 'If that email exists, an email has been sent with a reset link.', link: resetUrl });
    } catch (err) {
        console.error('Forgot Password error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * POST /api/auth/reset-password/:token
 */
router.post('/reset-password/:token', async (req, res) => {
    try {
        const resetPasswordToken = req.params.token;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() } // Ensure it's not expired
        });

        if (!user) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        }
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passRegex.test(password)) {
            return res.status(400).json({ error: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Password has been successfully updated.' });
    } catch (err) {
        console.error('Reset Password error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
