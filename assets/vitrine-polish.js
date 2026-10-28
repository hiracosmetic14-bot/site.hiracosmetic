(function () {
  'use strict';
  const search = document.getElementById('catalogue-search-input');
  if (search) {
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
    const stock = document.getElementById('hira-stock-filter');
    const brand = document.getElementById('hira-brand-filter');
    const category=document.getElementById('hira-category-filter');
    const status = document.getElementById('catalogue-search-status');
    function collectCards(){return Array.from(document.querySelectorAll('#produits .product-card, #produits .gbs-card')).map(card => {
      const label = card.querySelector('.gbs-category');
      const name = card.dataset.catalogueBrand || (label ? label.textContent.trim() : 'Gummy Professional');
      const available=!!card.querySelector('.gbs-stock-available');
      const categoryName=card.closest('.hira-category-group')?.querySelector('h3')?.textContent.trim()||'';
      return {card, brand:name, category:categoryName,text:normalize(card.textContent), available,stock:card.dataset.stockStatus||(available?'available':'unavailable')};
    });}
    let cards=collectCards(), catalogueLoaded=false, cataloguePromise=null;
    async function ensureCatalogue(){
      if(catalogueLoaded)return;
      if(cataloguePromise)return cataloguePromise;
      cataloguePromise=(async()=>{
        const response=await fetch('/assets/catalogue-complet.json');
        if(!response.ok)throw new Error('catalogue');
        const data=await response.json();
        if(!Array.isArray(data.containers))throw new Error('catalogue');
        data.containers.forEach(fragment=>{
          if(!/^hira-lazy-grid-[0-9]+$/.test(fragment.id)||typeof fragment.html!=='string')return;
          const grid=document.getElementById(fragment.id);if(!grid)return;
          grid.insertAdjacentHTML('beforeend',fragment.html);
          grid.querySelectorAll('.gbs-image').forEach(area=>{
            if(area.querySelector('a,button'))return;
            const image=area.querySelector('img');if(!image)return;
            const link=document.createElement('a');link.href=image.dataset.originalPhoto||image.src;link.target='_blank';link.rel='noopener';link.setAttribute('aria-label','Agrandir : '+image.alt);image.before(link);link.append(image);
          });
        });
        cards=collectCards();
        [[brand,'brand'],[category,'category']].forEach(([control,key])=>{
          Array.from(new Set(cards.map(item=>item[key]))).filter(Boolean).sort((a,b)=>a.localeCompare(b,'fr')).forEach(name=>{
            if(Array.from(control.options).some(option=>option.value===name))return;
            const option=document.createElement('option');option.value=name;option.textContent=name;control.append(option);
          });
        });
        catalogueLoaded=true;
        document.dispatchEvent(new CustomEvent('hira:catalogue-hydrated'));
      })().catch(error=>{cataloguePromise=null;throw error;});
      return cataloguePromise;
    }
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
    async function filter() {
      if(stock.value!=='available'&&!catalogueLoaded){
        status.textContent='Chargement du catalogue complet…';
        try{await ensureCatalogue();}catch(_){status.textContent='Le catalogue complet ne se charge pas. Réessayez ou utilisez le lien « Explorer par marque ou catégorie ». ';return;}
      }
      const terms=normalize(search.value.trim()).split(/\s+/).filter(Boolean);
      let count=0, available=0, unconfirmed=0;
      cards.forEach(item => {
        const visible=terms.every(term=>item.text.includes(term)) && (!brand.value || item.brand===brand.value) && (stock.value==='all' || (stock.value==='available' && document.documentElement.dataset.liveStockState==='failed' ? item.card.classList.contains('product-card') : stock.value===item.stock)) && (!category.value || item.category===category.value);
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
      status.textContent=count ? (stock.value==='available' ? count+(document.documentElement.dataset.liveStockState==='ready'?' produits disponibles en boutique':' produits de la sélection') : count+' références affichées'+(unconfirmed?' · '+unconfirmed+' disponibilités à confirmer':'')) : 'Aucun produit ne correspond aux filtres actuels. Retirez un filtre ou modifiez la recherche.';
      updateFilterOverview(terms,count);
      document.dispatchEvent(new CustomEvent('hira:catalogue-results',{detail:{count,searchLength:search.value.trim().length}}));
    }
    search.closest('.catalogue-search').hidden=false;
    const headerSearch=document.querySelector('a[href="#catalogue-search-input"]');
    if(headerSearch)headerSearch.addEventListener('click',()=>{search.focus({preventScroll:true});});
    search.addEventListener('input',filter);stock.addEventListener('change',filter);brand.addEventListener('change',filter);category.addEventListener('change',filter);
    document.getElementById('catalogue-search-reset').addEventListener('click',()=>{search.value='';stock.value='available';brand.value='';category.value='';filter();search.focus();});
    document.querySelectorAll('.hira-hero-brandline a, .hira-brand-nav a, .catalogue-shortcuts a, .hira-guide-card').forEach(link=>link.addEventListener('click',()=>{search.value='';stock.value='all';brand.value='';category.value='';filter();}));
    document.querySelectorAll('[data-catalog-mode]').forEach(button=>button.addEventListener('click',()=>{search.value='';brand.value='';category.value='';stock.value=button.dataset.catalogMode;filter();}));
    document.addEventListener('click',event=>{
      const link=event.target.closest('[data-browse-brand]');if(!link)return;
      const name=link.dataset.browseBrand;
      if(!Array.from(brand.options).some(option=>option.value===name)){const option=document.createElement('option');option.value=name;option.textContent=name;brand.appendChild(option);}
      search.value='';category.value='';stock.value='all';brand.value=name;filter();
    });
    document.addEventListener('hira:catalogue-stock-updated',()=>{cards=collectCards();filter();});
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

/* Small usability improvements; do not submit or send any contact message. */
(() => {
  'use strict';
  document.querySelectorAll('.gbs-brand > summary span').forEach(label => {
    label.textContent = label.textContent.replace(/\b1 références\b/g, '1 référence');
  });
  const email = document.querySelector('#contact a[href="mailto:info@hiracosmetic.be"]');
  if (!email || !navigator.clipboard?.writeText) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hira-copy-email';
  button.textContent = 'Copier l’adresse e-mail';
  const status = document.createElement('span');
  status.className = 'hira-copy-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('info@hiracosmetic.be'); status.textContent = 'Adresse copiée : info@hiracosmetic.be'; }
    catch (_) { status.textContent = 'Sélectionnez l’adresse e-mail ci-dessus pour la copier.'; }
  });
  email.parentElement.after(button, status);
})();

/* Direct access to product advice and professional enquiries. */
(() => {
  const nav = document.querySelector('header nav[aria-label="Navigation principale"]');
  if (nav && !nav.querySelector('a[href="/guide-coiffants.html"]')) {
    const guide = document.createElement('a');
    guide.href = '/guide-coiffants.html'; guide.textContent = 'Guide';
    const pro = document.createElement('a');
    pro.href = '/professionnels.html'; pro.textContent = 'Professionnels';
    const help = nav.querySelector('a[href="#questions-frequentes"]');
    if (help) help.before(guide, pro); else nav.append(guide, pro);
  }
  const footer = document.querySelector('footer nav[aria-label="À propos de HIRA COSMETIC"]');
  if (footer) {
    const duplicate = footer.querySelector('a[href="#contact"] + a[href="#contact"]');
    if (duplicate) { duplicate.href = '/professionnels.html'; duplicate.textContent = 'Espace professionnels'; }
    const guide = document.createElement('a');
    guide.href = '/guide-coiffants.html'; guide.textContent = 'Choisir son coiffant';
    footer.append(guide);
  }
})();

/* Product-context assistance: no message is sent and no AI service is implied. */
(() => {
  const dialog = document.getElementById('product-detail-dialog');
  const launcher = document.getElementById('hira-chat-launcher');
  const panel = document.getElementById('hira-chat-panel');
  if (!dialog || !launcher || !panel) return;
  const guide = document.createElement('a');
  guide.href = '/guide-coiffants.html';
  guide.textContent = 'Bien choisir mon produit';
  guide.className = 'hira-assistance-guide';
  (panel.querySelector('.chat-links') || panel).append(guide);
  const prompt = document.createElement('aside');
  prompt.className = 'hira-product-help'; prompt.hidden = true;
  prompt.setAttribute('aria-label', 'Aide au choix du produit');
  const text = document.createElement('p');
  text.textContent = 'Une question sur ce produit ? Consultez notre guide ou préparez une demande à HIRA COSMETIC.';
  const link = document.createElement('a');
  link.href = '/guide-coiffants.html'; link.textContent = 'M’aider à choisir';
  const close = document.createElement('button'); close.type = 'button';
  close.textContent = 'Fermer'; close.setAttribute('aria-label', 'Fermer cette invitation');
  prompt.append(text, link, close); dialog.append(prompt);
  let timer = null, dismissed = false;
  const shortcut = document.createElement('a');
  shortcut.href = '/guide-coiffants.html';
  shortcut.className = 'hira-product-help-shortcut';
  shortcut.textContent = 'Besoin d’aide pour choisir ?';
  const heading = dialog.querySelector('.product-detail-head');
  if (heading) heading.after(shortcut); else dialog.prepend(shortcut);
  function stop() { clearTimeout(timer); timer = null; }
  function schedule() {
    stop();
    if (!dialog.open || document.hidden || dismissed) return;
    timer = setTimeout(() => {
      if (!dialog.open || document.hidden || dismissed) return;
      prompt.hidden = false;
    }, 25000);
  }
  close.addEventListener('click', () => { dismissed = true; stop(); prompt.hidden = true; });
  new MutationObserver(() => { prompt.hidden = true; schedule(); }).observe(dialog, {attributes:true, attributeFilter:['open']});
  document.addEventListener('visibilitychange', schedule);
  dialog.addEventListener('close', () => { stop(); prompt.hidden = true; });
  schedule();
})();

/* Local conversational assistant. It uses published content, not a generative AI API. */
(() => {
  const oldPanel = document.getElementById('hira-chat-panel');
  const oldLauncher = document.getElementById('hira-chat-launcher');
  if (!oldPanel || !oldLauncher) return;
  const panel = oldPanel.cloneNode(false);
  panel.classList.add('hira-advisor');
  const launcher = oldLauncher.cloneNode(true);
  oldPanel.replaceWith(panel); oldLauncher.replaceWith(launcher);
  launcher.querySelector('span').textContent = 'Discuter avec HIRA';
  panel.setAttribute('aria-label', 'Assistant automatique HIRA COSMETIC');
  panel.innerHTML = '<div class="chat-head"><div><div class="chat-head-brand">HIRA COSMETIC</div><div class="chat-head-sub">Conseiller coiffure · mode guidé</div></div><button class="chat-close" type="button" aria-label="Fermer le chat">×</button></div><div class="hira-chat-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation"></div><div class="hira-chat-quick" aria-label="Questions fréquentes"></div><form class="chat-form" id="hira-chat-form"><label for="hira-chat-message">Votre question</label><textarea id="hira-chat-message" name="message" maxlength="500" placeholder="Ex. : quelle différence entre cire et poudre ?" required></textarea><div class="chat-form-row"><span class="chat-email-note">Réponses automatiques à partir du site.</span><button class="chat-send" type="submit">Envoyer</button></div></form>';
  const log = panel.querySelector('.hira-chat-log');
  const input = panel.querySelector('textarea');
  const productDialog = document.getElementById('product-detail-dialog');
  let returnFocus = launcher, count = 0, aiAvailable=false, aiConsent=false, busy=false;
  const history=[];
  let checkedAI=false;
  async function discoverAI(){
    if(checkedAI)return;checkedAI=true;
    try{const r=await fetch('/api/hira-assistant',{signal:AbortSignal.timeout(4000)});if(!r.ok)return;const status=await r.json();aiAvailable=status.enabled===true;if(!aiAvailable)return;
      const opt=document.createElement('label');opt.className='hira-ai-opt';const check=document.createElement('input');check.type='checkbox';
      const text=document.createElement('span');text.textContent='Utiliser l’IA : mes questions seront transmises à Vercel AI Gateway et au fournisseur du modèle. Ne pas partager de données personnelles.';
      opt.append(check,text);panel.querySelector('form').prepend(opt);check.addEventListener('change',()=>{aiConsent=check.checked;panel.querySelector('.chat-head-sub').textContent=aiConsent?'Conseiller coiffure · IA activée':'Conseiller coiffure · mode guidé';});
    }catch(_){/* Guided advice remains available when the service is disabled. */}
  }
  async function answerAI(question){
    if(!aiAvailable||!aiConsent)return false;
    const product=productDialog?.open?productDialog.querySelector('#product-detail-title')?.textContent.trim():'';
    const messages=[...history.slice(-5),{role:'user',content:question}].slice(-6);
    try{const r=await fetch('/api/hira-assistant',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(18000),body:JSON.stringify({consent:true,messages,product})});if(!r.ok)throw new Error('unavailable');const data=await r.json();
      if(typeof data.answer!=='string')throw new Error('invalid');
      const products=Array.isArray(data.products)?data.products.filter(p=>typeof p.url==='string'&&p.url.startsWith('https://hiracosmetic-store.myshopify.com/products/')):[];
      say(data.answer,products.map(p=>[p.name,p.url]));history.push({role:'user',content:question.slice(0,700)},{role:'assistant',content:data.answer.slice(0,700)});return true;
    }catch(_){say('L’IA est momentanément indisponible. Je peux continuer avec les informations du guide.');return false;}
  }
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function say(text, links = [], user = false) {
    const item = document.createElement('div');
    item.className = user ? 'hira-chat-bubble hira-chat-user' : 'hira-chat-bubble';
    const p = document.createElement('p'); p.textContent = text; item.append(p);
    links.forEach(([label,url]) => {
      const a = document.createElement('a'); a.textContent = label; a.href = url;
      item.append(a);
    });
    log.append(item);
    while (log.children.length > 30) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  const helpLink = ['Contacter HIRA par e-mail','mailto:info@hiracosmetic.be'];
  const guideLink = ['Ouvrir le guide interactif','/guide-coiffants.html'];
  const preference = {finish:'',family:''};
  function productCards(family,finish) {
    let products=[...document.querySelectorAll('.product-card')].map(card=>{
      const title=card.querySelector('h3,h2'),image=card.querySelector('img'),buy=card.querySelector('a[href*="myshopify.com/products/"]');
      return title&&buy?{title:title.textContent.trim(),image:image?.currentSrc||image?.src,url:buy.href}:null;
    }).filter(Boolean);
    if(family)products=products.filter(p=>normalize(p.title).includes(family));
    if(finish==='mat')products=products.filter(p=>/mat/.test(normalize(p.title)));
    if(finish==='brillant')products=products.filter(p=>/brillan/.test(normalize(p.title)));
    if(!products.length){say('Je ne trouve pas de référence correspondant précisément à ces critères dans la sélection affichée. Comparez les autres familles dans le guide.',[guideLink]);return;}
    const group=document.createElement('div');group.className='hira-chat-recommendations';
    const caption=document.createElement('p');caption.textContent='À explorer dans notre catalogue';caption.className='hira-chat-selection-title';group.append(caption);
    products.slice(0,2).forEach(product=>{
      const card=document.createElement('a');card.className='hira-chat-reco';card.href=product.url;
      if(product.image){const image=document.createElement('img');image.src=product.image;image.alt=product.title;image.loading='lazy';card.append(image);}
      const info=document.createElement('span'),title=document.createElement('strong'),action=document.createElement('span');
      title.textContent=product.title;action.textContent='Voir dans la boutique →';action.className='hira-chat-reco-action';info.append(title,action);card.append(info);group.append(card);
    });
    const note=document.createElement('small');note.textContent='Prix et disponibilité à vérifier dans la boutique.';group.append(note);log.append(group);log.scrollTop=log.scrollHeight;
  }
  function reply(question) {
    const q = normalize(question);
    if(/mat/.test(q))preference.finish='mat';
    if(/brillan/.test(q))preference.finish='brillant';
    if(/poudre|volume/.test(q))preference.family='poudre';
    else if(/cire|souple|modeler/.test(q))preference.family='cire';
    else if(/gel|fixation|fixer/.test(q))preference.family='gel';
    if(/^(mat|mate|brillant|brillante|effet mat|finition mate|finition brillante)[.! ]*$/.test(q)){
      const family=preference.finish==='brillant'&&preference.family==='poudre'?'cire':preference.family;
      say(preference.finish==='mat'?'D’accord, vous recherchez une finition mate. Voici des références à comparer selon la tenue souhaitée.':'D’accord, vous recherchez de la brillance. Voici des références à explorer.');
      productCards(family,preference.finish);return;
    }
    if (/allerg|enceinte|grossesse|irrit|maladie|eczema|chute.*cheveu|danger|enfant|bebe/.test(q)) {
      say('Je ne peux pas évaluer une question de santé ou garantir qu’un produit vous convient. Consultez les précautions sur l’emballage et demandez conseil à un professionnel de santé.', [helpLink]); return;
    }
    if (/retour|rembours|retract|annul/.test(q)) {
      say('Pour un retour, une rétractation ou une demande de remboursement, consultez la politique détaillée. Pour votre dossier, contactez HIRA avec la référence de commande ; cet assistant ne peut ni décider d’un remboursement ni modifier une commande.', [['Retours et rétractation','/retours-remboursement.html'],helpLink]); return;
    }
    if (/livr|frais|expedi|delai|belgique/.test(q)) {
      say('Les destinations, les frais et les délais sont détaillés sur notre page Livraison. Vérifiez le montant et les conditions affichés dans la boutique avant de payer.', [['Lire les conditions de livraison','/livraison.html']]); return;
    }
    if (/command|colis|suivi|commande/.test(q)) {
      say('Je n’ai pas accès aux commandes ni aux informations personnelles. Consultez votre compte dans la boutique ou contactez HIRA. Ne saisissez pas votre adresse, votre mot de passe ou vos coordonnées bancaires ici.', [['Accéder à mon compte','https://hiracosmetic-store.myshopify.com/account/login'],helpLink]); return;
    }
    if (/profession|grossist|salon|barbier|revend|lot|remise/.test(q)) {
      say('Vous êtes coiffeur, barbier ou revendeur ? Présentez les références et quantités envisagées dans l’espace professionnels. Les conditions éventuelles doivent être confirmées par HIRA.', [['Faire une demande professionnelle','/professionnels.html']]); return;
    }
    if (/stock|disponib|prix|combien|tarif|promo/.test(q)) {
      say('Pour connaître le prix et la disponibilité au moment de commander, ouvrez la fiche dans la boutique. Je ne confirme pas de stock, de remise ou de réservation depuis ce chat.', [['Voir la boutique','https://hiracosmetic-store.myshopify.com/']]); return;
    }
    if (/paiement|bancontact|paypal|carte|payer/.test(q)) {
      say('Les moyens de paiement disponibles sont ceux proposés par la boutique au paiement. Ne communiquez jamais de données bancaires dans ce chat.', [['Ouvrir la boutique','https://hiracosmetic-store.myshopify.com/']]); return;
    }
    if (/contact|humain|personne|telephone|whatsapp|email|e-mail/.test(q)) {
      say('Vous pouvez contacter directement HIRA COSMETIC. Le lien e-mail ouvre votre messagerie : vous vérifiez et envoyez le message vous-même.', [helpLink,['Contacter HIRA sur WhatsApp','https://wa.me/message/YPOEXFPVUT6OA1']]); return;
    }
    if (/difference|choisir|trouver|conseil|hesit|quel produit/.test(q) || (/cire/.test(q) && /poudre|gel/.test(q))) {
      say('Pour modeler les mèches, comparez les cires et crèmes. Pour structurer une coiffure fixée, comparez les gels. Pour rechercher du volume et une texture mate, explorez les poudres. Le rendu dépend de la référence. Vous préférez une finition mate ou brillante ?', [guideLink]); return;
    }
    if (/poudre|volume/.test(q)) {
      say('Les poudres coiffantes permettent de rechercher de la texture et du volume. Certaines références ont un effet mat. Suivez le mode d’emploi de votre produit et commencez par une petite quantité.', [['Voir les poudres','/categories/poudres-coiffantes.html'],guideLink]); productCards('poudre',preference.finish); return;
    }
    if (/cire|creme|brillan|mat\b|souple/.test(q)) {
      say('Les cires et crèmes servent à modeler et définir la coiffure. Comparez la finition mate ou brillante et le niveau de tenue sur chaque fiche.', [['Voir les cires et crèmes','/categories/cires-et-cremes-coiffantes.html'],guideLink]); productCards('cire',preference.finish); return;
    }
    if (/gel|fixation|fixer/.test(q)) {
      say('Les gels permettent de structurer une coiffure fixée. La tenue et le rendu varient selon la référence ; consultez sa fiche et les instructions de l’emballage.', [['Voir les gels','/categories/gels-coiffants.html'],guideLink]); productCards('gel',preference.finish); return;
    }
    if (/bonjour|salut|merci|bonsoir/.test(q)) {
      say('Bonjour ! Je peux vous orienter sur les coiffants, la livraison, les retours ou le contact. Quelle est votre question ?'); return;
    }
    const tokens = q.split(/[^a-z0-9]+/).filter(word => word.length > 3 && !['avec','pour','votre','vous','dans','produit','avoir','comment'].includes(word));
    const cards = [...document.querySelectorAll('.product-card')];
    const matches = cards.filter(card => tokens.length && tokens.every(word => normalize(card.textContent).includes(word))).slice(0,3);
    const links = matches.map(card => {
      const buy = card.querySelector('a[href*="myshopify.com/products/"]');
      const title = card.querySelector('h3,h2');
      return buy && title ? [title.textContent.trim(),buy.href] : null;
    }).filter(Boolean);
    if (links.length) say('Voici des références du catalogue qui correspondent aux mots de votre question. Consultez leur fiche pour les caractéristiques, le prix et la disponibilité.',links);
    else say('Je n’ai pas de réponse vérifiée à cette question. Vous pouvez utiliser le guide ou contacter HIRA. Cet assistant fonctionne avec des réponses prédéfinies ; il ne consulte pas vos commandes.',[guideLink,helpLink]);
  }
  function openChat() {
    discoverAI();
    returnFocus = document.activeElement;
    const currentName = productDialog?.open ? productDialog.querySelector('#product-detail-title')?.textContent.trim() : '';
    let context = panel.querySelector('.hira-advisor-context');
    if(!context){context=document.createElement('div');context.className='hira-advisor-context';panel.querySelector('.chat-head').after(context);}
    context.hidden=!currentName; context.textContent=currentName ? 'Vous consultez : '+currentName : '';
    if (productDialog?.open) productDialog.append(panel); else document.body.append(panel);
    panel.hidden = false; launcher.setAttribute('aria-expanded','true'); input.focus();
  }
  function closeChat() {
    panel.hidden = true; launcher.setAttribute('aria-expanded','false');
    if (returnFocus?.isConnected) returnFocus.focus();
  }
  launcher.addEventListener('click', () => panel.hidden ? openChat() : closeChat());
  panel.querySelector('.chat-close').addEventListener('click',closeChat);
  panel.addEventListener('keydown', e => { if(e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeChat(); } });
  productDialog?.addEventListener('close',()=>{closeChat();document.body.append(panel);});
  panel.querySelector('form').addEventListener('submit',async e=>{
    e.preventDefault();const question=input.value.trim();if(!question||busy)return;
    input.value='';say(question,[],true);busy=true;const send=panel.querySelector('.chat-send');send.disabled=true;
    try{if(!(await answerAI(question)))reply(question);count++;}finally{busy=false;send.disabled=false;input.focus();}
  });
  ['Trouver mon coiffant','Effet mat','Finition brillante','Livraison'].forEach(question=>{
    const button=document.createElement('button');button.type='button';button.textContent=question;
    button.addEventListener('click',()=>{say(question,[],true);reply(question);input.focus();});
    panel.querySelector('.hira-chat-quick').append(button);
  });
  document.querySelectorAll('.hira-product-help a,.hira-product-help-shortcut').forEach(link=>{
    link.textContent='Discuter avec l’assistant';
    link.addEventListener('click',e=>{e.preventDefault();openChat();});
  });
  const invite = document.querySelector('.hira-product-help p');
  if(invite) invite.textContent='Une question sur ce produit ? Notre assistant automatique peut vous orienter.';
  say('Trouvons votre style. Vous recherchez du volume, une coiffure structurée ou des mèches à modeler ?',[guideLink]);
  const modeNote=document.createElement('p');modeNote.className='hira-advisor-mode';modeNote.textContent='Mode guidé · sans IA générative. Ne partagez pas de données personnelles.';panel.querySelector('form').append(modeNote);
})();



/* Read-only public catalogue updates. */
(()=>{if(document.getElementById('hira-live-catalogue-loader'))return;const script=document.createElement('script');script.id='hira-live-catalogue-loader';script.src='/assets/catalogue-live.js';script.defer=true;document.head.append(script);})();
