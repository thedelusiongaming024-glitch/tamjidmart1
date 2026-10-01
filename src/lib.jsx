let authToken = typeof localStorage !== 'undefined' ? (localStorage.getItem('tm_adm_token') || '') : '';
export const setAuthToken = (t) => {
  authToken = t || '';
  if (typeof localStorage !== 'undefined') {
    if (t) localStorage.setItem('tm_adm_token', t);
    else localStorage.removeItem('tm_adm_token');
  }
};
export const getAuthToken = () => authToken;

export const api = async (u, m = 'GET', b) => {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
    headers['x-session-token'] = authToken;
  }
  const r = await fetch('/api' + u, {
    method: m,
    headers,
    body: b ? JSON.stringify(b) : undefined
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(j.error || 'Something went wrong.');
    e.status = r.status;
    throw e;
  }
  return j;
};

export const thumb = u => /^\/uploads\/.+\.webp$/.test(u || '') ? u.replace(/\.webp$/, '-t.webp') : u;
export const dl = o => (window.dataLayer = window.dataLayer || []).push(o);
export const track = (id, type) => fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, type }) }).catch(() => {});
export const hue = s => [...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
export const safe = u => /^https?:\/\//.test(u) ? u : '#';

export const waUrl = (S, p, msg) => {
  const num = ((S && S.whatsapp) || '8801700000000').replace(/\D/g, '');
  const text = msg || ((S && S.waMessage) || "Hello Tamjid Mart! I'm interested in {product}. Could you share more details, price and availability?").replace('{product}', p ? p.name : 'your products');
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
};

export const telUrl = S => 'tel:' + ((S && S.phone) || '+8801700000000').replace(/[^\d+]/g, '');

// Clean, premium, minimalist brand product placeholder
export const ProductPlaceholderSVG = ({ name = 'Product', className = 'w-full h-full' }) => {
  const initial = (name || 'T').trim().charAt(0).toUpperCase();
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center select-none bg-gradient-to-br from-[#f8f5f0] via-[#f1eae1] to-[#e8ded4] rounded-2xl ${className}`}>
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/85 shadow-sm border border-black/5 flex items-center justify-center mb-3 text-[#5c412f] font-serif text-2xl sm:text-3xl font-bold">
        {initial}
      </div>
      <p className="text-xs font-semibold text-[#665f59] line-clamp-1 max-w-[140px]">{name}</p>
      <span className="text-[10px] uppercase tracking-wider text-[#9c8e80] mt-0.5">Tamjid Mart</span>
    </div>
  );
};

// High-fidelity stylized Sneaker SVGs with varied colorways
export const SneakerSVG = ({ type = 'gazelle', className = 'w-full h-full', style }) => {
  const palettes = {
    gazelle: { upper: '#e6decb', stripes: '#265842', sole: '#b57e4e', accents: '#d8ceb8', laces: '#ffffff', shadow: '#c2b69f' },
    sand: { upper: '#dfd6c5', stripes: '#312e2b', sole: '#9e6c3e', accents: '#c9bca8', laces: '#f2ede4', shadow: '#bdae99' },
    vomero: { upper: '#80d462', stripes: '#6c429c', sole: '#ffffff', accents: '#222222', laces: '#333333', shadow: '#70b852' },
    retro: { upper: '#f0e6d6', stripes: '#962938', sole: '#d4a574', accents: '#cb9e6e', laces: '#f7f4ed', shadow: '#d6c7b2' },
    stealth: { upper: '#222225', stripes: '#d4af37', sole: '#18181b', accents: '#3a3a40', laces: '#111113', shadow: '#0d0d0f' },
    nightfall: { upper: '#2b4c6f', stripes: '#38b2ac', sole: '#1a202c', accents: '#4299e1', laces: '#e2e8f0', shadow: '#1a365d' },
    summer: { upper: '#f8f9fa', stripes: '#3182ce', sole: '#e2e8f0', accents: '#cbd5e0', laces: '#ffffff', shadow: '#e2e8f0' },
    spezial: { upper: '#2b4c7e', stripes: '#f6e05e', sole: '#975a16', accents: '#2c5282', laces: '#ebf8ff', shadow: '#2a4365' }
  };
  const p = palettes[type] || palettes.gazelle;
  return (
    <svg viewBox="0 0 380 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <defs>
        <filter id={`sh-${type}`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.12" />
        </filter>
        <linearGradient id={`grad-upper-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.upper} />
          <stop offset="100%" stopColor={p.accents} />
        </linearGradient>
        <linearGradient id={`grad-sole-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={p.sole} />
          <stop offset="100%" stopColor={p.sole} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <ellipse cx="190" cy="182" rx="145" ry="12" fill="#000000" fillOpacity="0.08" filter="blur(4px)" />
      <g filter={`url(#sh-${type})`}>
        <path d="M48 168 C 65 174, 110 176, 175 174 C 240 172, 310 170, 332 155 C 336 150, 332 142, 320 144 C 295 148, 220 152, 160 152 C 100 152, 58 148, 44 153 C 38 155, 42 165, 48 168 Z" fill={`url(#grad-sole-${type})`} />
        <path d="M46 154 C 80 158, 170 159, 230 157 C 290 155, 320 150, 326 145 C 322 138, 305 138, 275 140 C 215 143, 110 142, 54 138 C 42 138, 40 148, 46 154 Z" fill="#ffffff" fillOpacity="0.35" />
        <path d="M46 142 C 40 120, 52 82, 86 70 C 104 64, 130 92, 162 104 C 195 116, 240 118, 282 128 C 314 135, 330 144, 324 148 C 300 150, 180 152, 52 145 Z" fill={`url(#grad-upper-${type})`} />
        <path d="M78 72 C 68 55, 82 42, 102 46 C 114 49, 126 62, 130 78 C 120 74, 98 68, 78 72 Z" fill={p.accents} />
        <path d="M92 50 C 98 44, 112 46, 118 56 C 110 58, 100 56, 92 50 Z" fill={p.stripes} />
        <path d="M125 70 C 132 50, 148 42, 165 48 C 158 64, 150 82, 142 96 C 134 88, 128 78, 125 70 Z" fill={p.upper} />
        <path d="M145 144 L 175 108 L 188 112 L 155 146 Z" fill={p.stripes} />
        <path d="M165 146 L 195 110 L 208 114 L 175 147 Z" fill={p.stripes} />
        <path d="M185 147 L 215 112 L 228 116 L 195 148 Z" fill={p.stripes} />
        <path d="M260 130 C 275 125, 305 132, 320 145 C 290 147, 265 144, 252 136 Z" fill={p.shadow} fillOpacity="0.6" />
        <path d="M136 84 C 146 80, 160 88, 172 96" stroke={p.laces} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M148 94 C 160 92, 176 100, 190 108" stroke={p.laces} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M164 106 C 178 104, 194 112, 208 120" stroke={p.laces} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M182 118 C 196 116, 212 122, 226 130" stroke={p.laces} strokeWidth="3" strokeLinecap="round" />
        <circle cx="68" cy="85" r="4" fill={p.stripes} />
      </g>
    </svg>
  );
};
