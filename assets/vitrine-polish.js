(function () {
  'use strict';
  const search = document.getElementById('catalogue-search-input');
  if (search) {
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
    const stock = document.getElementById('hira-stock-filter');
    const brand = document.getElementById('hira-brand-filter');
    const category=document.getElementById('hira-category-filter');
    const status = document.getElementById('catalogue-search-status');
    const cards = Array.from(document.querySelectorAll('#produits .product-card, #produits .gbs-card')).map(card => {
      const label = card.querySelector('.gbs-category');
      const name = card.dataset.catalogueBrand || (label ? label.textContent.trim() : 'Gummy Professional');
      const available=!!card.querySelector('.gbs-stock-available');
      const categoryName=card.closest('.hira-category-group')?.querySelector('h3')?.textContent.trim()||'';
      return {card, brand:name, category:categoryName,text:normalize(card.textContent), available,stock:card.dataset.stockStatus||(available?'available':'unavailable')};
    });
    Array.from(new Set(cards.map(item => item.brand))).sort((a,b)=>a.localeCompare(b,'fr')).forEach(name => {
      const option=document.createElement('option');option.value=name;option.textContent=name;brand.appendChild(option);
    });
    Array.from(new Set(cards.map(item=>item.category))).filter(Boolean).sort((a,b)=>a.localeCompare(b,'fr')).forEach(name=>{const option=document.createElement('option');option.value=name;option.textContent=name;category.appendChild(option);});
    function filter() {
      const terms=normalize(search.value.trim()).split(/\s+/).filter(Boolean);
      let count=0, available=0, unconfirmed=0;
      cards.forEach(item => {
        const visible=terms.every(term=>item.text.includes(term)) && (!brand.value || item.brand===brand.value) && (stock.value==='all' || stock.value===item.stock) && (!category.value || item.category===category.value);
        item.card.hidden=!visible;
        if(visible){count++;if(item.available)available++;if(item.stock==='unconfirmed')unconfirmed++;}
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
        if(visible && (search.value || brand.value || stock.value!=='all' || category.value))group.open=true;
      });
      document.querySelectorAll('.hira-category-group').forEach(group=>{group.hidden=!group.querySelector('article:not([hidden])');});
      const catalogue=document.querySelector('.gbs-catalogue');
      if(catalogue)catalogue.hidden=!catalogue.querySelector('.gbs-card:not([hidden])');
      const request=document.getElementById('hira-brand-request');
      const missingBrand=brand.value && !cards.some(item=>item.brand===brand.value);
      if(request){request.hidden=!missingBrand;if(missingBrand){document.getElementById('hira-brand-request-title').textContent=brand.value+' · Références sur demande';document.getElementById('hira-brand-request-link').href='mailto:info@hiracosmetic.be?subject='+encodeURIComponent('Demande de références : '+brand.value);}}
      document.querySelectorAll('.hira-catalog-mode button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.catalogMode===stock.value)));
      status.textContent=count ? (stock.value==='available' ? count+' produits disponibles à commander' : count+' références affichées'+(unconfirmed?' · '+unconfirmed+' disponibilités à confirmer':'')) : 'Aucun produit ne correspond. Modifiez les filtres ou effacez la recherche.';
    }
    search.closest('.catalogue-search').hidden=false;
    const headerSearch=document.querySelector('a[href="#catalogue-search-input"]');
    if(headerSearch)headerSearch.addEventListener('click',()=>{search.focus({preventScroll:true});});
    search.addEventListener('input',filter);stock.addEventListener('change',filter);brand.addEventListener('change',filter);category.addEventListener('change',filter);
    document.getElementById('catalogue-search-reset').addEventListener('click',()=>{search.value='';stock.value='all';brand.value='';category.value='';filter();search.focus();});
    document.querySelectorAll('.hira-hero-brandline a, .hira-brand-nav a, .catalogue-shortcuts a, .hira-guide-card').forEach(link=>link.addEventListener('click',()=>{search.value='';stock.value='all';brand.value='';category.value='';filter();}));
    document.querySelectorAll('[data-catalog-mode]').forEach(button=>button.addEventListener('click',()=>{search.value='';brand.value='';category.value='';stock.value=button.dataset.catalogMode;filter();}));
    document.addEventListener('click',event=>{
      const link=event.target.closest('[data-browse-brand]');if(!link)return;
      const name=link.dataset.browseBrand;
      if(!Array.from(brand.options).some(option=>option.value===name)){const option=document.createElement('option');option.value=name;option.textContent=name;brand.appendChild(option);}
      search.value='';category.value='';stock.value='all';brand.value=name;filter();
    });
    stock.value='available';
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
