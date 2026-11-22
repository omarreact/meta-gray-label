(() => {
  'use strict';

  const script = document.currentScript;
  const siteRoot = new URL('../../', script?.src || document.baseURI);
  const configUrl = new URL('assets/site-settings.json', siteRoot);
  const localKey = 'mgl-dev-typography-v2';
  const legacyLocalKey = 'mgl-dev-font-preference-v1';
  const repoIssueUrl = 'https://github.com/omarreact/meta-gray-label/issues/new';
  const googleMetadataUrl = 'https://fonts.google.com/metadata/fonts';

  const systemFonts = [
    { family: 'Arial', provider: 'system', category: 'sans-serif', weights: [400,700] },
    { family: 'Helvetica', provider: 'system', category: 'sans-serif', weights: [400,700] },
    { family: 'Georgia', provider: 'system', category: 'serif', weights: [400,700] },
    { family: 'Times New Roman', provider: 'system', category: 'serif', weights: [400,700] },
    { family: 'Verdana', provider: 'system', category: 'sans-serif', weights: [400,700] },
    { family: 'Tahoma', provider: 'system', category: 'sans-serif', weights: [400,700] },
    { family: 'Trebuchet MS', provider: 'system', category: 'sans-serif', weights: [400,700] },
    { family: 'Courier New', provider: 'system', category: 'monospace', weights: [400,700] }
  ];

  const fallbackGoogleFonts = [
    'Inter','Roboto','Open Sans','Lato','Montserrat','Poppins','Nunito Sans','DM Sans','Manrope',
    'Work Sans','Source Sans 3','Merriweather','Playfair Display','Noto Sans','Noto Serif',
    'Raleway','Oswald','Ubuntu','Rubik','Fira Sans','Barlow','Mulish','Karla','Libre Franklin',
    'IBM Plex Sans','IBM Plex Serif','Space Grotesk','Plus Jakarta Sans','Outfit','Sora'
  ].map(function (family) {
    return { family: family, provider: 'google', category: 'google', weights: [100,200,300,400,500,600,700,800,900] };
  });

  const defaults = {
    globalFontFamily: 'Inter',
    provider: 'google',
    bodySizePx: 16,
    bodyWeight: 400,
    bodyLineHeight: 1.65,
    bodyLetterSpacingEm: 0,
    headingWeight: 600,
    headingLineHeight: 1.04,
    headingLetterSpacingEm: -0.055,
    headingSizes: { h1: 93, h2: 77, h3: 36, h4: 26, h5: 22, h6: 18 },
    uiSizePx: 14,
    uiWeight: 600,
    buttonSizePx: 14,
    buttonWeight: 800
  };

  let fontCatalog = systemFonts.concat(fallbackGoogleFonts);
  let catalogMap = new Map(fontCatalog.map(function (font) { return [font.family, font]; }));
  let projectSetting = normalizeSetting(defaults);
  let draftSetting = normalizeSetting(defaults);
  let catalogLoaded = false;

  function clampNumber(value, min, max, fallback, step) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    const clamped = Math.min(max, Math.max(min, number));
    if (!step) return clamped;
    return Math.round(clamped / step) * step;
  }

  function normalizeWeight(value, fallback) {
    const weight = clampNumber(value, 100, 900, fallback, 100);
    return Math.round(weight / 100) * 100;
  }

  function sanitizeFamily(value) {
    const family = typeof value === 'string' ? value.trim() : '';
    return /^[A-Za-z0-9 .&+'-]{1,100}$/.test(family) ? family : 'Arial';
  }

  function normalizeSetting(value) {
    const source = value || {};
    const family = sanitizeFamily(source.globalFontFamily || defaults.globalFontFamily);
    const known = catalogMap.get(family);
    const provider = family === 'Arial' ? 'system' :
      (source.provider === 'system' || known?.provider === 'system' ? 'system' : 'google');
    const sizes = source.headingSizes || {};
    return {
      globalFontFamily: family,
      provider: provider,
      bodySizePx: clampNumber(source.bodySizePx, 12, 28, defaults.bodySizePx, 0.5),
      bodyWeight: normalizeWeight(source.bodyWeight, defaults.bodyWeight),
      bodyLineHeight: clampNumber(source.bodyLineHeight, 1.1, 2.2, defaults.bodyLineHeight, 0.05),
      bodyLetterSpacingEm: clampNumber(source.bodyLetterSpacingEm, -0.08, 0.2, defaults.bodyLetterSpacingEm, 0.005),
      headingWeight: normalizeWeight(source.headingWeight, defaults.headingWeight),
      headingLineHeight: clampNumber(source.headingLineHeight, 0.9, 1.6, defaults.headingLineHeight, 0.01),
      headingLetterSpacingEm: clampNumber(source.headingLetterSpacingEm, -0.12, 0.12, defaults.headingLetterSpacingEm, 0.005),
      headingSizes: {
        h1: clampNumber(sizes.h1, 28, 120, defaults.headingSizes.h1, 1),
        h2: clampNumber(sizes.h2, 26, 100, defaults.headingSizes.h2, 1),
        h3: clampNumber(sizes.h3, 20, 72, defaults.headingSizes.h3, 1),
        h4: clampNumber(sizes.h4, 18, 56, defaults.headingSizes.h4, 1),
        h5: clampNumber(sizes.h5, 16, 48, defaults.headingSizes.h5, 1),
        h6: clampNumber(sizes.h6, 14, 40, defaults.headingSizes.h6, 1)
      },
      uiSizePx: clampNumber(source.uiSizePx, 11, 22, defaults.uiSizePx, 0.5),
      uiWeight: normalizeWeight(source.uiWeight, defaults.uiWeight),
      buttonSizePx: clampNumber(source.buttonSizePx, 11, 22, defaults.buttonSizePx, 0.5),
      buttonWeight: normalizeWeight(source.buttonWeight, defaults.buttonWeight)
    };
  }

  function fontStack(setting) {
    const family = setting.globalFontFamily.replace(/"/g, '');
    if (setting.provider === 'google') return '"' + family + '",Arial,Helvetica,sans-serif';
    if (family === 'Arial') return 'Arial,Helvetica,sans-serif';
    return '"' + family + '",Arial,Helvetica,sans-serif';
  }

  function nearestWeight(target, available) {
    if (!available || !available.length) return target;
    return available.reduce(function (best, current) {
      return Math.abs(current - target) < Math.abs(best - target) ? current : best;
    }, available[0]);
  }

  function requestedGoogleWeights(setting) {
    const font = catalogMap.get(setting.globalFontFamily);
    const available = font?.weights?.length ? font.weights : [400,700];
    const wanted = [setting.bodyWeight, setting.headingWeight, setting.uiWeight, setting.buttonWeight];
    return Array.from(new Set(wanted.map(function (weight) {
      return nearestWeight(weight, available);
    }))).sort(function (a, b) { return a - b; });
  }

  function googleCss2Url(setting) {
    const encodedFamily = encodeURIComponent(setting.globalFontFamily).replace(/%20/g, '+');
    const weights = requestedGoogleWeights(setting);
    return 'https://fonts.googleapis.com/css2?family=' + encodedFamily + ':wght@' + weights.join(';') + '&display=swap';
  }

  function loadGoogleFont(setting) {
    const existing = document.getElementById('mgl-google-font-runtime');
    if (setting.provider !== 'google') {
      existing?.remove();
      return;
    }
    const href = googleCss2Url(setting);
    if (existing?.getAttribute('href') === href) return;
    existing?.remove();
    const link = document.createElement('link');
    link.id = 'mgl-google-font-runtime';
    link.rel = 'stylesheet';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  function setCssVar(name, value) {
    document.documentElement.style.setProperty(name, String(value));
  }

  function applySetting(setting) {
    const normalized = normalizeSetting(setting);
    loadGoogleFont(normalized);
    setCssVar('--mgl-global-font-family', fontStack(normalized));
    setCssVar('--mgl-body-font-size', normalized.bodySizePx + 'px');
    setCssVar('--mgl-body-font-weight', normalized.bodyWeight);
    setCssVar('--mgl-body-line-height', normalized.bodyLineHeight);
    setCssVar('--mgl-body-letter-spacing', normalized.bodyLetterSpacingEm + 'em');
    setCssVar('--mgl-heading-font-weight', normalized.headingWeight);
    setCssVar('--mgl-heading-line-height', normalized.headingLineHeight);
    setCssVar('--mgl-heading-letter-spacing', normalized.headingLetterSpacingEm + 'em');
    Object.keys(normalized.headingSizes).forEach(function (tag) {
      setCssVar('--mgl-' + tag + '-size', normalized.headingSizes[tag] + 'px');
    });
    setCssVar('--mgl-ui-font-size', normalized.uiSizePx + 'px');
    setCssVar('--mgl-ui-font-weight', normalized.uiWeight);
    setCssVar('--mgl-button-font-size', normalized.buttonSizePx + 'px');
    setCssVar('--mgl-button-font-weight', normalized.buttonWeight);
    document.documentElement.dataset.mglFontFamily = normalized.globalFontFamily;
    draftSetting = normalized;
    updatePreview(normalized);
    return normalized;
  }

  function updatePreview(setting) {
    const preview = document.querySelector('[data-mgl-font-preview]');
    if (preview) {
      preview.style.fontFamily = fontStack(setting);
      const title = preview.querySelector('strong');
      const body = preview.querySelector('span');
      if (title) {
        title.style.fontWeight = String(setting.headingWeight);
        title.style.lineHeight = String(setting.headingLineHeight);
        title.style.letterSpacing = setting.headingLetterSpacingEm + 'em';
      }
      if (body) {
        body.style.fontSize = setting.bodySizePx + 'px';
        body.style.fontWeight = String(setting.bodyWeight);
        body.style.lineHeight = String(setting.bodyLineHeight);
        body.style.letterSpacing = setting.bodyLetterSpacingEm + 'em';
      }
    }
    const source = document.querySelector('[data-mgl-font-source]');
    if (source) {
      source.textContent = setting.provider === 'google'
        ? 'Google Fonts CSS2 · live weights ' + requestedGoogleWeights(setting).join(', ')
        : 'System font · no external font request';
    }
  }

  function readLocalSetting() {
    try {
      const raw = localStorage.getItem(localKey) || localStorage.getItem(legacyLocalKey);
      return raw ? normalizeSetting(JSON.parse(raw)) : null;
    } catch (_) {
      return null;
    }
  }

  function saveLocalSetting(setting) {
    const normalized = normalizeSetting(setting);
    localStorage.setItem(localKey, JSON.stringify(normalized));
    localStorage.setItem(legacyLocalKey, JSON.stringify(normalized));
  }

  function setStatus(message, tone) {
    const status = document.querySelector('[data-mgl-settings-status]');
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone || 'ok';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[char];
    });
  }

  function parseGoogleMetadata(text) {
    const cleaned = text.replace(/^\)\]\}'\s*/, '');
    const payload = JSON.parse(cleaned);
    const items = payload.familyMetadataList || payload.items || [];
    return items.map(function (item) {
      const rawFamily = item.family || item.familyName || '';
      const family = sanitizeFamily(rawFamily);
      if (family === 'Arial' && rawFamily !== 'Arial') return null;
      const weights = new Set();
      const variants = Array.isArray(item.variants) ? item.variants : [];
      variants.forEach(function (variant) {
        const match = String(variant).match(/([1-9]00)/);
        if (match) weights.add(Number(match[1]));
        if (variant === 'regular') weights.add(400);
      });
      if (item.fonts && typeof item.fonts === 'object') {
        Object.keys(item.fonts).forEach(function (key) {
          const match = key.match(/^([1-9]00)/);
          if (match) weights.add(Number(match[1]));
        });
      }
      const axes = Array.isArray(item.axes) ? item.axes : [];
      const weightAxis = axes.find(function (axis) { return axis.tag === 'wght'; });
      if (weightAxis) {
        const min = Math.ceil(Number(weightAxis.min || 100) / 100) * 100;
        const max = Math.floor(Number(weightAxis.max || 900) / 100) * 100;
        for (let weight = min; weight <= max; weight += 100) weights.add(weight);
      }
      if (!weights.size) {
        weights.add(400);
        weights.add(700);
      }
      return {
        family: family,
        provider: 'google',
        category: item.category || 'google',
        weights: Array.from(weights).sort(function (a, b) { return a - b; })
      };
    }).filter(Boolean);
  }

  async function loadFontCatalog() {
    try {
      const response = await fetch(googleMetadataUrl, { cache: 'force-cache', mode: 'cors' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const googleFonts = parseGoogleMetadata(await response.text());
      if (!googleFonts.length) throw new Error('Empty Google Fonts catalog');
      fontCatalog = systemFonts.concat(googleFonts);
      catalogMap = new Map(fontCatalog.map(function (font) { return [font.family, font]; }));
      catalogLoaded = true;
      renderFontOptions(document.querySelector('[data-mgl-font-search]')?.value || '', draftSetting.globalFontFamily);
      refreshWeightControls();
      applySetting(draftSetting);
      updateCatalogStatus();
    } catch (error) {
      catalogLoaded = false;
      updateCatalogStatus('Google Fonts catalog could not be loaded; common fonts remain available.', 'warning');
      console.warn('Google Fonts catalog unavailable:', error);
    }
  }

  function updateCatalogStatus(message, tone) {
    const node = document.querySelector('[data-mgl-font-catalog-status]');
    if (!node) return;
    node.textContent = message || (fontCatalog.length + ' fonts loaded · search by family name');
    node.dataset.tone = tone || 'ok';
  }

  function renderFontOptions(query, selectedFamily) {
    const select = document.querySelector('[data-mgl-font-select]');
    if (!select) return;
    const search = String(query || '').trim().toLowerCase();
    const matches = fontCatalog.filter(function (font) {
      return !search || font.family.toLowerCase().includes(search);
    });
    const selected = catalogMap.get(selectedFamily);
    const visible = search ? matches.slice(0, 300) : matches;
    if (selected && !visible.some(function (font) { return font.family === selected.family; })) visible.unshift(selected);
    select.innerHTML = visible.map(function (font) {
      const suffix = font.provider === 'system' ? ' — System' : '';
      return '<option value="' + escapeHtml(font.family) + '">' + escapeHtml(font.family + suffix) + '</option>';
    }).join('');
    if (selectedFamily && Array.from(select.options).some(function (option) { return option.value === selectedFamily; })) {
      select.value = selectedFamily;
    }
    updateCatalogStatus(
      (catalogLoaded ? fontCatalog.length : fontCatalog.length + '+ fallback') +
      ' fonts available · ' + matches.length + ' match' + (matches.length === 1 ? '' : 'es')
    );
  }

  function weightOptionsForFamily(family) {
    const font = catalogMap.get(family);
    return font?.weights?.length ? font.weights : [100,200,300,400,500,600,700,800,900];
  }

  function fillWeightSelect(select, value, available) {
    if (!select) return;
    const weights = available.length ? available : [400,700];
    select.innerHTML = weights.map(function (weight) {
      return '<option value="' + weight + '">' + weight + '</option>';
    }).join('');
    select.value = String(nearestWeight(Number(value), weights));
  }

  function refreshWeightControls() {
    const available = weightOptionsForFamily(draftSetting.globalFontFamily);
    fillWeightSelect(document.querySelector('[data-mgl-body-weight]'), draftSetting.bodyWeight, available);
    fillWeightSelect(document.querySelector('[data-mgl-heading-weight]'), draftSetting.headingWeight, available);
    fillWeightSelect(document.querySelector('[data-mgl-ui-weight]'), draftSetting.uiWeight, available);
    fillWeightSelect(document.querySelector('[data-mgl-button-weight]'), draftSetting.buttonWeight, available);
  }

  function syncForm(setting) {
    const panel = document.getElementById('mgl-dev-settings-panel');
    if (!panel) return;
    const search = panel.querySelector('[data-mgl-font-search]');
    if (search) search.value = '';
    renderFontOptions('', setting.globalFontFamily);
    const mapping = {
      '[data-mgl-body-size]': setting.bodySizePx,
      '[data-mgl-body-line-height]': setting.bodyLineHeight,
      '[data-mgl-body-letter-spacing]': setting.bodyLetterSpacingEm,
      '[data-mgl-heading-line-height]': setting.headingLineHeight,
      '[data-mgl-heading-letter-spacing]': setting.headingLetterSpacingEm,
      '[data-mgl-ui-size]': setting.uiSizePx,
      '[data-mgl-button-size]': setting.buttonSizePx
    };
    Object.keys(mapping).forEach(function (selector) {
      const input = panel.querySelector(selector);
      if (input) input.value = mapping[selector];
    });
    Object.keys(setting.headingSizes).forEach(function (tag) {
      const input = panel.querySelector('[data-mgl-' + tag + '-size]');
      if (input) input.value = setting.headingSizes[tag];
    });
    refreshWeightControls();
  }

  function updateDraftFromForm() {
    const panel = document.getElementById('mgl-dev-settings-panel');
    if (!panel) return draftSetting;
    const family = panel.querySelector('[data-mgl-font-select]')?.value || draftSetting.globalFontFamily;
    const font = catalogMap.get(family);
    const next = {
      globalFontFamily: family,
      provider: font?.provider || (family === 'Arial' ? 'system' : 'google'),
      bodySizePx: panel.querySelector('[data-mgl-body-size]')?.value,
      bodyWeight: panel.querySelector('[data-mgl-body-weight]')?.value,
      bodyLineHeight: panel.querySelector('[data-mgl-body-line-height]')?.value,
      bodyLetterSpacingEm: panel.querySelector('[data-mgl-body-letter-spacing]')?.value,
      headingWeight: panel.querySelector('[data-mgl-heading-weight]')?.value,
      headingLineHeight: panel.querySelector('[data-mgl-heading-line-height]')?.value,
      headingLetterSpacingEm: panel.querySelector('[data-mgl-heading-letter-spacing]')?.value,
      headingSizes: {},
      uiSizePx: panel.querySelector('[data-mgl-ui-size]')?.value,
      uiWeight: panel.querySelector('[data-mgl-ui-weight]')?.value,
      buttonSizePx: panel.querySelector('[data-mgl-button-size]')?.value,
      buttonWeight: panel.querySelector('[data-mgl-button-weight]')?.value
    };
    ['h1','h2','h3','h4','h5','h6'].forEach(function (tag) {
      next.headingSizes[tag] = panel.querySelector('[data-mgl-' + tag + '-size]')?.value;
    });
    return applySetting(next);
  }

  function settingsEqual(a, b) {
    return JSON.stringify(normalizeSetting(a)) === JSON.stringify(normalizeSetting(b));
  }

  function buildIssueUrl(setting) {
    const normalized = normalizeSetting(setting);
    const payload = JSON.stringify(normalized);
    const body = [
      '<!-- MGL_SITE_SETTINGS_V2', payload, '-->',
      '### Global typography setting', '',
      '- Font family: **' + normalized.globalFontFamily + '** (' + normalized.provider + ')',
      '- Body: **' + normalized.bodySizePx + 'px / ' + normalized.bodyWeight + ' / ' + normalized.bodyLineHeight + '**',
      '- Headings: **weight ' + normalized.headingWeight + ' / line-height ' + normalized.headingLineHeight + '**',
      '- Navigation/UI: **' + normalized.uiSizePx + 'px / ' + normalized.uiWeight + '**',
      '- Buttons: **' + normalized.buttonSizePx + 'px / ' + normalized.buttonWeight + '**', '',
      'This issue was generated by the Meta Grey Label typography settings panel.',
      'Only the repository owner can trigger the protected workflow.', '',
      'Submit this issue to write these typography values into the codebase.'
    ].join('\n');
    const url = new URL(repoIssueUrl);
    url.searchParams.set('title', '[Site Settings] Typography: ' + normalized.globalFontFamily);
    url.searchParams.set('body', body);
    return url.href;
  }

  function closePanel(restoreFocus) {
    document.documentElement.classList.remove('mgl-settings-open');
    const panel = document.getElementById('mgl-dev-settings-panel');
    const toggle = document.getElementById('mgl-dev-settings-toggle');
    panel?.setAttribute('aria-hidden', 'true');
    toggle?.setAttribute('aria-expanded', 'false');
    if (restoreFocus !== false) toggle?.focus({ preventScroll: true });
  }

  function openPanel() {
    document.documentElement.classList.add('mgl-settings-open');
    const panel = document.getElementById('mgl-dev-settings-panel');
    const toggle = document.getElementById('mgl-dev-settings-toggle');
    panel?.setAttribute('aria-hidden', 'false');
    toggle?.setAttribute('aria-expanded', 'true');
    panel?.querySelector('[data-mgl-font-search]')?.focus({ preventScroll: true });
  }

  function numberField(label, attr, min, max, step, suffix) {
    return [
      '<label class="mgl-dev-control">', '<span>' + label + '</span>', '<span class="mgl-dev-control-input">',
      '<input type="number" ' + attr + ' min="' + min + '" max="' + max + '" step="' + step + '">',
      '<small>' + suffix + '</small>', '</span>', '</label>'
    ].join('');
  }

  function createUi(activeSetting) {
    if (document.getElementById('mgl-dev-settings-toggle')) return;
    const toggle = document.createElement('button');
    toggle.id = 'mgl-dev-settings-toggle';
    toggle.className = 'mgl-dev-settings-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Open typography settings');
    toggle.setAttribute('aria-controls', 'mgl-dev-settings-panel');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="M19.2 13.2a7.6 7.6 0 0 0 0-2.4l2-1.5-2-3.5-2.4 1a8.6 8.6 0 0 0-2.1-1.2L14.4 3h-4.1L10 5.6a8.6 8.6 0 0 0-2.1 1.2l-2.4-1-2 3.5 2 1.5a7.6 7.6 0 0 0 0 2.4l-2 1.5 2 3.5 2.4-1a8.6 8.6 0 0 0 2.1 1.2l.3 2.6h4.1l.3-2.6a8.6 8.6 0 0 0 2.1-1.2l2.4 1 2-3.5-2-1.5Z"/></svg>';

    const panel = document.createElement('aside');
    panel.id = 'mgl-dev-settings-panel';
    panel.className = 'mgl-dev-settings-panel';
    panel.setAttribute('aria-label', 'Typography settings');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = [
      '<div class="mgl-dev-settings-head"><div><span class="mgl-dev-settings-kicker">Developer controls</span><h2 class="mgl-dev-settings-title">Typography Settings</h2></div><button class="mgl-dev-settings-close" type="button" aria-label="Close settings" data-mgl-settings-close>×</button></div>',
      '<div class="mgl-dev-settings-body">',
      '<section class="mgl-dev-settings-section"><h3 class="mgl-dev-settings-section-title">Font family</h3><label class="mgl-dev-settings-label" for="mgl-font-search">Search Google Fonts</label><input class="mgl-dev-settings-search" id="mgl-font-search" type="search" autocomplete="off" placeholder="Search font family…" data-mgl-font-search><select class="mgl-dev-settings-select" id="mgl-global-font-select" aria-label="Font family results" data-mgl-font-select></select><div class="mgl-dev-settings-meta"><span class="mgl-dev-settings-dot" aria-hidden="true"></span><span data-mgl-font-catalog-status>Loading Google Fonts catalog…</span></div><div class="mgl-dev-settings-meta"><span data-mgl-font-source></span></div></section>',
      '<section class="mgl-dev-settings-section"><h3 class="mgl-dev-settings-section-title">Body text</h3><div class="mgl-dev-settings-grid">',
      numberField('Size','data-mgl-body-size','12','28','0.5','px'), '<label class="mgl-dev-control"><span>Weight</span><select data-mgl-body-weight></select></label>', numberField('Line height','data-mgl-body-line-height','1.1','2.2','0.05','×'), numberField('Letter spacing','data-mgl-body-letter-spacing','-0.08','0.2','0.005','em'), '</div></section>',
      '<section class="mgl-dev-settings-section"><h3 class="mgl-dev-settings-section-title">Headings</h3><div class="mgl-dev-settings-grid"><label class="mgl-dev-control"><span>Weight</span><select data-mgl-heading-weight></select></label>', numberField('Line height','data-mgl-heading-line-height','0.9','1.6','0.01','×'), numberField('Letter spacing','data-mgl-heading-letter-spacing','-0.12','0.12','0.005','em'), '</div><div class="mgl-dev-heading-grid">',
      numberField('H1','data-mgl-h1-size','28','120','1','px'), numberField('H2','data-mgl-h2-size','26','100','1','px'), numberField('H3','data-mgl-h3-size','20','72','1','px'), numberField('H4','data-mgl-h4-size','18','56','1','px'), numberField('H5','data-mgl-h5-size','16','48','1','px'), numberField('H6','data-mgl-h6-size','14','40','1','px'), '</div></section>',
      '<section class="mgl-dev-settings-section"><h3 class="mgl-dev-settings-section-title">Navigation & buttons</h3><div class="mgl-dev-settings-grid">', numberField('UI size','data-mgl-ui-size','11','22','0.5','px'), '<label class="mgl-dev-control"><span>UI weight</span><select data-mgl-ui-weight></select></label>', numberField('Button size','data-mgl-button-size','11','22','0.5','px'), '<label class="mgl-dev-control"><span>Button weight</span><select data-mgl-button-weight></select></label></div></section>',
      '<section class="mgl-dev-settings-section"><h3 class="mgl-dev-settings-section-title">Live preview</h3><div class="mgl-dev-font-preview" data-mgl-font-preview><strong>Meta Grey Label</strong><span>Brokerage technology, liquidity, CRM and platform infrastructure.</span></div><div class="mgl-dev-settings-actions"><button class="mgl-dev-settings-button" type="button" data-mgl-save-device>Save on device</button><button class="mgl-dev-settings-button" type="button" data-mgl-reset-font>Reset</button><button class="mgl-dev-settings-button mgl-dev-settings-button--primary mgl-dev-settings-button--wide" type="button" data-mgl-save-codebase>Save to codebase → GitHub</button></div><p class="mgl-dev-settings-note">Changes preview instantly. Device save uses localStorage. Codebase save opens an owner-only GitHub request; no GitHub token is exposed in the website.</p><p class="mgl-dev-settings-status" role="status" aria-live="polite" data-mgl-settings-status></p></section>',
      '</div><div class="mgl-dev-settings-footer">Google families are loaded on demand through the Google Fonts CSS2 service.</div>'
    ].join('');

    document.body.append(toggle, panel);
    syncForm(activeSetting);
    applySetting(activeSetting);
    toggle.addEventListener('click', openPanel);
    panel.querySelector('[data-mgl-settings-close]')?.addEventListener('click', function () { closePanel(); });

    const search = panel.querySelector('[data-mgl-font-search]');
    const select = panel.querySelector('[data-mgl-font-select]');
    search?.addEventListener('input', function () { renderFontOptions(search.value, select?.value || draftSetting.globalFontFamily); });
    search?.addEventListener('keydown', function (event) { if (event.key === 'ArrowDown') { event.preventDefault(); select?.focus(); } });
    select?.addEventListener('change', function () {
      if (search) search.value = select.value;
      draftSetting.globalFontFamily = select.value;
      draftSetting.provider = catalogMap.get(select.value)?.provider || 'google';
      refreshWeightControls();
      updateDraftFromForm();
      setStatus('Font preview applied. Adjust typography values or save.');
    });

    panel.querySelectorAll('input[type="number"], select[data-mgl-body-weight], select[data-mgl-heading-weight], select[data-mgl-ui-weight], select[data-mgl-button-weight]').forEach(function (control) {
      control.addEventListener('input', function () { updateDraftFromForm(); setStatus('Preview updated.'); });
      control.addEventListener('change', function () { updateDraftFromForm(); setStatus('Preview updated.'); });
    });

    panel.querySelector('[data-mgl-save-device]')?.addEventListener('click', function () { const setting = updateDraftFromForm(); saveLocalSetting(setting); setStatus('Typography saved on this device.'); });
    panel.querySelector('[data-mgl-reset-font]')?.addEventListener('click', function () { localStorage.removeItem(localKey); localStorage.removeItem(legacyLocalKey); draftSetting = normalizeSetting(projectSetting); syncForm(draftSetting); applySetting(draftSetting); setStatus('Reset to current codebase typography.'); });
    panel.querySelector('[data-mgl-save-codebase]')?.addEventListener('click', function () {
      const setting = updateDraftFromForm();
      saveLocalSetting(setting);
      if (settingsEqual(setting, projectSetting)) { setStatus('These values already match the codebase.'); return; }
      const popup = window.open(buildIssueUrl(setting), '_blank', 'noopener,noreferrer');
      if (!popup) { setStatus('Popup blocked. Allow popups and try again.', 'error'); return; }
      setStatus('GitHub opened. Submit the prefilled owner request to write these values to main.');
    });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && document.documentElement.classList.contains('mgl-settings-open')) closePanel(); });
    loadFontCatalog();
  }

  async function init() {
    try {
      const response = await fetch(configUrl, { cache: 'no-store' });
      if (response.ok) {
        const config = await response.json();
        projectSetting = normalizeSetting(config?.typography || config);
      }
    } catch (_) {
      projectSetting = normalizeSetting(defaults);
    }
    const localSetting = readLocalSetting();
    const active = applySetting(localSetting || projectSetting);
    createUi(active);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
