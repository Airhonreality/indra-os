#!/usr/bin/env node
/**
 * 🔍 ISK Module Validator
 * Ensures zero .gs imports and validates metadata compliance.
 */

const fs = require('fs');
const path = require('path');

const ISK_ROOT = path.join(__dirname, 'src', 'modules', 'isk');
const VIOLATIONS = [];

function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            scanDirectory(fullPath);
        } else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
            validateFile(fullPath);
        }
    }
}

function validateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(ISK_ROOT, filePath);

    // Check for .gs imports
    const gsImportRegex = /import\s+.*from\s+['"].*\.gs['"]/g;
    const matches = content.match(gsImportRegex);

    if (matches) {
        VIOLATIONS.push({
            file: relativePath,
            type: 'FORBIDDEN_IMPORT',
            details: `Found .gs import: ${matches.join(', ')}`
        });
    }

    // Check for metadata in .jsx files
    if (filePath.endsWith('.jsx')) {
        if (!content.includes('.metadata')) {
            VIOLATIONS.push({
                file: relativePath,
                type: 'MISSING_METADATA',
                details: 'Component missing .metadata declaration'
            });
        }
    }
}

console.log('🔍 Scanning ISK module for violations...\n');
scanDirectory(ISK_ROOT);

if (VIOLATIONS.length === 0) {
    console.log('✅ All checks passed! ISK module is compliant.\n');
    process.exit(0);
} else {
    console.log(`❌ Found ${VIOLATIONS.length} violation(s):\n`);
    VIOLATIONS.forEach((v, i) => {
        console.log(`${i + 1}. [${v.type}] ${v.file}`);
        console.log(`   ${v.details}\n`);
    });
    process.exit(1);
}
