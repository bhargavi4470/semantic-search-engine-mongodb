// Node 18+ has built-in fetch

async function testIngest() {
    console.log('--- Testing Document Ingestion ---');

    const payload = {
        documents: [
            {
                content: 'This is a test document for semantic search. It contains some text about machine learning.',
                metadata: { title: 'ML Basics', source: 'Test Script' }
            },
            {
                content: 'Vector databases are useful for storing high-dimensional embeddings for retrieval augmented generation.',
                metadata: { title: 'Vector DBs', source: 'Test Script' }
            }
        ]
    };

    try {
        const response = await fetch('http://localhost:3000/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('SUCCESS: Documents ingested successfully!');
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.error('FAILURE: Ingestion failed:', data);
        }
    } catch (err) {
        console.error('ERROR: Could not connect to API:', err.message);
    }
}

testIngest();
