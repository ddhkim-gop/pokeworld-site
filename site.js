const form = document.querySelector('#request-form');
if (form) {
  const r = form.querySelector('#request');
  const count = document.querySelector('#request-count');
  const status = document.querySelector('#form-status');
  const button = form.querySelector('button[type="submit"]');
  const shots = [];
  const preview = document.querySelector('#screenshot-previews');
  const pasteStatus = document.querySelector('#paste-status');
  let pending = 0, sending = false;
  let submissionId = crypto.randomUUID();
  const renderShots = () => {
    preview.replaceChildren();
    shots.forEach((data, i) => {
      const card = document.createElement('div'); card.className = 'shot-card';
      const img = document.createElement('img'); img.src = data; img.alt = `Pasted screenshot ${i + 1}`;
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = `Remove screenshot ${i + 1}`;
      remove.addEventListener('click', () => { if (sending) return; shots.splice(i, 1); renderShots(); });
      card.append(img, remove); preview.append(card);
    });
  };
  form.addEventListener('paste', async e => {
    const files = [...(e.clipboardData?.items || [])].filter(i => i.kind === 'file' && i.type.startsWith('image/')).map(i => i.getAsFile()).filter(Boolean);
    if (!files.length) return;
    e.preventDefault();
    if (sending) return;
    for (const file of files) {
      if (shots.length + pending >= 3) { pasteStatus.textContent = 'Up to 3 screenshots per request. Remove one to paste another.'; break; }
      if (file.size > 20000000) { pasteStatus.textContent = 'That screenshot is too large. Copy a smaller area and paste again.'; continue; }
      pending++; button.disabled = true; pasteStatus.textContent = 'Preparing screenshot...';
      let url;
      try {
        url = URL.createObjectURL(file);
        const img = new Image(); img.src = url; await img.decode();
        const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let data;
        for (const quality of [.86, .72, .58, .42, .28]) { data = canvas.toDataURL('image/jpeg', quality); if (data.length <= 240000) break; }
        if (data.length > 240000) throw new Error('too large');
        shots.push(data); renderShots(); pasteStatus.textContent = `${shots.length} screenshot${shots.length === 1 ? '' : 's'} attached. Paste again to add another.`;
      } catch (_) { pasteStatus.textContent = 'Could not prepare that screenshot. Copy a smaller area and paste again.'; }
      finally { if (url) URL.revokeObjectURL(url); pending--; button.disabled = sending || pending > 0; }
    }
  });
  r.addEventListener('input', () => count.textContent = `${r.value.length} / 1,000 characters`);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (pending || sending) return;
    if (!form.reportValidity()) return;
    const endpoint = (window.POKEWORLD_CONFIG || {}).intakeEndpoint;
    if (!endpoint) { status.textContent = 'Sending is not available right now.'; return; }
    const data = new FormData(form);
    const body = new URLSearchParams({
      name: data.get('name') || '', request: data.get('request') || '',
      where: data.get('where') || '', website: data.get('website') || '',
      screenshots: JSON.stringify(shots), submissionId
    });
    sending = true; button.disabled = true;
    status.textContent = 'Sending...';
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      const out = await res.json();
      if (out && out.ok === true && out.screenshotCount === shots.length) {
        status.textContent = 'Thanks, it is on the list.';
        form.reset(); shots.length = 0; renderShots(); submissionId = crypto.randomUUID(); pasteStatus.textContent = ''; count.textContent = '0 / 1,000 characters';
      } else {
        if (out?.saved) { form.querySelectorAll('input,textarea,button').forEach(e => e.disabled = true); }
        status.textContent = (out && out.message) || 'Could not send that. Please try again.';
      }
    } catch (err) {
      status.textContent = 'Could not send that. Please check your connection and try again.';
    } finally {
      sending = false; button.disabled = form.querySelector('#name').disabled || pending > 0;
    }
  });
}

const gameUrl = (window.POKEWORLD_CONFIG || {}).gameUrl;
if (gameUrl) {
  document.querySelectorAll('[data-game-url]').forEach(a => { a.href = gameUrl; });
}
