const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

const srcPath = path.join(__dirname, 'src');
walk(srcPath, (filePath) => {
    if (filePath.endsWith('.jsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        // Check for "React" as a standalone word NOT in an import and NOT preceded by a dot (optional)
        // But the error is "React is not defined", so it's a usage.
        const usesReact = /\bReact\b/.test(content);
        const importsReact = /import React/.test(content);
        
        if (usesReact && !importsReact) {
            console.log(`CONFLICTO: ${filePath}`);
            // Let's see context
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (/\bReact\b/.test(line)) {
                    console.log(`  L${idx+1}: ${line.trim()}`);
                }
            });
        }
    }
});
