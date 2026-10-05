import {useEffect,useState} from 'react';
import {api,thumb,setAuthToken} from './lib';

async function upload(f){ // resize in the browser: 1600px main + 480px thumbnail, both WebP
 const bm=await createImageBitmap(f),enc=w=>{const k=Math.min(1,w/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bm.width*k));c.height=Math.max(1,Math.round(bm.height*k));c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return c.toDataURL('image/webp',.82)};
 return (await api('/admin/upload','POST',{data:enc(1600),thumb:enc(480)})).url;
}
const SCH={
 products:[['name','Product Name (e.g. Wireless Earbuds, Smart Watch, Cotton Shirt)','text'],['category','Category','cat'],['price','Price / Tag (৳ or $) (optional)','text'],['badge','Badge (e.g. New, Hot Deal, Best Seller, Limited)','text'],['description','Product Description','area',1],['highlights','Key Highlights / Specs (one per line)','area',1],['images','Product Images','imgs',1],['colorway','Color / Variant (optional)','text'],['sku','SKU / Model Code (optional)','text'],['seoTitle','SEO title (optional, up to 60 characters)','text'],['seoDescription','SEO description (optional, up to 160 characters)','text',1],['featured','Show in Featured / Recommended Picks','chk'],['active','Visible on Storefront','chk']],
 categories:[['name','Category Name (e.g. Electronics, Fashion, Gadgets, Home)','text'],['description','Short description','text',1],['image','Cover image (optional)','img',1]],
 banners:[['title','Banner Headline','text',1],['subtitle','Banner Subtitle','text',1],['btnText','Button Text (e.g. Explore Now, WhatsApp Us)','text'],['btnLink','Button Link (e.g. #products, #contact)','text'],['image','Banner Image (optional)','img',1],['active','Active in Hero Auto-Slider','chk']]};
const ST=[['siteName','Store Name','text'],['tagline','Store Tagline','text'],['whatsapp','WhatsApp Number with country code (digits only, e.g. 88017XXXXXXXX)','text'],['phone','Phone Number for calls','text'],['email','Customer Support Email','text'],['address','Store / Office Address','text'],['hours','Operating Hours','text'],['facebook','Facebook Page Link','text'],['instagram','Instagram Page Link','text'],['youtube','YouTube Channel Link','text'],['logo','Store Logo (optional)','img',1],['aboutText','About Text in Footer','area',1],['waMessage','WhatsApp Pre-filled Message. Use {product} for product name.','area',1]];
const SEOF=[['siteUrl','Store Website Address (e.g. https://tamjidmart.com)','text',1],['seoTitle','Homepage SEO Title (up to 60 characters)','text'],['keywords','Keywords (comma separated)','text'],['seoDescription','Homepage SEO Description (up to 160 characters)','area',1],['ogImage','Social Sharing Preview Image','img',1],['gtmId','Google Tag Manager ID (optional)','text'],['gaId','Google Analytics ID (optional)','text']];
const LBL={products:'Product',categories:'Category',banners:'Hero Banner'},TTL={products:'Products',categories:'Categories',banners:'Hero Banners'};

const Top=({title,children})=><div className="flex justify-between items-center flex-wrap gap-2.5 mb-4"><h2 className="text-4xl">{title}</h2><div className="flex gap-2 flex-wrap">{children}</div></div>;
const Th=({src})=>src?<img src={thumb(src)} alt="" className="w-11 h-11 rounded-xl object-cover"/>:<span className="block w-11 h-11 rounded-xl bg-[#dfe8e3]"/>;
const Err=({children})=><p className="text-red-600 text-[13px] min-h-5 my-2">{children}</p>;

