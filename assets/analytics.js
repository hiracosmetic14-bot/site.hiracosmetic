/* HIRA COSMETIC — GA4 basic consent. No tag or event before opt-in. */
(() => {
  'use strict';
  const id = 'G-09Y4WWC1QF';
  const key = 'hira-analytics-consent-v2';
  // Preview deployments and local checks must never pollute production reports.
  const production = ['hiracosmetic.be', 'www.hiracosmetic.be'].includes(location.hostname);
  let consent = false, started = false;
  try { consent = JSON.parse(localStorage.getItem(key) || 'null')?.analytics === true; } catch (_) {}
  const cleanPath = url => url.origin + url.pathname;
  const page = new URL(location.href);
  const referrer = (() => { try { return new URL(document.referrer).origin + '/'; } catch (_) { return ''; } })();
  window['ga-disable-' + id] = !consent;
  function start() {
    if (!production || !consent || started) return;
    started = true;
    window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: cleanPath(page),
      page_referrer: referrer
    });
    const parameters = { page_location: cleanPath(page), page_referrer: referrer, page_title: document.title };
    // Only public campaign slugs; never forward arbitrary query strings.
    const source = page.searchParams.get('utm_source');
    const medium = page.searchParams.get('utm_medium');
    const campaign = page.searchParams.get('utm_campaign');
    if (['instagram', 'facebook', 'tiktok', 'google', 'newsletter'].includes(source)) parameters.campaign_source = source;
    if (['social', 'organic', 'email', 'cpc', 'referral'].includes(medium)) parameters.campaign_medium = medium;
    if (campaign && /^[a-z0-9_-]{1,64}$/.test(campaign)) parameters.campaign_name = campaign;
    window.gtag('event', 'page_view', parameters);
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    script.id = 'hira-ga4';
    document.head.appendChild(script);
  }
  function track(name, parameters) {
    if (!production || !consent || !started) return false;
    window.gtag('event', name, { send_to: id, page_location: cleanPath(page), ...parameters });
    return true;
  }
  function clearCookies() {
    document.cookie.split(';').forEach(part => {
      const name = part.split('=')[0].trim();
      if (!/^_ga(?:_|$)|^_gid$|^_gat/.test(name)) return;
      ['', '; domain=' + location.hostname, '; domain=.hiracosmetic.be'].forEach(domain => {
        document.cookie = name + '=; Max-Age=0; path=/' + domain + '; SameSite=Lax';
      });
    });
  }
  const panel = document.createElement('section');
  panel.id = 'hira-analytics-preferences';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Préférences de mesure d’audience');
  panel.hidden = true;
  panel.innerHTML = '<h2>Mesure d’audience</h2><p>Avec votre accord, Google Analytics mesure les pages consultées et les clics vers notre boutique pour améliorer le site. Aucun outil publicitaire n’est activé. Vous pouvez refuser ou changer votre choix à tout moment. <a href="/confidentialite.html">Confidentialité et cookies</a></p><div><button type="button" data-hira-consent="yes">Accepter la mesure</button><button type="button" data-hira-consent="no">Refuser</button><button type="button" data-hira-close hidden>Fermer</button></div>';
  const settings = document.createElement('button');
  settings.id = 'hira-analytics-settings';
  settings.type = 'button';
  settings.textContent = 'Gérer les cookies';
  settings.setAttribute('aria-controls', panel.id);
  settings.setAttribute('aria-expanded', 'false');
  function show(value) {
    panel.hidden = !value;
    settings.setAttribute('aria-expanded', String(value));
  }
  settings.addEventListener('click', () => {
    show(panel.hidden);
    if (!panel.hidden) panel.querySelector('button').focus();
  });
  panel.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-hira-close')) { show(false); settings.focus(); return; }
    if (!button.hasAttribute('data-hira-consent')) return;
    consent = button.dataset.hiraConsent === 'yes';
    try { localStorage.setItem(key, JSON.stringify({ analytics: consent, version: 2, updatedAt: new Date().toISOString() })); } catch (_) {}
    if (consent) {
      window['ga-disable-' + id] = false;
      start();
    } else {
      window['ga-disable-' + id] = true;
      clearCookies();
    }
    panel.querySelector('[data-hira-close]').hidden = false;
    show(false);
    settings.focus();
  });
  const style = document.createElement('style');
  style.textContent = '#hira-cookie-consent,#hira-cookie-settings{display:none!important}#hira-analytics-preferences[hidden]{display:none!important}#hira-analytics-preferences{position:fixed;bottom:64px;left:16px;right:16px;max-width:640px;z-index:10020;background:#fff;color:#202020;border:1px solid #767676;border-radius:8px;padding:22px;box-shadow:0 6px 26px #0003;font:16px/1.6 Arial,sans-serif;max-height:75vh;overflow:auto}#hira-analytics-preferences h2{font:600 21px/1.3 Arial,sans-serif;margin:0 0 12px;color:#202020}#hira-analytics-preferences p{margin:0 0 16px;color:#202020;font:16px/1.6 Arial,sans-serif}#hira-analytics-preferences a{color:#174b88;text-decoration:underline}#hira-analytics-preferences>div{display:flex;flex-wrap:wrap;gap:12px}#hira-analytics-preferences button,#hira-analytics-settings{background:#fff;color:#202020;border:1px solid #555;border-radius:5px;padding:12px 16px;min-height:44px;font:600 15px/1.4 Arial,sans-serif;cursor:pointer}#hira-analytics-preferences button:focus-visible,#hira-analytics-settings:focus-visible{outline:3px solid #1768ae;outline-offset:3px}#hira-analytics-settings{position:fixed;bottom:12px;left:16px;z-index:10019;box-shadow:0 2px 8px #0002}';
  document.head.appendChild(style);
  document.body.append(panel, settings);
  let known = false;
  try { known = typeof JSON.parse(localStorage.getItem(key) || 'null')?.analytics === 'boolean'; } catch (_) {}
  panel.querySelector('[data-hira-close]').hidden = !known;
  show(!known);
  start();
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const details = event.target.closest('.product-details-button');
    if (details) {
      const card = details.closest('.product-card');
      track('product_details_open', { product_name: card?.querySelector('h3')?.textContent.trim().slice(0, 100) || '' });
    }
    const link = event.target.closest('a[href]');
    if (!link) return;
    let target;
    try { target = new URL(link.href, location.href); } catch (_) { return; }
    if (target.hostname !== 'hiracosmetic-store.myshopify.com') return;
    // A click leaving the showcase is neither a cart addition nor a purchase.
    const parameters = { destination_path: target.pathname, product_handle: target.pathname.startsWith('/products/') ? target.pathname.split('/')[2] : '' };
    const sameTab = (!link.target || link.target === '_self') && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
    if (production && consent && started && sameTab) {
      // Give gtag a short bounded opportunity to send before leaving this page.
      event.preventDefault();
      let navigated = false;
      const leave = () => { if (!navigated) { navigated = true; location.assign(link.href); } };
      track('outbound_shop_click', { ...parameters, event_callback: leave, event_timeout: 700 });
      setTimeout(leave, 750);
    } else track('outbound_shop_click', parameters);
  });
})();
