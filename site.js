const form = document.querySelector('#request-form');
if (form) {
  const r = form.querySelector('#request');
  const count = document.querySelector('#request-count');
  const status = document.querySelector('#form-status');
  const button = form.querySelector('button[type="submit"]');
  r.addEventListener('input', () => count.textContent = `${r.value.length} / 1,000 characters`);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const endpoint = (window.POKEWORLD_CONFIG || {}).intakeEndpoint;
    if (!endpoint) { status.textContent = 'Sending is not available right now.'; return; }
    const data = new FormData(form);
    const body = new URLSearchParams({
      name: data.get('name') || '', request: data.get('request') || '',
      where: data.get('where') || '', website: data.get('website') || ''
    });
    button.disabled = true;
    status.textContent = 'Sending...';
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      const out = await res.json();
      if (out && out.ok === true) {
        status.textContent = 'Thanks, it is on the list.';
        form.reset(); count.textContent = '0 / 1,000 characters';
      } else {
        status.textContent = (out && out.message) || 'Could not send that. Please try again.';
      }
    } catch (err) {
      status.textContent = 'Could not send that. Please check your connection and try again.';
    } finally {
      button.disabled = false;
    }
  });
}

const gameUrl = (window.POKEWORLD_CONFIG || {}).gameUrl;
if (gameUrl) {
  document.querySelectorAll('[data-game-url]').forEach(a => { a.href = gameUrl; });
}
