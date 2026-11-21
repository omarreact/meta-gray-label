const mglSiteRoot = new URL('../../', document.currentScript.src);
// =================== preloader js  ================== //
function hidePreloader() {
    var preloader = document.querySelector('.preloader');
    if (!preloader) return;
    preloader.style.transition = 'opacity 0.5s ease';
    // Hide the preloader 1 second (1000 milliseconds) after DOM content is loaded
    setTimeout(function () {
        preloader.style.opacity = '0';
        setTimeout(function () {
            preloader.style.display = 'none';
        }, 500); // .5 seconds for the fade-out transition
    }, 1000); // 1 second delay before starting the fade-out effect
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hidePreloader);
} else {
    hidePreloader();
}
// =================== preloader js end ================== //


// =================== light and dark start ================== //

const colorSwitcher = document.querySelector('.mgl-site-header #btnSwitch') || document.getElementById('btnSwitch');


switchThemeByUrl();
const savedTheme = localStorage.getItem('theme');
updateThemeColor(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark');


colorSwitcher?.addEventListener('click', () => {

    const theme = localStorage.getItem('theme');

    if (theme && theme === 'dark') {

        updateThemeColor('light');

    } else {
        updateThemeColor('dark');

    }

    refreshScrollEffectsAfterLayout();
});

function updateThemeColor(themeMode = 'dark') {
    themeMode = themeMode === 'dark' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-bs-theme', themeMode);
    localStorage.setItem('theme', themeMode)

    if (themeMode === 'dark') {
        colorSwitcher?.classList.add('dark-switcher');

    } else {
        colorSwitcher?.classList.remove('dark-switcher');
    }

    changeImage(themeMode);
    const assetRoot = new URL('media/branding/', mglSiteRoot).href;
    const headerLogo = document.querySelector('img[data-brand-logo]');
    const footerLogo = document.querySelector('img[data-brand-footer]');
    if (headerLogo) headerLogo.src = assetRoot + (themeMode === 'dark' ? 'logo-dark.svg' : 'logo-light.svg');
    if (footerLogo) footerLogo.src = assetRoot + 'logo-dark.svg';
    const favicon = document.querySelector('#site-favicon');
    const largeIcon = document.querySelector('#site-icon-large');
    const appleIcon = document.querySelector('#site-apple-icon');
    if (favicon) favicon.href = assetRoot + 'favicon.svg';
    if (largeIcon) largeIcon.href = assetRoot + 'icon-192.png';
    if (appleIcon) appleIcon.href = assetRoot + 'apple-touch-icon.png';
    colorSwitcher?.setAttribute('aria-label', themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    colorSwitcher?.setAttribute('aria-pressed', String(themeMode === 'dark'));

}



function switchThemeByUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const theme = urlParams.get('theme');

    if (theme) {
        localStorage.setItem("theme", theme);
    }

}

// =================== light and dark end ================== //




// =================== Change image path start ================== //


function changeImage(themeMode = 'light') {
    const icon = document.querySelector('#btnSwitch img');
    if (icon) {
        icon.src = new URL(themeMode === 'dark' ? 'assets/images/icon/sun.svg' : 'assets/images/icon/moon.svg', mglSiteRoot).href;
    }

    // Do not fabricate -dark asset paths. Only swap when a verified alternate is configured.
    document.querySelectorAll('img[data-dark-src]').forEach(image => {
        if (!image.dataset.lightSrc) image.dataset.lightSrc = image.getAttribute('src');
        const target = themeMode === 'dark' ? image.dataset.darkSrc : image.dataset.lightSrc;
        if (target && image.getAttribute('src') !== target) image.setAttribute('src', target);
    });
}

// =================== Change image path end ================== //









// =================== header js start here ===================

const siteHeader = document.querySelector('[data-site-header]');
const primaryNav = document.querySelector('.mgl-primary-nav');
const navToggle = document.querySelector('.mgl-menu-toggle');
const navDisclosureButtons = Array.from(document.querySelectorAll('[data-nav-disclosure]'));
const mobileNavQuery = window.matchMedia('(max-width: 1199.98px)');
const desktopTouchQuery = window.matchMedia('(min-width: 1200px) and (hover: none), (min-width: 1200px) and (pointer: coarse)');

function closeHeaderSubmenus(exceptItem = null) {
    document.querySelectorAll('.mgl-nav-item.is-open').forEach(function (item) {
        if (item === exceptItem) return;
        item.classList.remove('is-open');
        const button = item.querySelector(':scope > .mgl-nav-trigger [data-nav-disclosure]');
        if (button) button.setAttribute('aria-expanded', 'false');
    });
}

function setMobileNavigation(open, restoreFocus = false) {
    if (!primaryNav || !navToggle) return;

    const shouldOpen = Boolean(open && mobileNavQuery.matches);
    primaryNav.classList.toggle('is-open', shouldOpen);
    navToggle.classList.toggle('is-active', shouldOpen);
    navToggle.setAttribute('aria-expanded', String(shouldOpen));
    navToggle.setAttribute('aria-label', shouldOpen ? 'Close navigation' : 'Open navigation');
    document.documentElement.classList.toggle('mgl-nav-open', shouldOpen);

    if (!shouldOpen) {
        closeHeaderSubmenus();
        if (restoreFocus) navToggle.focus({ preventScroll: true });
    }
}

navToggle?.addEventListener('click', function () {
    setMobileNavigation(!primaryNav?.classList.contains('is-open'));
});

navDisclosureButtons.forEach(function (button) {
    button.addEventListener('click', function (event) {
        if (!mobileNavQuery.matches) return;

        event.preventDefault();
        event.stopPropagation();

        const item = button.closest('.mgl-nav-item--has-panel');
        if (!item) return;

        const willOpen = !item.classList.contains('is-open');
        closeHeaderSubmenus(item);
        item.classList.toggle('is-open', willOpen);
        button.setAttribute('aria-expanded', String(willOpen));
    });
});

document.querySelectorAll('.mgl-nav-item--has-panel > .mgl-nav-trigger > .mgl-nav-link').forEach(function (link) {
    link.addEventListener('click', function (event) {
        if (!desktopTouchQuery.matches) return;

        const item = link.closest('.mgl-nav-item--has-panel');
        if (!item || item.classList.contains('is-touch-open')) return;

        event.preventDefault();
        document.querySelectorAll('.mgl-nav-item.is-touch-open').forEach(function (openItem) {
            if (openItem !== item) openItem.classList.remove('is-touch-open');
        });
        item.classList.add('is-touch-open');
    });
});

primaryNav?.addEventListener('click', function (event) {
    if (!mobileNavQuery.matches) return;
    const link = event.target.closest('a[href]');
    if (link) setMobileNavigation(false);
});

document.addEventListener('click', function (event) {
    if (mobileNavQuery.matches) {
        if (!siteHeader?.contains(event.target) && primaryNav?.classList.contains('is-open')) {
            setMobileNavigation(false);
        }
        return;
    }

    if (!siteHeader?.contains(event.target)) {
        document.querySelectorAll('.mgl-nav-item.is-touch-open').forEach(function (item) {
            item.classList.remove('is-touch-open');
        });
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;

    if (primaryNav?.classList.contains('is-open')) {
        setMobileNavigation(false, true);
        return;
    }

    closeHeaderSubmenus();
    document.querySelectorAll('.mgl-nav-item.is-touch-open').forEach(function (item) {
        item.classList.remove('is-touch-open');
    });
});

mobileNavQuery.addEventListener('change', function (event) {
    if (!event.matches) setMobileNavigation(false);
});

function updateHeaderScrollState() {
    if (!siteHeader) return;
    siteHeader.classList.toggle('is-scrolled', window.scrollY > 24);
}

updateHeaderScrollState();
window.addEventListener('scroll', updateHeaderScrollState, { passive: true });

// =================== header js end here =================== //




// Keep reveal effects, but initialise after the shared layout is loaded and
// refresh after image layout shifts. This prevents sections from remaining
// invisible or offset during a fast scroll.
function initialiseScrollEffects() {
    if (!window.AOS) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compactViewport = window.matchMedia('(max-width: 767.98px)').matches;

    if (reduceMotion || compactViewport) {
        document.querySelectorAll('[data-aos]').forEach(function (element) {
            element.removeAttribute('data-aos');
            element.removeAttribute('data-aos-duration');
            element.removeAttribute('data-aos-delay');
        });
        return;
    }

    // Prevent long stagger chains from making the interface feel slow.
    document.querySelectorAll('[data-aos-duration]').forEach(function (element) {
        var duration = Number(element.getAttribute('data-aos-duration'));
        if (!Number.isFinite(duration) || duration > 650) {
            element.setAttribute('data-aos-duration', '560');
        }
    });

    AOS.init({
        once: true,
        mirror: false,
        offset: 60,
        duration: 560,
        easing: 'ease-out-cubic',
        anchorPlacement: 'top-bottom'
    });

    requestAnimationFrame(function () {
        AOS.refreshHard();
    });

    window.addEventListener('load', function () {
        AOS.refreshHard();
    }, { once: true });
}
initialiseScrollEffects();




// =================== custom trk slider js here =================== //

// Meta Grey Label's capability links are ordinary accessible links.

// component slider here
const Partner = new Swiper('.partner__slider', {
    spaceBetween: 24,
    grabCursor: true,
    loop: true,
    slidesPerView: 2,
    breakpoints: {
        576: { slidesPerView: 3 },
        768: { slidesPerView: 4 },
        992: { slidesPerView: 5, spaceBetween: 15 },
        1200: { slidesPerView: 6, spaceBetween: 25 },
    },
    autoplay: {
        delay: 1,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
    },
    speed: 2000,
});


// blog  slider here
const blog = new Swiper('.blog__slider', {
    spaceBetween: 24,
    grabCursor: true,
    loop: true,
    slidesPerView: 1,
    breakpoints: {
        576: {
            slidesPerView: 1,
        },
        768: {
            slidesPerView: 2,
        },
        992: {
            slidesPerView: 3,
        },
        1200: {
            slidesPerView: 3,
        }
    },

    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
    },
    speed: 500,
    navigation: {
        nextEl: ".blog__slider-next",
        prevEl: ".blog__slider-prev",
    },
});

// testimonial slider

const testimonial = new Swiper('.testimonial__slider', {
    spaceBetween: 24,
    grabCursor: true,
    loop: true,
    slidesPerView: 1,
    breakpoints: {
        576: {
            slidesPerView: 1,
        },
        768: {
            slidesPerView: 2,
        },
        992: {
            slidesPerView: 2,
        },
        1200: {
            slidesPerView: 2,
            spaceBetween: 25,
        },
    },

    autoplay: {
        delay: 5500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
    },
    speed: 500,

    navigation: {
        nextEl: ".testimonial__slider-next",
        prevEl: ".testimonial__slider-prev",
    },
});


// roadmap slider 
const roadmapSlider = new Swiper('.roadmap__slider', {

    grabCursor: true,
    // loop: true,
    slidesPerView: 1,
    breakpoints: {
        576: {
            slidesPerView: 1,
            spaceBetween: 15,
        },
        768: {
            slidesPerView: 2,
            spaceBetween: 15,
        },
        992: {
            slidesPerView: 3,
            spaceBetween: 10,
        },
        1200: {
            slidesPerView: 4,
            spaceBetween: 10,
        },
        1400: {
            slidesPerView: 4,
            spaceBetween: 10,
        }

    },

    autoplay: {
        delay: 4500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
    },
    speed: 500,

});

// =================== custom trk slider end here =================== //




// =================== homepage lifecycle tabs =================== //
const lifecycleTabs = Array.from(document.querySelectorAll('[data-lifecycle-step]'));
const lifecyclePanels = Array.from(document.querySelectorAll('[data-lifecycle-panel]'));

function activateLifecycleTab(tab, moveFocus = false) {
    if (!tab) return;
    const key = tab.getAttribute('data-lifecycle-step');

    lifecycleTabs.forEach(function (item) {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
    });

    lifecyclePanels.forEach(function (panel) {
        panel.hidden = panel.getAttribute('data-lifecycle-panel') !== key;
    });

    if (moveFocus) tab.focus({ preventScroll: true });
}

lifecycleTabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
        activateLifecycleTab(tab);
    });

    tab.addEventListener('keydown', function (event) {
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();

        let nextIndex = index;
        if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = lifecycleTabs.length - 1;
        else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % lifecycleTabs.length;
        else nextIndex = (index - 1 + lifecycleTabs.length) % lifecycleTabs.length;

        activateLifecycleTab(lifecycleTabs[nextIndex], true);
    });
});

