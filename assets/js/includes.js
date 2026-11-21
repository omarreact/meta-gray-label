// Load the original header/footer markup before initializing the template's scripts.
// Paths are resolved from this file, so the includes work on GitHub Pages and on nested pages.
(async function loadSharedLayout() {
  const siteRoot = new URL('../../', document.currentScript.src);
  const isNestedPage = new URL('.', document.baseURI).href !== siteRoot.href;

  // Developer site settings are shared across every static/dynamic route.
  if (!document.getElementById('mgl-site-settings-style')) {
    const settingsStyle = document.createElement('link');
    settingsStyle.id = 'mgl-site-settings-style';
    settingsStyle.rel = 'stylesheet';
    settingsStyle.href = new URL('assets/css/site-settings.css', siteRoot).href;
    document.head.appendChild(settingsStyle);
  }

  async function insertPart(name) {
    const target = document.querySelector('template[data-shared-part="' + name + '"]');
    if (!target) return;

    const url = new URL(name + '.html', siteRoot);
    url.searchParams.set('layout', '20261121-mobile-header-v2');
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load ' + url + ': HTTP ' + response.status);

    const template = document.createElement('template');
    template.innerHTML = await response.text();

    // Keep the original attributes on the homepage. On subpages, resolve
    // fragment assets and internal links relative to the website root.
    if (isNestedPage) {
      for (const element of template.content.querySelectorAll('[src], [href]')) {
        for (const attr of ['src', 'href']) {
          const value = element.getAttribute(attr);
          if (value && !value.startsWith('#') && !value.startsWith('//') &&
              !/^[a-z][a-z0-9+.-]*:/i.test(value)) {
            element.setAttribute(attr, new URL(value, siteRoot).href);
          }
        }
      }
    }

    // Replace the placeholder without introducing any wrapper elements.
    target.replaceWith(template.content);
  }

  try {
    await Promise.all([insertPart('header'), insertPart('footer')]);

    // GitHub Pages is now a compatibility shell. Keep its retained entry pages
    // usable by handing internal navigation to the canonical dynamic Worker.
    function handOffLegacyPagesToDynamicRuntime() {
      if (window.location.hostname !== 'omarreact.github.io' ||
          !window.location.pathname.startsWith('/meta-gray-label')) return;

      const dynamicRoot = new URL('https://meta-gray-label-dynamic.farukkhanone.workers.dev/');
      const staticRootPath = new URL(siteRoot).pathname;

      document.querySelectorAll('a[href]').forEach(function (link) {
        const raw = link.getAttribute('href');
        if (!raw || raw.startsWith('#') || raw.startsWith('//') ||
            /^(?:mailto:|tel:|javascript:)/i.test(raw)) return;

        const resolved = new URL(raw, document.baseURI);
        if (resolved.origin !== window.location.origin ||
            !resolved.pathname.startsWith(staticRootPath)) return;

        const relativePath = resolved.pathname.slice(staticRootPath.length).replace(/^\/+/, '');
        const target = new URL(relativePath || '/', dynamicRoot);
        target.search = resolved.search;
        target.hash = resolved.hash;
        link.href = target.href;
      });
    }

    handOffLegacyPagesToDynamicRuntime();

    // Resolve the shared inner-page hero background from the site root so it
    // works consistently on the homepage host, GitHub Pages and nested routes.
    const innerHeroImage = new URL('assets/images/banner/home1/bg.png', siteRoot).href;
    document.querySelectorAll('.mgl-inner-hero').forEach((hero) => {
      hero.style.setProperty('--mgl-inner-hero-image', 'url("' + innerHeroImage + '")');

      // Inner heroes intentionally contain only route/breadcrumb, title and
      // the short page summary. All supporting content begins after the hero.
      hero.querySelectorAll('.mgl-kicker, .mgl-hero-actions, .mgl-hero-art').forEach((extra) => extra.remove());
    });

    const settingsScript = document.createElement('script');
    settingsScript.src = new URL('assets/js/site-settings.js', siteRoot).href;
    settingsScript.onerror = () => console.error('Failed to load developer site settings.');
    document.body.appendChild(settingsScript);

    const script = document.createElement('script');
    script.src = new URL('assets/js/custom.js', siteRoot).href;
    script.onerror = () => console.error('Failed to load the website initialization script.');
    document.body.appendChild(script);
  } catch (error) {
    console.error('Failed to load shared header/footer:', error);
    // Do not leave the entire page covered by the preloader on a network error.
    const preloader = document.querySelector('.preloader');
    if (preloader) preloader.style.display = 'none';
  }
})();
