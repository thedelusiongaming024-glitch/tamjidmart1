// Server-side rendering, SEO meta, JSON-LD, dataLayer, sitemap and robots
const fs=require('fs'),path=require('path');
let db;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=p=>(String(p.name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item')+'-'+p.id;
const thumb=u=>/^\/uploads\/.+\.webp$/.test(u||'')?u.replace(/\.webp$/,'-t.webp'):u;
const cn=id=>db.categories.find(c=>c.id===id)?.name||'';
const base=req=>(db.settings.siteUrl||`${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}`).replace(/\/$/,'');
const abs=(b,u)=>u?(/^https?:/.test(u)?u:b+u):undefined;
const clip=(s,n)=>{s=String(s||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1)+'\u2026':s};
const html=(res,s,c=200)=>{res.writeHead(c,{'Content-Type':'text/html; charset=utf-8'});res.end(s)};
const js=o=>JSON.stringify(o).replace(/</g,'\\u003c');
function head(req,o){const S=db.settings,b=base(req),url=b+o.path,img=abs(b,o.img||S.ogImage||S.logo),ok=x=>/^[\w-]{3,20}$/.test(x||'')?x:'',gtm=ok(S.gtmId),ga=ok(S.gaId);
 return `<title>${E(o.title)}</title><meta name="description" content="${E(o.desc)}">${S.keywords&&o.path==='/'?`<meta name="keywords" content="${E(S.keywords)}">`:''}<link rel="canonical" href="${E(url)}"><meta property="og:type" content="${o.type||'website'}"><meta property="og:site_name" content="${E(S.siteName)}"><meta property="og:title" content="${E(o.title)}"><meta property="og:description" content="${E(o.desc)}"><meta property="og:url" content="${E(url)}">${img?`<meta property="og:image" content="${E(img)}">`:''}<meta name="twitter:card" content="${img?'summary_large_image':'summary'}">`
 +`<script type="application/ld+json">${js(o.ld)}</script><script>window.dataLayer=window.dataLayer||[];dataLayer.push(${js(o.dl)});</script>`
 +(gtm?`<script>(function(w,d,s,l,i){w[l].push({'gtm.start':Date.now(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f)})(window,document,'script','dataLayer','${gtm}');</script>`:'')
 +(ga?`<script async src="https://www.googletagmanager.com/gtag/js?id=${ga}"></script><script>function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}')</script>`:'')}
const DIST=path.join(__dirname,'dist');
const PUB=()=>({settings:db.settings,categories:db.categories,banners:db.banners.filter(b=>b.active),products:db.products.filter(x=>x.active).map(({views,contacts,...r})=>({...r,slug:slug(r)}))});
// Inject SEO head, a crawler-readable snapshot and the data (window.__DATA__) into the built React index.html
function page(res,{head='',snap='',code=200,data}){
 let f;try{f=fs.readFileSync(path.join(DIST,'index.html'),'utf8')}catch(e){return html(res,'<p style="font-family:sans-serif;padding:40px">Site not built yet. Run <b>npm run build</b> and restart the server.</p>',503)}
 const inj=head+(data?`<script>window.__DATA__=${js(data)}</script>`:'');
 f=f.replace(/<title>[^<]*<\/title>/,'').replace('</head>',()=>inj+'</head>').replace('<div id="root"></div>',()=>`<div id="root">${snap}</div>`);
 html(res,f,code)}
module.exports=get=>({slug,
 pub(){db=get();return PUB()},
 spa(req,res,code=200){db=get();const ad=req.url.startsWith('/admin');page(res,{code,head:ad?'<meta name="robots" content="noindex">':'',data:ad?null:PUB()})},
 home(req,res){db=get();const S=db.settings,b=base(req),list=db.products.filter(p=>p.active).sort((a,c)=>c.createdAt-a.createdAt);
  const ld=[{'@context':'https://schema.org','@type':'Store',name:S.siteName,url:b,image:abs(b,S.ogImage||S.logo),telephone:S.phone,email:S.email,address:{'@type':'PostalAddress',streetAddress:S.address},sameAs:[S.facebook,S.instagram,S.youtube].filter(Boolean)},{'@context':'https://schema.org','@type':'ItemList',itemListElement:list.slice(0,30).map((p,i)=>({'@type':'ListItem',position:i+1,url:b+'/p/'+slug(p),name:p.name}))}];
  page(res,{head:head(req,{title:S.seoTitle||`${S.siteName} | ${S.tagline}`,desc:clip(S.seoDescription||S.aboutText,160),path:'/',ld,dl:{page_type:'home',site:S.siteName,product_count:list.length}}),
   snap:`<main><h1>${E(S.siteName)}</h1><p>${E(S.tagline)}</p><ul>${list.map(p=>`<li><a href="/p/${slug(p)}">${E(p.name)}</a>: ${E(p.description)}</li>`).join('')}</ul></main>`,data:PUB()})},
 prod(req,res,s){db=get();const p=db.products.find(x=>x.id===s.split('-').pop()&&x.active),S=db.settings;
  if(!p)return page(res,{code:404,data:PUB()});
  if(s!==slug(p)){res.writeHead(301,{Location:'/p/'+slug(p)});return res.end()}
  const b=base(req),cat=cn(p.category),ims=p.images,url=b+'/p/'+slug(p);
  const ld=[{'@context':'https://schema.org','@type':'Product',name:p.name,description:clip(p.description,500),image:ims.map(u=>abs(b,u)),category:cat||undefined,brand:{'@type':'Brand',name:S.siteName},url},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[['Home',b+'/'],[p.name,url]].map((x,i)=>({'@type':'ListItem',position:i+1,name:x[0],item:x[1]}))}];
  page(res,{head:head(req,{title:p.seoTitle||`${p.name} | ${S.siteName}`,desc:clip(p.seoDescription||p.description,160),path:'/p/'+slug(p),img:ims[0],type:'product',ld,dl:{page_type:'product',product_id:p.id,product_name:p.name,product_category:cat}}),
   snap:`<article><h1>${E(p.name)}</h1>${ims[0]?`<img src="${E(ims[0])}" alt="${E(p.name)}" width="400">`:''}<p>${E(p.description)}</p></article>`,data:PUB()})},
 sitemap(req,res){db=get();const b=base(req),d=t=>new Date(t).toISOString().slice(0,10),u=[[b+'/',d(Date.now())],...db.products.filter(p=>p.active).map(p=>[b+'/p/'+slug(p),d(p.updatedAt||p.createdAt)])];
  res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8'});res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${u.map(x=>`<url><loc>${E(x[0])}</loc><lastmod>${x[1]}</lastmod></url>`).join('')}</urlset>`)},
 robots(req,res){db=get();res.writeHead(200,{'Content-Type':'text/plain'});res.end(`User-Agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${base(req)}/sitemap.xml\n`)}});
