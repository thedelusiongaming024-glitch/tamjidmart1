const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let S,C=[],B=[],P=[],cat='all',term='',sort='new',slide=0,tm;
const thumb=u=>/^\/uploads\/.+\.webp$/.test(u||'')?u.replace(/\.webp$/,'-t.webp'):u,dl=o=>(window.dataLayer=window.dataLayer||[]).push(o);
const cname=id=>C.find(c=>c.id===id)?.name||'';
const hue=s=>[...String(s)].reduce((a,c)=>a+c.charCodeAt(0),0)%360;
const wa=p=>`https://wa.me/${S.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent((S.waMessage||'Hello! I am interested in {product}.').replace('{product}',p?p.name:'your products'))}`;
const tel=()=>'tel:'+S.phone.replace(/[^\d+]/g,'');
const pic=(src,name)=>src?`<img loading="lazy" src="${esc(src)}" alt="${esc(name)}">`:`<div class="ph" style="background:linear-gradient(145deg,hsl(${hue(name)} 30% 62%),hsl(${hue(name)+40} 35% 78%))">${esc(name[0]||'T')}</div>`;
const track=(id,type)=>fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,type})}).catch(()=>{});
const cbtn=p=>`<a class="btn sm" href="${wa(p)}" target="_blank" rel="noopener" data-c="${p.id}">Contact us</a>`;
const card=p=>`<article class="card glass"><a class="img" href="/p/${p.slug}" data-o="${p.id}">${pic(thumb(p.images[0]),p.name)}${p.badge?`<span class="badge">${esc(p.badge)}</span>`:''}</a><div class="cbody"><span class="tag">${esc(cname(p.category))}</span><h3><a href="/p/${p.slug}" data-o="${p.id}">${esc(p.name)}</a></h3><p>${esc(p.description)}</p><div class="acts">${cbtn(p)}<a class="btn sm ghost" href="${tel()}" data-c="${p.id}">Call</a></div></div></article>`;
function list(){let l=P.filter(p=>(cat==='all'||p.category===cat)&&(p.name+p.description+cname(p.category)).toLowerCase().includes(term));
 l=[...l].sort(sort==='az'?(a,b)=>a.name.localeCompare(b.name):(a,b)=>b.createdAt-a.createdAt);
 $('#all').innerHTML=l.length?l.map(card).join(''):'<p class="empty">No products match. Try another search or collection.</p>'}
function chips(){$('#chips').innerHTML=[{id:'all',name:'All'},...C].map(c=>`<button class="chip ${cat===c.id?'on':''}" data-cat="${c.id}">${esc(c.name)}</button>`).join('')}
function hero(){const b=B.length?B:[{title:S.siteName,subtitle:S.tagline,btnText:'Explore',btnLink:'#products'}];
 $('#hero').innerHTML=b.map((x,i)=>`<div class="slide ${i?'':'on'}" style="${x.image?`background-image:url('${esc(x.image)}')`:''}"><div class="hc glass"><h1>${esc(x.title)}</h1><p>${esc(x.subtitle)}</p><a class="btn" href="${esc(x.btnLink||'#products')}">${esc(x.btnText||'Explore')}</a></div></div>`).join('')+(b.length>1?`<div class="ctl"><div class="dots">${b.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div><button data-s="-1" aria-label="Previous">&#8249;</button><button data-s="1" aria-label="Next">&#8250;</button></div>`:'');
 clearInterval(tm);if(b.length>1&&!matchMedia('(prefers-reduced-motion:reduce)').matches)tm=setInterval(()=>go(1),6500)}
function go(d){const s=document.querySelectorAll('.slide'),dt=document.querySelectorAll('.dots i');if(!s.length)return;s[slide].classList.remove('on');dt[slide]?.classList.remove('on');slide=(slide+d+s.length)%s.length;s[slide].classList.add('on');dt[slide]?.classList.add('on')}
function openP(id){const p=P.find(x=>x.id===id);if(!p)return;track(id,'view');dl({event:'view_item',item_id:id,item_name:p.name});const im=p.images.length?p.images:[''];
 $('#md').innerHTML=`<button class="x" aria-label="Close" data-x>&times;</button><div><div class="main" id="mm">${pic(im[0],p.name)}</div>${im.length>1?`<div class="th">${im.map((s,i)=>`<img src="${esc(s)}" alt="" data-t="${i}" class="${i?'':'on'}">`).join('')}</div>`:''}</div><div><span class="tag">${esc(cname(p.category))}</span><h2>${esc(p.name)}</h2><p style="color:var(--mut);white-space:pre-line">${esc(p.description)}</p>${p.highlights?`<ul>${p.highlights.split('\n').filter(Boolean).map(h=>`<li>${esc(h)}</li>`).join('')}</ul>`:''}<div class="acts"><a class="btn" href="${wa(p)}" target="_blank" rel="noopener" data-c="${p.id}">Contact us on WhatsApp</a><a class="btn ghost" href="${tel()}" data-c="${p.id}">Call us</a><a class="btn ghost" href="#enquiry" data-q="${p.id}">Send enquiry</a></div></div>`;
 $('#md').dataset.imgs=JSON.stringify(im);$('#mo').classList.add('on')}
