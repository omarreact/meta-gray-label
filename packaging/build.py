from pathlib import Path
import shutil, json, re, subprocess, zipfile, tempfile
root=Path.cwd()
template=root/'packaging'
out=root/'dist'
out.mkdir(exist_ok=True)
data=json.loads((root/'site-content.json').read_text())
assert len(data['pages'])==52 and len({p['slug'] for p in data['pages']})==52
assert all(data['homeLayouts'][t] for t in ['theme-1','theme-2'])
with tempfile.TemporaryDirectory() as tmp:
    package=Path(tmp)/'meta-grey-label-standalone'
    web=package/'website'
    web.mkdir(parents=True)
    for n in ['index.html','404.html','site-content.json','site-manifest.json','design-tokens.json','pages.xml','sitemap.xml','robots.txt']:
        shutil.copy2(root/n,web/n)
    for n in ['assets','theme-1','theme-2']:
        shutil.copytree(root/n,web/n)
    for n in ['style.css','functions.php','index.php','README.txt']:
        shutil.copy2(template/n,package/n)
    adapter=(template/'route-adapter.js').read_text()
    def once(s,a,b):
        assert s.count(a)==1, ('source pattern mismatch',a[:100],s.count(a))
        return s.replace(a,b,1)
    for t in ['theme-1','theme-2']:
        p=web/t/'script.js';s=p.read_text()
        s=once(s,"const root=new URL('.',location.href);","const root=window.__mglStandalone?new URL(window.__mglStandalone.assetBase):new URL('.',location.href);")
        s=once(s,"slug=new URLSearchParams(location.search).get('page')||'home'","slug=(window.__mglStandalone&&window.__mglStandalone.slug)||new URLSearchParams(location.search).get('page')||'home'")
        end='document.open();document.write(html);document.close();'
        s=once(s,end,adapter+'\n'+end);p.write_text(s)
        p=web/t/'runtime.js';s=p.read_text()
        pattern=r'function\s+createUi\s*\(\s*activeSetting\s*\)\s*\{'
        guard="function createUi(activeSetting){Promise.resolve(window.__mglpsAccess).then(function(ok){if(ok===true&&document.documentElement.getAttribute('data-mglps-allowed')==='1')mglsaOriginalUi(activeSetting)}).catch(function(){});} function mglsaOriginalUi(activeSetting){"
        s,n=re.subn(pattern,lambda _:guard,s,count=1);assert n==1
        a="const u=new URL('../'+t+'/',location.href);u.search=location.search;u.hash=location.hash;"
        b="const cfg=window.__mglStandalone;const u=cfg?new URL((t==='theme-2'?'theme-2/':'')+(cfg.slug==='home'?'':encodeURIComponent(cfg.slug)+'/'),cfg.home):new URL('../'+t+'/',location.href);if(!cfg)u.search=location.search;u.hash=location.hash;"
        s=once(s,a,b);p.write_text(s)
        for n in ['index.html','404.html']:
            p=web/t/n;s=p.read_text();s,k=re.subn(r'(\bsrc=["\x27]script\.js)([^"\x27]*)(["\x27])',lambda m:m[1]+m[2]+('&amp;' if '?' in m[2] else '?')+'mglsa=21'+m[3],s);assert k==1;p.write_text(s)
        for n in ['script.js','runtime.js']:subprocess.run(['node','--check',str(web/t/n)],check=True)
    for n in ['functions.php','index.php']:subprocess.run(['php','-l',str(package/n)],check=True)
    files=[f for f in web.rglob('*') if f.is_file()]
    assert len(files)>=151
    for n in ['logo-dark.svg','logo-light.svg','favicon-dark.svg','favicon-light.svg','favicon-32.png','icon-192.png','icon-512.png','apple-touch-icon.png']:
        assert (web/'assets/media/branding/theme-2'/n).is_file()
    (package/'source-inventory.json').write_text(json.dumps({'source_files':len(files),'pages':52,'designs':2,'source_revision':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()},indent=2))
    target=out/'meta-grey-label-standalone.zip'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for f in sorted(package.rglob('*')):
            if f.is_file():z.write(f,f.relative_to(package.parent).as_posix())
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None
        assert 'meta-grey-label-standalone/style.css' in z.namelist()
        assert 'meta-grey-label-standalone/website/site-content.json' in z.namelist()
        print('PASS: installable standalone ZIP,',len(z.namelist()),'files,',target.stat().st_size,'bytes')
