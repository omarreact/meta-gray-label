import designContent from '../data/inner-pages.json' with { type: 'json' };
/** Shared semantic composition. Static HTML and Gutenberg serialize this same tree. */
export const REFERENCE_ROUTE = '/forex-grey-label/mt5-grey-label/';
// Family rollout follows the MT5 reference passing static and real WordPress QA.
export const INNER_ROLLOUT = new Set(designContent.rollout);
export const esc = (s = '') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const text = (tag, value, cls = '') => ({ tag, text: value, cls });
const group = (cls, children, tag = 'div', id) => ({ tag, cls, children: children.filter(Boolean), id });
const p = (value, cls = '') => text('p', value, cls);
const h = (value, level = 2) => text('h' + level, value);
const link = (label, href, cls = '') => ({ tag:'p', cls, links:[{label,href}] });
const actions = (label = 'Discuss your setup', href = '/contact/') => group('mgl-inner-actions', [link(label + ' ↗', href, 'mgl-inner-action'), link('Compare models →', '/forex-white-label/vs-grey-label/', 'mgl-inner-action mgl-inner-action--secondary')]);
const label = value => p(value, 'mgl-inner-eyebrow');
export const ui = { group, p, h, link, actions, label };
const short = (s, length = 150) => s.length > length ? s.slice(0,length).replace(/\s+\S*$/,'') + '…' : s;
export function pageFamily(route) {
  if(route.startsWith('/insights/')) return 'article';
  if(route.includes('/pricing/')) return 'pricing';
  if(/vs-grey-label|a-book-b-book/.test(route)) return 'comparison';
  if(route.includes('how-it-works')) return 'process';
  if(route.startsWith('/about-us/')) return 'company';
  if(/mt-admin-license|upgrade-to-admin|back-office|liquidity-bridge/.test(route)) return 'technical';
  if(route.split('/').filter(Boolean).length === 1) return 'hub';
  return 'service';
}
export function splitContent(blocks) {
  const intro=[], sections=[]; let current;
  for(const b of blocks) {
    if(b.type==='heading' && b.level===1) continue;
    if(b.type==='heading' && b.level===2) { current={title:b.text,blocks:[]}; sections.push(current); }
    else (current ? current.blocks : intro).push(b);
  }
  return {intro,sections};
}
function chunks(blocks) {
  const lead=[],items=[]; let current;
  for(const b of blocks) {
    if(b.type==='heading') { current={title:b.text,blocks:[]}; items.push(current); }
    else (current ? current.blocks : lead).push(b);
  }
  return {lead,items};
}
const copy = blocks => blocks.map(b=>b.type==='heading'?h(b.text,Math.max(3,b.level)):p(b.text));
function panel(item, index, cls='mgl-inner-card') {
  return group(cls,[label(String(index+1).padStart(2,'0')),h(item.title,3),...copy(item.blocks)]);
}
function contentSection(section, index, family, route) {
  const {lead,items}=chunks(section.blocks);
  const id='inner-section-'+(index+1);
  const faq=/frequently asked|questions|faq|\?$/.test(section.title.toLowerCase()) && items.some(x=>x.title.endsWith('?'));
  const heading=group('mgl-inner-section-heading',[label(faq?'Answers, without the ambiguity':String(index+1).padStart(2,'0')+' / '+(family==='technical'?'Operational scope':'Explore the detail')),h(section.title)]);
  if(faq) return group('mgl-inner-section mgl-inner-faq',[group('mgl-inner-container mgl-inner-split',[heading,group('mgl-inner-faq-list',[...copy(lead),...items.map(x=>({tag:'details',cls:'mgl-inner-disclosure',summary:x.title,children:copy(x.blocks)}))])])],'section',id);
  let pattern='cards';
  if(family==='article') pattern='editorial';
  else if(family==='process' && index<6) pattern='timeline';
  else if(family==='comparison') pattern='matrix';
  else if(family==='company') pattern='story';
  else if(family==='technical') pattern=/how it works|how.*upgrade|migration|implementation|process/i.test(section.title)?'timeline':'technical';
  else if(family==='pricing') pattern=/package|add-on/i.test(section.title)?'packages':'rows';
  else if(/cost|price|fees|technical|choice|integration/i.test(section.title)) pattern='rows';
  else if(!items.length) pattern='spotlight';
  if(family==='comparison' && route.includes('vs-grey-label') && index===0) {
    return group('mgl-inner-section mgl-inner-comparison-matrix',[group('mgl-inner-container',[
      heading,...copy(lead),group('mgl-inner-comparison-rows',items.map(item=>{
        const paras=item.blocks.filter(b=>b.type==='paragraph');
        return group('mgl-inner-comparison-row'+(paras.length===1?' mgl-inner-comparison-row--shared':''),[
          h(item.title,3),
          paras.length===1?group('mgl-inner-comparison-cell',[label('Both models / commercial scope'),...copy(paras)]):null,
          paras.length>1?group('mgl-inner-comparison-cell',[label('White label'),...copy(paras.slice(0,1))]):null,
          paras.length>1?group('mgl-inner-comparison-cell',[label('Grey label'),...copy(paras.slice(1))]):null
        ]);
      }))
    ])],'section',id);
  }
  const body=group('mgl-inner-section-body',[
    lead.length?group('mgl-inner-lead',copy(lead)):null,
    items.length?group('mgl-inner-items',items.map((item,i)=>panel(item,i))):null
  ]);
  return group('mgl-inner-section mgl-inner-pattern--'+pattern,[group('mgl-inner-container',[heading,body])],'section',id);
}
function architecture(title='Your brokerage, connected', platform='MT5', route='') {
  let modules=[['Trading access','Desktop · Web · Mobile','/trading-platforms/'],['Client operations','CRM · KYC · Payments','/forex-crm/'],['Execution layer','Liquidity · Bridge · Routing','/forex-liquidity/']];
  let caption='Your brand. Your trading conditions.', type='Platform architecture';
  if(/kyc/.test(route)){title='Onboarding, in context';platform='KYC';caption='Client records and review workflows.';type='Client operations';modules=[['Client portal','Onboarding touchpoint','/forex-crm/'],['Back office','Operational review','/forex-crm/back-office/'],['Payments','Connected workflow','/forex-crm/payments-automation/']];}
  else if(/back-office/.test(route)){title='The operational view';platform='OPS';caption='Client records. Access. Reporting.';type='Operations workspace';modules=[['Client operations','CRM & TradeRoom','/forex-crm/'],['KYC module','Compliance workflow','/forex-crm/kyc/'],['Payments','Deposit / withdrawal','/forex-crm/payments-automation/']];}
  else if(/liquidity-bridge/.test(route)){title='Connect the execution layer';platform='LP';caption='Review pricing, connectivity and routing.';type='Execution architecture';modules=[['Trading platform','Platform environment','/trading-platforms/'],['Liquidity','Connectivity scope','/forex-liquidity/'],['Book model','A-Book / B-Book / Hybrid','/forex-liquidity/a-book-b-book/']];}
  else if(/admin-license|upgrade-to-admin/.test(route)){title='Define the control boundary';platform='ADM';caption='Access, infrastructure and responsibilities.';type='Administration scope';modules=[['Platform access','Trading environment','/trading-platforms/'],['Operations','Back office & reporting','/forex-crm/back-office/'],['Upgrade path','Scope & responsibilities','/forex-grey-label/upgrade-to-admin/']];}
  return group('mgl-inner-architecture',[
    group('mgl-inner-console-top',[label(type),p('Illustrative configuration','mgl-inner-caption')]),
    group('mgl-inner-core',[p(platform,'mgl-inner-platform'),h(title,3),p(caption,'mgl-inner-caption')]),
    group('mgl-inner-modules',modules.map(([name,desc,href])=>group('mgl-inner-module',[link(name+' ↗',href),p(desc,'mgl-inner-caption')]))),
    p('Final modules and access depend on the agreed package.','mgl-inner-caption mgl-inner-console-note')
  ]);
}
function related(route, entries, family) {
  const root=route.split('/')[1];
  const others=entries.filter(x=>x.route!==route && x.route!=='/' && (family==='article' ? x.route.startsWith('/insights/') : !x.route.startsWith('/insights/')));
  others.sort((a,b)=>Number(b.route.split('/')[1]===root)-Number(a.route.split('/')[1]===root));
  return group('mgl-inner-section mgl-inner-related',[group('mgl-inner-container',[
    label('Keep exploring'),h(family==='article'?'More brokerage perspectives':'Build the rest of your stack'),
    group('mgl-inner-link-grid',others.slice(0,3).map(x=>group('mgl-inner-link-card',[label(family==='article'?'Insight':'Connected solution'),h(x.title,3),link('Explore '+x.title+' ↗',x.route)])))
  ])],'section');
}
export function buildInnerPage(entry, entries) {
  const route=entry.route, family=pageFamily(route), reference=route===REFERENCE_ROUTE;
  const blocks=entry.document.blocks, {intro,sections}=splitContent(blocks);
  const originalTitle=blocks.find(b=>b.type==='heading'&&b.level===1)?.text||entry.title;
  const pageContent=designContent.pages[route]||{};
  const title=pageContent.heroTitle||(family==='article'?originalTitle:entry.title);
  const summary=pageContent.summary||designContent.families[family].summary;
  const parent=entries.find(x=>x.route==='/'+route.split('/')[1]+'/');
  const crumbLinks=[{label:'Home',href:'/'},...(parent&&parent.route!==route?[{label:parent.title,href:parent.route}]:[]),{label:entry.title}];
  const heroCopy=group('mgl-inner-hero-copy',[
    label(family==='article'?'Brokerage insights':'Meta Grey Label / '+(reference?'Multi-asset platform':family)),
    h(title,1),p(summary,'mgl-inner-summary'),
    family==='article'?p(Math.max(1,Math.ceil(blocks.map(x=>x.text).join(' ').split(/\s+/).length/220))+' min read · Meta Grey Label','mgl-inner-caption'):actions(reference?'Plan your MT5 setup':'Discuss your requirements'),
    reference?p('Desktop / Web / iOS / Android','mgl-inner-device-note'):null
  ]);
  const heroVisual=family==='service'||family==='technical'?architecture(reference?'A platform built around you':'Connected operational scope',/mt4/i.test(route)?'MT4':/mt5/i.test(route)?'MT5':'MGL',route):family==='comparison'?group('mgl-inner-decision',[label('Choose your operating model'),h('Control. Scope. Responsibility.',3),group('mgl-inner-model-pair',[group('mgl-inner-model-choice',[label(route.includes('vs-grey-label')?'White label':'A-Book'),p(route.includes('vs-grey-label')?'Provider-led platform operations.':'Route orders to liquidity providers.')]),group('mgl-inner-model-choice',[label(route.includes('vs-grey-label')?'Grey label':'B-Book / Hybrid'),p(route.includes('vs-grey-label')?'More direct manager-level control.':'Define how selected flow is managed.')])]),p('Start with what your team needs to manage directly. Confirm the commercial and technical scope before launch.'),link('Explore the decision criteria ↓','#inner-section-1','mgl-inner-action mgl-inner-action--secondary')]):null;
  const children=[group('mgl-inner-hero-v2',[group('mgl-inner-container',[
    {tag:'p',cls:'mgl-inner-breadcrumb',links:crumbLinks},
    group('mgl-inner-hero-layout',[heroCopy,heroVisual])
  ])],'section')];
  if(reference) children.push(group('mgl-inner-value-band',[group('mgl-inner-container',[
    p('01 / Your identity','mgl-inner-value'),p('02 / Your trading conditions','mgl-inner-value'),p('03 / Connected operations','mgl-inner-value')
  ])]));
  const toc=group('mgl-inner-toc',[
    label(family==='article'?'In this guide':'On this page'),
    ...sections.map((s,i)=>link(s.title,'#inner-section-'+(i+1)))
  ],'aside');
  const contents=[];
  if(intro.length) contents.push(group('mgl-inner-section mgl-inner-intro',[group('mgl-inner-container',[label(reference?'A modern operating foundation':'The context'),...copy(intro)])],'section'));
  if(family==='hub') {
    const childrenRoutes=entries.filter(x=>x.route.startsWith(route)&&x.route!==route);
    if(childrenRoutes.length) contents.push(group('mgl-inner-section mgl-inner-selector',[group('mgl-inner-container',[label('Choose your next step'),h('Explore '+entry.title),group('mgl-inner-link-grid',childrenRoutes.map(x=>group('mgl-inner-link-card',[h(x.title,3),p(short(x.document.blocks.find(b=>b.type==='paragraph')?.text||'')),link('Explore '+x.title+' ↗',x.route)])))])],'section'));
  }
  for(const [i,section] of sections.entries()) {
    contents.push(contentSection(section,i,family,route));
    if(reference && i===3) contents.push(group('mgl-inner-section mgl-inner-integration',[group('mgl-inner-container mgl-inner-split',[
      group('mgl-inner-section-heading',[label('One connected environment'),h('Fewer handoffs.\nA clearer operating picture.'),p('Define your platform and operations together. Each integration is configured and tested against the agreed launch scope.'),link('Explore CRM & client operations ↗','/forex-crm/','mgl-inner-action mgl-inner-action--secondary')]),
      group('mgl-inner-flow',[
        panel({title:'Configure',blocks:[{text:'Branding, symbols, groups and trading conditions.'}]},0),
        panel({title:'Connect',blocks:[{text:'Align liquidity, CRM and the modules in your package.'}]},1),
        panel({title:'Validate',blocks:[{text:'Test trading and client workflows before go-live.'}]},2),
        link('See the complete launch process →','/forex-broker-turnkey/how-it-works/')
      ])
    ])],'section'));
  }
  children.push(family==='article'?group('mgl-inner-editorial-layout',[group('mgl-inner-editorial-copy',contents,'article'),toc]):group('mgl-inner-body',contents));
  children.push(related(route,entries,family));
  children.push(group('mgl-inner-section mgl-inner-final',[group('mgl-inner-container',[group('mgl-inner-final-panel',[
    group('mgl-inner-final-copy',[label('Your next move'),h(reference?'Build your MT5 brokerage\non a clearer foundation.':'Let’s define your next step.'),p('Bring your platform, market and operational requirements. We’ll help turn them into a clear implementation scope.')]),actions(reference?'Discuss MT5 Grey Label':'Talk to our team')
  ])])],'section'));
  return group('mgl-design mgl-design--'+family,children);
}

