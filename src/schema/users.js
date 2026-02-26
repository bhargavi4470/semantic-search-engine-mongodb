import { getDb } from '../config/db.js';

/**
 * User document structure:
 * {
 *   username: string (unique),
 *   passwordHash: string,
 *   email: string (optional),
 *   googleId: string (optional),
 *   microsoftId: string (optional),
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

export async function createUserIndexes() {
    const db = getDb();
    const users = db.collection('users');

    await users.createIndex({ username: 1 }, { unique: true });
    console.log('User indexes created successfully');
}

export function normalizeUser(user) {
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    // Assign role based on username (simple RBAC for this demo)
    return {
        ...safeUser,
        role: user.username === 'ArjunP' ? 'admin' : 'user'
    };
}
