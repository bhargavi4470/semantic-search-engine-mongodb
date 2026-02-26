import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

export async function seedAdmin() {
    try {
        const db = getDb();
        const users = db.collection('users');

        const adminUsername = 'ArjunP';
        const adminPassword = '20051716';

        const existingAdmin = await users.findOne({ username: adminUsername });

        if (!existingAdmin) {
            console.log('--- ADMIN SEEDING ---');
            console.log(`Creating admin user: ${adminUsername}`);

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(adminPassword, salt);

            await users.insertOne({
                username: adminUsername,
                passwordHash,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user "ArjunP" already exists.');
        }
    } catch (err) {
        console.error('Failed to seed admin user:', err);
    }
}
