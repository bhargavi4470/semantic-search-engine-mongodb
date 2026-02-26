const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'server.log');
const outputPath = path.join(__dirname, 'ai_raw.txt');

try {
    if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n');
        let found = false;
        for (const line of lines) {
            if (line.includes('[AI] Raw content from HF:')) {
                const rawContent = line.split('[AI] Raw content from HF:')[1].trim();
                fs.writeFileSync(outputPath, rawContent);
                console.log('Extracted raw content to ai_raw.txt');
                found = true;
                break;
            }
        }
        if (!found) console.log('Pattern not found in log');
    } else {
        console.log('server.log not found');
    }
} catch (err) {
    console.error('Error:', err);
}
