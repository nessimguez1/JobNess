// Email signature — single source of truth. The LLM never writes its own; we
// append this at copy time so Gmail gets a clickable LinkedIn link.

const LINKEDIN_URL = 'https://www.linkedin.com/in/nessim-guez-0519411b8';
const PHONE = '+972 54 649 5846';

const EMAIL_TEXT = `Best,
Nessim Guez
${PHONE} · linkedin.com/in/nessim-guez`;

const EMAIL_HTML = `<div>Best,</div>
<div>Nessim Guez</div>
<div>${PHONE} · <a href="${LINKEDIN_URL}">LinkedIn</a></div>`;

const LINKEDIN_TEXT = `— Nessim`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
}

function bodyToHtml(body: string): string {
  return body.trimEnd().split('\n').map(line => {
    if (line.trim() === '') return '<div><br></div>';
    return `<div>${escapeHtml(line)}</div>`;
  }).join('\n');
}

type Kind = 'email' | 'linkedin';

/**
 * Copy email to clipboard with an appended signature. Uses ClipboardItem with
 * both text/plain and text/html so pasting into Gmail preserves the LinkedIn
 * hyperlink. Falls back to plain text on older browsers.
 */
export async function copyEmail(opts: {
  kind: Kind;
  subject?: string;
  body: string;
}): Promise<void> {
  const { kind, subject, body } = opts;
  const trimmed = body.trimEnd();

  if (kind === 'linkedin') {
    // LinkedIn DMs: plain text only, minimal sign-off.
    const text = `${trimmed}\n\n${LINKEDIN_TEXT}`;
    await navigator.clipboard.writeText(text);
    return;
  }

  const plainText = (subject ? `Subject: ${subject}\n\n` : '') +
                    `${trimmed}\n\n${EMAIL_TEXT}`;

  const htmlBody = (subject ? `<div><b>Subject:</b> ${escapeHtml(subject)}</div><div><br></div>` : '') +
                   bodyToHtml(trimmed) +
                   `<div><br></div>${EMAIL_HTML}`;

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
        'text/html':  new Blob([htmlBody],  { type: 'text/html'  }),
      }),
    ]);
  } catch {
    await navigator.clipboard.writeText(plainText);
  }
}
