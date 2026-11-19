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

const colorSwitcher = document.getElementById('btnSwitch');


switchThemeByUrl();
updateThemeColor(localStorage.getItem('theme'))


colorSwitcher?.addEventListener('click', () => {

    const theme = localStorage.getItem('theme');

    if (theme && theme === 'dark') {

        updateThemeColor('light');

    } else {
        updateThemeColor('dark');

    }

});

function updateThemeColor(themeMode = 'light') {
    themeMode = themeMode === 'dark' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-bs-theme', themeMode);
    localStorage.setItem('theme', themeMode)

    if (themeMode === 'dark') {
        colorSwitcher.classList.add('dark-switcher');

    } else {
        colorSwitcher.classList.remove('dark-switcher');
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


// Add class 'menu-item-has-children' to parent li elements of '.submenu'
var submenuList = document.querySelectorAll("ul>li>.submenu");
submenuList.forEach(function (submenu) {
    var parentLi = submenu.parentElement;
    if (parentLi) {
        parentLi.classList.add("menu-item-has-children");
    }
});

// Fix dropdown menu overflow problem
var menuList = document.querySelectorAll("ul");
menuList.forEach(function (menu) {
    var parentLi = menu.parentElement;
    if (parentLi) {
        parentLi.addEventListener("mouseover", function () {
            var menuPos = menu.getBoundingClientRect();
            if (menuPos.left + menu.offsetWidth > window.innerWidth) {
                menu.style.left = -menu.offsetWidth + "px";
            }
        });
    }
});



// Toggle menu on click

var menuLinks = document.querySelectorAll(".menu li a");

menuLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
        e.stopPropagation(); // prevent the event from bubbling up to parent elements
        var element = link.parentElement;
        var submenu = element.querySelector(":scope > .submenu");
        if (parseInt(window.innerWidth, 10) < 1200 && submenu) {
            e.preventDefault();
            var expanded = !element.classList.contains("open");
            element.classList.toggle("open", expanded);
            submenu.style.display = expanded ? "block" : "none";
            link.setAttribute("aria-expanded", String(expanded));
        }
    });
});




// Toggle header bar on click
var headerBar = document.querySelector(".header-bar");
headerBar?.addEventListener("click", function () {
    headerBar.classList.toggle("active");
    var menu = document.querySelector(".menu");
    if (menu) {
        menu.classList.toggle("active");
    }
});




//Header
var fixedTop = document.querySelector("header");
window.addEventListener("scroll", function () {
    if (!fixedTop) return;
    if (window.scrollY > 300) {
        fixedTop.classList.add("header-fixed", "fadeInUp");
    } else {
        fixedTop.classList.remove("header-fixed", "fadeInUp");
    }
}, { passive: true });


// =================== header js end here =================== //




// Scroll-reveal effects previously left content transparent or translated while
// scrolling. Content now remains immediately visible on every page.
document.querySelectorAll('[data-aos]').forEach(function (element) {
    element.removeAttribute('data-aos');
    element.removeAttribute('data-aos-duration');
    element.removeAttribute('data-aos-delay');
    element.classList.remove('aos-init', 'aos-animate');
    element.style.removeProperty('opacity');
    element.style.removeProperty('transform');
    element.style.removeProperty('transition');
});




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
        disableOnInteraction: true,
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

    autoplay: true,
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

    autoplay: true,
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

    autoplay: true,
    speed: 500,

});

// =================== custom trk slider end here =================== //




// =================== scroll js start here =================== //

// Show/hide button on scroll
window.addEventListener('scroll', function () {
    var scrollToTop = document.querySelector('.scrollToTop');

    if (scrollToTop) {
        if (window.pageYOffset > 300) {
            scrollToTop.style.bottom = '7%';
            scrollToTop.style.opacity = '1';
            scrollToTop.style.transition = 'all .5s ease';
        } else {
            scrollToTop.style.bottom = '-30%';
            scrollToTop.style.opacity = '0';
            scrollToTop.style.transition = 'all .5s ease';
        }
    }
});

var scrollToTop = document.querySelector('.scrollToTop');

if (scrollToTop) {

    // Click event to scroll to top
    scrollToTop.addEventListener('click', function (e) {
        e.preventDefault();
        var scrollDuration = 100; // Set scroll duration in milliseconds
        var scrollStep = -window.scrollY / (scrollDuration / 15);
        var scrollInterval = setInterval(function () {
            if (window.scrollY !== 0) {
                window.scrollBy(0, scrollStep);
            } else {
                clearInterval(scrollInterval);
            }
        }, 15);
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
// The homepage form navigates between launch models; it does not send lead data.
document.querySelector('.cta-form.form-subscribe')?.addEventListener('submit', function (event) {
  event.preventDefault();
  const preference = (this.querySelector('input')?.value || '').trim().toLowerCase();
  const selected = preference.includes('white') ? 0 : preference.includes('grey') || preference.includes('gray') ? 1 : preference.includes('turnkey') ? 2 : null;
  if (selected !== null) {
    document.querySelectorAll('#models .pricing__item-inner').forEach((card, index) => card.classList.toggle('active', index === selected));
  }
  document.querySelector('#models')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
