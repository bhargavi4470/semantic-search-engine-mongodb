const fs = require('fs');
const path = require('path');
const readline = require('readline');

const logPath = path.join(__dirname, 'server.log');

async function processLineByLine() {
    if (!fs.existsSync(logPath)) {
        console.error('server.log not found');
        return;
    }

    const fileStream = fs.createReadStream(logPath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.includes('[AI] Full API Response:')) {
            const jsonStr = line.replace(/^.*\[AI\] Full API Response:\s*/, '').trim();
            try {
                const json = JSON.parse(jsonStr);
                console.log('--- CONTENT START ---');
                console.log(json.choices[0].message.content);
                console.log('--- CONTENT END ---');
            } catch (e) {
                console.error('Error parsing JSON:', e.message);
            }
        }
    }
}

processLineByLine();
