// Native fetch used
async function testBinaryRejection() {
    console.log('\n--- Testing Binary Rejection ---');
    // Construct a "binary-like" string (lots of control characters)
    const binaryContent = String.fromCharCode(...Array.from({ length: 100 }, (_, i) => i % 31));

    try {
        const res = await fetch('http://localhost:3000/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documents: [{
                    content: binaryContent,
                    metadata: { title: 'Binary Test' }
                }]
            })
        });

        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', data);

        if (res.status === 400 && data.message.includes('binary')) {
            console.log('PASS: Binary content correctly rejected.');
        } else {
            console.log('FAIL: Binary content was not rejected correctly.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testBinaryRejection();
