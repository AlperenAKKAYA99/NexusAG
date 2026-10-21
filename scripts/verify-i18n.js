const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const enKeys = new Set(Object.keys(en));

function scanDir(dir) {
    let files = [];
    for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (item === 'node_modules' || item === 'out' || item === 'locales') continue;
        if (fs.statSync(full).isDirectory()) files = files.concat(scanDir(full));
        else if (full.endsWith('.ts') || full.endsWith('.js')) files.push(full);
    }
    return files;
}

const files = scanDir(path.join(__dirname, '..', 'src'));
const missingInEn = new Set();
const foundKeys = new Set();

const tRegex = /\b(?:t|tu)\(\s*['"]([^'"]+)['"]/g;
const dataI18nRegex = /data-i18n(?:-title|-placeholder)?=['"]([^'"]+)['"]/g;

for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = tRegex.exec(content)) !== null) {
        foundKeys.add(m[1]);
        if (!enKeys.has(m[1])) missingInEn.add(m[1] + ' (in ' + path.relative(path.join(__dirname, '..'), f) + ')');
    }
    while ((m = dataI18nRegex.exec(content)) !== null) {
        foundKeys.add(m[1]);
        if (!enKeys.has(m[1])) missingInEn.add(m[1] + ' (in ' + path.relative(path.join(__dirname, '..'), f) + ')');
    }
}

console.log('Total unique keys referenced in code/HTML:', foundKeys.size);
console.log('Total keys in en.json:', enKeys.size);

let hasError = false;

if (missingInEn.size > 0) {
    console.error('❌ Keys referenced in code but missing in en.json:', Array.from(missingInEn));
    hasError = true;
} else {
    console.log('✅ All code-referenced keys exist in en.json');
}

// Check parity across all 10 locales
const localeFiles = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== 'en.json');
for (const lf of localeFiles) {
    const locData = JSON.parse(fs.readFileSync(path.join(localesDir, lf), 'utf8'));
    const locKeys = new Set(Object.keys(locData));
    const missing = [];
    for (const k of enKeys) {
        if (!locKeys.has(k)) missing.push(k);
    }
    if (missing.length > 0) {
        console.error(`❌ ${lf} is missing ${missing.length} keys:`, missing);
        hasError = true;
    } else {
        console.log(`✅ ${lf}: 100% key parity with en.json (${locKeys.size} keys)`);
    }
}

if (hasError) {
    process.exit(1);
} else {
    console.log('🎉 SUCCESS: 100% translation coverage and key parity across all 10 languages!');
}
