const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'server.log');

try {
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');
    const responseLine = lines.find(line => line.includes('[AI] Full API Response:'));
    if (responseLine) {
        console.log(responseLine);
    } else {
        console.log('Line not found');
    }
} catch (err) {
    console.error('Error reading log:', err);
}
