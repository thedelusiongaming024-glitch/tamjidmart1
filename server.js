// Tamjid Mart - Node.js Server connected purely to Supabase Cloud PostgreSQL
if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch (_) {}
}
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {
  loadDbFromPostgres,
  saveDbToPostgres,
  pgInsertProduct,
  pgDeleteProduct,
  pgInsertCategory,
  pgDeleteCategory,
  pgInsertBanner,
  pgDeleteBanner,
  pgInsertEnquiry,
  pgTrackMetric,
  pgUpdateSettings
} = require('./db');

const PORT=process.env.PORT||3000,D=path.join(__dirname,'data'),U=path.join(__dirname,'uploads'),DBF=path.join(D,'db.json');
[D,U].forEach(d=>fs.mkdirSync(d,{recursive:true}));
const hash=(p,s)=>crypto.scryptSync(p,s,32).toString('hex'),uid=()=>crypto.randomBytes(4).toString('hex');

// Default initial state structure (pure empty arrays - no mock data)
let db = {
  settings: {
    siteName: 'Tamjid Mart',
    tagline: 'Curated Essentials & Modern Lifestyle Goods',
    logo: '/logo.png',
    whatsapp: '8801700000000',
    phone: '+8801700000000',
    email: 'hello@tamjidmart.com',
    address: 'Savar, Dhaka, Bangladesh',
    hours: 'Saturday to Thursday, 10am to 9pm',
    aboutText: 'Tamjid Mart is your trusted destination for genuine premium lifestyle goods, gadgets, fashion, and daily essentials with verified quality and dedicated customer service.',
    waMessage: "Hello Tamjid Mart! I am interested in {product}. Is this available in stock?",
    facebook: '',
    instagram: '',
    youtube: '',
    siteUrl: '',
    seoTitle: 'Tamjid Mart | Curated Essentials, Gadgets & Lifestyle',
    seoDescription: 'Discover verified genuine products, modern gadgets, curated fashion, and premium lifestyle essentials at Tamjid Mart.',
    keywords: 'tamjid mart, shopping bangladesh, online store, gadgets, fashion, lifestyle, premium goods',
    ogImage: '/logo.png',
    gtmId: '',
    gaId: ''
  },
  admin: {
    user: 'admin',
    salt: 'e20bfd65d4b0f92b',
    hash: hash(process.env.ADMIN_PASSWORD || 'admin123', 'e20bfd65d4b0f92b')
  },
  categories: [],
  products: [],
  banners: [],
  enquiries: []
};

let timer;
const save = () => {
  try { fs.writeFileSync(DBF, JSON.stringify(db, null, 1)); } catch(e){}
  saveDbToPostgres(db);
};
const saveSoon = () => {
  clearTimeout(timer);
  timer = setTimeout(save, 800);
};

// Asynchronously load real records from Supabase PostgreSQL on startup
loadDbFromPostgres().then(pgData => {
  if (pgData) {
    db = pgData;
    db.settings = { ...db.settings, siteUrl:'',seoTitle:'',seoDescription:'',keywords:'',ogImage:'',gtmId:'',gaId:'',...pgData.settings };
    db.enquiries = db.enquiries || [];
    try { fs.writeFileSync(DBF, JSON.stringify(db, null, 1)); } catch(e){}
    console.log(`[Tamjid Mart] Real database ready: ${db.products.length} products in catalog.`);
  } else if (fs.existsSync(DBF)) {
    try {
      db = JSON.parse(fs.readFileSync(DBF, 'utf8'));
      console.log(`[Tamjid Mart] Loaded from local cache backup: ${db.products?.length || 0} products.`);
    } catch(e){}
  }
}).catch(err => {
  console.error('[Tamjid Mart] Initial PostgreSQL sync error:', err.message);
  if (fs.existsSync(DBF)) {
    try {
      db = JSON.parse(fs.readFileSync(DBF, 'utf8'));
      console.log(`[Tamjid Mart] Loaded from local cache backup: ${db.products?.length || 0} products.`);
    } catch(e){}
  }
});

const ssr = require('./ssr')(() => db), enqRate = new Map(), DIST = path.join(__dirname, 'dist');
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.svg':'image/svg+xml' };
const sessions = new Map(), fails = new Map();
const send = (res, c, o, h = {}) => { res.writeHead(c, { 'Content-Type':'application/json', ...h }); res.end(JSON.stringify(o)); };
const body = (req, max = 1e6) => new Promise((ok, no) => {
  let n = 0, c = [];
  req.on('data', d => {
    n += d.length;
    if (n > max) { no(new Error('Too large')); req.destroy(); }
    else c.push(d);
  });
  req.on('end', () => {
    try { ok(JSON.parse(Buffer.concat(c).toString() || '{}')); }
    catch (e) { no(new Error('Bad JSON')); }
  });
});

