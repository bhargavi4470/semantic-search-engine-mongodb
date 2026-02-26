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

        console.log(`Creating index 'createdAt_1' on: ${collectionName}`);
        const result = await collection.createIndex({ createdAt: 1 });
        console.log(`Index created: ${result}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

run();
