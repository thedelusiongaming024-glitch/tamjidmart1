// Comprehensive End-to-End Simulation of All Aspects of Tamjid Mart
if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch (_) {}
}

const http = require('http');

const PORT = 3000;
const BASE = `http://localhost:${PORT}`;

// Helper HTTP fetcher
async function req(path, options = {}) {
  const url = BASE + path;
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { status: res.status, headers: res.headers, text, json };
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

async function runSimulation() {
  console.log('===============================================================');
  console.log('   TAMJID MART - FULL FACTOR & ASPECT SIMULATION SUITE       ');
  console.log('===============================================================\n');

  // Start the server in-process
  console.log('[1/12] Initializing Server & Syncing with Supabase Cloud...');
  require('./server');
  
  // Wait 4 seconds for PostgreSQL connection and initial sync
  await new Promise(r => setTimeout(r, 4000));

  // --- FACTOR 1: Public Catalog API ---
  console.log('\n[2/12] Testing Public Catalog API (GET /api/public)...');
  const pub = await req('/api/public');
  assert(pub.status === 200, 'Status is 200 OK');
  assert(pub.json && pub.json.settings.siteName === 'Tamjid Mart', 'Store settings: Tamjid Mart');
  assert(pub.json.categories.length === 3, `Categories loaded: ${pub.json.categories.length} categories`);
  assert(pub.json.banners.length === 2, `Banners loaded: ${pub.json.banners.length} banners`);
  assert(pub.json.banners[0].image.startsWith('https://'), 'Banner 1 has valid CDN image URL');
  assert(pub.json.products.length >= 8, `Catalog products loaded: ${pub.json.products.length} products`);
  const sampleProd = pub.json.products[0];
  assert(sampleProd.price && sampleProd.slug, `Product has price (${sampleProd.price}) and slug (${sampleProd.slug})`);

  // --- FACTOR 2: SSR Home Page & SEO Injection ---
  console.log('\n[3/12] Testing SSR Home Page & Search Engine Crawlability (GET /)...');
  const home = await req('/');
  assert(home.status === 200, 'Home page status is 200 OK');
  assert(home.headers.get('content-type').includes('text/html'), 'Content-Type is text/html; charset=utf-8');
  assert(home.text.includes('<title>Tamjid Mart'), 'Contains dynamic SEO <title>');
  assert(home.text.includes('<meta name="description"'), 'Contains SEO meta description');
  assert(home.text.includes('"@type":"Store"'), 'Schema.org Store structured data present');
  assert(home.text.includes('"@type":"ItemList"'), 'Schema.org ItemList structured data present');
  assert(home.text.includes('window.__DATA__='), 'Hydration data window.__DATA__ injected');
  assert(home.text.includes('<div id="root"><main><h1>'), 'Crawler-friendly HTML snapshot pre-rendered in #root');

  // --- FACTOR 3: Dynamic Product Page SSR ---
  console.log('\n[4/12] Testing Dynamic Product SSR & Schema.org Metadata (GET /p/:slug)...');
  const prodSlug = sampleProd.slug;
  const prodPage = await req(`/p/${prodSlug}`);
  assert(prodPage.status === 200, `Product page /p/${prodSlug} status 200 OK`);
  assert(prodPage.text.includes(sampleProd.name), 'Contains product name in HTML');
  assert(prodPage.text.includes('"@type":"Product"'), 'Contains Schema.org Product structured data');
  assert(prodPage.text.includes('"@type":"BreadcrumbList"'), 'Contains Schema.org BreadcrumbList');
  assert(prodPage.text.includes('property="og:image"'), 'Contains Open Graph image tag');

  // --- FACTOR 4: SEO Slug Canonical Redirect & 404 Handling ---
  console.log('\n[5/12] Testing Slug Redirects & 404 Pages...');
  const redir = await req(`/p/wrong-slug-${sampleProd.id}`, { redirect: 'manual' });
  assert(redir.status === 301, 'Wrong slug returns 301 Permanent Redirect');
  assert(redir.headers.get('location') === `/p/${prodSlug}`, `Redirects to canonical URL /p/${prodSlug}`);
  
  const notFound = await req('/p/non-existent-product-p9999');
  assert(notFound.status === 404, 'Non-existent product returns 404 status');

  // --- FACTOR 5: SEO Sitemap & Robots.txt ---
  console.log('\n[6/12] Testing Sitemap XML & Robots.txt...');
  const sitemap = await req('/sitemap.xml');
  assert(sitemap.status === 200, 'sitemap.xml returns 200 OK');
  assert(sitemap.headers.get('content-type').includes('application/xml'), 'sitemap.xml is application/xml');
  assert(sitemap.text.includes('<urlset') && sitemap.text.includes(`/p/${prodSlug}`), 'sitemap.xml contains product URLs');

  const robots = await req('/robots.txt');
  assert(robots.status === 200, 'robots.txt returns 200 OK');
  assert(robots.text.includes('Disallow: /admin'), 'robots.txt protects /admin');
  assert(robots.text.includes('Sitemap:'), 'robots.txt declares sitemap location');

  // --- FACTOR 6: Metrics Tracking Engine ---
  console.log('\n[7/12] Testing Real-Time Metrics Tracking (POST /api/track)...');
  const initialViews = sampleProd.views || 0;
  const trackView = await req('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: sampleProd.id, type: 'view' })
  });
  assert(trackView.status === 200 && trackView.json.ok === 1, 'Product view tracked');

  const trackContact = await req('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: sampleProd.id, type: 'contact' })
  });
  assert(trackContact.status === 200 && trackContact.json.ok === 1, 'WhatsApp contact click tracked');

  // --- FACTOR 7: Customer Enquiry Form Submission ---
  console.log('\n[8/12] Testing Customer Lead & Enquiry Submission (POST /api/enquiry)...');
  // Honeypot spam test
  const spam = await req('/api/enquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bot', phone: '1234567', message: 'Spam', website: 'http://spambot.xyz' })
  });
  assert(spam.status === 200 && spam.json.ok === 1, 'Spam honeypot silently absorbed');

  // Valid customer enquiry
  const validEnquiry = await req('/api/enquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Tanvir Hasan',
      phone: '+8801812345678',
      message: 'Hello, is the Aura ANC Wireless headphone in stock for delivery to Dhanmondi, Dhaka?',
      product: sampleProd.id
    })
  });
  assert(validEnquiry.status === 200 && validEnquiry.json.ok === 1, 'Customer inquiry submitted successfully');

  // --- FACTOR 8: Admin Authentication & Security ---
  console.log('\n[9/12] Testing Admin Authentication & Session Management...');
  // Bad login
  const badLogin = await req('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: 'admin', password: 'wrongpassword' })
  });
  assert(badLogin.status === 401, 'Unauthorized with incorrect password');

  // Good login
  const goodLogin = await req('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: 'admin', password: 'admin123' })
  });
  assert(goodLogin.status === 200 && goodLogin.json.token, 'Login successful with session token issued');
  const token = goodLogin.json.token;

  // Unauthenticated access check
  const unauth = await req('/api/admin/all');
  assert(unauth.status === 401, 'Unauthenticated /api/admin/all rejected (401)');

  // Authenticated access check
  const adminData = await req('/api/admin/all', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert(adminData.status === 200, 'Authenticated admin access granted (200)');
  assert(adminData.json.enquiries.length > 0, `Admin sees customer inquiry (${adminData.json.enquiries[0].name})`);
  const enquiryId = adminData.json.enquiries[0].id;

  // --- FACTOR 9: Admin Inquiry Management ---
  console.log('\n[10/12] Testing Admin Enquiry Status Update (PUT /api/admin/enquiries/:id)...');
  const updateEnq = await req(`/api/admin/enquiries/${enquiryId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'in-progress' })
  });
  assert(updateEnq.status === 200 && updateEnq.json.status === 'in-progress', 'Inquiry marked as in-progress');

  // --- FACTOR 10: Admin Product CRUD Lifecycle ---
  console.log('\n[11/12] Testing Admin Product CRUD Lifecycle (Create, Update, Delete)...');
  // 1. Create Product
  const newProd = await req('/api/admin/products', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Simulation Test Smart Lamp',
      category: 'gadgets',
      price: '৳ 2,100',
      description: 'App-controlled RGB ambient light with wireless fast charger.',
      highlights: '16M RGB colors\n15W wireless charging\nSmart timer',
      images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'],
      badge: 'Test',
      active: true,
      featured: false
    })
  });
  assert(newProd.status === 200 && newProd.json.id, `Created test product with ID: ${newProd.json.id}`);
  const testId = newProd.json.id;

  // 2. Update Product
  const updateProd = await req(`/api/admin/products/${testId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      price: '৳ 1,950',
      badge: 'Sale Test'
    })
  });
  assert(updateProd.status === 200 && updateProd.json.price === '৳ 1,950', 'Updated product price to ৳ 1,950');

  // 3. Delete Product
  const deleteProd = await req(`/api/admin/products/${testId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert(deleteProd.status === 200 && deleteProd.json.ok === 1, 'Deleted test product successfully');

  // --- FACTOR 11: Admin Settings Update & Logout ---
  console.log('\n[12/12] Testing Store Settings Update & Admin Logout...');
  const updateSettings = await req('/api/admin/settings', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tagline: 'Curated Essentials & Modern Lifestyle Goods'
    })
  });
  assert(updateSettings.status === 200, 'Site settings updated');

  const logout = await req('/api/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert(logout.status === 200 && logout.json.ok === 1, 'Admin logout successful');

  const afterLogout = await req('/api/admin/all', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert(afterLogout.status === 401, 'Old session token successfully revoked');

  console.log('\n===============================================================');
  console.log(`   SIMULATION SUMMARY: ${passCount} PASSED | ${failCount} FAILED`);
  console.log('===============================================================\n');

  setTimeout(() => {
    process.exit(failCount === 0 ? 0 : 1);
  }, 1000);
}

runSimulation().catch(err => {
  console.error('Fatal simulation error:', err);
  process.exit(1);
});
