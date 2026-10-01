// Universal Vercel Serverless Function: handles /api/* routes
const crypto = require('crypto');
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
} = require('../db');

let localDb = null;
try { localDb = require('../data/db.json'); } catch (_) {}

const sessions = new Map();
const enqRate = new Map();
const hash = (p, s) => crypto.scryptSync(p, s, 32).toString('hex');
const uid = () => crypto.randomBytes(4).toString('hex');
const slug = p => (String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item') + '-' + p.id;

let db = localDb || {
  settings: { siteName: 'Tamjid Mart', logo: '/logo.png', phone: '+8801700000000' },
  admin: { user: 'admin', salt: 'e20bfd65d4b0f92b', hash: hash(process.env.ADMIN_PASSWORD || 'admin123', 'e20bfd65d4b0f92b') },
  categories: [],
  products: [],
  banners: [],
  enquiries: []
};

let dbLoaded = false;
async function ensureDb() {
  if (!dbLoaded) {
    try {
      const pgData = await Promise.race([
        loadDbFromPostgres(),
        new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 3000))
      ]);
      if (pgData && pgData.products && pgData.products.length > 0) {
        db = pgData;
        db.enquiries = db.enquiries || [];
        dbLoaded = true;
      }
    } catch (_) {}
  }
  return db;
}

const ALLOW = {
  products: ['name', 'category', 'price', 'description', 'highlights', 'images', 'badge', 'featured', 'active', 'seoTitle', 'seoDescription', 'colorway', 'sku'],
  categories: ['name', 'description', 'image'],
  banners: ['title', 'subtitle', 'btnText', 'btnLink', 'image', 'active'],
  enquiries: ['status']
};
const pick = (o, keys) => Object.fromEntries(keys.filter(k => k in o).map(k => [k, o[k]]));

function send(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-token');
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (req.body && typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)); } catch (_) { return Promise.resolve({}); }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch (_) { resolve({}); }
    });
  });
}

const authed = req => {
  const h = req.headers || {};
  const t = (h.cookie || '').match(/sid=([a-f0-9]+)/)?.[1] || h['x-session-token'] || (h.authorization || '').replace(/^Bearer\s+/i, '');
  return t && sessions.get(t) > Date.now() ? t : null;
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-token');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  await ensureDb();

  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  let p = decodeURIComponent(url.pathname);
  // Normalization: if rewrite stripped /api prefix or left it
  if (!p.startsWith('/api')) p = '/api' + p;
  const m = req.method;

  try {
    // GET /api/public
    if (p === '/api/public' && m === 'GET') {
      const pub = {
        settings: db.settings,
        categories: db.categories,
        banners: (db.banners || []).filter(b => b.active !== false),
        products: (db.products || []).filter(x => x.active !== false).map(({ views, contacts, ...r }) => ({ ...r, slug: slug(r) }))
      };
      return send(res, 200, pub);
    }

    // POST /api/track
    if (p === '/api/track' && m === 'POST') {
      const b = await parseBody(req);
      const x = (db.products || []).find(i => i.id === b.id);
      if (x) {
        x[b.type === 'contact' ? 'contacts' : 'views'] = (x[b.type === 'contact' ? 'contacts' : 'views'] || 0) + 1;
        pgTrackMetric(b.id, b.type);
      }
      return send(res, 200, { ok: 1 });
    }

    // POST /api/enquiry
    if (p === '/api/enquiry' && m === 'POST') {
      const b = await parseBody(req);
      const name = String(b.name || '').trim().slice(0, 80);
      const phone = String(b.phone || '').trim().slice(0, 30);
      const msg = String(b.message || '').trim().slice(0, 1500);
      if (!name || !/^[+\d][\d\s()+-]{6,}$/.test(phone) || msg.length < 3) {
        return send(res, 400, { error: 'Please enter a name, valid phone number and message.' });
      }
      const pr = (db.products || []).find(x => x.id === b.product);
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
      db.enquiries = db.enquiries || [];
      db.enquiries.unshift(newEnquiry);
      pgInsertEnquiry(newEnquiry);
      return send(res, 200, { ok: 1 });
    }

    // POST /api/login
    if (p === '/api/login' && m === 'POST') {
      const b = await parseBody(req);
      const a = db.admin;
      const inputUser = String(b.user || '').trim().toLowerCase();
      const targetUser = String(a.user || 'admin').trim().toLowerCase();
      const inputHash = Buffer.from(hash(String(b.password || ''), a.salt));
      const targetHash = Buffer.from(a.hash);
      const ok = inputUser === targetUser && inputHash.length === targetHash.length && crypto.timingSafeEqual(inputHash, targetHash);
      if (!ok) return send(res, 401, { error: 'Wrong username or password.' });
      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, Date.now() + 864e5 * 7);
      res.setHeader('Set-Cookie', `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
      return send(res, 200, { ok: 1, user: a.user, token });
    }

    // Admin protected routes
    const isAuth = authed(req);
    if (!isAuth && p.startsWith('/api/admin')) {
      return send(res, 401, { error: 'Unauthorized' });
    }

    // GET /api/admin/all
    if (p === '/api/admin/all' && m === 'GET') {
      return send(res, 200, {
        settings: db.settings,
        categories: db.categories,
        banners: db.banners,
        products: db.products,
        enquiries: db.enquiries || [],
        user: db.admin.user
      });
    }

    // PUT /api/admin/settings
    if (p === '/api/admin/settings' && m === 'PUT') {
      const b = await parseBody(req);
      db.settings = { ...db.settings, ...b };
      pgUpdateSettings(db.settings);
      return send(res, 200, db.settings);
    }

    // Admin CRUD /api/admin/:resource/:id
    const parts = p.split('/').filter(Boolean); // ['api', 'admin', resource, id?]
    if (parts[1] === 'admin' && parts[2]) {
      const r = parts[2];
      const id = parts[3];

      if (ALLOW[r]) {
        const list = db[r];
        if (m === 'POST' && !id && r !== 'enquiries') {
          const it = { id: uid(), ...pick(await parseBody(req), ALLOW[r]) };
          if (r === 'products') Object.assign(it, { views: 0, contacts: 0, createdAt: Date.now() });
          list.push(it);
          if (r === 'products') pgInsertProduct(it);
          if (r === 'categories') pgInsertCategory(it);
          if (r === 'banners') pgInsertBanner(it);
          return send(res, 200, it);
        }

        const it = list.find(x => x.id === id);
        if (!it) return send(res, 404, { error: 'Not found' });

        if (m === 'PUT') {
          Object.assign(it, pick(await parseBody(req), ALLOW[r]));
          it.updatedAt = Date.now();
          if (r === 'products') pgInsertProduct(it);
          if (r === 'categories') pgInsertCategory(it);
          if (r === 'banners') pgInsertBanner(it);
          if (r === 'enquiries') pgInsertEnquiry(it);
          return send(res, 200, it);
        }

        if (m === 'DELETE') {
          list.splice(list.indexOf(it), 1);
          if (r === 'products') pgDeleteProduct(id);
          if (r === 'categories') pgDeleteCategory(id);
          if (r === 'banners') pgDeleteBanner(id);
          return send(res, 200, { ok: 1 });
        }
      }
    }

    send(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('[API Error]:', err);
    send(res, 500, { error: err.message });
  }
};
