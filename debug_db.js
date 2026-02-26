import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DATABASE || 'semantic_search');
        const collectionName = process.env.MONGODB_COLLECTION || 'documents';

        console.log(`Connected to DB: ${db.databaseName}`);
        console.log(`Checking collection: ${collectionName}`);

        const count = await db.collection(collectionName).countDocuments();
        console.log(`Document Count: ${count}`);

        if (count > 0) {
            const doc = await db.collection(collectionName).findOne();
            console.log('Sample Doc:', JSON.stringify(doc, null, 2));
        }

        const searchCount = await db.collection('searches').countDocuments();
        console.log(`Searches Count: ${searchCount}`);

    } finally {
        await client.close();
    }
}
run().catch(console.dir);
