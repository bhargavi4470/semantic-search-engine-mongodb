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

        console.log(`Checking indexes for: ${collectionName}`);
        const indexes = await collection.indexes();
        console.log(JSON.stringify(indexes, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

run();
