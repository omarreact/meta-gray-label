// Load the Meta Grey Label shared header/footer before initializing site scripts.
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

    // Keep the Meta Grey Label root-relative attributes on the homepage. On subpages, resolve
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

    // Inner-page motion and active table-of-contents state.
    const motionTargets = document.querySelectorAll(
      '.mgl-copy-block, .mgl-related-card, .mgl-directory-card, .mgl-services-page .service__item, .mgl-services-page .mgl-delivery__card'
    );
    motionTargets.forEach((element, index) => {
      if (!element.hasAttribute('data-aos')) {
        element.setAttribute('data-aos', 'fade-up');
        element.setAttribute('data-aos-duration', String(620 + (index % 4) * 90));
        element.setAttribute('data-aos-once', 'true');
      }
    });

    const tocLinks = [...document.querySelectorAll('.mgl-toc a[href^="#"]')];
    if (tocLinks.length && 'IntersectionObserver' in window) {
      const tocMap = new Map(tocLinks.map(link => [link.getAttribute('href').slice(1), link]));
      const sections = [...tocMap.keys()].map(id => document.getElementById(id)).filter(Boolean);
      const observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        tocLinks.forEach(link => link.removeAttribute('aria-current'));
        const active = tocMap.get(visible.target.id);
        if (active) active.setAttribute('aria-current', 'true');
      }, { rootMargin: '-18% 0px -62% 0px', threshold: [0.05, 0.25, 0.6] });
      sections.forEach(section => observer.observe(section));
    }

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