const authed = req => {
  const h = req.headers;
  const t = (h.cookie || '').match(/sid=([a-f0-9]+)/)?.[1] || h['x-session-token'] || (h.authorization || '').replace(/^Bearer\s+/i, '');
  return t && sessions.get(t) > Date.now() ? t : null;
};

const ALLOW = {
  products: ['name', 'category', 'price', 'description', 'highlights', 'images', 'badge', 'featured', 'active', 'seoTitle', 'seoDescription', 'colorway', 'sku'],
  categories: ['name', 'description', 'image'],
  banners: ['title', 'subtitle', 'btnText', 'btnLink', 'image', 'active'],
  enquiries: ['status']
};

const pick = (o, keys) => Object.fromEntries(keys.filter(k => k in o).map(k => [k, o[k]]));

function serve(res, base, rel) {
  const f = path.normalize(path.join(base, rel));
  if (!f.startsWith(base + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404);
    return res.end('Not found');
  }
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(f)] || 'application/octet-stream',
    'Cache-Control': base === U ? 'public,max-age=31536000' : 'no-cache'
  });
  fs.createReadStream(f).pipe(res);
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x'), p = decodeURIComponent(url.pathname), m = req.method;

    if (!p.startsWith('/api/')) {
      if (m === 'GET') {
        if (p === '/') return ssr.home(req, res);
        const pm = /^\/p\/([^/]+)$/.exec(p);
        if (pm) return ssr.prod(req, res, pm[1]);
        if (p === '/sitemap.xml') return ssr.sitemap(req, res);
        if (p === '/robots.txt') return ssr.robots(req, res);
      }
      if (p === '/admin' || p.startsWith('/admin/')) return ssr.spa(req, res);
      if (p.startsWith('/uploads/')) return serve(res, U, p.slice(9));
      {
        const f = path.join(DIST, p.slice(1));
        if (p !== '/' && fs.existsSync(f) && fs.statSync(f).isFile()) return serve(res, DIST, p.slice(1));
        return ssr.spa(req, res, 404);
      }
    }

    // GET /api/public - Get active catalog directly from cloud state
    if (p === '/api/public' && m === 'GET') return send(res, 200, ssr.pub());

    // POST /api/track - Track views / contacts in cloud DB
    if (p === '/api/track' && m === 'POST') {
      const b = await body(req), x = db.products.find(i => i.id === b.id);
      if (x) {
        x[b.type === 'contact' ? 'contacts' : 'views']++;
        pgTrackMetric(b.id, b.type);
        saveSoon();
      }
      return send(res, 200, { ok: 1 });
    }

    // POST /api/enquiry - Customer inquiry submission directly to DB
    if (p === '/api/enquiry' && m === 'POST') {
      const ip = req.socket.remoteAddress, f = enqRate.get(ip) || { n: 0, t: Date.now() };
      if (Date.now() - f.t > 6e5) { f.n = 0; f.t = Date.now(); }
      if (f.n >= 30) return send(res, 429, { error: 'Too many enquiries. Please contact us on WhatsApp.' });

      const b = await body(req, 2e4);
      if (b.website) return send(res, 200, { ok: 1 });

      const c = (k, n) => String(b[k] || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
      const name = c('name', 80), phone = c('phone', 30), msg = String(b.message || '').trim().slice(0, 1500);

      if (!name || !/^[+\d][\d\s()+-]{6,}$/.test(phone) || msg.length < 3) {
        return send(res, 400, { error: 'Please enter your name, a valid phone number and a message.' });
      }

      const pr = db.products.find(x => x.id === b.product);
      f.n++;
      enqRate.set(ip, f);

      const newEnquiry = {
        id: uid(),
        name,
        phone,
        message: msg,
        productId: pr ? pr.id : '',
        productName: pr ? pr.name : '',
        status: 'new',
        createdAt: Date.now()
      };

      db.enquiries.unshift(newEnquiry);
      db.enquiries.length = Math.min(db.enquiries.length, 2000);
      pgInsertEnquiry(newEnquiry);
      save();
      return send(res, 200, { ok: 1 });
    }

    // POST /api/login - Admin authentication
    if (p === '/api/login' && m === 'POST') {
      const b = await body(req), a = db.admin;
      const inputUser = String(b.user || '').trim().toLowerCase();
      const targetUser = String(a.user || 'admin').trim().toLowerCase();
      const inputHash = Buffer.from(hash(String(b.password || ''), a.salt));
      const targetHash = Buffer.from(a.hash);
      const ok = inputUser === targetUser && inputHash.length === targetHash.length && crypto.timingSafeEqual(inputHash, targetHash);
      if (!ok) { return send(res, 401, { error: 'Wrong username or password.' }); }

      const t = crypto.randomBytes(24).toString('hex');
      sessions.set(t, Date.now() + 864e5);
      return send(res, 200, { ok: 1, token: t }, { 'Set-Cookie': `sid=${t}; Path=/; Max-Age=86400; SameSite=Lax` });
    }

    // POST /api/logout - Admin logout
    if (p === '/api/logout') {
      const t = authed(req);
      if (t) sessions.delete(t);
      return send(res, 200, { ok: 1 }, { 'Set-Cookie': 'sid=; Path=/; Max-Age=0' });
    }

    if (!p.startsWith('/api/admin/')) return send(res, 404, { error: 'Not found' });
    if (!authed(req)) return send(res, 401, { error: 'Please sign in.' });
    const [,,, r, id] = p.split('/');

    // GET /api/admin/all - Get full database records for admin
    if (r === 'all' && m === 'GET') {
      return send(res, 200, {
        settings: db.settings,
        categories: db.categories,
        products: db.products,
        banners: db.banners,
        enquiries: db.enquiries,
        user: db.admin.user
      });
    }

    // PUT /api/admin/settings - Update site settings in DB
    if (r === 'settings' && m === 'PUT') {
      const b = await body(req);
      for (const k in db.settings) if (k in b) db.settings[k] = String(b[k]).slice(0, 2000);
      pgUpdateSettings(db.settings, db.admin);
      save();
      return send(res, 200, db.settings);
    }

    // POST /api/admin/password - Update admin credentials in DB
    if (r === 'password' && m === 'POST') {
      const b = await body(req), a = db.admin;
      if (!crypto.timingSafeEqual(Buffer.from(hash(String(b.current || ''), a.salt)), Buffer.from(a.hash))) {
        return send(res, 400, { error: 'Current password is wrong.' });
      }
      if (String(b.password || '').length < 8) {
        return send(res, 400, { error: 'New password must be at least 8 characters.' });
      }
      a.salt = crypto.randomBytes(8).toString('hex');
      a.hash = hash(b.password, a.salt);
      if (b.user) a.user = String(b.user).slice(0, 40);
      pgUpdateSettings(db.settings, a);
      save();
      return send(res, 200, { ok: 1 });
    }

    // POST /api/admin/upload - Handle image uploads
    if (r === 'upload' && m === 'POST') {
      const b = await body(req, 8e6), mt = /^data:image\/(png|jpeg|webp|gif);base64,(.+)$/.exec(b.data || '');
      if (!mt) return send(res, 400, { error: 'Use a PNG, JPG, WEBP or GIF image.' });
      const buf = Buffer.from(mt[2], 'base64');
      if (buf.length > 5e6) return send(res, 400, { error: 'Image must be under 5 MB.' });
      const imgId = crypto.randomBytes(8).toString('hex'), n = imgId + '.' + (mt[1] === 'jpeg' ? 'jpg' : mt[1]);
      fs.writeFileSync(path.join(U, n), buf);
      const tt = mt[1] === 'webp' && /^data:image\/webp;base64,(.+)$/.exec(b.thumb || '');
      if (tt) fs.writeFileSync(path.join(U, imgId + '-t.webp'), Buffer.from(tt[1], 'base64'));
      return send(res, 200, { url: '/uploads/' + n });
    }

    // Dynamic REST CRUD: products, categories, banners, enquiries
    if (ALLOW[r]) {
      const list = db[r];

      // POST /api/admin/:resource (Create & persist to PostgreSQL)
      if (m === 'POST' && r !== 'enquiries') {
        const it = { id: uid(), ...pick(await body(req), ALLOW[r]) };
        if (r === 'products') Object.assign(it, { views: 0, contacts: 0, createdAt: Date.now() });
        list.push(it);
        if (r === 'products') pgInsertProduct(it);
        if (r === 'categories') pgInsertCategory(it);
        if (r === 'banners') pgInsertBanner(it);
        save();
        return send(res, 200, it);
      }

      const it = list.find(x => x.id === id);
      if (!it) return send(res, 404, { error: 'Not found' });

      // PUT /api/admin/:resource/:id (Update & persist to PostgreSQL)
      if (m === 'PUT') {
        Object.assign(it, pick(await body(req), ALLOW[r]));
        it.updatedAt = Date.now();
        if (r === 'products') pgInsertProduct(it);
        if (r === 'categories') pgInsertCategory(it);
        if (r === 'banners') pgInsertBanner(it);
        if (r === 'enquiries') pgInsertEnquiry(it);
        save();
        return send(res, 200, it);
      }

      // DELETE /api/admin/:resource/:id (Delete & persist to PostgreSQL)
      if (m === 'DELETE') {
        list.splice(list.indexOf(it), 1);
        if (r === 'categories') {
          db.products.forEach(x => { if (x.category === id) x.category = ''; });
          pgDeleteCategory(id);
        }
        if (r === 'products') pgDeleteProduct(id);
        if (r === 'banners') pgDeleteBanner(id);
        save();
        return send(res, 200, { ok: 1 });
      }
    }

    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 400, { error: e.message });
  }
}).listen(PORT, '0.0.0.0', () => console.log(`Tamjid Mart running: http://0.0.0.0:${PORT}  |  Admin: http://0.0.0.0:${PORT}/admin`));

process.on('SIGINT', () => { save(); process.exit(); });
