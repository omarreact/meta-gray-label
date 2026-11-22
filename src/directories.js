import content from '../data/directories.json' with { type:'json' };
import { ui } from './inner-system.js';
const {group,p,h,link,actions,label}=ui;
export const DIRECTORY_ROUTES=new Set(['/services.html','/solutions/','/insights/']);
export function directoryEntry(route){
 const title=route==='/services.html'?'Brokerage Services':route==='/solutions/'?'Brokerage Solutions':'Brokerage Insights';
 const summary=route==='/services.html'?'Trading platforms, liquidity, client management, operational controls and launch support—connected around the needs of your brokerage.':route==='/solutions/'?'Explore MetaTrader grey label, white label, turnkey, liquidity, client operations and brokerage infrastructure options.':'Practical guides covering MetaTrader grey label, brokerage licensing, client onboarding, platform integration and operating models.';
 return {route,title,family:'directory',document:{title,blocks:[{type:'heading',level:1,text:title},{type:'paragraph',text:summary}]}};
}
const section=(cls,children,id)=>group('mgl-inner-section '+cls,[group('mgl-inner-container',children)],'section',id);
const filter=(name,choices)=>group('mgl-directory-filter',[label(name),group('mgl-directory-filter-links',[link('All','#directory-all'),...choices.map(([id,title])=>link(title,'#directory-'+id))])],'nav');
const hero=(route,kicker,title,summary,visual)=>group('mgl-inner-hero-v2 mgl-directory-hero',[group('mgl-inner-container',[
 {tag:'p',cls:'mgl-inner-breadcrumb',links:[{label:'Home',href:'/'},{label:directoryEntry(route).title}]},
 group('mgl-directory-hero-layout',[group('mgl-directory-hero-copy',[label(kicker),h(title,1),p(summary,'mgl-inner-summary')]),visual])])],'section');
