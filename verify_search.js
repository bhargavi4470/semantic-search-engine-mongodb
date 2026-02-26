import 'dotenv/config';

async function testSearch() {
    const query = 'database performance';
    console.log(`--- Testing Search with Query: "${query}" ---`);
    console.log('Parameters: limit=3, explain=true');

    try {
        const response = await fetch(`http://localhost:3000/search?q=${encodeURIComponent(query)}&limit=3&explain=true`);
        const data = await response.json();

        if (!data.success) {
            console.error('Search API returned failure:', data);
            return;
        }

        console.log(`\nFound ${data.count} results above threshold.`);

        data.results.forEach((res, i) => {
            console.log(`\n[Result ${i + 1}]`);
            console.log(`Title: ${res.metadata?.title || 'Untitled'}`);
            console.log(`Score: ${res.similarityScore.toFixed(4)}`);
            console.log(`Excerpt: ${res.excerpt}`);
            console.log(`AI Explanation: ${res.explanation || 'NO EXPLANATION PROVIDED'}`);
        });

        if (data.results.length > 0 && data.results[0].explanation) {
            const sentenceCount = data.results[0].explanation.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
            console.log(`\nVerification: First explanation has ${sentenceCount} sentences.`);
            if (sentenceCount >= 2) {
                console.log('SUCCESS: Detailed AI explanation logic verified.');
            } else {
                console.log('WARNING: AI explanation might be too short.');
            }
        }

        if (data.aiContext) {
            console.log(`\n[AI Context]`);
            console.log(data.aiContext);
            console.log('SUCCESS: AI Context returned.');
        } else {
            console.log('WARNING: No AI Context returned.');
        }

    } catch (err) {
        console.error('Test script failed to connect to API:', err.message);
    }
}

testSearch();
