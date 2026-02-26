import 'dotenv/config';

async function diagnoseHF() {
    const models = [
        'meta-llama/Llama-3.2-3B-Instruct',
        'meta-llama/Llama-3.2-3B-Instruct',
        'mistralai/Mistral-7B-Instruct-v0.2'
    ];

    const token = process.env.HF_API_KEY;
    if (!token) {
        console.error('No HF_API_KEY found in .env');
        return;
    }

    for (const model of models) {
        console.log(`Testing model: ${model} via Router V1...`);
        try {
            const res = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'user', content: 'Hello' }
                    ]
                })
            });

            if (res.ok) {
                console.log(`SUCCESS: ${model} is available.`);
                const data = await res.json();
                console.log('Response sample:', JSON.stringify(data).slice(0, 100));
            } else {
                console.log(`FAILED: ${model} returned ${res.status} ${await res.text()}`);
            }
        } catch (err) {
            console.log(`ERROR: ${model} connection failed: ${err.message}`);
        }
        console.log('---');
    }
}

diagnoseHF();
