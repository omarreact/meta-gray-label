import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const manifest=JSON.parse(fs.readFileSync('site-manifest.json','utf8'));
assert.equal(manifest.pages.length,53);
assert.equal(new Set(manifest.pages.map(p=>p.path)).size,53);
assert.equal(new Set(manifest.pages.map(p=>p.sourceFile)).size,53);
assert(manifest.pages.some(p=>p.sourceFile==='index-2.html'&&p.template==='standalone'));
for(const part of ['header','footer']){
  const html=fs.readFileSync(part+'.html','utf8');
  assert(html.includes('<'+part),'Missing full '+part+' wrapper');
}
assert(fs.readFileSync('header.html','utf8').includes('data-site-header'));
for(const page of manifest.pages){
  const source=fs.readFileSync(page.sourceFile,'utf8');
  const imported=fs.readFileSync(page.file,'utf8');
  const headings=s=>[...s.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map(m=>m[1].replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim());
  assert.deepEqual(headings(imported),headings(source),'Content changed in '+page.sourceFile);
  assert(imported.includes('/assets/css/wordpress-import.css'));
  if(page.template!=='standalone'){
    assert(!imported.includes('src="/assets/js/includes.js"'));
    assert(imported.includes('src="/assets/js/wordpress.js"')||imported.includes('src="/assets/js/custom.js"'));
  }
  for(const match of imported.matchAll(/\b(?:src|href|poster)=(["'])(.*?)\1/gi)){
    const value=match[2];
    if(!value.startsWith('/')||value.startsWith('//'))continue;
    const local=value.slice(1).split(/[?#]/)[0];
    if(!local)continue;
    const file=local.endsWith('/')?local+'index.html':local;
    assert(fs.existsSync(file),'Missing import reference '+value+' in '+page.file);
  }
}
execFileSync(process.execPath,['scripts/prepare-wordpress-import.mjs','--check'],{stdio:'inherit'});
console.log('PASS: all 53 source pages preserve headings, complete chrome, local references and independent layout metadata.');
