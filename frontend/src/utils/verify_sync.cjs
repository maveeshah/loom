const fs = require('fs');
const path = require('path');

const tsPath = path.join(__dirname, 'authUtils.ts');
const jsPath = path.join(__dirname, 'authUtils.js');

const tsContent = fs.readFileSync(tsPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');

// Function to extract the hasPermission function body
function extractFunctionBody(content) {
    const lines = content.split('\n');
    let startLine = -1;
    let endLine = -1;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const hasPermission =')) {
            startLine = i;
            break;
        }
    }

    if (startLine === -1) {
        throw new Error('Could not find hasPermission definition');
    }

    let body = "";
    for (let i = startLine; i < lines.length; i++) {
        const line = lines[i];
        for (let char of line) {
            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endLine = i;
                    body += line.substring(0, line.indexOf('}') + 1);
                    break;
                }
            }
        }
        if (endLine !== -1) break;
        body += line + '\n';
    }

    // Extract just the part between the first { and the last }
    const firstBrace = body.indexOf('{');
    const lastBrace = body.lastIndexOf('}');
    return body.substring(firstBrace + 1, lastBrace).trim();
}

try {
    const tsBody = extractFunctionBody(tsContent);
    const jsBody = extractFunctionBody(jsContent);

    if (tsBody === jsBody) {
        console.log('✅ Synchronization Check Passed: `authUtils.ts` and `authUtils.js` are in sync.');
        process.exit(0);
    } else {
        console.error('❌ Synchronization Check Failed: `authUtils.ts` and `authUtils.js` are out of sync.');
        process.exit(1);
    }
} catch (error) {
    console.error(`❌ Error during synchronization check: ${error.message}`);
    process.exit(1);
}
