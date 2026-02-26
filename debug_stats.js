import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DATABASE || 'semantic_search');
        const collectionName = process.env.MONGODB_COLLECTION || 'documents';
        const collection = db.collection(collectionName);

        console.log(`Connected. DB: ${db.databaseName}, Collection: ${collectionName}`);

        console.log('--- TEST 1: countDocuments ---');
        try {
            const count = await collection.countDocuments();
            console.log(`Count: ${count}`);
        } catch (e) {
            console.error('Count Failed:', e);
        }

        console.log('--- TEST 2: Recent Searches (with Sort) ---');
        try {
            const searches = await db.collection('searches')
                .find()
                .sort({ createdAt: -1 })
                .limit(5)
                .toArray();
            console.log(`Searches found: ${searches.length}`);
        } catch (e) {
            console.error('Searches Failed:', e);
        }

        console.log('--- TEST 3: File Distribution Aggregation ---');
        try {
            const dist = await collection.aggregate([
                { $group: { _id: '$metadata.fileType', count: { $sum: 1 } } }
            ]).toArray();
            console.log('Distribution:', JSON.stringify(dist, null, 2));
        } catch (e) {
            console.error('Distribution Failed:', e);
        }

        console.log('--- TEST 4: Recent Files (with Sort) ---');
        try {
            const recentFiles = await collection.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .project({ 'metadata.title': 1, 'metadata.fileType': 1, createdAt: 1 })
                .toArray();
            console.log(`Recent Files found: ${recentFiles.length}`);
        } catch (e) {
            console.error('Recent Files Failed:', e);
        }

    } catch (err) {
        console.error('Fatal Error:', err);
    } finally {
        await client.close();
    }
}

run();
