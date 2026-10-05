// Seeding script for Tamjid Mart catalog with verified high-resolution images
if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch (_) {}
}

const {
  pool,
  initSchema,
  pgInsertCategory,
  pgInsertBanner,
  pgInsertProduct,
  saveDbToPostgres,
  loadDbFromPostgres
} = require('./db');

const categories = [
  {
    id: 'gadgets',
    name: 'Smart Gadgets & Tech',
    description: 'Modern wireless electronics, high-fidelity audio, and functional tech gear.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    description: 'Curated contemporary wear, minimalist garments, and lifestyle apparel.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle & Home Goods',
    description: 'Refined daily essentials, genuine leather goods, and interior accessories.',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80'
  }
];

const banners = [
  {
    id: 'b1',
    title: 'Quality Craftsmanship & Modern Living',
    subtitle: 'Every product is hand-inspected for durability, authentic quality, and contemporary aesthetic value.',
    btnText: 'Contact Us on WhatsApp',
    btnLink: '#contact',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
    active: true
  },
  {
    id: 'b2',
    title: 'Curated Essentials & Premium Finds',
    subtitle: 'Discover verified genuine products, modern gadgets, curated fashion, and lifestyle essentials at honest value.',
    btnText: 'Browse Collection',
    btnLink: '#products',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=80',
    active: true
  }
];

