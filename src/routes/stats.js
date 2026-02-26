import { getDb } from '../config/db.js';

export async function handleStats(req, res, next) {
    try {
        const db = getDb();
        const userId = req.user.id;
        const collectionName = process.env.MONGODB_COLLECTION || 'documents';
        const collection = db.collection(collectionName);

        const docCount = await collection.countDocuments({ userId: userId });

        const recentSearches = await db.collection('searches')
            .find({ userId: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        // Aggregation for file distribution
        const fileDistribution = await collection.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: '$metadata.fileType', count: { $sum: 1 } } }
        ]).toArray();

        // Recent file uploads
        const recentFiles = await collection.find({ userId: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .project({ 'metadata.title': 1, 'metadata.fileType': 1, createdAt: 1 })
            .toArray();

        // In a real app, we might check Atlas Search index status or other metrics.
        // For this demo, we'll return some mock-ish but document-linked stats.
        res.json({
            success: true,
            data: {
                totalDocuments: docCount,
                indexedVectors: docCount, // Ingestion is synchronous, so all docs are indexed
                searchTimeAvg: '~150ms', // Estimate based on typical vector search latency
                systemStatus: db.databaseName ? 'ONLINE' : 'OFFLINE',
                recentSearches: recentSearches.map(s => ({
                    query: s.query,
                    createdAt: s.createdAt
                })),
                fileDistribution: fileDistribution.map(f => ({
                    type: f._id || 'unknown',
                    count: f.count
                })),
                recentFiles: recentFiles.map(f => ({
                    title: f.metadata?.title || 'Untitled',
                    fileType: f.metadata?.fileType || 'unknown',
                    createdAt: f.createdAt
                })),
                mongodb: {
                    database: db.databaseName,
                    collection: collectionName
                }
            }
        });
    } catch (err) {
        next(err);
    }
}
