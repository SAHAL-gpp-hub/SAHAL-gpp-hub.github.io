export function setupCreditsModal(): void {
  const openBtn = document.getElementById('credits-trigger');
  const dialog = document.getElementById('credits-dialog') as HTMLDialogElement | null;
  const closeBtn = document.getElementById('credits-close');

  if (!openBtn || !dialog || !closeBtn) return;

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', 'true');
    }
    closeBtn.focus();
  });

  closeBtn.addEventListener('click', () => {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    openBtn.focus();
  });

  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!isInDialog) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      openBtn.focus();
    }
  });
}
