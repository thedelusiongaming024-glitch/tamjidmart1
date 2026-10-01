// PostgreSQL Database Layer for Tamjid Mart (Direct Cloud DB Queries & Zero Mock Data)
if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(); } catch (_) {}
}
const { Pool } = require('pg');
const crypto = require('crypto');

const hash = (p, s) => crypto.scryptSync(p, s, 32).toString('hex');

const DB_HOST = process.env.DB_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_NAME = process.env.DB_NAME || 'postgres';
const DB_USER = process.env.DB_USER || 'postgres.flulqmmakfjreofduczi';
const DB_PASSWORD = process.env.DB_PASSWORD || 'Minhazul@118';

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected pool error:', err.message);
});

// Initialize database schema with pure relational tables
async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tamjid_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
        site_name TEXT,
        tagline TEXT,
        logo TEXT,
        whatsapp TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        hours TEXT,
        about_text TEXT,
        wa_message TEXT,
        facebook TEXT,
        instagram TEXT,
        youtube TEXT,
        site_url TEXT,
        seo_title TEXT,
        seo_description TEXT,
        keywords TEXT,
        og_image TEXT,
        gtm_id TEXT,
        ga_id TEXT,
        admin_user TEXT,
        admin_salt TEXT,
        admin_hash TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure columns exist if table was created previously
    await client.query(`
      ALTER TABLE tamjid_settings ADD COLUMN IF NOT EXISTS admin_user TEXT;
      ALTER TABLE tamjid_settings ADD COLUMN IF NOT EXISTS admin_salt TEXT;
      ALTER TABLE tamjid_settings ADD COLUMN IF NOT EXISTS admin_hash TEXT;
    `);

    // Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tamjid_categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tamjid_products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50),
        description TEXT,
        highlights TEXT,
        images JSONB DEFAULT '[]'::jsonb,
        badge VARCHAR(50),
        price VARCHAR(100),
        featured BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        views INT DEFAULT 0,
        contacts INT DEFAULT 0,
        seo_title TEXT,
        seo_description TEXT,
        colorway VARCHAR(100),
        sku VARCHAR(100),
        created_at BIGINT,
        updated_at BIGINT
      );
    `);

    // Ensure all product columns exist if table was created previously
    await client.query(`
      ALTER TABLE tamjid_products ADD COLUMN IF NOT EXISTS price VARCHAR(100);
      ALTER TABLE tamjid_products ADD COLUMN IF NOT EXISTS seo_title TEXT;
      ALTER TABLE tamjid_products ADD COLUMN IF NOT EXISTS seo_description TEXT;
      ALTER TABLE tamjid_products ADD COLUMN IF NOT EXISTS colorway VARCHAR(100);
      ALTER TABLE tamjid_products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
      ALTER TABLE tamjid_products ADD COLUMN IF NOT EXISTS views INT DEFAULT 0;
      ALTER TABLE tamjid_products ADD COLUMN IF NOT EXISTS contacts INT DEFAULT 0;
      ALTER TABLE tamjid_products ADD COLUMN IF NOT EXISTS updated_at BIGINT;
    `);

    // Banners table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tamjid_banners (
        id VARCHAR(50) PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT,
        btn_text VARCHAR(100),
        btn_link TEXT,
        image TEXT,
        active BOOLEAN DEFAULT true
      );
    `);

    // Enquiries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tamjid_enquiries (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        product_id VARCHAR(50),
        product_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'new',
        created_at BIGINT
      );
    `);

    // Ensure full atomic state table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tamjid_app_state (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed initial customizable categories if none exist
    const catCount = await client.query('SELECT COUNT(*) FROM tamjid_categories');
    if (parseInt(catCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO tamjid_categories (id, name, description, image) VALUES
        ('gadgets', 'Smart Gadgets & Tech', 'Everyday modern electronics, accessories, and functional tech gear.', ''),
        ('fashion', 'Fashion & Apparel', 'Curated contemporary wear, premium garments, and lifestyle apparel.', ''),
        ('lifestyle', 'Lifestyle & Home Goods', 'Durable craftsmanship, personal grooming, and refined daily essentials.', '')
      `);
    }

    // Seed initial customizable hero banners if none exist
    const banCount = await client.query('SELECT COUNT(*) FROM tamjid_banners');
    if (parseInt(banCount.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO tamjid_banners (id, title, subtitle, btn_text, btn_link, image, active) VALUES
        ('b1', 'Quality Craftsmanship & Modern Living', 'Every product is hand-inspected for durability, authentic quality, and contemporary aesthetic value.', 'Contact Us on WhatsApp', '#contact', '', true),
        ('b2', 'Curated Essentials & Premium Finds', 'Discover verified genuine products, modern gadgets, curated fashion, and lifestyle essentials at honest value.', 'Browse Collection', '#products', '', true)
      `);
    }

    await client.query('COMMIT');
    console.log('[PostgreSQL] Database schemas verified on Supabase.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[PostgreSQL] Schema initialization error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Load pure real data directly from Supabase PostgreSQL tables
async function loadDbFromPostgres() {
  await initSchema();
  try {
    const [settingsRes, catsRes, prodsRes, bansRes, enqsRes, stateRes] = await Promise.all([
      pool.query("SELECT * FROM tamjid_settings WHERE id = 'main'"),
      pool.query('SELECT * FROM tamjid_categories ORDER BY created_at ASC'),
      pool.query('SELECT * FROM tamjid_products ORDER BY created_at DESC'),
      pool.query('SELECT * FROM tamjid_banners ORDER BY id ASC'),
      pool.query('SELECT * FROM tamjid_enquiries ORDER BY created_at DESC LIMIT 2000'),
      pool.query("SELECT data FROM tamjid_app_state WHERE id = 'main'")
    ]);

    // Format products
    const products = prodsRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category || '',
      description: r.description || '',
      highlights: r.highlights || '',
      images: Array.isArray(r.images) ? r.images : (typeof r.images === 'string' ? JSON.parse(r.images || '[]') : []),
      badge: r.badge || '',
      price: r.price || '',
      featured: Boolean(r.featured),
      active: r.active !== false,
      views: parseInt(r.views || 0, 10),
      contacts: parseInt(r.contacts || 0, 10),
      seoTitle: r.seo_title || '',
      seoDescription: r.seo_description || '',
      colorway: r.colorway || '',
      sku: r.sku || '',
      createdAt: parseInt(r.created_at || Date.now(), 10),
      updatedAt: parseInt(r.updated_at || Date.now(), 10)
    }));

    // Format categories
    const categories = catsRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      image: r.image || ''
    }));

    // Format banners
    const banners = bansRes.rows.map(r => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle || '',
      btnText: r.btn_text || '',
      btnLink: r.btn_link || '',
      image: r.image || '',
      active: r.active !== false
    }));

    // Format enquiries
    const enquiries = enqsRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      message: r.message,
      productId: r.product_id || '',
      productName: r.product_name || '',
      status: r.status || 'new',
      createdAt: parseInt(r.created_at || Date.now(), 10)
    }));

    // Format settings
    let settings = {
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
    };

    const defaultSalt = 'e20bfd65d4b0f92b';
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const defaultHash = hash(defaultPassword, defaultSalt);

    let admin = {
      user: 'admin',
      salt: defaultSalt,
      hash: defaultHash
    };

    if (settingsRes.rows.length > 0) {
      const s = settingsRes.rows[0];
      settings = {
        ...settings,
        siteName: s.site_name || settings.siteName,
        tagline: s.tagline || settings.tagline,
        logo: s.logo || '',
        whatsapp: s.whatsapp || settings.whatsapp,
        phone: s.phone || settings.phone,
        email: s.email || settings.email,
        address: s.address || settings.address,
        hours: s.hours || settings.hours,
        aboutText: s.about_text || settings.aboutText,
        waMessage: s.wa_message || settings.waMessage,
        facebook: s.facebook || '',
        instagram: s.instagram || '',
        youtube: s.youtube || '',
        siteUrl: s.site_url || '',
        seoTitle: s.seo_title || settings.seoTitle,
        seoDescription: s.seo_description || settings.seoDescription,
        keywords: s.keywords || settings.keywords,
        ogImage: s.og_image || '',
        gtmId: s.gtm_id || '',
        gaId: s.ga_id || ''
      };
      if (s.admin_user) admin.user = s.admin_user;
      if (s.admin_salt && s.admin_hash) {
        admin.salt = s.admin_salt;
        admin.hash = s.admin_hash;
      }
    } else if (stateRes.rows.length > 0 && stateRes.rows[0].data) {
      const st = stateRes.rows[0].data;
      if (st.settings) settings = { ...settings, ...st.settings };
      if (st.admin) admin = { ...admin, ...st.admin };
    }

    console.log(`[PostgreSQL] Loaded real records: ${products.length} products, ${categories.length} categories, ${banners.length} banners, ${enquiries.length} enquiries.`);

    return {
      settings,
      admin,
      categories,
      products,
      banners,
      enquiries
    };
  } catch (err) {
    console.error('[PostgreSQL] Failed to fetch data from Postgres:', err.message);
    return null;
  }
}

// POST / INSERT product to PostgreSQL
async function pgInsertProduct(p) {
  try {
    await pool.query(`
      INSERT INTO tamjid_products (
        id, name, category, description, highlights, images, badge, price, featured,
        active, views, contacts, seo_title, seo_description, colorway, sku,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO UPDATE SET
        name=$2, category=$3, description=$4, highlights=$5, images=$6::jsonb,
        badge=$7, price=$8, featured=$9, active=$10, views=$11, contacts=$12, seo_title=$13,
        seo_description=$14, colorway=$15, sku=$16, created_at=$17, updated_at=$18
    `, [
      p.id, p.name || '', p.category || '', p.description || '', p.highlights || '',
      JSON.stringify(p.images || []), p.badge || '', p.price || '', Boolean(p.featured),
      p.active !== false, p.views || 0, p.contacts || 0, p.seoTitle || '',
      p.seoDescription || '', p.colorway || '', p.sku || '',
      p.createdAt || Date.now(), p.updatedAt || Date.now()
    ]);
  } catch (err) {
    console.error('[PostgreSQL] Product insert error:', err.message);
  }
}

// DELETE product from PostgreSQL
async function pgDeleteProduct(id) {
  try {
    await pool.query('DELETE FROM tamjid_products WHERE id = $1', [id]);
  } catch (err) {
    console.error('[PostgreSQL] Product delete error:', err.message);
  }
}

// POST / INSERT category to PostgreSQL
async function pgInsertCategory(c) {
  try {
    await pool.query(`
      INSERT INTO tamjid_categories (id, name, description, image)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET name=$2, description=$3, image=$4
    `, [c.id, c.name || '', c.description || '', c.image || '']);
  } catch (err) {
    console.error('[PostgreSQL] Category insert error:', err.message);
  }
}

// DELETE category from PostgreSQL
async function pgDeleteCategory(id) {
  try {
    await pool.query('DELETE FROM tamjid_categories WHERE id = $1', [id]);
    await pool.query('UPDATE tamjid_products SET category = NULL WHERE category = $1', [id]);
  } catch (err) {
    console.error('[PostgreSQL] Category delete error:', err.message);
  }
}

// POST / INSERT banner to PostgreSQL
async function pgInsertBanner(b) {
  try {
    await pool.query(`
      INSERT INTO tamjid_banners (id, title, subtitle, btn_text, btn_link, image, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET title=$2, subtitle=$3, btn_text=$4, btn_link=$5, image=$6, active=$7
    `, [b.id, b.title || '', b.subtitle || '', b.btnText || '', b.btnLink || '', b.image || '', b.active !== false]);
  } catch (err) {
    console.error('[PostgreSQL] Banner insert error:', err.message);
  }
}

// DELETE banner from PostgreSQL
async function pgDeleteBanner(id) {
  try {
    await pool.query('DELETE FROM tamjid_banners WHERE id = $1', [id]);
  } catch (err) {
    console.error('[PostgreSQL] Banner delete error:', err.message);
  }
}

// POST / INSERT enquiry to PostgreSQL
async function pgInsertEnquiry(e) {
  try {
    await pool.query(`
      INSERT INTO tamjid_enquiries (id, name, phone, message, product_id, product_name, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET name=$2, phone=$3, message=$4, product_id=$5, product_name=$6, status=$7
    `, [e.id, e.name, e.phone, e.message, e.productId || '', e.productName || '', e.status || 'new', e.createdAt || Date.now()]);
  } catch (err) {
    console.error('[PostgreSQL] Enquiry insert error:', err.message);
  }
}

// Track product view or WhatsApp inquiry contact count in PostgreSQL
async function pgTrackMetric(productId, type) {
  try {
    if (type === 'contact') {
      await pool.query('UPDATE tamjid_products SET contacts = contacts + 1 WHERE id = $1', [productId]);
    } else {
      await pool.query('UPDATE tamjid_products SET views = views + 1 WHERE id = $1', [productId]);
    }
  } catch (err) {
    console.error('[PostgreSQL] Metric track error:', err.message);
  }
}

// Update site settings in PostgreSQL
async function pgUpdateSettings(s, admin) {
  try {
    await pool.query(`
      INSERT INTO tamjid_settings (
        id, site_name, tagline, logo, whatsapp, phone, email, address, hours,
        about_text, wa_message, facebook, instagram, youtube, site_url,
        seo_title, seo_description, keywords, og_image, gtm_id, ga_id,
        admin_user, admin_salt, admin_hash, updated_at
      ) VALUES (
        'main', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, CURRENT_TIMESTAMP
      ) ON CONFLICT (id) DO UPDATE SET
        site_name=$1, tagline=$2, logo=$3, whatsapp=$4, phone=$5, email=$6,
        address=$7, hours=$8, about_text=$9, wa_message=$10, facebook=$11,
        instagram=$12, youtube=$13, site_url=$14, seo_title=$15, seo_description=$16,
        keywords=$17, og_image=$18, gtm_id=$19, ga_id=$20,
        admin_user=COALESCE($21, tamjid_settings.admin_user),
        admin_salt=COALESCE($22, tamjid_settings.admin_salt),
        admin_hash=COALESCE($23, tamjid_settings.admin_hash),
        updated_at=CURRENT_TIMESTAMP
    `, [
      s.siteName || '', s.tagline || '', s.logo || '', s.whatsapp || '', s.phone || '', s.email || '',
      s.address || '', s.hours || '', s.aboutText || '', s.waMessage || '', s.facebook || '', s.instagram || '',
      s.youtube || '', s.siteUrl || '', s.seoTitle || '', s.seoDescription || '', s.keywords || '',
      s.ogImage || '', s.gtmId || '', s.gaId || '',
      admin ? admin.user : null, admin ? admin.salt : null, admin ? admin.hash : null
    ]);
  } catch (err) {
    console.error('[PostgreSQL] Settings update error:', err.message);
  }
}

// Sync full state snapshot into PostgreSQL
async function saveDbToPostgres(db) {
  if (!db) return;
  try {
    await pgUpdateSettings(db.settings || {}, db.admin);
    await pool.query(`
      INSERT INTO tamjid_app_state (id, data, updated_at) 
      VALUES ('main', $1::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET data = $1::jsonb, updated_at = CURRENT_TIMESTAMP
    `, [JSON.stringify(db)]);
  } catch (err) {
    console.error('[PostgreSQL] Save state snapshot error:', err.message);
  }
}

module.exports = {
  pool,
  initSchema,
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
};