function ImgField({value,multi,set,toast}){
 const [inputUrl,setInputUrl]=useState('');
 const a=multi?(Array.isArray(value)?value:(value?[value]:[])):(value?[value]:[]);
 const out=n=>set(multi?n:(n[0]||''));

 const addUrl=()=>{
  const trimmed=inputUrl.trim();
  if(!trimmed) return;
  // Handle multiple links separated by comma, space, or newline
  const urls=trimmed.split(/[\n,\s]+/).map(u=>u.trim()).filter(Boolean);
  if(!urls.length) return;
  const n=multi?[...a,...urls]:[urls[0]];
  out(n);
  setInputUrl('');
  toast && toast(multi?`Added ${urls.length} image link${urls.length>1?'s':''}`:'Image link updated');
 };

 const handleKeyDown=e=>{
  if(e.key==='Enter'){
   e.preventDefault();
   addUrl();
  }
 };

 const addFiles=async e=>{
  const fs=[...e.target.files];
  e.target.value='';
  if(!fs.length) return;
  try{
   const n=[...a];
   for(const f of fs) n.push(await upload(f));
   out(n);
   toast && toast('Image uploaded');
  }catch(x){
   toast && toast(x.message||'Upload failed. Try entering image URL instead.');
  }
 };

 return (
  <div className="mt-2 space-y-3">
   {/* Image URL Input Bar */}
   <div className="flex gap-2">
    <input
      type="url"
      className="input !py-2 !text-xs sm:!text-sm flex-1 font-normal"
      placeholder="Paste any image link (e.g. https://images.unsplash.com/...)"
      value={inputUrl}
      onChange={e=>setInputUrl(e.target.value)}
      onKeyDown={handleKeyDown}
    />
    <button
      type="button"
      className="btn !py-2 !px-4 text-xs font-semibold whitespace-nowrap"
      onClick={addUrl}
    >
      + Add Link
    </button>
    <label className="btn btn-ghost !py-2 !px-3 text-xs font-medium cursor-pointer border border-black/10 hover:bg-black/5" title="Or upload local file">
      📁 Upload
      <input type="file" accept="image/*" hidden multiple={multi} onChange={addFiles}/>
    </label>
   </div>

   {/* Auto-resizing Image Previews */}
   {a.length > 0 && (
    <div className="flex flex-wrap gap-2.5 p-2.5 bg-[#f5efe6] rounded-2xl border border-[#ded5c6]">
     {a.map((u,i)=>(
      <div key={`${u}-${i}`} className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white border border-black/10 overflow-hidden flex items-center justify-center shadow-2xs p-1">
       <img
        src={thumb(u)}
        alt=""
        className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-105"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={e=>{e.target.onerror=null; e.target.src='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';}}
       />
       <button
        type="button"
        aria-label="Remove Image"
        onClick={()=>out(a.filter((_,j)=>j!==i))}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center opacity-90 hover:opacity-100 hover:scale-110 shadow-sm transition-all"
       >
        &times;
       </button>
      </div>
     ))}
    </div>
   )}
  </div>
 );
}
function Fields({sch,v,set,cats=[],toast}){
 return <div className="grid sm:grid-cols-2 gap-x-5">{sch.map(([k,l,t,w])=>{const c=w?'sm:col-span-2':'',val=v[k]??'',on=e=>set(k,e.target.value);
  if(t==='chk')return <label key={k} className={`flex items-center gap-2 mb-3.5 text-[13px] font-semibold ${c}`}><input type="checkbox" checked={!!v[k]} onChange={e=>set(k,e.target.checked)}/>{l}</label>;
  if(t==='img'||t==='imgs')return <div key={k} className={`mb-3.5 ${c}`}><span className="text-[13px] font-semibold">{l}</span><ImgField value={v[k]} multi={t==='imgs'} set={x=>set(k,x)} toast={toast}/></div>;
  return <label key={k} className={`block mb-3.5 text-[13px] font-semibold ${c}`}>{l}
   {t==='area'?<textarea className="input mt-1.5 min-h-[90px] font-normal" value={val} onChange={on}/>
   :t==='cat'?<select className="input mt-1.5 font-normal" value={val} onChange={on}><option value="">None</option>{cats.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
   :<input className="input mt-1.5 font-normal" value={val} onChange={on}/>}</label>})}</div>;
}
const Modal=({title,children,onClose})=>(
 <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col my-auto border border-black/10 animate-fade-in overflow-hidden">
   <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 shrink-0 bg-[#faf8f5]">
    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1c1917]">{title}</h2>
    <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-xl text-[#78716c] hover:text-[#1c1917] transition-colors" aria-label="Close">&times;</button>
   </div>
   <div className="p-6 overflow-y-auto flex-1 overscroll-contain">
    {children}
   </div>
  </div>
 </div>
);

function FormModal({col,item,D,onClose,done,toast}){
 const [v,setV]=useState(item||{active:true,featured:false,images:[],image:'',category:''}),[e,setE]=useState(''),[busy,setBusy]=useState(false),set=(k,x)=>setV(o=>({...o,[k]:x}));
 const save=async()=>{if(!(v.name||v.title))return setE('Please enter a name.');setBusy(true);try{await api(item?`/admin/${col}/${item.id}`:`/admin/${col}`,item?'PUT':'POST',v);toast('Saved');done()}catch(x){setE(x.message);setBusy(false)}};
 return <Modal title={`${item?'Edit':'Add'} ${LBL[col]}`} onClose={onClose}>
  <Fields sch={SCH[col]} v={v} set={set} cats={D.categories} toast={toast}/><Err>{e}</Err>
  <div className="flex gap-2.5 justify-end pt-4 border-t border-black/5 mt-4 sticky bottom-0 bg-white/95 backdrop-blur-xs py-2">
   <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
   <button type="button" className="btn" disabled={busy} onClick={save}>{busy?'Saving...':'Save changes'}</button>
  </div>
 </Modal>;
}
function List({col,D,reload,toast}){
 const [q,setQ]=useState(''),[f,setF]=useState(null),cn=id=>D.categories.find(c=>c.id===id)?.name||'None',pr=col==='products',
 items=D[col].filter(i=>(i.name||i.title).toLowerCase().includes(q.toLowerCase()));
 const del=async i=>{if(confirm('Delete this permanently?')){await api(`/admin/${col}/${i.id}`,'DELETE');toast('Deleted');reload()}};
 return <><Top title={TTL[col]}><input className="input !w-48" placeholder="Search" aria-label="Search" value={q} onChange={e=>setQ(e.target.value)}/><button className="btn" onClick={()=>setF({})}>Add new</button></Top>
  <div className="panel"><table className="tbl"><thead><tr><th></th><th>Name</th>{pr&&<><th>Views</th><th>Contacts</th></>}<th>Status</th><th></th></tr></thead><tbody>
   {items.map(i=><tr key={i.id}><td><Th src={pr?i.images[0]:i.image}/></td><td><b>{i.name||i.title}</b><br/><small className="text-mut">{pr?cn(i.category)+(i.featured?' · Recommended':''):col==='categories'?D.products.filter(p=>p.category===i.id).length+' products':i.subtitle}</small></td>
    {pr&&<><td>{i.views}</td><td>{i.contacts}</td></>}<td>{'active' in i&&<span className={i.active?'pill':'pill off'}>{i.active?'Visible':'Hidden'}</span>}</td>
    <td className="text-right whitespace-nowrap"><button className="btn btn-ghost btn-sm" onClick={()=>setF(i)}>Edit</button> <button className="btn btn-ghost btn-sm !text-red-600" onClick={()=>del(i)}>Delete</button></td></tr>)}
   {!items.length&&<tr><td colSpan={6} className="text-mut p-8">Nothing here yet. Click Add new to create your first one.</td></tr>}</tbody></table></div>
  {f&&<FormModal key={f.id||'new'} col={col} item={f.id?f:null} D={D} onClose={()=>setF(null)} done={()=>{setF(null);reload()}} toast={toast}/>}</>;
}
function Dashboard({D}){
 const P=D.products,sum=k=>P.reduce((a,p)=>a+p[k],0),top=k=>[...P].sort((a,b)=>b[k]-a[k]).filter(p=>p[k]).slice(0,5);
 return <><Top title="Dashboard"/><div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5 mb-5">
  {[['Products',P.length],['Visible',P.filter(p=>p.active).length],['Collections',D.categories.length],['Product views',sum('views')],['Contact clicks',sum('contacts')],['New enquiries',D.enquiries.filter(e=>e.status==='new').length]].map(([l,n])=><div key={l} className="glass rounded-2xl p-4"><b className="font-serif text-4xl font-normal block">{n}</b><span className="text-[13px] text-mut">{l}</span></div>)}</div>
  <div className="grid md:grid-cols-2 gap-5">{[['views','Most viewed'],['contacts','Most contacted']].map(([k,t])=><div key={k} className="panel"><h3 className="text-2xl mb-2">{t}</h3>{top(k).map(p=><div key={p.id} className="flex justify-between py-1.5 border-t border-black/5"><span>{p.name}</span><b>{p[k]}</b></div>)}{!top(k).length&&<p className="text-mut">No data yet</p>}</div>)}</div></>;
}
const wnum=p=>{p=p.replace(/\D/g,'');return p.startsWith('0')?'880'+p.slice(1):p};
function Enquiries({D,reload,toast}){
 const st=async(e,s)=>{try{await api('/admin/enquiries/'+e.id,'PUT',{status:s});reload()}catch(x){toast(x.message)}},del=async e=>{if(confirm('Delete this enquiry?')){await api('/admin/enquiries/'+e.id,'DELETE');toast('Deleted');reload()}};
 return <><Top title="Enquiries"/>{D.enquiries.map(e=><div key={e.id} className={`panel ${e.status==='new'?'!border-l-4 !border-l-acc':''}`}>
  <div className="flex justify-between flex-wrap gap-2.5 mb-2"><div><b>{e.name}</b> <span className={e.status==='new'?'pill':'pill off'}>{e.status==='new'?'New':e.status==='replied'?'Replied':'Read'}</span><br/><small className="text-mut">{new Date(e.createdAt).toLocaleString()} · {e.phone}{e.productName&&` · ${e.productName}`}</small></div>
   <div className="flex gap-1.5 flex-wrap items-start"><a className="btn btn-sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wnum(e.phone)}`} onClick={()=>st(e,'replied')}>WhatsApp reply</a><a className="btn btn-ghost btn-sm" href={`tel:${e.phone}`} onClick={()=>st(e,'replied')}>Call</a>{e.status==='new'&&<button className="btn btn-ghost btn-sm" onClick={()=>st(e,'read')}>Mark read</button>}<button className="btn btn-ghost btn-sm !text-red-600" onClick={()=>del(e)}>Delete</button></div></div>
  <p className="whitespace-pre-wrap">{e.message}</p></div>)}
  {!D.enquiries.length&&<div className="panel text-mut">No enquiries yet. Messages from your website form will appear here.</div>}</>;
}
function SettingsPage({title,sch,D,reload,toast,actions,children}){
 const [v,setV]=useState(D.settings||{}),[e,setE]=useState(''),[busy,setBusy]=useState(false),set=(k,x)=>setV(o=>({...o,[k]:x}));
 
 useEffect(()=>{
  if(D?.settings) setV(D.settings);
 },[D?.settings]);

 const save=async()=>{
  setBusy(true);
  try{
   const b={};
   sch.forEach(([k])=>b[k]=v[k]!==undefined?v[k]:'');
   await api('/admin/settings','PUT',b);
   toast('Settings saved to database');
   setE('');
   reload();
  }catch(x){
   setE(x.message||'Failed to save settings');
  }finally{
   setBusy(false);
  }
 };

 return <><Top title={title}>{actions}</Top><div className="panel">{children}<Fields sch={sch} v={v} set={set} toast={toast}/><Err>{e}</Err><button className="btn" disabled={busy} onClick={save}>{busy?'Saving...':`Save ${title.toLowerCase()}`}</button></div></>;
}
function Seo(P){
 const {D}=P,[f,setF]=useState(null),issues=p=>{const i=[];if(!p.images.length)i.push('No image');if((p.description||'').length<50)i.push('Short description');if((p.seoTitle||p.name).length>60)i.push('Title over 60');if(!p.seoDescription)i.push('No SEO description');else if(p.seoDescription.length>160)i.push('Description over 160');return i};
 return <><SettingsPage title="SEO" sch={SEOF} {...P} actions={<><a className="btn btn-ghost btn-sm" href="/sitemap.xml" target="_blank" rel="noopener noreferrer">View sitemap</a><a className="btn btn-ghost btn-sm" href="/robots.txt" target="_blank" rel="noopener noreferrer">View robots.txt</a></>}>
  <p className="text-mut mb-4">Each product has its own page with structured data and a dataLayer. The sitemap updates automatically. Submit <b>/sitemap.xml</b> in Google Search Console.</p></SettingsPage>
  <div className="panel"><h3 className="text-2xl mb-2">Product SEO check</h3><table className="tbl"><thead><tr><th>Product</th><th>Issues</th><th></th></tr></thead><tbody>{D.products.map(p=>{const i=issues(p);return <tr key={p.id}><td><b>{p.name}</b></td><td className="space-x-1">{i.map(x=><span key={x} className="pill off">{x}</span>)}{!i.length&&<span className="pill">Good</span>}</td><td className="text-right"><button className="btn btn-ghost btn-sm" onClick={()=>setF(p)}>Fix</button></td></tr>})}</tbody></table></div>
  {f&&<FormModal col="products" item={f} D={D} onClose={()=>setF(null)} done={()=>{setF(null);P.reload()}} toast={P.toast}/>}</>;
}
function Account({D,reload,toast}){
 const [v,setV]=useState({user:D.user,current:'',password:''}),[e,setE]=useState(''),[busy,setBusy]=useState(false),s=k=>x=>setV(o=>({...o,[k]:x.target.value}));
 useEffect(()=>{ if(D?.user) setV(o=>({...o,user:D.user})); },[D?.user]);
 const save=async()=>{setBusy(true);try{await api('/admin/password','POST',v);toast('Account updated');setE('');setV(o=>({...o,current:'',password:''}));reload()}catch(x){setE(x.message)}finally{setBusy(false)}};
 return <><Top title="Account"/><div className="panel max-w-md">{[['user','Username','text','username'],['current','Current password','password','current-password'],['password','New password, at least 8 characters','password','new-password']].map(([k,l,t,a])=><label key={k} className="block mb-3.5 text-[13px] font-semibold">{l}<input className="input mt-1.5 font-normal" type={t} autoComplete={a} value={v[k]} onChange={s(k)}/></label>)}<Err>{e}</Err><button className="btn" disabled={busy} onClick={save}>{busy?'Updating...':'Update account'}</button></div></>;
}
function Login({done}){
 const [u,setU]=useState('admin'),[p,setP]=useState(''),[e,setE]=useState(''),[loading,setLoading]=useState(false);
 const go=async ev=>{
  ev.preventDefault();
  setLoading(true);
  setE('');
  try{
   const res=await api('/login','POST',{user:u,password:p});
   if(res.token) setAuthToken(res.token);
   done();
  }catch(x){
   setE(x.message||'Wrong username or password.');
  }finally{
   setLoading(false);
  }
 };
 return <div className="min-h-screen grid place-items-center p-5"><form onSubmit={go} className="glass rounded-3xl p-8 w-full max-w-sm"><div className="mb-4 flex justify-center"><img src="/logo.png" alt="Tamjid Mart" className="h-12 w-auto object-contain"/></div><p className="text-mut mb-5 text-sm text-center">Sign in to manage your website.</p>
  <label className="block mb-3.5 text-[13px] font-semibold">Username<input className="input mt-1.5 font-normal" autoComplete="username" value={u} onChange={x=>setU(x.target.value)} required/></label>
  <label className="block mb-3.5 text-[13px] font-semibold">Password<input className="input mt-1.5 font-normal" type="password" autoComplete="current-password" value={p} onChange={x=>setP(x.target.value)} required/></label><Err>{e}</Err><button className="btn w-full mt-2" disabled={loading} type="submit">{loading?'Signing in...':'Sign in'}</button></form></div>;
}
const NAV=[['dashboard','Dashboard'],['products','Products'],['categories','Collections'],['banners','Hero banners'],['enquiries','Enquiries'],['seo','SEO'],['settings','Settings'],['account','Account']];
export default function Admin(){
 const [D,setD]=useState(null),[auth,setAuth]=useState(null),[tab,setTab]=useState('dashboard'),[msg,setMsg]=useState('');
 const toast=m=>{setMsg(m);setTimeout(()=>setMsg(''),2200)};
 const reload=()=>api('/admin/all').then(d=>{setD(d);setAuth(true)}).catch(e=>{if(e.status===401){setAuthToken('');setAuth(false)}else{toast(e.message)}});
 useEffect(()=>{
  document.title='Admin | Tamjid Mart';
  if(window.location.hash) window.history.replaceState(null,'','/admin');
  reload();
 },[]);
 if(auth===null)return <div className="min-h-screen grid place-items-center font-serif text-2xl text-[#5c412f]">Loading Admin...</div>;
 if(!auth)return <Login done={reload}/>;
 const P={D,reload,toast},nw=D.enquiries.filter(e=>e.status==='new').length,list=['products','categories','banners'].includes(tab);
 return <div className="grid md:grid-cols-[230px_1fr] gap-5 p-5 max-w-[1400px] mx-auto">
  <aside className="glass rounded-3xl p-5 flex md:flex-col flex-wrap gap-1.5 md:sticky md:top-5 md:h-[calc(100vh-40px)]"><div className="mb-4 w-full">{D.settings.logo?<img src={D.settings.logo} alt={D.settings.siteName} className="h-10 w-auto object-contain"/>:<div className="font-serif text-[28px] font-bold text-[#1c1917]">{D.settings.siteName}</div>}</div>
   {NAV.map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`text-left px-3.5 py-2.5 rounded-xl font-semibold transition-colors ${tab===k?'bg-[#5c412f] text-white shadow-xs':'text-[#78716c] hover:bg-white/60'}`}>{l}{k==='enquiries'&&nw>0&&` (${nw})`}</button>)}
   <a className="btn btn-ghost btn-sm md:mt-auto" href="/" target="_blank" rel="noopener noreferrer">View website</a><button className="btn btn-ghost btn-sm" onClick={()=>{setAuthToken('');api('/logout','POST').finally(()=>setAuth(false))}}>Sign out</button></aside>
  <main className="min-w-0">{list?<List key={tab} col={tab} {...P}/>:tab==='dashboard'?<Dashboard D={D}/>:tab==='enquiries'?<Enquiries {...P}/>:tab==='seo'?<Seo {...P}/>:tab==='settings'?<SettingsPage title="Settings" sch={ST} {...P}/>:<Account {...P}/>}</main>
  {msg&&<div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white px-5 py-3 rounded-2xl z-[60] shadow-elevated">{msg}</div>}</div>;
}
