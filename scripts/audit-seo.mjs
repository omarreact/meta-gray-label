#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRouteIndex, injectSharedParts, renderSimple404, renderStructuredPage,
  rewriteRuntimeSeo, specialAssetPath
} from "../src/renderer.js";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const mode=process.argv[2];
if(!["--check","--report"].includes(mode)||process.argv.length!==3){
  console.error("Usage: node scripts/audit-seo.mjs --check | --report"); process.exit(2);
}
const data=JSON.parse(readFileSync(resolve(root,"data/content.json"),"utf8"));
const header=readFileSync(resolve(root,"header.html"),"utf8");
const footer=readFileSync(resolve(root,"footer.html"),"utf8");
const routes=buildRouteIndex(data);
const base="https://dynamic.example";
const problems=[];
const pages=Object.entries(data.pages).filter(([,v])=>v.role==="page");

function attr(tag,key){
  const m=tag.match(new RegExp("\\b"+key+"\\s*=\\s*([\"'])(.*?)\\1","i"));
  return m?.[2]||"";
}
function tags(html,name){return [...html.matchAll(new RegExp("<"+name+"\\b[^>]*>","gi"))].map(m=>m[0]);}
function problem(path,msg){problems.push(path+": "+msg);}

for(const [path,record] of pages){
  let html="";
  if(path==="404.html"){
    html=renderSimple404({header,footer,canonicalBase:base});
  } else {
    const special=specialAssetPath(record.route);
    if(special){
      html=readFileSync(resolve(root,special.replace(/^\//,"")),"utf8");
      html=injectSharedParts(html,header,footer);
      html=rewriteRuntimeSeo(html,base+record.route);
    } else {
      const entry=routes.get(record.route);
      if(!entry){problem(path,"route missing from dynamic index");continue;}
      html=renderStructuredPage({route:record.route,entry,routeIndex:routes,header,footer,canonicalBase:base});
    }
  }
  const titles=[...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  if(titles.length!==1||!titles[0][1].trim()) problem(path,"requires one title");
  const h1=(html.match(/<h1(?:\s|>)/gi)||[]).length;
  if(h1!==1) problem(path,"expected one H1; found "+h1);
  const meta=tags(html,"meta");
  const is404=path==="404.html";
  if(!is404){
    const desc=meta.filter(t=>attr(t,"name").toLowerCase()==="description");
    if(desc.length!==1||!attr(desc[0],"content")) problem(path,"requires one description");
    const canonical=tags(html,"link").filter(t=>attr(t,"rel").split(/\s+/).includes("canonical"));
    const expected=base+record.route;
    if(canonical.length!==1||attr(canonical[0],"href")!==expected) problem(path,"canonical mismatch");
    const robots=meta.filter(t=>attr(t,"name").toLowerCase()==="robots");
    if(robots.length!==1||!/index/i.test(attr(robots[0],"content"))) problem(path,"requires index robots metadata");
    const twitter=meta.filter(t=>attr(t,"name").toLowerCase()==="twitter:card");
    if(twitter.length!==1||!attr(twitter[0],"content")) problem(path,"requires Twitter card metadata");
    if(!/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html)) problem(path,"requires JSON-LD structured data");
  } else if(!meta.some(t=>attr(t,"name").toLowerCase()==="robots"&&/noindex/i.test(attr(t,"content")))){
    problem(path,"404 must be noindex");
  }
}
if(pages.length!==52) problem("inventory","expected 52 page records");
console.log("DYNAMIC SEO AUDIT: "+pages.length+" pages; "+problems.length+" technical errors.");
if(mode==="--report") for(const p of problems) console.log(" - "+p);
else for(const p of problems) console.error("ERROR "+p);
if(problems.length) process.exit(1);
