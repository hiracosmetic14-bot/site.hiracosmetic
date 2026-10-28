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
    const filterOverview=document.createElement('div');
    filterOverview.className='hira-applied-filters';filterOverview.setAttribute('aria-label','Filtres actifs');
    status.after(filterOverview);
    const recovery=document.createElement('button');
    recovery.type='button';recovery.className='hira-search-recovery';recovery.hidden=true;
    recovery.addEventListener('click',()=>{stock.value='all';filter();});
    filterOverview.after(recovery);
    function updateFilterOverview(terms,count){
      filterOverview.replaceChildren();
      [[search,search.value.trim()?'Recherche : '+search.value.trim():''],[brand,brand.value],[category,category.value],[stock,stock.value==='all'?'':stock.options[stock.selectedIndex].textContent]].forEach(([control,label])=>{
        if(!label)return;
        const button=document.createElement('button');button.type='button';button.textContent=label+' ×';
        button.setAttribute('aria-label','Retirer le filtre '+label);
        button.addEventListener('click',()=>{control.value=control===stock?'all':'';filter();});
        filterOverview.appendChild(button);
      });
      const otherCount=stock.value==='all'?0:cards.filter(item=>terms.every(term=>item.text.includes(term))&&(!brand.value||item.brand===brand.value)&&(!category.value||item.category===category.value)&&item.stock!==stock.value).length;
      recovery.hidden=!!count||!otherCount;
      if(!recovery.hidden)recovery.textContent='Voir '+otherCount+' référence'+(otherCount>1?'s':'')+' dans les autres disponibilités';
    }
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
      status.textContent=count ? (stock.value==='available' ? count+' produits disponibles à commander' : count+' références affichées'+(unconfirmed?' · '+unconfirmed+' disponibilités à confirmer':'')) : 'Aucun produit ne correspond aux filtres actuels. Retirez un filtre ou modifiez la recherche.';
      updateFilterOverview(terms,count);
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
})();

/* Shared consent-gated measurement, loaded once on catalogue pages. */
(()=>{if(document.getElementById('hira-analytics-loader'))return;const s=document.createElement('script');s.id='hira-analytics-loader';s.src='/assets/analytics.js';s.defer=true;document.head.appendChild(s);})();
