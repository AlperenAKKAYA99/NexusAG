/**
 * OAuth success page template.
 * Shown in the browser after a successful Google OAuth callback.
 * Cloned and tailored from the clean Authentication Successful design.
 */
export function getOAuthSuccessHtml(email: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Authentication Successful</title>
    <style>
      :root {
        --bg: #FAFAFA;
        --card-bg: #FFFFFF;
        --text-primary: #1F2937;
        --text-secondary: #6B7280;
        --accent: #2563EB;
        --success: #10B981;
        --border: #E5E7EB;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #111827;
          --card-bg: #1F2937;
          --text-primary: #F9FAFB;
          --text-secondary: #9CA3AF;
          --accent: #3B82F6;
          --success: #34D399;
          --border: #374151;
        }
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: var(--bg);
        color: var(--text-primary);
        padding: 1rem;
        box-sizing: border-box;
      }
      .card {
        background: var(--card-bg);
        border-radius: 16px;
        padding: 3rem 2rem;
        width: 100%;
        max-width: 420px;
        text-align: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid var(--border);
        box-sizing: border-box;
        animation: cardIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes cardIn {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .icon-wrapper {
        width: 64px;
        height: 64px;
        background: rgba(16, 185, 129, 0.12);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
      }
      .icon {
        width: 32px;
        height: 32px;
        color: var(--success);
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 0.5rem;
        letter-spacing: -0.025em;
      }
      p {
        color: var(--text-secondary);
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0 0 1.25rem;
      }
      .email-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 6px 14px;
        border-radius: 9999px;
        background: rgba(59, 130, 246, 0.08);
        border: 1px solid rgba(59, 130, 246, 0.2);
        color: var(--accent);
        font-size: 0.88rem;
        font-weight: 500;
        margin-bottom: 1.5rem;
        word-break: break-all;
      }
      .email-badge .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--success);
        flex-shrink: 0;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--text-primary);
        color: var(--card-bg);
        font-weight: 500;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        text-decoration: none;
        transition: opacity 0.2s, transform 0.1s;
        font-size: 0.95rem;
        border: none;
        cursor: pointer;
        width: 100%;
        box-sizing: border-box;
      }
      .btn:hover {
        opacity: 0.9;
      }
      .btn:active {
        transform: scale(0.99);
      }
      .sub-text {
        margin-top: 1rem;
        font-size: 0.8rem;
        color: var(--text-secondary);
        line-height: 1.4;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon-wrapper">
        <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h1>All set!</h1>
      <p>You've successfully authenticated with Antigravity. You can now return to your IDE.</p>
      ${email ? `
      <div class="email-badge">
        <span class="dot"></span>
        ${email}
      </div>` : ''}
      <button class="btn" id="close-btn" onclick="closeWindow()">Close this tab (<span id="cd">5</span>s)</button>
      <div class="sub-text">Usage Tip: Most browsers block auto-closing. If the button doesn't work, please close the tab manually.</div>
    </div>
    <script>
      function closeWindow() {
        window.close();
        setTimeout(function() {
          try { window.open('', '_self', ''); window.close(); } catch(e) {}
        }, 100);
        setTimeout(function() {
          var btn = document.getElementById('close-btn');
          if (btn) {
            btn.textContent = "Tab cannot be closed automatically";
            btn.style.opacity = "0.5";
            btn.style.cursor = "default";
          }
        }, 300);
      }

      var s = 5;
      var cd = document.getElementById('cd');
      var timer = setInterval(function() {
        s--;
        if (cd) cd.textContent = s;
        if (s <= 0) {
          clearInterval(timer);
          closeWindow();
        }
      }, 1000);
    </script>
</body>
</html>`;
}

