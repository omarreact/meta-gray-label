/* Progressive enhancement: unfiltered directories remain usable without JavaScript. */
(() => {
 'use strict';
 const root=document.querySelector('.mgl-design--directory');
 if(!root)return;
 const nav=root.querySelector('.mgl-directory-filter');
 if(!nav)return;
 const links=[...nav.querySelectorAll('a')],groups=[...root.querySelectorAll('.mgl-directory-group')];
 const status=document.createElement('p');status.className='mgl-directory-status';status.setAttribute('role','status');nav.append(status);
 function select(id,announce){
  if(id!=='directory-all'&&!groups.some(x=>x.id===id))return false;
  for(const item of groups)item.hidden=id!=='directory-all'&&item.id!==id;
  for(const item of links)item.setAttribute('aria-pressed',String(item.hash==='#'+id));
  if(announce)status.textContent=id==='directory-all'?'Showing all '+groups.length+' groups.':'Showing '+links.find(x=>x.hash==='#'+id).textContent+'.';
  return true;
 }
 for(const item of links){
  item.setAttribute('role','button');
  item.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();select(item.hash.slice(1),true);history.replaceState(null,'',item.hash);});
  item.addEventListener('keydown',event=>{if(event.key===' '){event.preventDefault();item.click();}});
 }
 select(location.hash.slice(1)||'directory-all',false);
 addEventListener('hashchange',()=>select(location.hash.slice(1)||'directory-all',true));
})();
