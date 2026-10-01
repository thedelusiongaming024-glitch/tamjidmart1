// Vercel Serverless Function: GET /api/public
const { loadDbFromPostgres } = require('../db');
let localDb = null;
try {
  localDb = require('../data/db.json');
} catch (_) {}

const slug = p => (String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item') + '-' + p.id;

function formatPublicData(rawDb) {
  const settings = rawDb.settings || {};
  const categories = rawDb.categories || [];
  const banners = (rawDb.banners || []).filter(b => b.active !== false);
  const products = (rawDb.products || []).filter(p => p.active !== false).map(({ views, contacts, ...r }) => ({
    ...r,
    slug: slug(r)
  }));
  return { settings, categories, banners, products };
}

let cachedData = null;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  // 1. Try real Supabase PostgreSQL data with 3.5s timeout
  try {
    const pgData = await Promise.race([
      loadDbFromPostgres(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase pooler timeout')), 3500))
    ]);
    if (pgData && pgData.products && pgData.products.length > 0) {
      cachedData = formatPublicData(pgData);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59');
      return res.end(JSON.stringify(cachedData));
    }
  } catch (err) {
    console.warn('[api/public] Supabase notice:', err.message);
  }

  // 2. Memory cache if available
  if (cachedData) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify(cachedData));
  }

  // 3. Fallback to bundled data/db.json
  if (localDb) {
    cachedData = formatPublicData(localDb);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify(cachedData));
  }

  res.statusCode = 500;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ error: 'Catalog unavailable' }));
};
