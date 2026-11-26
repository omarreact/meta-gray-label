#!/usr/bin/env python3
"""Project-specific release overlay for a pinned PIN Structured Build output."""
import argparse, html, json, pathlib, re, shutil, zipfile
from PIL import Image
p=argparse.ArgumentParser()
p.add_argument("theme",type=pathlib.Path)
p.add_argument("manifest",type=pathlib.Path)
p.add_argument("--source",type=pathlib.Path,required=True)
p.add_argument("--zip",type=pathlib.Path)
p.add_argument("--screenshot",type=pathlib.Path)
a=p.parse_args(); root=a.theme; here=pathlib.Path(__file__).parent
assert root.name=="meta-grey-label-standalone","Retain installed theme directory for safe upgrade"
assert (root/"pin-local-pages.json").is_file()
manifest=json.loads(a.manifest.read_text())
pages=json.loads((root/"pin-local-pages.json").read_text())
assert len(pages)==52
def read(f):return (root/f).read_text()
def write(f,s):(root/f).write_text(s,encoding="utf-8")
def once(s,old,new):
    assert s.count(old)==1,old[:90]
    return s.replace(old,new,1)
def b(name,attrs=None,inner=None):
    raw=json.dumps(attrs,ensure_ascii=False,separators=(",",":")).replace("--",r"\u002d\u002d") if attrs else ""
    return "<!-- wp:"+name+(" "+raw if raw else "")+(" /-->" if inner is None else " -->"+inner+"<!-- /wp:"+name+" -->")
def layout(tag,classes,inner,**attrs):
    return b("pin/source-layout",{"tagName":tag,"sourceAttrs":{"class":classes,**attrs}},inner)
def text(tag,value,classes=""):
    return b("pin/source-element",{"tagName":tag,"sourceAttrs":{"class":classes} if classes else {},"content":value})
header=b("template-part",{"slug":"header","area":"header"})
footer=b("template-part",{"slug":"footer","area":"footer"})
def frame(inner):
    return header+layout("div","page-wrapper",inner+footer)
def main(inner,extra=""):
    return layout("main","mgl-editorial "+extra,inner,id="main-content")
