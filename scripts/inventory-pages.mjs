import { readFileSync,writeFileSync } from 'node:fs';
import { pageFamily,INNER_ROLLOUT } from '../src/inner-system.js';
const d=JSON.parse(readFileSync('data/content.json','utf8'));
const entries=Object.entries(d.pages).filter(([,v])=>v.role==='page').map(([path,v])=>({path,route:v.route,title:d.pageMap.pages.find(p=>p.path===path)?.title||({'services.html':'Technology / Services','solutions/index.html':'All Solutions','insights/index.html':'Insights','404.html':'Not Found','contact/index.html':'Get Started'})[path]||v.route}));

const family=e=>e.route==='/'?'Approved homepage':e.route==='/404.html'?'Utility':e.route==='/contact/'?'Contact / conversion':/^(\/services.html|\/solutions\/|\/insights\/)$/.test(e.route)?'Directory / hub':pageFamily(e.route);
const rows=entries.map(e=>`| ${e.route} | ${e.title.replaceAll('|','/')} | ${family(e)} | ${INNER_ROLLOUT.has(e.route)?'Family design enabled':e.route==='/'?'Preserved':'Existing composition'} |`).join('\n');
writeFileSync('docs/route-inventory.md',`# Current route inventory\n\nBase: main 7d5568d512e21e09cdd18e57749abe5e1eb7cf49. Generated from canonical data plus the bespoke contact source.\n\n${entries.length-1} public routes and one 404 utility. Aliases /index.html and /services/ resolve to / and /services.html. Contact is now included in the canonical SEO/FSE inventory. Its static composition remains independent.\n\n| Route | Page | Semantic family | Redesign state |\n|---|---|---|---|\n${rows}\n`);
console.log('INVENTORY: '+entries.length+' routes including 404');
