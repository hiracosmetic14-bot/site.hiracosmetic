const offerDialog = document.querySelector('#hira-offer-dialog');
const offerNewsletter = document.querySelector('#hira-offer-news');
const offerSessionKey = 'hira-welcome-offer-seen';

if (offerDialog && offerNewsletter && typeof offerDialog.showModal === 'function') {
  offerNewsletter.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    offerDialog.showModal();
  });

  try {
    if (!sessionStorage.getItem(offerSessionKey) && !window.location.hash) {
      sessionStorage.setItem(offerSessionKey, '1');
      offerDialog.showModal();
    }
  } catch {
    // The banner link still opens the offer if browser storage is unavailable.
  }
}
