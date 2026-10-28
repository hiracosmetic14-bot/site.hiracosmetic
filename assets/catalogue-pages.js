(() => {
  'use strict';
  const main = document.querySelector('main');
  if (main) {
    main.id ||= 'contenu-catalogue';
    main.setAttribute('tabindex', '-1');
    const skip = document.createElement('a');
    skip.href = '#' + main.id;
    skip.className = 'catalogue-skip-link';
    skip.textContent = 'Aller au contenu';
    document.body.prepend(skip);
  }
  document.querySelectorAll('header nav a').forEach(link => {
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && url.pathname === location.pathname && !url.hash) link.setAttribute('aria-current', 'page');
  });
  const input = document.querySelector('#recherche');
  const stock = document.querySelector('#stock');
  const more = document.querySelector('#more');
  const status = document.querySelector('#resultats');
  const cards = [...document.querySelectorAll('.card')];
  if (input && stock && more && status) {
    let limit = 24;
    const norm = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'catalogue-reset';
    reset.textContent = 'Effacer les filtres';
    reset.hidden = true;
    reset.setAttribute('aria-controls', 'resultats');
    document.querySelector('.tools').appendChild(reset);
    const hint = document.createElement('p');
    hint.className = 'catalogue-empty';
    hint.hidden = true;
    hint.textContent = 'Essayez un nom de produit plus court ou retirez le filtre « Uniquement en stock ».';
    status.after(hint);
    function render(fresh) {
      if (fresh) limit = 24;
      const terms = norm(input.value.trim()).split(/\s+/).filter(Boolean);
      const matched = cards.filter(card => terms.every(term => norm(card.textContent).includes(term)) && (!stock.checked || card.dataset.available === 'true'));
      cards.forEach(card => { card.hidden = true; });
      matched.slice(0, limit).forEach(card => { card.hidden = false; });
      status.textContent = matched.length ? matched.length + ' référence' + (matched.length > 1 ? 's' : '') + ' · ' + Math.min(limit, matched.length) + ' affichée' + (Math.min(limit, matched.length) > 1 ? 's' : '') : 'Aucune référence ne correspond à votre recherche.';
      hint.hidden = matched.length !== 0;
      reset.hidden = !input.value && !stock.checked;
      more.hidden = matched.length <= limit;
      if (!more.hidden) more.textContent = 'Afficher ' + Math.min(24, matched.length - limit) + ' référence' + (Math.min(24, matched.length - limit) > 1 ? 's' : '') + ' de plus';
    }
    reset.addEventListener('click', () => { input.value = ''; stock.checked = false; render(true); input.focus(); });
    input.addEventListener('input', () => render(true));
    stock.addEventListener('change', () => render(true));
    input.addEventListener('keydown', event => { if (event.key === 'Escape' && input.value) { event.preventDefault(); input.value = ''; render(true); } });
    more.addEventListener('click', () => {
      const shown = cards.filter(card => !card.hidden).length;
      limit += 24;
      render(false);
      cards.filter(card => !card.hidden)[shown]?.querySelector('a')?.focus({ preventScroll: true });
    });
    render(true);
  }
  document.querySelectorAll('img[data-fallback]').forEach(image => image.addEventListener('error', () => {
    if (!image.dataset.fallback) return;
    const fallback = image.dataset.fallback;
    delete image.dataset.fallback;
    image.src = fallback;
  }));
})();
/* Shared consent-gated measurement, loaded once on catalogue pages. */
(() => { if (document.getElementById('hira-analytics-loader')) return; const script = document.createElement('script'); script.id = 'hira-analytics-loader'; script.src = '/assets/analytics.js'; script.defer = true; document.head.appendChild(script); })();
