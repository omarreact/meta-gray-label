/* Initialize the imported source without replacing editable FSE header/footer parts. */
(function () {
  'use strict';
  const root = new URL('../../', document.currentScript.src);
  const load = (file) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL(file, root).href;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load ' + file));
    document.body.appendChild(script);
  });
  async function initialize() {
    if (!document.getElementById('mgl-site-settings-style')) {
      const style = document.createElement('link');
      style.id = 'mgl-site-settings-style';
      style.rel = 'stylesheet';
      style.href = new URL('assets/css/site-settings.css', root).href;
      document.head.appendChild(style);
    }
    const image = new URL('assets/media/images/banner/home1/bg.png', root).href;
    document.querySelectorAll('.mgl-inner-hero').forEach((hero) => {
      hero.style.setProperty('--mgl-inner-hero-image', 'url("' + image + '")');
      hero.querySelectorAll('.mgl-kicker, .mgl-hero-actions, .mgl-hero-art').forEach((extra) => extra.remove());
    });
    try {
      await load('assets/js/site-settings.js');
      await load('assets/js/custom.js');
    } catch (error) {
      console.error(error);
      document.querySelectorAll('.preloader').forEach((item) => { item.style.display = 'none'; });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