const cta=()=>section('mgl-inner-final',[group('mgl-inner-final-panel',[group('mgl-inner-final-copy',[label('Make the next step clear'),h('Plan your brokerage\nwith confidence.'),p('Compare brokerage models and review the platform and operations that fit your business.')]),actions('Discuss your requirements')])]);
function services(){
 const entry=directoryEntry('/services.html');
 return group('mgl-design mgl-design--directory mgl-directory--services',[
 hero(entry.route,'Service directory',entry.title,entry.document.blocks[1].text,
 group('mgl-directory-map',[label('A connected technology stack'),...['01 / Trading & platform access','02 / Execution & liquidity','03 / Client operations & control'].map(x=>p(x)),link('Find your operating model →','/solutions/')])),
 section('mgl-directory-introduction',[label('Brokerage technology overview'),h('Choose the components.\nConnect the whole operation.'),p('Choose the trading, execution and client operations components that fit your launch model.'),filter('Browse service groups',content.services.map(x=>[x[0],x[1]]))]),
 section('mgl-directory-catalog',[group('mgl-directory-service-grid',content.services.map(([id,title,summary,route,...links],i)=>group('mgl-directory-group mgl-directory-service mgl-directory-service--'+id,[
 label(String(i+1).padStart(2,'0')+' / Technology services'),h(title,2),p(summary),link('Explore '+title+' ↗',route,'mgl-directory-primary'),group('mgl-directory-subservices',links.map(([name,url])=>link(name+' →',url)))
 ],'section','directory-'+id)))],'directory-all'),
 section('mgl-directory-journey',[label('A connected launch process'),h('Define. Connect. Validate.'),p('Define the model, connect the technology and validate the workflows before handover.'),group('mgl-directory-steps',[
 ['Choose your operating model','Align market requirements and company documents with white label, grey label or turnkey infrastructure.'],
 ['Connect platform and operations','Configure trading groups, platform access, bridge, liquidity, CRM, client portal and payments as needed.'],
 ['Test and prepare for launch','Verify trading, reporting and client workflows, resolve setup issues and prepare a documented handover.']
 ].map(([title,summary],i)=>group('mgl-directory-step',[label('0'+(i+1)),h(title,3),p(summary)]))),link('Review the full launch process →','/forex-broker-turnkey/how-it-works/')]),
 section('mgl-directory-guidance',[label('Help me choose'),h('Start with the decisions\nyour team needs to make.'),group('mgl-inner-link-grid',[
 ['White Label vs Grey Label','Compare platform access, provider responsibilities and operational control.','/forex-white-label/vs-grey-label/'],
 ['A-Book / B-Book / Hybrid','Review routing and risk considerations for your execution model.','/forex-liquidity/a-book-b-book/'],
 ['Risk & reporting','Explore operational tools to monitor exposure, activity and reporting.','/forex-crm/back-office/']
 ].map(([title,summary,url])=>group('mgl-inner-link-card',[h(title,3),p(summary),link('Review the detail ↗',url)])))]),cta()]);
}
function solutions(){
 const entry=directoryEntry('/solutions/');
 const stages=[['start','Starting out'],['control','Taking control'],['operations','Connecting operations'],['stack','Building the stack']];
 const stageFor=id=>['start','launch','platform'].includes(id)?'start':['control','admin','upgrade'].includes(id)?'control':['operations','execution'].includes(id)?'operations':'stack';
 return group('mgl-design mgl-design--directory mgl-directory--solutions',[
 hero(entry.route,'Business needs / Solution pathways','What does your\nnext stage need?',entry.document.blocks[1].text,
 group('mgl-directory-decision',[label('Begin with the operating decision'),h('Your team.\nYour responsibilities.',3),p('Platform access, operational ownership and connected systems shape the model you choose.'),link('Compare the four operating models ↓','#operating-models')])),
 section('mgl-directory-introduction',[label('Find your path'),h('Start with the problem\nyou need to solve.'),filter('Your business stage',stages)]),
 section('mgl-directory-pathways',[group('mgl-directory-path-grid',stages.map(([id,name])=>group('mgl-directory-group mgl-directory-stage',[label(name),...content.pathways.filter(x=>stageFor(x[0])===id).map(([key,title,summary,route,cta])=>group('mgl-directory-path',[h(title,2),p(summary),link(cta+' ↗',route)]))],'section','directory-'+id)))],'directory-all'),
 section('mgl-directory-models',[label('Operating model guide'),h('Different levels of access.\nDifferent responsibilities.'),p('These are starting points for discussion. Confirm platform access, included modules, fees and responsibilities in your agreed package.'),group('mgl-directory-model-grid',[
 ['White Label','Provider-led platform operations','A branded environment with platform operations managed by the provider.','/forex-white-label/'],
 ['Grey Label','Manager-level operational control','More direct manager-level control within the agreed platform scope.','/forex-grey-label/'],
 ['Turnkey','A coordinated launch stack','Platform, liquidity and client operations brought together in one implementation scope.','/forex-broker-turnkey/'],
 ['Admin License','Platform administration','Administrative scope and infrastructure responsibilities require an operationally prepared team.','/mt-admin-license/']
 ].map(([title,scope,summary,route],i)=>group('mgl-directory-model',[label('0'+(i+1)),h(title,3),p(scope,'mgl-directory-model-scope'),p(summary),link('Review '+title+' →',route)]))),link('Compare White Label vs Grey Label in detail →','/forex-white-label/vs-grey-label/')],'operating-models'),
 section('mgl-directory-guidance',[label('Requirements before recommendations'),h('Bring the requirements.\nWe’ll clarify the scope.'),group('mgl-directory-requirements',[
 ['Platform & access','Trading platform, channels and the permissions your team needs.'],['Execution & risk','Liquidity connectivity, routing and your intended book model.'],['Client operations','Onboarding, KYC, payments, reporting and support workflows.']
 ].map(([title,summary])=>group('mgl-directory-requirement',[h(title,3),p(summary)]))),link('Browse individual services →','/services.html')]),cta()]);
}
export function insightTopic(route){
 if(/licens|compliance|kyc/.test(route))return 'Governance';
 if(/crm|portal|onboarding|broker-ib|copy-trading/.test(route))return 'Client operations';
 if(/tools|plugins/.test(route))return 'Technology';
 return 'Brokerage strategy';
}
export function readingTime(entry){return Math.max(1,Math.ceil(entry.document.blocks.map(x=>x.text||'').join(' ').split(/\s+/).length/220));}
function insights(entries){
 const articles=entries.filter(x=>x.route.startsWith('/insights/')&&x.route!=='/insights/');
 const featured=articles.find(x=>x.route.includes('white-label-grey-label-or-turnkey'))||articles[0];
 const topics=['Brokerage strategy','Client operations','Governance','Technology'];
 const articleCard=(entry,featured=false)=>group(featured?'mgl-directory-featured':'mgl-directory-article',[
 label(insightTopic(entry.route)),h(entry.title,featured?2:3),p(readingTime(entry)+' min read · Practical guide','mgl-inner-caption'),
 featured?p('Understand the differences between brokerage models before defining your platform and operational scope.'):null,
 link(featured?'Read the featured guide ↗':'Read the guide →',entry.route,'mgl-directory-read')
 ],'article');
 return group('mgl-design mgl-design--directory mgl-directory--insights',[
 hero('/insights/','The brokerage reading room','Perspective before\nyour next decision.',directoryEntry('/insights/').document.blocks[1].text,
 group('mgl-directory-editor-note',[label('Inside the reading room'),p('Operating models.\nPlatform decisions.\nClient experience.'),link('Explore the guide collection ↓','#directory-all')])),
 section('mgl-directory-feature',[group('mgl-directory-feature-layout',[group('mgl-directory-feature-label',[label('Featured perspective'),p('01 / The operating model')]),articleCard(featured,true)])]),
 section('mgl-directory-introduction',[label('Explore the collection'),h('Practical guides.\nA clearer operating picture.'),filter('Browse by subject',topics.map((x,i)=>['topic-'+i,x]))]),
 section('mgl-directory-library',[group('mgl-directory-topic-grid',topics.map((topic,i)=>group('mgl-directory-group mgl-directory-topic',[group('mgl-directory-topic-heading',[label('0'+(i+1)+' / Subject'),h(topic,2)]),group('mgl-directory-article-list',articles.filter(x=>insightTopic(x.route)===topic).map(x=>articleCard(x)))],'section','directory-topic-'+i)))],'directory-all'),cta()]);
}
export function buildDirectoryPage(route,entries){return route==='/services.html'?services():route==='/solutions/'?solutions():insights(entries);}
export function directoryEntries(config){return config.pageMap.pages.filter(x=>x.status==='available'&&config.content.documents[x.id]).map(x=>({...x,document:config.content.documents[x.id]}));}
