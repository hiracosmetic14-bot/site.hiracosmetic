/* Public Shopify price/availability. No Admin token and no visitor data are forwarded. */
(() => {
 'use strict';
 const root=document.documentElement;
 const storeHost='hiracosmetic-store.myshopify.com';
 let snapshot=null,lastAttempt=0,pending=false;
 const status=document.createElement('p');status.id='hira-live-catalogue-status';status.className='hira-live-catalogue-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const anchor=document.getElementById('catalogue-search-status')||document.getElementById('resultats');
 if(!anchor)return;
 anchor.after(status);
 function targets(){return [...document.querySelectorAll('.product-card,.card')].map(card=>{
  const link=[...card.querySelectorAll('a[href]')].find(a=>{try{const u=new URL(a.href);return u.hostname===storeHost&&/^\/products\/[a-z0-9-]+$/.test(u.pathname);}catch(_){return false;}});
  return link?{card,link,handle:new URL(link.href).pathname.split('/')[2]}:null;
 }).filter(Boolean);}
 if(!targets().length){status.remove();return;}
 const money=value=>new Intl.NumberFormat('fr-BE',{style:'currency',currency:'EUR'}).format(value/100);
 function badgeFor(card){return card.querySelector('.gbs-stock,.stock');}
 function unknown(target){
  const {card,link}=target,badge=badgeFor(card);
  if(badge){badge.textContent='À confirmer en boutique';badge.dataset.liveState='unknown';badge.classList.remove('gbs-stock-available','available');}
  card.dataset.stockStatus='unconfirmed';card.dataset.available='false';
  const price=card.querySelector('.hira-price-line strong,.price');if(price)price.textContent='Voir le prix en boutique';
  const unit=card.querySelector('.hira-price-line span');if(unit)unit.textContent='';
  link.textContent='Consulter la boutique';
 }
 function apply(){
  if(!snapshot)return;
  const products=new Map(snapshot.products.map(p=>[p.handle,p]));
  let updated=0;
  targets().forEach(target=>{
    const product=products.get(target.handle);
    if(!product){unknown(target);return;}
    const {card,link}=target,badge=badgeFor(card);
    if(badge){badge.textContent=product.available?'Disponible en boutique':'Indisponible en boutique';badge.dataset.liveState=product.available?'available':'unavailable';badge.classList.toggle('gbs-stock-available',product.available);badge.classList.toggle('available',product.available);}
    card.dataset.stockStatus=product.available?'available':'unavailable';card.dataset.available=String(product.available);
    const price=card.querySelector('.hira-price-line strong,.price');
    if(price){price.textContent=(product.priceVaries?'À partir de ':'')+money(product.price);if(price.classList.contains('price')){const unit=document.createElement('small');unit.textContent=' TTC · prix boutique';price.append(unit);}}
    const unit=card.querySelector('.hira-price-line span');if(unit)unit.textContent='TTC · prix boutique';
    link.textContent=product.available?'Choisir dans la boutique':'Voir dans la boutique';
    card.dataset.liveCheckedAt=snapshot.checkedAt;updated++;
  });
  const when=new Intl.DateTimeFormat('fr-BE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Brussels'}).format(new Date(snapshot.checkedAt));
  root.dataset.liveStockState='ready';
  status.textContent='Prix et disponibilité actualisés depuis la boutique à '+when+'. Confirmation finale avant paiement.';
  if(snapshot.failedHandles?.length)status.textContent+=' Certaines références restent à vérifier en boutique.';
  document.dispatchEvent(new CustomEvent('hira:catalogue-stock-updated'));
 }
 async function refresh(){
  if(pending)return;pending=true;lastAttempt=Date.now();
  if(!snapshot){root.dataset.liveStockState='checking';status.textContent='Actualisation des prix et disponibilités depuis la boutique…';targets().forEach(({card})=>{const badge=badgeFor(card);if(badge){badge.textContent='Vérification en boutique…';badge.dataset.liveState='unknown';}});}
  try{
    const response=await fetch('/api/catalogue-live',{signal:AbortSignal.timeout(25000)});if(!response.ok)throw new Error('unavailable');
    const data=await response.json();
    if(data.currency!=='EUR'||!Number.isFinite(Date.parse(data.checkedAt))||!Array.isArray(data.products)||!data.products.length||data.products.some(p=>!p||typeof p.handle!=='string'||typeof p.available!=='boolean'||!Number.isSafeInteger(p.price)||p.price<0||p.currency!=='EUR'))throw new Error('invalid');
    snapshot=data;apply();
  }catch(_){
    snapshot=null;root.dataset.liveStockState='failed';targets().forEach(unknown);status.textContent='L’actualisation est indisponible. Consultez les prix et disponibilités dans la boutique avant de commander.';document.dispatchEvent(new CustomEvent('hira:catalogue-stock-updated'));
  }finally{pending=false;}
 }
 document.addEventListener('hira:catalogue-hydrated',()=>{if(snapshot)apply();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastAttempt>120000)refresh();});
 refresh();
})();