def qloop(inherit=True,namespace=None):
    attrs={"queryId":61 if inherit else 62,"query":{"perPage":9 if inherit else 6,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","inherit":inherit}}
    if namespace:attrs["namespace"]=namespace
    item=b("post-featured-image",{"isLink":True,"aspectRatio":"16/9","scale":"cover"})+b("post-title",{"level":2,"isLink":True})+b("post-date")+b("post-excerpt",{"moreText":"Read article"})
    pagination=b("query-pagination",{},b("query-pagination-previous")+b("query-pagination-numbers")+b("query-pagination-next"))
    return b("query",attrs,'<div class="wp-block-query">'+b("post-template",{},item)+(pagination if inherit else "")+b("query-no-results",{},b("paragraph",{},'<p>No articles published here yet.</p>'))+'</div>')
sidebar=layout("aside","mgl-article-sidebar",text("h2","Search articles")+b("search",{"label":"Search articles","showLabel":False,"placeholder":"Search insights","buttonText":"Search"})+text("h2","Categories")+b("categories",{"showPostCounts":True})+text("h2","Recent posts")+b("latest-posts",{"postsToShow":5}))
write("parts/sidebar.html",sidebar)
meta=layout("div","mgl-article-meta",b("post-author-name")+b("post-date")+b("post-terms",{"term":"category"}))
body=layout("article","mgl-article-content",b("post-featured-image",{"aspectRatio":"16/9","scale":"cover"})+b("post-content",{"layout":{"type":"default"}})+b("post-terms",{"term":"post_tag"})+layout("div","mgl-post-navigation",b("post-navigation-link",{"type":"previous","showTitle":True})+b("post-navigation-link",{"type":"next","showTitle":True}))+b("comments",{},'<div class="wp-block-comments">'+b("comments-title")+b("comment-template",{},b("comment-author-name")+b("comment-date")+b("comment-content")+b("comment-reply-link"))+b("post-comments-form")+'</div>'))
single=frame(main(text("p","BROKERAGE INSIGHTS","mgl-article-eyebrow")+b("post-title",{"level":1})+meta+layout("div","mgl-article-grid",body+b("template-part",{"slug":"sidebar"}))+text("h2","Related articles")+qloop(False,"mgl/related")))
write("templates/single.html",single)
for key in ("home","index","archive","category","tag","author","search"):
    title=b("query-title",{"type":"search" if key=="search" else "archive","showPrefix":False}) if key not in ("home","index") else text("h1","Brokerage Insights")
    write("templates/"+key+".html",frame(main(text("p","META GREY LABEL / INSIGHTS","mgl-article-eyebrow")+title+b("search",{"label":"Search articles","showLabel":False,"placeholder":"Search insights","buttonText":"Search"})+qloop())))
write("templates/404.html",frame(main(text("p","404 / PAGE NOT FOUND","mgl-article-eyebrow")+text("h1","This page has moved or is unavailable.")+text("p","Explore our brokerage technology, or search for the information you need.")+b("search",{"label":"Search","buttonText":"Search"})+b("pin/source-element",{"tagName":"a","sourceAttrs":{"href":"/__pin_route__/"},"content":"Return to homepage"}))))
# Existing article pages stay at their existing URLs; new posts appear alongside them.
content=b("post-content",{"layout":{"type":"default"}})
write("templates/page-insights.html",frame(content+layout("section","mgl-editorial mgl-insights-live",text("p","LATEST FROM OUR TEAM","mgl-article-eyebrow")+text("h2","Latest articles")+qloop(False,"mgl/latest"))))
# Keep older custom template and part slugs valid.
write("templates/mgl-theme-2.html",read("templates/page.html"))
write("parts/theme-2-header.html",read("parts/header.html"))
write("parts/theme-2-footer.html",read("parts/footer.html"))
theme=json.loads(read("theme.json"))
theme["templateParts"] += [{"name":"sidebar","title":"Article sidebar","area":"uncategorized"},{"name":"theme-2-header","title":"Legacy header","area":"header"},{"name":"theme-2-footer","title":"Legacy footer","area":"footer"}]
theme.setdefault("customTemplates",[]).append({"name":"mgl-theme-2","title":"Legacy Forexy page","postTypes":["page"]})
write("theme.json",json.dumps(theme,indent=2)+"\n")
write("style.css","/*\nTheme Name: Meta Grey Label\nTheme URI: https://github.com/omarreact/meta-gray-label\nAuthor: PINCODE IT\nDescription: Meta Grey Label Forexy dark block theme with local installation, editable FSE layouts and native blog templates.\nVersion: 0.0.1\nRequires at least: 6.6\nRequires PHP: 8.1\nText Domain: meta-grey-label-standalone\nTags: full-site-editing, block-styles, custom-colors, wide-blocks\n*/\n")
meta_by_route={x["path"]:{k:html.unescape(str(x.get("seo",{}).get(k,""))) for k in ("title","description")} for x in manifest["pages"]}
write("release-meta.json",json.dumps(meta_by_route,ensure_ascii=False,separators=(",",":")))
for page in pages:page["seo"]=meta_by_route.get(page["route"],{})
write("pin-local-pages.json",json.dumps(pages,ensure_ascii=False,separators=(",",":")))
# Give new posts/system pages the existing site's assets and dark mode, not a bare WP layout.
s=read("functions.php")
s=once(s,"$page = $config['pages'][ $route ] ?? array( 'css' => array(), 'js' => array() );","$page = $config['pages'][ $route ] ?? $config['pages']['/'] ?? array( 'css' => array(), 'js' => array() );")
s=s.replace("$source = $config['pages'][ $route ]['document']['body']['class'] ?? '';","$source = ( $config['pages'][ $route ] ?? $config['pages']['/'] ?? array() )['document']['body']['class'] ?? '';")
s=s.replace("$source = $config['pages'][ $route ]['document']['html'] ?? array();","$source = ( $config['pages'][ $route ] ?? $config['pages']['/'] ?? array() )['document']['html'] ?? array();")
s=s.replace("array( 'page', 'wp_template', 'wp_template_part' )","array( 'page', 'post', 'wp_template', 'wp_template_part', 'wp_block', 'wp_navigation' )")
s += "\nrequire_once __DIR__ . '/release.php';\nrequire_once __DIR__ . '/legacy-compat.php';\n"
write("functions.php",s)
s=read("local-setup.php")
s=once(s,"if($hook==='toplevel_page_pin-local-setup')wp_enqueue_script('pin-local-setup',get_theme_file_uri('/local-setup.js'),[],'1.0.1',true);","if($hook==='toplevel_page_pin-local-setup'){wp_enqueue_script('pin-local-setup',get_theme_file_uri('/local-setup.js'),[],'0.0.1',true);wp_enqueue_style('mgl-setup',get_theme_file_uri('/setup.css'),[],'0.0.1');}")
s=once(s,"if(!current_user_can('manage_options')||wp_doing_ajax()||!get_option(pin_local_option().'_redirect'))return;","if(!current_user_can('manage_options')||wp_doing_ajax()||is_network_admin()||($_SERVER['REQUEST_METHOD']??'')!=='GET'||!get_option(pin_local_option().'_redirect'))return;\n global $pagenow;if(!in_array($pagenow,['themes.php','index.php','admin.php'],true))return;")
s=once(s,"add_menu_page('Website setup','Website setup'","add_menu_page('Meta Grey Label setup','Meta Grey Label'")
i=s.index("function pin_local_screen(){");j=s.index("function pin_local_import_batch",i)
s=s[:i]+(here/"setup-screen.php").read_text().removeprefix("<?php\n")+s[j:]
s=once(s,"  update_post_meta($id,'_pin_structured_theme',$slug);update_post_meta($id,'_pin_structured_route',$route);","  update_post_meta($id,'_pin_structured_theme',$slug);update_post_meta($id,'_pin_structured_route',$route);\n  foreach(($p['seo']??[]) as $field=>$value)if(in_array($field,['title','description'],true)&&!get_post_meta($id,'_pin_import_seo_'.$field,true))update_post_meta($id,'_pin_import_seo_'.$field,sanitize_text_field($value));")
# Don't rewrite custom permalink structure on an established site.
s=once(s,"global $wp_rewrite;$wp_rewrite->set_permalink_structure('/%postname%/');flush_rewrite_rules(false);","global $wp_rewrite;if(!get_option('permalink_structure'))$wp_rewrite->set_permalink_structure('/%postname%/');flush_rewrite_rules(false);")
# Legacy migration requires admin with unfiltered_html and permission to publish, especially on multisite.
s=once(s,"if(!current_user_can('manage_options'))wp_die('Forbidden'","if(!current_user_can('manage_options')||!current_user_can('publish_pages')||!current_user_can('unfiltered_html'))wp_die('Forbidden'")
write("local-setup.php",s)
s=read("local-setup.js")
s=once(s,"progress.textContent='Imported / matched '+cursor+' of '+total+' pages';","progress.textContent='Imported / matched '+cursor+' of '+total+' pages';const bar=document.getElementById('mgl-setup-progress');if(bar){bar.max=total;bar.value=cursor;}")
write("local-setup.js",s)
for f in ("release.php","release.css","release-enquiry.js","setup.css","legacy-compat.php","legacy-editor.js"):
    shutil.copyfile(here/f,root/f)
# Exact pixel preservation: lossless PNG recompression; retain all source filenames
# for saved content, dynamic runtime dependencies and legacy URL compatibility.
saved=0;optimized=0
for f in (root/"source").rglob("*.png"):
    try:
        with Image.open(f) as im:
            if getattr(im,"n_frames",1)!=1:continue
            tmp=f.with_suffix(".opt.png")
            im.save(tmp,format="PNG",optimize=True,compress_level=9,**{k:im.info[k] for k in ("icc_profile","transparency","dpi") if k in im.info})
            with Image.open(tmp) as check:
                if im.convert("RGBA").tobytes()!=check.convert("RGBA").tobytes():
                    tmp.unlink();continue
            if tmp.stat().st_size<f.stat().st_size:
                saved+=f.stat().st_size-tmp.stat().st_size;optimized+=1;tmp.replace(f)
            else:tmp.unlink()
    except (OSError,ValueError):
        if f.with_suffix(".opt.png").exists():f.with_suffix(".opt.png").unlink()
# Preserve upstream license notices verbatim. Do not invent a license for third-party assets.
for f in (a.source/"assets/fonts").glob("*OFL.txt"):shutil.copyfile(f,root/"source/assets/fonts"/f.name)
write("README.txt","Meta Grey Label 0.0.1\nPINCODE IT\nWordPress 6.6+ / PHP 8.1+\n\nInstall as a theme ZIP, activate, then Meta Grey Label > Import & Launch Website. Existing managed content is preserved by default. Export a full database and files backup before updating. Legacy migration is explicit and may replace managed page content; keep the prior ZIP and backup. Edit pages with Gutenberg and header/footer/templates in Appearance > Editor. Publish new posts using Posts > Add New; Insights lists them alongside imported article pages. Enquiry delivery is disabled until configured and tested. Existing customized templates may need a reviewed migration. WordPress mail acceptance is not proof of delivery.\n\nThe imported Forexy artwork, fonts and scripts remain subject to their respective licenses; verify redistribution rights before public distribution. See THIRD-PARTY-NOTICES.txt.\n")
write("THIRD-PARTY-NOTICES.txt","Source website: https://github.com/omarreact/meta-gray-label\nFSE generator: https://github.com/omarreact/WpBlockThemeFSE\nInter and Plus Jakarta Sans: bundled OFL notices in source/assets/fonts/.\nForexy / vendor images, icons, scripts and fonts: source assets retained; this build does not grant redistribution rights. Confirm the original template and asset licenses before distribution.\n")
if a.screenshot:
    with Image.open(a.screenshot) as im:
        im.convert("RGB").resize((1200,900),Image.Resampling.LANCZOS).save(root/"screenshot.png",optimize=True)
report=json.loads(read("build-report.json"));report.update({"release_version":"0.0.1","png_lossless_optimized":optimized,"png_bytes_saved":saved,"templates":sorted(f.stem for f in (root/"templates").glob("*.html"))})
write("build-report.json",json.dumps(report,indent=2))
if a.zip:
    assert (root/"screenshot.png").is_file()
    a.zip.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(a.zip,"w",zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for f in sorted(root.rglob("*")):
            if f.is_file():z.write(f,root.name+"/"+f.relative_to(root).as_posix())
    with zipfile.ZipFile(a.zip) as z:assert z.testzip() is None
print(json.dumps(report,indent=2))
