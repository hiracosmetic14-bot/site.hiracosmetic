const offerDialog = document.querySelector('#hira-offer-dialog');
const offerNewsletter = document.querySelector('#hira-offer-news');

if (offerDialog && offerNewsletter && typeof offerDialog.showModal === 'function') {
  offerNewsletter.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    offerDialog.showModal();
  });
}
