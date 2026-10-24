(function () {
  'use strict';
  const search = document.getElementById('catalogue-search-input');
  if (search) {
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
    const grids = Array.from(document.querySelectorAll('#produits .product-grid'));
    const groups = grids.map(grid => ({grid, heading: grid.previousElementSibling, cards: Array.from(grid.querySelectorAll('.product-card')).map(card => ({card, text: normalize(card.textContent)}))}));
    const status = document.getElementById('catalogue-search-status');
    function filter() {
      const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
      let count = 0;
      groups.forEach(group => {
        let visible = 0;
        group.cards.forEach(item => {
          item.card.hidden = !terms.every(term => item.text.includes(term));
          if (!item.card.hidden) visible++;
        });
        group.grid.hidden = visible === 0;
        if (group.heading && group.heading.classList.contains('section-head')) group.heading.hidden = visible === 0;
        count += visible;
      });
      status.textContent = count ? count + (count === 1 ? ' produit présenté' : ' produits présentés') : 'Aucun produit ne correspond. Essayez un autre mot ou effacez la recherche.';
    }
    search.closest('.catalogue-search').hidden = false;
    search.addEventListener('input', filter);
    document.getElementById('catalogue-search-reset').addEventListener('click', () => {search.value = ''; filter(); search.focus();});
    document.querySelectorAll('.catalogue-shortcuts a').forEach(link => link.addEventListener('click', () => {search.value = ''; filter();}));
    filter();
  }
  const form = document.getElementById('contact-form');
  if (form) form.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    if (!name || !email || !message) return;
    const body = 'Nom : ' + name + '\nE-mail : ' + email + '\n\n' + message;
    window.location.href = 'mailto:info@hiracosmetic.be?subject=' + encodeURIComponent('Demande depuis HIRA COSMETIC') + '&body=' + encodeURIComponent(body);
  });
  const banner = document.getElementById('hira-cookie-consent');
  if (banner) {
    const key = 'hira-cookie-v1';
    const detail = document.getElementById('hira-cookie-detail');
    const analytics = document.getElementById('hira-cookie-analytics');
    const marketing = document.getElementById('hira-cookie-marketing');
    let choice = null;
    try {choice = JSON.parse(localStorage.getItem(key) || 'null');} catch (_) {}
    function sync() {analytics.checked = !!(choice && choice.analytics); marketing.checked = !!(choice && choice.marketing);}
    function save(value) {
      choice = value;
      try {localStorage.setItem(key, JSON.stringify(value));} catch (_) {}
      banner.hidden = true;
      detail.hidden = true;
      document.getElementById('hira-cookie-settings').focus();
    }
    banner.hidden = !!choice;
    document.querySelector('[data-cookie-action=accept]').onclick = () => save({necessary:true,analytics:true,marketing:true});
    document.querySelector('[data-cookie-action=reject]').onclick = () => save({necessary:true,analytics:false,marketing:false});
    document.querySelector('[data-cookie-action=customize]').onclick = () => {sync(); detail.hidden = false; analytics.focus();};
    document.querySelector('[data-cookie-action=save]').onclick = () => save({necessary:true,analytics:analytics.checked,marketing:marketing.checked});
    document.getElementById('hira-cookie-settings').onclick = () => {sync(); banner.hidden = false; detail.hidden = false; analytics.focus();};
  }
})();
