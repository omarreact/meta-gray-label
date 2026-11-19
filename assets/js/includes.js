// Load the original header/footer markup before initializing the template's scripts.
// Paths are resolved from this file, so the includes work on GitHub Pages and on nested pages.
(async function loadSharedLayout() {
  const siteRoot = new URL('../../', document.currentScript.src);
  const isNestedPage = new URL('.', document.baseURI).href !== siteRoot.href;

  async function insertPart(name) {
    const target = document.querySelector('template[data-shared-part="' + name + '"]');
    if (!target) return;

    const url = new URL(name + '.html', siteRoot);
    const response = await fetch(url);
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

    // Resolve the shared inner-page hero background from the site root so it
    // works consistently on the homepage host, GitHub Pages and nested routes.
    const innerHeroImage = new URL('assets/images/banner/home1/bg.png', siteRoot).href;
    document.querySelectorAll('.mgl-inner-hero').forEach((hero) => {
      hero.style.setProperty('--mgl-inner-hero-image', 'url("' + innerHeroImage + '")');
    });

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