async function init(){({settings:S,categories:C,banners:B,products:P}=await(await fetch('/api/public')).json());
 document.title=`${S.siteName} | ${S.tagline}`;$('#logo').innerHTML=(S.logo?`<img src="${esc(S.logo)}" alt="">`:'')+esc(S.siteName);
 $('#hcall').href=wa();$('#cwa').href=wa();$('#ccall').href=tel();$('#fab').href=wa();$('#ctap').textContent=`Message us on WhatsApp or call ${S.phone}. ${S.hours}.`;
 const soc=[['Facebook',S.facebook],['Instagram',S.instagram],['YouTube',S.youtube]].filter(x=>x[1]);
 $('#foot').innerHTML=`<div><div class="logo">${esc(S.siteName)}</div><p>${esc(S.aboutText)}</p></div><div><h4>Contact</h4><a href="${tel()}">${esc(S.phone)}</a><a href="mailto:${esc(S.email)}">${esc(S.email)}</a><p>${esc(S.address)}</p><p>${esc(S.hours)}</p></div><div><h4>Follow us</h4>${soc.map(s=>`<a href="${esc(s[1])}" target="_blank" rel="noopener">${s[0]}</a>`).join('')||'<p>Coming soon</p>'}</div>`;
 $('#copy').textContent=`\u00a9 ${new Date().getFullYear()} ${S.siteName}. All rights reserved.`;
 hero();chips();
 $('#cats').innerHTML=C.slice(0,4).map(c=>{const n=P.filter(p=>p.category===c.id).length,im=c.image||P.find(p=>p.category===c.id&&p.images[0])?.images[0];return `<button class="cat" data-cat="${c.id}" style="${im?`background-image:url('${esc(im)}')`:`background-image:linear-gradient(145deg,hsl(${hue(c.name)} 30% 68%),hsl(${hue(c.name)+40} 35% 84%))`}"><div class="in glass"><h3>${esc(c.name)}</h3><span>${n} product${n==1?'':'s'}</span></div></button>`}).join('');
 $('#newg').innerHTML=[...P].sort((a,b)=>b.createdAt-a.createdAt).slice(0,6).map(card).join('');
 const f=P.filter(p=>p.featured).slice(0,5);$('#rec').style.display=f.length?'':'none';
 $('#mos').innerHTML=f.map(p=>`<div class="tile" data-o="${p.id}"><div class="img">${pic(p.images[0],p.name)}</div><div class="in glass"><h3>${esc(p.name)}</h3>${cbtn(p)}</div></div>`).join('');
 list();enqInit()}
document.addEventListener('click',e=>{if(e.target.id==='mo')return $('#mo').classList.remove('on');const t=e.target.closest('[data-c],[data-cat],[data-o],[data-s],[data-x],[data-t],[data-q]');if(!t)return;
 if(t.dataset.q){$('#mo').classList.remove('on');$('#eq-p').value=t.dataset.q;return}
 if(t.dataset.c){track(t.dataset.c,'contact');dl({event:'contact_click',method:t.href.startsWith('tel:')?'call':'whatsapp',item_id:t.dataset.c});return}
 if(t.dataset.cat){cat=t.dataset.cat;dl({event:'select_collection',collection:cname(cat)||'All'});chips();list();$('#products').scrollIntoView();return}
 if(t.dataset.o){if(t.matches('a')&&(e.metaKey||e.ctrlKey))return;e.preventDefault();return openP(t.dataset.o)}
 if(t.dataset.s){go(+t.dataset.s);return}
 if(t.dataset.x!==undefined)return $('#mo').classList.remove('on');
 if(t.dataset.t){const im=JSON.parse($('#md').dataset.imgs);$('#mm').innerHTML=pic(im[t.dataset.t],'');document.querySelectorAll('.th img').forEach((x,i)=>x.classList.toggle('on',i==t.dataset.t))}});
document.addEventListener('keydown',e=>e.key==='Escape'&&$('#mo').classList.remove('on'));
$('#q').oninput=e=>{term=e.target.value.toLowerCase();list();if(term)$('#products').scrollIntoView()};$('#sort').onchange=e=>{sort=e.target.value;list()};
function enqInit(){const f=$('#enq'),m=$('#enqm');$('#eq-p').innerHTML='<option value="">General enquiry</option>'+P.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
 const pre=new URLSearchParams(location.search).get('enquire');if(pre)$('#eq-p').value=pre;
 f.onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(f));m.textContent='Sending...';
  try{const r=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}),j=await r.json();if(!r.ok)throw new Error(j.error);f.reset();m.textContent='Thank you! We received your enquiry and will contact you soon.';dl({event:'enquiry_submit',item_id:b.product||''})}catch(x){m.textContent=x.message||'Could not send. Please try WhatsApp instead.'}}}
init();