const products = [
  {
    id: 'p1',
    name: 'Aura ANC Wireless Noise-Cancelling Headphones',
    category: 'gadgets',
    price: '৳ 4,850',
    badge: 'Trending',
    featured: true,
    active: true,
    description: 'Immerse yourself in pure acoustic clarity. Equipped with 40mm titanium drivers, active noise cancellation up to 35dB, ultra-plush memory foam earcups, and up to 45 hours of continuous battery life.',
    highlights: 'Active Noise Cancellation (ANC) with transparency mode\n40mm dynamic drivers with deep resonant bass\nBluetooth 5.3 multi-device pairing\n45-hour battery life with USB-C fast charging\nFoldable ergonomic design with carry pouch',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'TM-AUD-01',
    colorway: 'Midnight Obsidian',
    seoTitle: 'Aura ANC Wireless Noise-Cancelling Headphones | Tamjid Mart',
    seoDescription: 'Buy Aura ANC Wireless Headphones at Tamjid Mart. 45-hr battery, active noise cancellation, fast delivery in Bangladesh.',
    views: 142,
    contacts: 28,
    createdAt: Date.now() - 7 * 86400000,
    updatedAt: Date.now()
  },
  {
    id: 'p2',
    name: 'Chronos Ultra AMOLED Smartwatch',
    category: 'gadgets',
    price: '৳ 3,600',
    badge: 'New',
    featured: true,
    active: true,
    description: 'Refined aerospace-grade aluminum casing housing a vivid 1.43-inch Always-On AMOLED display. Tracks heart rate, SpO2, sleep architecture, and 100+ workout modes with IP68 water resistance.',
    highlights: '1.43" HD AMOLED Always-On Display\nHeart rate, SpO2 & sleep tracking sensors\nBluetooth calling with dual noise-cancelling mics\nIP68 water & dust resistance\nUp to 10 days battery on single charge',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'TM-WCH-02',
    colorway: 'Space Silver',
    seoTitle: 'Chronos Ultra AMOLED Smartwatch | Tamjid Mart',
    seoDescription: 'Order Chronos Ultra AMOLED Smartwatch with health tracking and Bluetooth calling. Available at Tamjid Mart.',
    views: 98,
    contacts: 19,
    createdAt: Date.now() - 5 * 86400000,
    updatedAt: Date.now()
  },
  {
    id: 'p3',
    name: 'Studio Mechanical Ergonomic Wireless Keyboard',
    category: 'gadgets',
    price: '৳ 5,400',
    badge: 'Hot',
    featured: true,
    active: true,
    description: 'Compact 75% layout crafted for tactile typing comfort and productivity. Pre-lubed linear switches, sound-dampening silicone gasket mount, hot-swappable PCB, and tri-mode connectivity.',
    highlights: '75% compact ergonomic layout with rotary volume knob\nFactory pre-lubed silent linear switches\nGasket mounted structure with dual dampening foam\nTri-mode: Bluetooth 5.0, 2.4GHz wireless & USB-C wired\nCustomizable per-key RGB backlighting',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'TM-KBD-03',
    colorway: 'Retro Cream & Grey',
    seoTitle: 'Studio Mechanical Ergonomic Keyboard | Tamjid Mart',
    seoDescription: 'Shop Studio 75% mechanical wireless keyboard at Tamjid Mart. Premium typing experience with gasket mount.',
    views: 64,
    contacts: 12,
    createdAt: Date.now() - 4 * 86400000,
    updatedAt: Date.now()
  },
  {
    id: 'p4',
    name: 'Full-Grain Italian Leather Bifold Wallet',
    category: 'lifestyle',
    price: '৳ 1,950',
    badge: 'Bestseller',
    featured: true,
    active: true,
    description: 'Handcrafted from vegetable-tanned full-grain leather that patinas gracefully over time. Ultra-slim profile featuring 8 card slots, dual cash compartments, and RFID blocking protection.',
    highlights: '100% Genuine vegetable-tanned full-grain leather\nRFID blocking security layer built-in\n8 card slots + 2 hidden compartments + full billfold\nPrecision reinforced nylon edge stitching\nSlim silhouette fits comfortably in front pocket',
    images: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'TM-WAL-04',
    colorway: 'Cognac Brown',
    seoTitle: 'Full-Grain Italian Leather Wallet | Tamjid Mart',
    seoDescription: 'Handmade full-grain leather wallet with RFID protection. Authentic quality at Tamjid Mart.',
    views: 180,
    contacts: 44,
    createdAt: Date.now() - 10 * 86400000,
    updatedAt: Date.now()
  },
  {
    id: 'p5',
    name: 'Nordic Ceramic Matte Mug & Carafe',
    category: 'lifestyle',
    price: '৳ 1,450',
    badge: 'Curated',
    featured: false,
    active: true,
    description: 'Artisanal stoneware ceramic finished with a smooth tactile matte glaze. Designed for quiet mornings, specialty pour-over coffee, and contemporary table aesthetics.',
    highlights: 'High-fire durable stoneware ceramic\nErgonomic balanced handle with heat insulation\nFood-grade lead-free matte glaze finish\nDishwasher & microwave safe\n380ml capacity perfect for pour-over or tea',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'TM-CRM-05',
    colorway: 'Sandstone Matte',
    seoTitle: 'Nordic Ceramic Matte Mug | Tamjid Mart',
    seoDescription: 'Artisanal stoneware ceramic mug for tea and coffee lovers at Tamjid Mart.',
    views: 45,
    contacts: 7,
    createdAt: Date.now() - 3 * 86400000,
    updatedAt: Date.now()
  },
  {
    id: 'p6',
    name: 'Heavyweight Relaxed Fit Cotton Tee',
    category: 'fashion',
    price: '৳ 1,200',
    badge: 'Sale',
    featured: true,
    active: true,
    description: 'Engineered from 260 GSM combed compact organic cotton. Features dropped shoulders, a structured boxy drape, and a ribbed mock neck that retains its shape wash after wash.',
    highlights: '260 GSM heavyweight 100% combed cotton\nDrop-shoulder relaxed streetwear silhouette\nPre-shrunk fabric to prevent post-wash shrinkage\nReinforced double-stitched collar and hem\nBreathable, soft, and skin-friendly',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'TM-TEE-06',
    colorway: 'Off-White Stone',
    seoTitle: 'Heavyweight Relaxed Fit Tee | Tamjid Mart',
    seoDescription: 'Shop 260 GSM heavyweight relaxed fit organic cotton tee at Tamjid Mart.',
    views: 110,
    contacts: 22,
    createdAt: Date.now() - 6 * 86400000,
    updatedAt: Date.now()
  },
  {
    id: 'p7',
    name: 'Japanese Indigo Chambray Overshirt',
    category: 'fashion',
    price: '৳ 2,750',
    badge: 'New',
    featured: false,
    active: true,
    description: 'Woven from lightweight Japanese chambray with a classic utility aesthetic. Ideal for transitional layering, equipped with dual flap chest pockets and genuine horn buttons.',
    highlights: '100% indigo-dyed cotton chambray\nTailored utility overshirt fit with curved hem\nDual chest utility pockets with reinforced stitch\nNatural horn buttons with contrast thread\nVersatile styling as jacket or button-down',
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'TM-SHT-07',
    colorway: 'Indigo Wash',
    seoTitle: 'Japanese Indigo Chambray Overshirt | Tamjid Mart',
    seoDescription: 'Curated indigo chambray utility overshirt. Order via WhatsApp on Tamjid Mart.',
    views: 52,
    contacts: 11,
    createdAt: Date.now() - 2 * 86400000,
    updatedAt: Date.now()
  },
  {
    id: 'p8',
    name: 'Waxed Canvas & Leather Weekender Duffel',
    category: 'fashion',
    price: '৳ 3,800',
    badge: 'Premium',
    featured: true,
    active: true,
    description: 'Rugged 16oz water-repellent waxed cotton canvas trimmed with thick vegetable-tanned leather. Spacious 42L capacity featuring a dedicated shoe compartment and brass hardware.',
    highlights: '16oz heavy water-repellent waxed canvas\nTop-grain leather handles and detachable padded shoulder strap\nSeparate ventilated shoe / laundry compartment\nHeavy-duty antique brass YKK zippers\nMeets standard carry-on luggage size guidelines',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'
    ],
    sku: 'TM-BAG-08',
    colorway: 'Vintage Olive & Tan',
    seoTitle: 'Waxed Canvas & Leather Weekender Duffel | Tamjid Mart',
    seoDescription: 'Buy waxed canvas travel duffel bag at Tamjid Mart. Premium craftsmanship with delivery across Bangladesh.',
    views: 135,
    contacts: 31,
    createdAt: Date.now() - 8 * 86400000,
    updatedAt: Date.now()
  }
];

async function seed() {
  console.log('--- Initializing / Migrating Schemas in Supabase ---');
  await initSchema();
  console.log('--- Seeding Categories ---');
  for (const c of categories) {
    await pgInsertCategory(c);
    console.log(`[Category] ${c.id}: ${c.name}`);
  }

  console.log('--- Seeding Banners ---');
  for (const b of banners) {
    await pgInsertBanner(b);
    console.log(`[Banner] ${b.id}: ${b.title}`);
  }

  console.log('--- Seeding Products ---');
  for (const p of products) {
    await pgInsertProduct(p);
    console.log(`[Product] ${p.id}: ${p.name} (${p.price})`);
  }

  console.log('--- Verifying Data from Supabase ---');
  const freshDb = await loadDbFromPostgres();
  console.log(`Total Categories in Supabase: ${freshDb.categories.length}`);
  console.log(`Total Banners in Supabase: ${freshDb.banners.length}`);
  console.log(`Total Products in Supabase: ${freshDb.products.length}`);
  
  await saveDbToPostgres(freshDb);
  console.log('Atomic snapshot synced to tamjid_app_state.');
  await pool.end();
  console.log('Seeding completed successfully!');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  pool.end();
  process.exit(1);
});
