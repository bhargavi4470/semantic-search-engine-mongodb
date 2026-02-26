import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../config/db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { normalizeUser } from '../schema/users.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        const db = getDb();
        const users = db.collection('users');

        // Check if user exists
        const existing = await users.findOne({ username });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await users.insertOne({
            username,
            passwordHash,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const user = await users.findOne({ _id: result.insertedId });
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            data: {
                user: normalizeUser(user),
                token
            }
        });

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ success: false, message: 'Signup failed', error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        const db = getDb();
        const users = db.collection('users');

        const user = await users.findOne({ username });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            data: {
                user: normalizeUser(user),
                token
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Login failed', error: err.message });
    }
});

// Get Current User
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const db = getDb();
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.id) });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: { user: normalizeUser(user) }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
});

// Update Password
router.post('/update-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Both passwords are required' });
        }

        const db = getDb();
        const users = db.collection('users');
        const user = await users.findOne({ _id: new ObjectId(req.user.id) });

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await users.updateOne(
            { _id: user._id },
            { $set: { passwordHash, updatedAt: new Date() } }
        );

        res.json({ success: true, message: 'Password updated successfully' });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update password' });
    }
});

export default router;
