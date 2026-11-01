/**
 * Password gate: SHA-256 (Web Crypto) vs VITE_OFFICE_PASSWORD_HASH.
 * Never stores plaintext passwords.
 */

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * @returns {Promise<boolean>} true when unlocked
 */
export function runPasswordGate() {
  const expected = (import.meta.env.VITE_OFFICE_PASSWORD_HASH || '').trim().toLowerCase();
  const gate = document.getElementById('auth-gate');
  const app = document.getElementById('app');
  const input = document.getElementById('office-password');
  const submit = document.getElementById('auth-submit');
  const err = document.getElementById('auth-error');

  // Dev / missing hash: allow through with a console notice (build can inject later).
  if (!expected) {
    console.info('[auth] VITE_OFFICE_PASSWORD_HASH unset — gate open for local build.');
    gate.hidden = true;
    app.hidden = false;
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    async function tryUnlock() {
      err.hidden = true;
      const hash = (await sha256Hex(input.value)).toLowerCase();
      if (hash === expected) {
        gate.hidden = true;
        app.hidden = false;
        input.value = '';
        resolve(true);
        return;
      }
      err.hidden = false;
      input.select();
    }

    submit.addEventListener('click', () => {
      void tryUnlock();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') void tryUnlock();
    });
    input.focus();
  });
}
