import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function verify() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('semantic_search');
        const user = await db.collection('users').findOne({ username: 'ArjunP' });

        if (user) {
            console.log('SUCCESS: Admin user "ArjunP" found in database.');
            console.log('User Details (sanitized):', {
                username: user.username,
                hasPasswordHash: !!user.passwordHash,
                createdAt: user.createdAt
            });
        } else {
            console.log('FAILURE: Admin user "ArjunP" not found in database.');
        }
    } catch (err) {
        console.error('Verification error:', err);
    } finally {
        await client.close();
    }
}

verify();
