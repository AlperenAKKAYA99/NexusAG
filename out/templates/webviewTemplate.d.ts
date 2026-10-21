import * as vscode from 'vscode';
/**
 * Assembles the full webview HTML with:
 * - CSP (Content Security Policy) with nonce
 * - External CSS via <link> (loaded from out/webview/panel.css)
 * - External JS via <script> (loaded from out/webview/panel.js)
 *
 * HTML skeleton only — all CSS is in panel.css, all JS in panel.js (esbuild bundle).
 */
export declare function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string;
