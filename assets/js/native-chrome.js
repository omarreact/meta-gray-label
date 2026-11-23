(() => {
 'use strict';
 const controls=[...document.querySelectorAll('.mgl-native-theme-toggle a')];
 function sync(){const dark=document.documentElement.getAttribute('data-bs-theme')==='dark';for(const control of controls){control.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');control.setAttribute('aria-pressed',String(dark));}}
 for(const control of controls){control.setAttribute('role','button');control.addEventListener('click',event=>{event.preventDefault();const next=document.documentElement.getAttribute('data-bs-theme')==='dark'?'light':'dark';document.documentElement.setAttribute('data-bs-theme',next);try{localStorage.setItem('theme',next);}catch{}sync();});control.addEventListener('keydown',event=>{if(event.key===' '){event.preventDefault();control.click();}});}
 sync();
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-bs-theme']});
})();