/** Native core blocks throughout; no raw HTML blocks, scripts or custom blocks. */
export function renderInnerTree(node, gutenberg=false) {
  const children=()=> (node.children||[]).map(n=>renderInnerTree(n,gutenberg)).join('\n');
  const rich=()=>node.links?node.links.map(x=>x.href?`<a href="${esc(x.href)}">${esc(x.label)}</a>`:`<span>${esc(x.label)}</span>`).join(' <span aria-hidden="true">/</span> '):esc(node.text).replace(/\n/g,'<br>');
  const cls=node.cls||'';
  const anchor=node.id?` id="${esc(node.id)}"`:'';
  const attr={...(cls?{className:cls}:{}),...(node.id?{anchor:node.id}:{})};
  let name,html;
  if(node.tag==='details') {
    name='details';attr.summary=node.summary;
    html=`<details class="wp-block-details${cls?' '+cls:''}"><summary>${esc(node.summary)}</summary>\n${children()}</details>`;
  } else if(/^h[1-6]$/.test(node.tag)) {
    name='heading'; if(node.tag!=='h2')attr.level=Number(node.tag[1]);
    html=`<${node.tag} class="wp-block-heading${cls?' '+cls:''}">${rich()}</${node.tag}>`;
  } else if(node.tag==='p') {
    name='paragraph';html=`<p${cls?` class="${cls}"`:''}>${rich()}</p>`;
  } else {
    name='group'; if(node.tag!=='div')attr.tagName=node.tag;
    attr.layout={type:'default'};
    html=`<${node.tag}${anchor} class="wp-block-group${cls?' '+cls:''}">\n${children()}\n</${node.tag}>`;
  }
  return gutenberg?`<!-- wp:${name}${Object.keys(attr).length?' '+JSON.stringify(attr).replace(/--/g,'\\u002d\\u002d').replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026'):''} -->\n${html}\n<!-- /wp:${name} -->`:html;
}
