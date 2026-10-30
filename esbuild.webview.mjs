/**
 * esbuild config for the webview bundle.
 * Compiles src/webview/main.ts → out/webview/panel.js (browser IIFE)
 * Also copies panel.css to out/webview/
 */
import { build } from 'esbuild';
import { copyFileSync, cpSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

// Ensure output directory exists
const outDir = resolve(__dirname, 'out/webview');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

// Copy CSS (not bundled by esbuild — loaded separately via <link>)
copyFileSync(
    resolve(__dirname, 'src/webview/panel.css'),
    resolve(outDir, 'panel.css')
);
copyFileSync(
    resolve(__dirname, 'src/webview/context-detail.css'),
    resolve(outDir, 'context-detail.css')
);

// Copy & process Font Awesome 7.3.1 Pro+ Assets (CSS + WOFF2 Webfonts)
const faCssDir = resolve(outDir, 'css');
const faFontsDir = resolve(outDir, 'webfonts');
if (!existsSync(faCssDir)) mkdirSync(faCssDir, { recursive: true });
if (!existsSync(faFontsDir)) mkdirSync(faFontsDir, { recursive: true });

// Copy only required woff2 files to out/webview/webfonts
const requiredFonts = ['fa-solid-900.woff2', 'fa-regular-400.woff2', 'fa-brands-400.woff2'];
for (const font of requiredFonts) {
    const src = resolve(__dirname, 'web_fonts/webfonts', font);
    if (existsSync(src)) copyFileSync(src, resolve(faFontsDir, font));
}

// Read all.css and embed primary woff2 fonts as Base64 to bypass VS Code webview relative-URI resolution limits
let allCss = readFileSync(resolve(__dirname, 'web_fonts/css/all.css'), 'utf8');

const solidWoff2Path = resolve(__dirname, 'web_fonts/webfonts/fa-solid-900.woff2');
if (existsSync(solidWoff2Path)) {
    const solidBase64 = readFileSync(solidWoff2Path).toString('base64');
    allCss = allCss.replace(
        'url(../webfonts/fa-solid-900.woff2)',
        `url("data:font/woff2;charset=utf-8;base64,${solidBase64}") format("woff2")`
    );
}

const regularWoff2Path = resolve(__dirname, 'web_fonts/webfonts/fa-regular-400.woff2');
if (existsSync(regularWoff2Path)) {
    const regularBase64 = readFileSync(regularWoff2Path).toString('base64');
    allCss = allCss.replace(
        'url(../webfonts/fa-regular-400.woff2)',
        `url("data:font/woff2;charset=utf-8;base64,${regularBase64}") format("woff2")`
    );
}

const brandsWoff2Path = resolve(__dirname, 'web_fonts/webfonts/fa-brands-400.woff2');
if (existsSync(brandsWoff2Path)) {
    const brandsBase64 = readFileSync(brandsWoff2Path).toString('base64');
    allCss = allCss.replace(
        'url(../webfonts/fa-brands-400.woff2)',
        `url("data:font/woff2;charset=utf-8;base64,${brandsBase64}") format("woff2")`
    );
}

writeFileSync(resolve(faCssDir, 'all.css'), allCss, 'utf8');
console.log('[webview] Font Awesome Pro 7.3.1 assets processed with embedded Base64 fonts → out/webview/css/all.css');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
    entryPoints: [resolve(__dirname, 'src/webview/main.ts')],
    bundle: true,
    outfile: resolve(outDir, 'panel.js'),
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    minify: isProduction,
    sourcemap: !isProduction,
    tsconfig: resolve(__dirname, 'tsconfig.webview.json'),
};

if (isWatch) {
    const ctx = await (await import('esbuild')).context(buildOptions);
    await ctx.watch();
    console.log('[webview] watching for changes...');
} else {
    await build(buildOptions);
    console.log('[webview] bundle → out/webview/panel.js' + (isProduction ? ' (minified)' : ''));
}