// =================== homepage lifecycle tabs end =================== //


// =================== scroll js start here =================== //

const scrollToTop = document.querySelector('.scrollToTop');

function updateScrollToTopVisibility() {
    if (!scrollToTop) return;

    const visible = window.scrollY > 300;
    scrollToTop.classList.toggle('is-visible', visible);
    scrollToTop.setAttribute('aria-hidden', String(!visible));
    scrollToTop.tabIndex = visible ? 0 : -1;
}

if (scrollToTop) {
    updateScrollToTopVisibility();

    window.addEventListener('scroll', updateScrollToTopVisibility, { passive: true });

    scrollToTop.addEventListener('click', function (event) {
        event.preventDefault();

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: reduceMotion ? 'auto' : 'smooth'
        });
    });
}

// =================== scroll js end here =================== //



// =================== count start here =================== //
new PureCounter();
// =================== count end here =================== //




// =================== rtl icon direction chnage start here =================== //
// Get the HTML tag
const htmlTag = document.querySelector('html');

// Function to toggle the icon directions
function toggleAllIconsDirection() {
    const icons = document.querySelectorAll('i');

    icons.forEach((icon) => {
        if (icon.classList.contains("fa-arrow-right") || icon.classList.contains("fa-angle-right")) {
            icon.classList.remove("fa-arrow-right", "fa-angle-right");
            icon.classList.add("fa-arrow-left", "fa-angle-left");
        } else if (icon.classList.contains("fa-arrow-left") || icon.classList.contains("fa-angle-left")) {
            icon.classList.remove("fa-arrow-left", "fa-angle-left");
            icon.classList.add("fa-arrow-right", "fa-angle-right");
        }
    });
}

