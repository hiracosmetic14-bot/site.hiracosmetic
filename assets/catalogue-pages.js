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
    const grid = cards[0]?.parentElement;
    const tools = input.closest('.tools');
    const productInfo = cards.map(card => {
      const meta = card.querySelector('.meta')?.textContent;
      const [brand = '', category = ''] = (meta || (card.classList.contains('hira-shave-pair') ? 'Gummy Professional · Rasage' : '')).split(' · ');
      return {
        card, brand: brand.trim(), category: category.trim(),
        price: () => {
          const price = card.querySelector('.price')?.textContent.match(/(\d[\d \u00a0\u202f]*(?:[.,]\d{1,2})?)\s*€/);
          return price ? Number(price[1].replace(/\s/g, '').replace(',', '.')) : null;
        }
      };
    });

    function selectFilter(label, options) {
      const field = document.createElement('label');
      field.textContent = label;
      const select = document.createElement('select');
      for (const [value, title] of options) select.add(new Option(title, value));
      field.append(select);
      tools.append(field);
      return select;
    }

    function facet(key, label, all) {
      const values = [...new Set(productInfo.map(product => product[key]).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'fr-BE'));
      return values.length > 1 ? selectFilter(label, [['', all], ...values.map(value => [value, value])]) : null;
    }

    const category = facet('category', 'Catégorie', 'Toutes les catégories');
    const brand = facet('brand', 'Marque', 'Toutes les marques');
    const sort = selectFilter('Trier par', [['', 'En stock en premier'], ['name', 'Nom de A à Z']]);
    function enablePriceSort() {
      if (sort.options.length === 2 && productInfo.some(product => product.price() !== null)) {
        sort.add(new Option('Prix croissant', 'price-up'));
        sort.add(new Option('Prix décroissant', 'price-down'));
      }
    }
    enablePriceSort();
    const selects = [category, brand, sort].filter(Boolean);

    if (grid) {
      const layout = document.createElement('div');
      layout.className = 'catalogue-layout';
      const filters = document.createElement('details');
      filters.className = 'catalogue-filters';
      filters.open = !matchMedia('(max-width: 700px)').matches;
      const summary = document.createElement('summary');
      summary.textContent = 'Filtres et tri';
      const results = document.createElement('section');
      results.className = 'catalogue-results';
      results.setAttribute('aria-label', 'Produits');
      tools.before(layout);
      filters.append(summary, tools);
      results.append(status, grid, more.closest('.more') || more);
      layout.append(filters, results);
    }

    let limit = 24;
    const norm = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/(?<![\p{L}\d])(\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d+)\s*(ml|cl|kg|gr|g|l)\b/gu, (_, number, unit) => number.replace(/\s/g, '') + (unit === 'gr' ? 'g' : unit));
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'catalogue-reset';
    reset.textContent = 'Effacer les filtres';
    reset.hidden = true;
    reset.setAttribute('aria-controls', 'resultats');
    tools.append(reset);
    const hint = document.createElement('p');
    hint.className = 'catalogue-empty';
    hint.hidden = true;
    hint.textContent = 'Modifiez la recherche ou effacez les filtres.';
    status.after(hint);
    function render(fresh) {
      if (fresh) limit = 24;
      const terms = norm(input.value.trim()).split(/\s+/).filter(Boolean);
      const order = sort.value;
      const ordered = productInfo.map(product => ({ ...product, amount: product.price() })).sort((a, b) => {
        if (order === 'name') {
          return (a.card.querySelector('h2')?.textContent || '').localeCompare(b.card.querySelector('h2')?.textContent || '', 'fr-BE');
        }
        if (order === 'price-up' || order === 'price-down') {
          if (a.amount === null || b.amount === null) return Number(a.amount === null) - Number(b.amount === null);
          return order === 'price-up' ? a.amount - b.amount : b.amount - a.amount;
        }
        return Number(b.card.dataset.available === 'true') - Number(a.card.dataset.available === 'true');
      });
      if (grid && ordered.some(({ card }, index) => card !== grid.children[index])) {
        grid.append(...ordered.map(({ card }) => card));
      }
      const matched = ordered.filter(product =>
        (!category?.value || product.category === category.value) &&
        (!brand?.value || product.brand === brand.value) &&
        (!stock.checked || product.card.dataset.available === 'true') &&
        terms.every(term => norm(product.card.textContent).includes(term))
      ).map(({ card }) => card);
      cards.forEach(card => { card.hidden = true; });
      matched.slice(0, limit).forEach(card => { card.hidden = false; });
      status.textContent = matched.length ? matched.length + ' référence' + (matched.length > 1 ? 's' : '') + ' · ' + Math.min(limit, matched.length) + ' affichée' + (Math.min(limit, matched.length) > 1 ? 's' : '') : 'Aucune référence ne correspond à votre recherche.';
      hint.hidden = matched.length !== 0;
      reset.hidden = !input.value && !stock.checked && !selects.some(select => select.value);
      more.hidden = matched.length <= limit;
      if (!more.hidden) more.textContent = 'Afficher ' + Math.min(24, matched.length - limit) + ' référence' + (Math.min(24, matched.length - limit) > 1 ? 's' : '') + ' de plus';
      return matched;
    }
    reset.addEventListener('click', () => { input.value = ''; stock.checked = false; selects.forEach(select => { select.selectedIndex = 0; }); render(true); input.focus(); });
    input.addEventListener('input', () => render(true));
    selects.forEach(select => select.addEventListener('change', () => render(true)));
    stock.addEventListener('change', () => render(true));
    input.addEventListener('keydown', event => { if (event.key === 'Escape' && input.value) { event.preventDefault(); input.value = ''; render(true); } });
    more.addEventListener('click', () => {
      const shown = cards.filter(card => !card.hidden).length;
      limit += 24;
      render(false)[shown]?.querySelector('a')?.focus({ preventScroll: true });
    });
    document.addEventListener('hira:catalogue-stock-updated', () => {
      enablePriceSort();
      render(false);
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

(()=>{if(document.getElementById('hira-live-catalogue-loader'))return;const s=document.createElement('script');s.id='hira-live-catalogue-loader';s.src='/assets/catalogue-live.js';s.defer=true;document.head.append(s);})();

