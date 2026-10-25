(function () {
  'use strict';
  const search = document.getElementById('catalogue-search-input');
  if (search) {
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
    const stock = document.getElementById('hira-stock-filter');
    const brand = document.getElementById('hira-brand-filter');
    const status = document.getElementById('catalogue-search-status');
    const cards = Array.from(document.querySelectorAll('#produits .product-card, #produits .gbs-card')).map(card => {
      const label = card.querySelector('.gbs-category');
      const name = card.dataset.catalogueBrand || (label ? label.textContent.trim() : 'Gummy Professional');
      return {card, brand:name, text:normalize(card.textContent), available:!!card.querySelector('.gbs-stock-available')};
    });
    Array.from(new Set(cards.map(item => item.brand))).sort((a,b)=>a.localeCompare(b,'fr')).forEach(name => {
      const option=document.createElement('option');option.value=name;option.textContent=name;brand.appendChild(option);
    });
    function filter() {
      const terms=normalize(search.value.trim()).split(/\s+/).filter(Boolean);
      let count=0, available=0;
      cards.forEach(item => {
        const visible=terms.every(term=>item.text.includes(term)) && (!brand.value || item.brand===brand.value) && (stock.value==='all' || (stock.value==='available')===item.available);
        item.card.hidden=!visible;
        if(visible){count++;if(item.available)available++;}
      });
      document.querySelectorAll('#produits .product-grid').forEach(grid=>{
        const visible=!!grid.querySelector('.product-card:not([hidden]), .gbs-card:not([hidden])');
        grid.hidden=!visible;
        const heading=grid.previousElementSibling;
        if(heading && heading.classList.contains('section-head'))heading.hidden=!visible;
      });
      document.querySelectorAll('.gbs-brand').forEach(group=>{
        const visible=!!group.querySelector('.gbs-card:not([hidden]), .product-card:not([hidden])');
        group.hidden=!visible;
        if(visible && (search.value || brand.value || stock.value!=='all'))group.open=true;
      });
      document.querySelectorAll('.hira-category-group').forEach(group=>{group.hidden=!group.querySelector('article:not([hidden])');});
      const catalogue=document.querySelector('.gbs-catalogue');
      if(catalogue)catalogue.hidden=!catalogue.querySelector('.gbs-card:not([hidden])');
      status.textContent=count ? count+' référence'+(count>1?'s':'')+' affichée'+(count>1?'s':'')+' · '+available+' en stock · '+(count-available)+' indisponible'+(count-available>1?'s':'') : 'Aucun produit ne correspond. Modifiez les filtres ou effacez la recherche.';
    }
    search.closest('.catalogue-search').hidden=false;
    const headerSearch=document.querySelector('a[href="#catalogue-search-input"]');
    if(headerSearch)headerSearch.addEventListener('click',()=>{search.focus({preventScroll:true});});
    search.addEventListener('input',filter);stock.addEventListener('change',filter);brand.addEventListener('change',filter);
    document.getElementById('catalogue-search-reset').addEventListener('click',()=>{search.value='';stock.value='all';brand.value='';filter();search.focus();});
    document.querySelectorAll('.hira-brand-nav a, .catalogue-shortcuts a, .hira-guide-card').forEach(link=>link.addEventListener('click',()=>{search.value='';stock.value='all';brand.value='';filter();}));
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