// Check if the HTML tag has the dir="rtl" attribute
if (htmlTag.getAttribute('dir') === 'rtl') {
    toggleAllIconsDirection();
}
// =================== rtl icon direction chnage end here =================== //

// Keep reveal animations enabled while recalculating their positions after any layout change.
var mglAosRefreshFrame;
function refreshScrollEffectsAfterLayout() {
    if (!window.AOS) return;
    window.cancelAnimationFrame(mglAosRefreshFrame);
    mglAosRefreshFrame = window.requestAnimationFrame(function () {
        AOS.refreshHard();
    });
}

document.querySelectorAll('img').forEach(function (image) {
    if (!image.complete) image.addEventListener('load', refreshScrollEffectsAfterLayout, { once: true });
});
window.addEventListener('resize', refreshScrollEffectsAfterLayout, { passive: true });
window.addEventListener('orientationchange', refreshScrollEffectsAfterLayout, { passive: true });
document.addEventListener('shown.bs.collapse', refreshScrollEffectsAfterLayout);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshScrollEffectsAfterLayout);

// All in-page navigation accounts for the floating header rather than placing
// the target title beneath it.
document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    var hash = link.getAttribute('href');
    if (!hash || hash === '#') return;
    var target = document.querySelector(hash);
    if (!target) return;

    link.addEventListener('click', function (event) {
        event.preventDefault();
        var header = document.querySelector('.mgl-site-header');
        var offset = (header ? header.getBoundingClientRect().height : 78) + 40;
        var targetTop = window.scrollY + target.getBoundingClientRect().top - offset;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        window.history.replaceState(null, '', hash);
    });
});

