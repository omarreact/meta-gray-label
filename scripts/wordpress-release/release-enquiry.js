(()=>{'use strict';
 const out=document.getElementById('mgl-enquiry-output'), summary=document.getElementById('mgl-enquiry-summary'), actions=out?.querySelector('.mgl-contact-output__actions');
 if(!actions||!summary||!window.MGLEnquiry||!MGLEnquiry.enabled)return;
 const form=document.createElement('form');form.className='mgl-send-enquiry';
 const label=document.createElement('label'),consent=document.createElement('input');consent.type='checkbox';consent.required=true;label.append(consent,document.createTextNode(' I agree to send my reviewed project brief to Meta Grey Label.'));
 const honeypot=document.createElement('input');honeypot.type='text';honeypot.name='website';honeypot.tabIndex=-1;honeypot.autocomplete='off';honeypot.setAttribute('aria-hidden','true');honeypot.hidden=true;
 const button=document.createElement('button');button.type='submit';button.className='mgl-home-btn mgl-home-btn--primary';button.textContent='Send enquiry';
 const status=document.createElement('p');status.setAttribute('role','status');form.append(label,honeypot,button,status);actions.after(form);
 const unavailable=document.getElementById('mgl-share-enquiry');if(unavailable)unavailable.hidden=true;
 form.addEventListener('submit',async event=>{event.preventDefault();if(!consent.checked||!summary.textContent.trim())return;button.disabled=true;status.textContent='Sending…';try{
 const body=new URLSearchParams({action:'mgl_send_enquiry',nonce:MGLEnquiry.nonce,summary:summary.textContent,consent:'1',website:honeypot.value});
 const r=await fetch(MGLEnquiry.url,{method:'POST',body,credentials:'same-origin',cache:'no-store'});const j=await r.json();status.textContent=j.data?.message||'Unable to send enquiry.';if(j.success)consent.checked=false;
 }catch(e){status.textContent='The enquiry could not be sent. Your brief is still available to copy.';}finally{button.disabled=false;}});
})();