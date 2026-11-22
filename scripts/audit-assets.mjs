/** Conservative asset inventory: all tracked source, generated markup and CSS/runtime references. */
import {execFileSync} from 'node:child_process';
import {readFileSync,statSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {basename,dirname,resolve} from 'node:path';
const files=execFileSync('git',['ls-files','-co','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter((x,i,a)=>a.indexOf(x)===i&&existsSync(x));
const sources=files.filter(x=>/\.(?:html|css|js|mjs|php|json|ya?ml|jsonc)$/.test(x));
const texts=sources.map(path=>({path,text:readFileSync(path,'utf8')}));
const assets=files.filter(x=>/^(assets|media)\//.test(x));
const inventory=assets.map(path=>{
 const name=basename(path),tail=path.replace(/^(?:assets|media)\//,'');
 const refs=texts.filter(x=>x.path!==path&&(x.text.includes(path)||x.text.includes(tail)||x.text.includes(name))).map(x=>x.path);
 return{path,bytes:statSync(path).size,references:refs,disposition:refs.length?'retain: source/generated/CSS/runtime reference':'retain: no literal reference; dynamic or editor usage requires manual review'};
});
const cssDependencies=[];
for(const path of ['assets/css/fse.css','assets/css/inner-pages.css','assets/css/directories.css','assets/css/native-chrome.css','assets/css/site-settings.css']){
 for(const [,url] of readFileSync(path,'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g)){
  if(/^(data:|https?:|#)/.test(url))continue;
  const relative=resolve(dirname(path),url).slice(process.cwd().length+1);
  if(!existsSync(relative))throw Error(path+' missing '+relative);
  cssDependencies.push({stylesheet:path,asset:relative});
 }
}
const omitted=['assets/js/all.min.js','assets/js/swiper-bundle.min.js','assets/js/aos.js','assets/js/purecounter_vanilla.js','assets/css/aos.css','assets/css/swiper-bundle.min.css'];
const report={policy:'No image or runtime component removed on a filename heuristic. Reference matches deliberately over-retain ambiguous numbered and dynamic assets.',removed:[{path:'assets/css/all.min.css',bytes:102033,reason:'No source, generated HTML, CSS import, runtime loader or WordPress packaging reference. Icon SVG runtime remains on approved homepage.'}],omittedFromRedesignedRoutes:omitted.map(path=>({path,bytes:statSync(path).size})),uncompressedBytesOmittedPerRedesignedRoute:omitted.reduce((n,path)=>n+statSync(path).size,0),cssDependencies,inventory};
mkdirSync('tmp/asset-audit',{recursive:true});writeFileSync('tmp/asset-audit/inventory.json',JSON.stringify(report,null,2));
console.log(`ASSET AUDIT PASS: ${assets.length} retained assets, ${sources.length} source/generated files searched, ${cssDependencies.length} native CSS dependencies valid; ${report.uncompressedBytesOmittedPerRedesignedRoute} uncompressed bytes omitted per redesigned route.`);
