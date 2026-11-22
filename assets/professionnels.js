(() => {
  'use strict';
  const form = document.getElementById('professional-request');
  if (!form) return;
  form.hidden = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const fields = new FormData(form);
    const lines = [
      ['Établissement', 'business'],
      ['Activité', 'activity'],
      ['Ville', 'city'],
      ['Contact', 'contact'],
      ['E-mail professionnel', 'business-email'],
      ['N° d’entreprise ou de TVA', 'business-number'],
      ['Références et besoins', 'needs']
    ].flatMap(([label, key]) => {
      const value = String(fields.get(key) || '').trim();
      return value ? [label + ' : ' + value] : [];
    });
    const subject = encodeURIComponent('Demande d’ouverture de compte pro — HIRA COSMETIC');
    const body = encodeURIComponent(lines.join('\n'));
    document.getElementById('request-status').textContent = 'Vérifiez le message dans votre messagerie, puis envoyez-le à HIRA COSMETIC.';
    window.location.href = 'mailto:info@hiracosmetic.be?subject=' + subject + '&body=' + body;
  });
})();
