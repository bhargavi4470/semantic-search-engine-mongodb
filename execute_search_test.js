
async function testSearch() {
    try {
        const response = await fetch('http://localhost:3000/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'semantic search', explain: true })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));

        if (data.aiContext) {
            console.log('\nSUCCESS: AI Context received.');
        } else {
            console.log('\nFAILURE: AI Context missing.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testSearch();
