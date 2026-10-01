import {createContext,useContext,useEffect,useState,useMemo} from 'react';
import {Link,Outlet,useLocation,useParams,useNavigate} from 'react-router-dom';
import {api,thumb,dl,track,safe,waUrl,telUrl,ProductPlaceholderSVG} from './lib';
import {translations} from './translations';

const Ctx=createContext();
export const useD=()=>useContext(Ctx);

// Bengali number converter helper
const toBnNum=(n)=>{
  const digits={'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'};
  return String(n).replace(/\d/g,d=>digits[d]||d);
};

export function DataProvider({children}){
  const [d,setD]=useState(window.__DATA__||null);
  const [err,setErr]=useState(false);
  const [toast,setToast]=useState('');
  const [contactProduct,setContactProduct]=useState(null);
  
  // Language state (default: 'bn' - Bangla)
  const [lang,setLangState]=useState(()=>{
    try {
      return localStorage.getItem('tm_lang') || 'bn';
    } catch {
      return 'bn';
    }
  });

  const setLang=(l)=>{
    setLangState(l);
    try {
      localStorage.setItem('tm_lang',l);
    } catch {}
  };

  useEffect(()=>{
    if(!d) api('/public').then(setD).catch(()=>setErr(true));
  },[]);

  const showToast=(msg)=>{
    setToast(msg);
    setTimeout(()=>setToast(''),2800);
  };

  // Translation helper function
  const t=(key,fallback='')=>{
    const dict=translations[lang]||translations.bn;
    return dict[key]!==undefined ? dict[key] : (translations.en[key]!==undefined ? translations.en[key] : fallback);
  };

  // Dynamic Category Name Translator
  const cname=(id)=>{
    if(!d) return '';
    const cat=d.categories?.find(c=>c.id===id);
    if(cat){
      const transKey=cat.id;
      if(translations[lang]?.[transKey]) return translations[lang][transKey];
      return cat.name;
    }
    return lang==='bn'?'সাধারণ ক্যাটাগরি':'General Category';
  };

  if(err) return <p className="p-10 text-center text-[#5c412f]">Could not load the catalog. Please refresh.</p>;
  if(!d) return <div className="min-h-screen grid place-items-center text-[#78716c] font-serif text-2xl">লোড হচ্ছে তানজিদ মার্ট...</div>;

  const categoriesWithAll=[{id:'all',name:t('filterAll')},...(d.categories||[])];

  return (
    <Ctx.Provider value={{
      ...d,
      lang,
      setLang,
      t,
      cname,
      categoriesWithAll,
      showToast,
      contactProduct,
      setContactProduct,
      toBnNum
    }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1c1917] text-white px-6 py-3.5 rounded-2xl shadow-elevated text-sm font-medium flex items-center gap-3 animate-fade-in border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          {toast}
        </div>
      )}
      {contactProduct && <ContactModal product={contactProduct} onClose={()=>setContactProduct(null)}/>}
    </Ctx.Provider>
  );
}

// Visual product image component with clean universal fallback & auto-resizing
export const ProductImage=({src,product,className="w-full h-full object-contain p-3"})=>{
  const [error,setError]=useState(false);

  useEffect(()=>{
    setError(false);
  },[src]);

  if(src && !error){
    return (
      <img
        loading="lazy"
        src={thumb(src)}
        alt={product?.name||'Product'}
        className={`${className} max-w-full max-h-full transition-transform duration-300`}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={()=>setError(true)}
      />
    );
  }
  return <ProductPlaceholderSVG name={product?.name} className="w-full h-full"/>;
};

// Language Toggle Switch Component
export function LanguageToggle({className=""}){
  const {lang,setLang}=useD();
  return (
    <div className={`inline-flex items-center p-1 rounded-full bg-[#eae4db] border border-black/5 shadow-inner ${className}`}>
      <button
        type="button"
        onClick={()=>setLang('bn')}
        className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 ${lang==='bn'?'bg-[#5c412f] text-white shadow-xs':'text-[#665f59] hover:text-[#1c1917]'}`}
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={()=>setLang('en')}
        className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 ${lang==='en'?'bg-[#5c412f] text-white shadow-xs':'text-[#665f59] hover:text-[#1c1917]'}`}
      >
        EN
      </button>
    </div>
  );
}

// Top Shell with Navbar, Language Toggle, and Contact Actions
export function Shell(){
  const {settings:S,t,lang}=useD();
  const [mobileNavOpen,setMobileNavOpen]=useState(false);

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 selection:bg-[#5c412f] selection:text-white">
      {/* Top Banner Notice */}
      <div className="bg-[#1c1917] text-[#e8ded4] text-[11px] sm:text-xs py-2 px-3 sm:px-4 text-center font-medium tracking-wide">
        {t('topBanner')}
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-black/[0.06] shadow-xs">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-95 transition-opacity">
            {S.logo ? (
              <img src={S.logo} alt={S.siteName || "Tamjid Mart"} className="h-8 sm:h-10 w-auto object-contain" />
            ) : (
              <div className="flex items-center gap-2 font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1c1917]">
                <span className="inline-block w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1b5e20] text-white text-sm sm:text-base font-serif flex items-center justify-center shadow-sm">T</span>
                <span>{lang==='bn'?'তানজিদ মার্ট':(S.siteName||'Tamjid Mart')}</span>
              </div>
            )}
            {S.logo && lang === 'bn' && (
              <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 tracking-tight">
                তানজিদ মার্ট
              </span>
            )}
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[14px] font-medium text-[#665f59]">
            <Link to="/" className="hover:text-[#1c1917] transition-colors">{t('navHome')}</Link>
            <a href="/#collections" className="hover:text-[#1c1917] transition-colors">{t('navCollections')}</a>
            <a href="/#new" className="hover:text-[#1c1917] transition-colors">{t('navNew')}</a>
            <a href="/#recommend" className="hover:text-[#1c1917] transition-colors">{t('navRecommend')}</a>
            <a href="/#products" className="hover:text-[#1c1917] transition-colors">{t('navProducts')}</a>
            <a href="/#contact" className="hover:text-[#1c1917] transition-colors">{t('navContact')}</a>
          </nav>

          {/* Header Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Toggle */}
            <LanguageToggle/>

            {/* Direct Call Button (tablet & desktop) */}
            <a
              href={telUrl(S)}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full bg-[#f4f1ea] text-[#1c1917] hover:bg-[#ede5dc] transition-colors border border-black/5"
            >
              <svg className="w-3.5 h-3.5 text-[#5c412f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <span>{t('callUs')}</span>
            </a>

            {/* WhatsApp Contact Button (sm screens & above) */}
            <a
              href={waUrl(S)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-semibold rounded-full bg-[#5c412f] text-white hover:bg-[#453022] transition-colors shadow-sm"
            >
              <span>{t('contactUs')}</span>
            </a>

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={()=>setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden p-2 rounded-xl text-[#1c1917] hover:bg-black/5 active:bg-black/10 transition-colors"
              aria-label={t('mobileMenu')}
            >
              {mobileNavOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-over Drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={()=>setMobileNavOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-[82%] max-w-xs h-full bg-[#faf8f5] shadow-2xl p-6 flex flex-col justify-between z-10 overflow-y-auto">
            <div>
              {/* Drawer Brand & Close Button */}
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.08] mb-5">
                <Link to="/" onClick={()=>setMobileNavOpen(false)} className="flex items-center gap-2">
                  {S.logo ? (
                    <img src={S.logo} alt="Tamjid Mart" className="h-8 w-auto object-contain" />
                  ) : (
                    <span className="font-serif font-bold text-xl text-[#1c1917]">Tamjid Mart</span>
                  )}
                </Link>
                <button
                  onClick={()=>setMobileNavOpen(false)}
                  className="p-2 rounded-lg text-[#78716c] hover:text-[#1c1917] hover:bg-black/5"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex flex-col space-y-1 text-sm font-semibold text-[#1c1917]">
                <Link to="/" onClick={()=>setMobileNavOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-black/5 flex items-center justify-between transition-colors">
                  <span>{t('navHome')}</span>
                  <span className="text-xs text-[#78716c]">→</span>
                </Link>
                <a href="/#collections" onClick={()=>setMobileNavOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-black/5 flex items-center justify-between transition-colors">
                  <span>{t('navCollections')}</span>
                  <span className="text-xs text-[#78716c]">→</span>
                </a>
                <a href="/#new" onClick={()=>setMobileNavOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-black/5 flex items-center justify-between transition-colors">
                  <span>{t('navNew')}</span>
                  <span className="text-xs text-[#78716c]">→</span>
                </a>
                <a href="/#recommend" onClick={()=>setMobileNavOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-black/5 flex items-center justify-between transition-colors">
                  <span>{t('navRecommend')}</span>
                  <span className="text-xs text-[#78716c]">→</span>
                </a>
                <a href="/#products" onClick={()=>setMobileNavOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-black/5 flex items-center justify-between transition-colors">
                  <span>{t('navProducts')}</span>
                  <span className="text-xs text-[#78716c]">→</span>
                </a>
                <a href="/#contact" onClick={()=>setMobileNavOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-black/5 flex items-center justify-between transition-colors">
                  <span>{t('navContact')}</span>
                  <span className="text-xs text-[#78716c]">→</span>
                </a>
                <Link to="/admin" onClick={()=>setMobileNavOpen(false)} className="px-3 py-2.5 rounded-xl hover:bg-black/5 flex items-center justify-between text-[#78716c] text-xs mt-3 pt-3 border-t border-black/5">
                  <span>{t('adminPortal')}</span>
                  <span>🔐</span>
                </Link>
              </nav>
            </div>

            {/* Drawer Quick Action Buttons */}
            <div className="pt-5 border-t border-black/[0.08] space-y-2.5">
              <a
                href={telUrl(S)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#eae4db] text-[#2c221e] hover:bg-[#ded6ca] transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5 text-[#5c412f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span>{t('callUs')} ({S.phone||'+8801700000000'})</span>
              </a>

              <a
                href={waUrl(S)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#25d366] text-white hover:bg-[#1ebd59] transition-colors text-center shadow-xs flex items-center justify-center gap-2"
              >
                <span>{t('chatWhatsApp')}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1">
        <Outlet/>
      </main>

      {/* Footer */}
      <Footer/>

      {/* Sticky Mobile Bottom Navigation Dock (App-Like Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-black/10 py-1.5 px-2 flex items-center justify-around shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
        <Link to="/" className="flex flex-col items-center py-1 px-2 text-[#78716c] hover:text-[#5c412f] active:scale-95 transition-transform">
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span className="text-[10px] font-semibold">{t('navHome')}</span>
        </Link>

        <a href="/#collections" className="flex flex-col items-center py-1 px-2 text-[#78716c] hover:text-[#5c412f] active:scale-95 transition-transform">
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
          <span className="text-[10px] font-semibold">{t('navCollections')}</span>
        </a>

        <a href="/#products" className="flex flex-col items-center py-1 px-2 text-[#78716c] hover:text-[#5c412f] active:scale-95 transition-transform">
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          <span className="text-[10px] font-semibold">{t('navProducts')}</span>
        </a>

        <a href={waUrl(S)} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center py-1 px-2 text-emerald-600 active:scale-95 transition-transform">
          <div className="w-5 h-5 flex items-center justify-center mb-0.5">
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">💬</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700">WhatsApp</span>
        </a>

        <a href={telUrl(S)} className="flex flex-col items-center py-1 px-2 text-[#5c412f] active:scale-95 transition-transform">
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
          <span className="text-[10px] font-semibold">{t('callUs')}</span>
        </a>
      </nav>

      {/* Floating WhatsApp Consultation Button (positioned above mobile dock on small screens) */}
      <a
        href={waUrl(S)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('chatWhatsApp')}
        className="fixed right-4 sm:right-6 bottom-20 md:bottom-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25d366] text-white flex items-center justify-center shadow-elevated text-xl sm:text-2xl hover:scale-110 active:scale-95 transition-transform"
      >
        <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </a>
    </div>
  );
}

// Interactive Product Card matching the user's mockup with Contact Us actions & layout variants
export function ProductCard({p, layout='auto'}){
  const {cname,settings:S,t,lang,toBnNum}=useD();
  const to=`/p/${p.slug||p.id}`;

  const translatedBadge=(badge)=>{
    if(!badge) return '';
    const b=badge.toLowerCase();
    if(lang==='bn'){
      if(b.includes('new')) return 'নতুন';
      if(b.includes('trend')) return 'জনপ্রিয়';
      if(b.includes('sale')||b.includes('seller')||b.includes('hot')) return 'হট ডিল';
      if(b.includes('feat')) return 'ফিচার্ড';
    }
    return badge;
  };

  // Horizontal Card / Cart View (Optimized for Mobile and List View)
  if (layout === 'horizontal') {
    return (
      <article className="bg-[#f7f6f2] rounded-2xl p-3 sm:p-4 flex flex-row items-center gap-3 sm:gap-4 border border-black/[0.04] transition-all duration-200 hover:shadow-card hover:-translate-y-0.5 group">
        {/* Left: Thumbnail Stage with Badge */}
        <Link to={to} className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-xl bg-[#eae7df]/60 overflow-hidden flex items-center justify-center p-2 border border-black/5" aria-label={p.name}>
          <ProductImage src={p.images?.[0]} product={p} className="w-full h-full object-contain drop-shadow-xs" />
          {p.badge && (
            <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/95 text-[#5c412f] shadow-xs">
              {translatedBadge(p.badge)}
            </span>
          )}
        </Link>

        {/* Right: Info & Actions */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-[11px] font-medium text-[#78716c] truncate max-w-[130px]">
                {cname(p.category)}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('available')}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-serif font-bold text-[#1c1917] line-clamp-1 group-hover:text-[#5c412f] transition-colors">
              <Link to={to}>{p.name}</Link>
            </h3>

            {p.price && (
              <div className="text-sm sm:text-base font-extrabold text-[#5c412f] tracking-tight mt-0.5">
                {lang === 'bn' ? toBnNum(p.price) : p.price}
              </div>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 mt-2 pt-1">
            <a
              href={telUrl(S)}
              onClick={()=>track(p.id,'contact')}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-[#eae4db] text-[#2c221e] hover:bg-[#ded6ca] transition-colors flex items-center justify-center gap-1 active:scale-95"
              aria-label={t('callUs')}
              title={t('callUs')}
            >
              <svg className="w-3.5 h-3.5 text-[#5c412f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <span className="hidden sm:inline">{t('callUs')}</span>
            </a>

            <a
              href={waUrl(S,p,lang==='bn'?`আসসালামু আলাইকুম তানজিদ মার্ট! আমি ${p.name} প্রোডাক্টটি সম্পর্কে জানতে আগ্রহী। স্টক ও মূল্য কি জানানো যাবে?`:`Hello Tamjid Mart! I am interested in ${p.name}. Is this available in stock?`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={()=>track(p.id,'contact')}
              className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#5c412f] text-white hover:bg-[#453022] transition-colors text-center shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>{t('quickOrder')}</span>
            </a>
          </div>
        </div>
      </article>
    );
  }

  // Vertical Grid Card View
  return (
    <article className="bg-[#f7f6f2] rounded-[22px] sm:rounded-[28px] p-3 sm:p-4 flex flex-col border border-black/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-card group">
      {/* Product Image Stage */}
      <div className="relative aspect-[4/3] rounded-xl sm:rounded-2xl bg-[#eae7df]/50 overflow-hidden flex items-center justify-center p-2.5 sm:p-3 mb-2.5 sm:mb-4">
        <Link to={to} className="w-full h-full flex items-center justify-center" aria-label={p.name}>
          <ProductImage src={p.images?.[0]} product={p}/>
        </Link>
        {p.badge && (
          <span className="absolute top-2 right-2 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[#5c412f] shadow-xs">
            {translatedBadge(p.badge)}
          </span>
        )}
      </div>

      {/* Category Header */}
      <div className="flex items-center justify-between gap-1.5 mb-1 px-1">
        <span className="text-[10px] sm:text-[11px] font-medium text-[#78716c] px-2 py-0.5 rounded-md bg-[#ede9e2] truncate max-w-[110px]">
          {cname(p.category)}
        </span>
        <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {t('available')}
        </span>
      </div>

      {/* Product Name */}
      <h3 className="text-sm sm:text-[19px] font-serif font-bold text-[#1c1917] mb-1 px-1 line-clamp-1 group-hover:text-[#5c412f] transition-colors">
        <Link to={to}>{p.name}</Link>
      </h3>

      {/* Price Tag */}
      {p.price && (
        <div className="px-1 mb-1.5">
          <span className="text-sm sm:text-lg font-extrabold text-[#5c412f] tracking-tight">
            {lang === 'bn' ? toBnNum(p.price) : p.price}
          </span>
        </div>
      )}

      {/* Clean 2-line Description */}
      <p className="text-xs sm:text-[13px] text-[#78716c] line-clamp-2 mb-3 sm:mb-4 px-1 leading-relaxed">
        {p.description||(lang==='bn'?'প্রিমিয়াম কোয়ালিটি উপাদান, নিখুঁত ফিনিশিং ও দীর্ঘস্থায়ী স্থায়িত্বের নিশ্চয়তা।':'Premium grade materials, refined finish, and guaranteed durability.')}
      </p>

      {/* Contact Actions: WhatsApp redirect / Call Us */}
      <div className="mt-auto grid grid-cols-2 gap-1.5 sm:gap-2 pt-1">
        <a
          href={telUrl(S)}
          onClick={()=>track(p.id,'contact')}
          className="w-full py-2 sm:py-2.5 px-2 rounded-xl text-xs font-semibold bg-[#eae4db] text-[#2c221e] hover:bg-[#ded6ca] transition-colors active:scale-95 text-center flex items-center justify-center gap-1"
        >
          <svg className="w-3.5 h-3.5 text-[#5c412f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
          <span className="truncate">{t('callUs')}</span>
        </a>
        <a
          href={waUrl(S,p,lang==='bn'?`আসসালামু আলাইকুম তানজিদ মার্ট! আমি ${p.name} প্রোডাক্টটি সম্পর্কে জানতে আগ্রহী। স্টক ও মূল্য কি জানানো যাবে?`:`Hello Tamjid Mart! I am interested in ${p.name}. Is this available in stock?`)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={()=>track(p.id,'contact')}
          className="w-full py-2 sm:py-2.5 px-2 rounded-xl text-xs font-semibold bg-[#5c412f] text-white hover:bg-[#453022] transition-colors active:scale-95 text-center shadow-xs flex items-center justify-center gap-1"
        >
          <span className="truncate">{t('contactUs')}</span>
        </a>
      </div>
    </article>
  );
}

// Hero Section with Full-View Auto-Resizing Image Slideshow
function HeroSection(){
  const {banners:B,products:P,settings:S,t,lang}=useD();
  const [activeSlide,setActiveSlide]=useState(0);
  const [searchQuery,setSearchQuery]=useState('');
  const [imgErrors,setImgErrors]=useState({});
  const navigate=useNavigate();

  const handleHeroSearch=(e)=>{
    e.preventDefault();
    if(searchQuery.trim()){
      navigate(`/#products?q=${encodeURIComponent(searchQuery.trim())}`);
      document.getElementById('products')?.scrollIntoView({behavior:'smooth'});
    }
  };

  const heroSlides=useMemo(()=>{
    // 1. Check if custom active banners exist in database
    const activeCustomBanners=(B||[]).filter(b=>b.active!==false);
    if(activeCustomBanners.length>0){
      return activeCustomBanners.map((b,i)=>({
        id:b.id||String(i),
        title:b.title,
        subtitle:b.subtitle,
        btnText:b.btnText||t('heroBtnContact'),
        btnLink:b.btnLink||waUrl(S,null,lang==='bn'?"আসসালামু আলাইকুম তানজিদ মার্ট! আপনাদের কালেকশন সম্পর্কে বিস্তারিত জানতে চাই।":"Hello Tamjid Mart! I'm browsing your catalog and would like to inquire about availability."),
        image:b.image,
        badge:lang==='bn'?'বিশেষ অফার':'Special Feature'
      }));
    }

    // 2. Check if products with images exist in database
    const prodsWithImgs=(P||[]).filter(p=>p.active!==false && p.images && p.images.length>0);
    if(prodsWithImgs.length>0){
      return prodsWithImgs.slice(0,5).map((p,i)=>({
        id:p.id,
        title:p.name,
        subtitle:p.description||(lang==='bn'?'প্রিমিয়াম কোয়ালিটি ও শতভাগ খাঁটি পণ্য। এখনই অর্ডার করুন বা স্টক জানতে মেসেজ দিন।':'Verified authentic quality. Inquire now for doorstep delivery.'),
        btnText:t('heroBtnContact'),
        btnLink:waUrl(S,p,lang==='bn'?`আসসালামু আলাইকুম তানজিদ মার্ট! আমি ${p.name} সম্পর্কে বিস্তারিত জানতে চাই।`:`Hello Tamjid Mart! I am interested in ${p.name}.`),
        image:p.images[0],
        badge:p.badge||(lang==='bn'?'জনপ্রিয় কালেকশন':'Featured Pick')
      }));
    }

    // 3. Default curated platform slides
    return [
      {
        id:'1',
        title:t('heroTitle1'),
        subtitle:t('heroSubtitle1'),
        btnText:t('heroBtnContact'),
        btnLink:waUrl(S,null,lang==='bn'?"আসসালামু আলাইকুম তানজিদ মার্ট! আমি আপনাদের কালেকশন ও স্টক সম্পর্কে বিস্তারিত জানতে চাই।":"Hello Tamjid Mart! I'm browsing your store and would like to inquire about availability."),
        badge:lang==='bn'?'প্রিমিয়াম কালেকশন':'Curated Luxury'
      },
      {
        id:'2',
        title:t('heroTitle2'),
        subtitle:t('heroSubtitle2'),
        btnText:t('heroBtnContact'),
        btnLink:waUrl(S,null,lang==='bn'?"আসসালামু আলাইকুম তানজিদ মার্ট! আপনাদের নতুন প্রোডাক্ট ও গ্যাজেটস সম্পর্কে জানান।":"Hello Tamjid Mart! I'm interested in your fresh new arrivals."),
        badge:lang==='bn'?'নতুন ড্রপস':'Fresh Drops'
      },
      {
        id:'3',
        title:t('heroTitle3'),
        subtitle:t('heroSubtitle3'),
        btnText:t('heroBtnContact'),
        btnLink:waUrl(S,null,lang==='bn'?"আসসালামু আলাইকুম তানজিদ মার্ট! ডেলিভারি ও অর্ডার প্রসেস সম্পর্কে জানতে চাই।":"Hello Tamjid Mart! I would like to place an order via WhatsApp."),
        badge:lang==='bn'?'দ্রুত ডেলিভারি':'Express Care'
      }
    ];
  },[B,P,S,lang,t]);

  const slideCount=heroSlides.length;
  const currentSlide=heroSlides[activeSlide]||heroSlides[0];

  // Auto slide with smooth timer
  useEffect(()=>{
    if(slideCount<=1) return;
    const timer=setInterval(()=>{
      setActiveSlide(s=>(s+1)%slideCount);
    },4500);
    return ()=>clearInterval(timer);
  },[slideCount]);

  return (
    <section className="mt-2 sm:mt-4 mb-8 sm:mb-10 max-w-[1360px] mx-auto px-3 sm:px-4 lg:px-10">
      <div className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden min-h-[440px] sm:min-h-[520px] lg:min-h-[580px] flex items-center shadow-card bg-[#ece4db] border border-[#d9ccb9] text-[#1c1917]">
        {/* Full-View Auto-Resizing Slideshow Layers */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {heroSlides.map((slide,idx)=>{
            const hasImg=slide.image && !imgErrors[slide.id||idx];
            return (
              <div
                key={slide.id||idx}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${activeSlide===idx?'opacity-100':'opacity-0 pointer-events-none'}`}
              >
                {/* Full-View Image taking the whole container */}
                {hasImg ? (
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-7000 ease-out"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={()=>setImgErrors(e=>({...e,[slide.id||idx]:true}))}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#ded2be] via-[#e5dbc4] to-[#ece4db]">
                    <div className="absolute -right-20 -bottom-20 w-[500px] h-[500px] rounded-full bg-white/40 blur-3xl pointer-events-none"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Top Right Hero Search Bar */}
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-30">
          <form onSubmit={handleHeroSearch} className="relative flex items-center">
            <input
              type="search"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              className="w-36 sm:w-64 md:w-72 pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-[11px] sm:text-sm rounded-full bg-white/95 hover:bg-white focus:bg-white text-[#1c1917] placeholder:text-[#78716c] shadow-md backdrop-blur-md border border-black/10 outline-none focus:ring-2 focus:ring-[#5c412f]/30 transition-all"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute left-3 text-[#5c412f] hover:text-[#1c1917] transition-colors"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
          </form>
        </div>

        {/* Foreground Content */}
        <div className="relative z-20 w-full p-5 sm:p-12 lg:p-16 pt-16 sm:pt-20 lg:pt-16 max-w-xl lg:max-w-2xl flex flex-col items-start">
          {/* Slide Tag / Badge */}
          {currentSlide.badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#5c412f]/10 text-[#5c412f] border border-[#5c412f]/20 mb-3 sm:mb-4 animate-fade-in shadow-xs backdrop-blur-xs">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#5c412f]"></span>
              {currentSlide.badge}
            </span>
          )}

          {/* Editorial Title */}
          <h1 className="font-serif text-[28px] sm:text-[44px] lg:text-[54px] font-bold text-[#1c1917] leading-[1.15] sm:leading-[1.12] tracking-tight mb-3 sm:mb-4 transition-all duration-700 drop-shadow-xs">
            {currentSlide.title}
          </h1>

          {/* Subtitle / Description */}
          <p className="text-[#5a4d43] text-xs sm:text-base lg:text-lg font-sans mb-6 sm:mb-8 leading-relaxed max-w-md lg:max-w-lg transition-all duration-700">
            {currentSlide.subtitle}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <a
              href={currentSlide.btnLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial text-center px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#5c412f] text-white font-semibold text-xs sm:text-base shadow-md hover:bg-[#432f22] hover:scale-105 active:scale-95 transition-all duration-200"
            >
              {currentSlide.btnText}
            </a>
            <a
              href="/#products"
              className="flex-1 sm:flex-initial text-center px-5 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/80 text-[#1c1917] font-semibold text-xs sm:text-base backdrop-blur-xs border border-black/10 hover:bg-white transition-colors"
            >
              {t('browseCollection')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// Categories Feature Section (Light Luxury Theme - 100% wired to database)
function PromoCardsSection(){
  const {categories:C,products:P,settings:S,t,lang,cname}=useD();

  // If no categories in DB yet, show fallback guide
  const catsList = C && C.length > 0 ? C : [
    { id: 'gadgets', name: 'Smart Gadgets & Tech', description: 'Everyday modern electronics and functional tech accessories.', image: '' },
    { id: 'fashion', name: 'Fashion & Apparel', description: 'Curated modern wear, premium garments, and lifestyle apparel.', image: '' },
    { id: 'lifestyle', name: 'Lifestyle & Essentials', description: 'Durable craftsmanship, personal grooming, and verified essentials.', image: '' }
  ];

  return (
    <section id="collections" className="my-8 sm:my-12 max-w-[1360px] mx-auto px-4 lg:px-10">
      <div className="rounded-[36px] bg-[#fbf9f6] border border-[#e8e1d7] p-6 sm:p-10 lg:p-12 shadow-card">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#eae2d7] text-[#5c412f] border border-[#d8ccbe] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#5c412f]"></span>
            {t('badgeCollections')}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#1c1917] mb-2">
            {t('navCollections')}
          </h2>
          <p className="text-sm sm:text-base text-[#78716c]">
            {lang==='bn'?'ডাটাবেজ থেকে সরাসরি ক্যাটাগরি ব্রাউজ করুন':'Browse verified categories customized directly from the admin panel'}
          </p>
        </div>

        {/* Dynamic Category Cards Grid in Warm Light Aesthetic */}
        <div className={`grid grid-cols-1 ${catsList.length===2?'md:grid-cols-2':catsList.length>=4?'sm:grid-cols-2 lg:grid-cols-4':'md:grid-cols-3'} gap-6`}>
          {catsList.map((cat, idx)=>{
            const prodsInCat = (P||[]).filter(p=>p.category===cat.id);
            const countStr = lang==='bn' ? `${prodsInCat.length} টি প্রোডাক্ট` : `${prodsInCat.length} products`;
            const bgGradients = [
              'bg-gradient-to-br from-[#f8f5ee] to-[#ece5d8] border-[#dfd6c8]',
              'bg-gradient-to-br from-[#f6f2ea] to-[#e8decb] border-[#dcd0bc]',
              'bg-gradient-to-br from-[#f5f1eb] to-[#e7e1d5] border-[#dad0c1]',
              'bg-gradient-to-br from-[#faf6f0] to-[#eae3d5] border-[#dfd7c6]'
            ];
            const bgClass = bgGradients[idx % bgGradients.length];

            return (
              <div
                key={cat.id||idx}
                className={`relative rounded-[30px] ${bgClass} text-[#1c1917] overflow-hidden p-8 flex flex-col justify-end min-h-[320px] group shadow-card border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                {/* Background Image if uploaded in Admin */}
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 group-hover:opacity-45 transition-all duration-700"
                  />
                ) : null}

                {/* Delicate Light Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f5]/95 via-[#faf8f5]/70 to-transparent z-10"></div>

                {/* Content */}
                <div className="relative z-20">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#8a684f]">
                      {cat.name}
                    </span>
                    <span className="text-[11px] font-semibold text-[#5c412f] bg-[#5c412f]/10 border border-[#5c412f]/15 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      {countStr}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl font-bold mb-2 leading-snug text-[#1c1917]">
                    {cname(cat.id)}
                  </h3>

                  {cat.description && (
                    <p className="text-xs text-[#665f59] mb-5 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`/#products`}
                      className="inline-block px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#5c412f] text-white hover:bg-[#432f22] hover:scale-105 transition-all shadow-sm"
                    >
                      {t('browseCollection')}
                    </a>
                    <a
                      href={waUrl(S,null,lang==='bn'?`আসসালামু আলাইকুম তানজিদ মার্ট! আমি ${cat.name} ক্যাটাগরির প্রোডাক্ট সম্পর্কে জানতে চাই।`:`Hello Tamjid Mart! I am interested in ${cat.name} products.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block p-2.5 rounded-xl text-xs bg-[#5c412f]/10 text-[#5c412f] hover:bg-[#5c412f]/20 transition-colors"
                      title={t('chatWhatsApp')}
                    >
                      💬
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// "Most Recommended For You" (Light Luxury Bento Grid - 100% wired to database)
function RecommendedMosaicSection(){
  const {products:P,settings:S,t,lang,cname}=useD();

  // Pick products marked as "featured" in admin, or fill with latest active products
  const recProducts=useMemo(()=>{
    const featured = (P||[]).filter(p=>p.featured && p.active!==false);
    const regular = (P||[]).filter(p=>!p.featured && p.active!==false);
    const combined = [...featured, ...regular];
    return combined.slice(0, 4);
  },[P]);

  const p1 = recProducts[0];
  const p2 = recProducts[1];
  const p3 = recProducts[2];
  const p4 = recProducts[3];

  return (
    <section id="recommend" className="my-8 sm:my-12 max-w-[1360px] mx-auto px-4 lg:px-10">
      <div className="rounded-[36px] bg-[#f7f3ec] border border-[#e5dcce] p-6 sm:p-10 lg:p-12 shadow-card">
        {/* Section Header */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#eae0d2] text-[#5c412f] border border-[#d8cbba] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#5c412f]"></span>
            {t('badgeRecommended')}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#1c1917] mb-2.5">
            {t('recTitle')}
          </h2>
          <p className="text-sm sm:text-base text-[#615a54]">
            {t('recSubtitle')}
          </p>
        </div>

        {/* Bento Grid Layout in Light Luxury Aesthetic */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Left Tall Card (Spans 6 cols on md) */}
          <div className="md:col-span-6 rounded-[32px] bg-gradient-to-br from-[#ebe2d4] via-[#e2d5c3] to-[#d6c5af] border border-[#cbbaa3] p-8 relative overflow-hidden min-h-[420px] flex flex-col justify-end group shadow-card text-[#1c1917]">
            <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f5]/90 via-[#faf8f5]/40 to-transparent z-10"></div>
            <div className="absolute inset-0 flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-700">
              {p1 ? (
                <ProductImage src={p1.images?.[0]} product={p1} className="w-full h-full max-h-[280px] object-contain drop-shadow-xl"/>
              ) : (
                <div className="text-8xl opacity-30 text-[#8a684f]">✨</div>
              )}
            </div>
            <div className="relative z-20">
              {p1 && (
                <span className="text-xs uppercase tracking-widest text-[#5c412f] font-bold mb-1 block">
                  {cname(p1.category)} {p1.price && `· ${p1.price}`}
                </span>
              )}
              <h3 className="font-serif text-3xl font-bold mb-2 text-[#1c1917]">
                {p1 ? p1.name : (lang==='bn'?'সেরা নির্বাচিত প্রোডাক্ট':'Featured Selection')}
              </h3>
              <p className="text-xs text-[#5c5045] mb-5 max-w-sm line-clamp-2 leading-relaxed">
                {p1 ? p1.description : (lang==='bn'?'অ্যাডমিন প্যানেলে যেকোনো প্রোডাক্টে "Show in Featured" চেক করুন।':'Check "Show in Featured" in the Admin Panel on any product.')}
              </p>
              <a
                href={p1 ? `/p/${p1.slug||p1.id}` : "/#products"}
                className="inline-block px-6 py-3 rounded-xl text-xs font-semibold bg-[#5c412f] text-white hover:bg-[#432f22] transition-transform active:scale-95 shadow-sm"
              >
                {t('viewAllSneakers')}
              </a>
            </div>
          </div>

          {/* Right Column Stack (Spans 6 cols on md) */}
          <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Card 2: Top Right Card */}
            <div className="rounded-[28px] bg-gradient-to-br from-[#f2ece2] to-[#e6dcce] border border-[#d6c7b3] p-6 relative overflow-hidden min-h-[200px] flex flex-col justify-end group shadow-card text-[#1c1917]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f5]/90 via-[#faf8f5]/40 to-transparent z-10"></div>
              <div className="absolute inset-0 flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-500">
                {p2 ? (
                  <ProductImage src={p2.images?.[0]} product={p2} className="w-full h-full max-h-[140px] object-contain drop-shadow-md"/>
                ) : (
                  <div className="text-6xl opacity-30 text-[#8a684f]">⚡</div>
                )}
              </div>
              <div className="relative z-20">
                <span className="text-[10px] uppercase tracking-wider text-[#8a684f] font-bold block mb-0.5">
                  {p2 ? cname(p2.category) : t('badgeRecommended')}
                </span>
                <h4 className="font-serif text-xl font-bold mb-2 line-clamp-1 text-[#1c1917]">
                  {p2 ? p2.name : (lang==='bn'?'নতুন কালেকশন':'Fresh Arrival')}
                </h4>
                <a
                  href={p2 ? `/p/${p2.slug||p2.id}` : waUrl(S,null)}
                  className="inline-block px-4 py-2 rounded-xl text-xs font-semibold bg-[#5c412f] text-white hover:bg-[#432f22] transition-all shadow-xs"
                >
                  {p2 ? (lang==='bn'?'বিস্তারিত দেখুন':'View Details') : t('contactUs')}
                </a>
              </div>
            </div>

            {/* Card 3: Bottom Right Card */}
            <div className="rounded-[28px] bg-gradient-to-br from-[#eee6da] to-[#dfd3c3] border border-[#d2c2ad] p-6 relative overflow-hidden min-h-[200px] flex flex-col justify-end group shadow-card text-[#1c1917]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f5]/90 via-[#faf8f5]/40 to-transparent z-10"></div>
              <div className="absolute inset-0 flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-500">
                {p3 ? (
                  <ProductImage src={p3.images?.[0]} product={p3} className="w-full h-full max-h-[140px] object-contain drop-shadow-md"/>
                ) : (
                  <div className="text-6xl opacity-30 text-[#8a684f]">💎</div>
                )}
              </div>
              <div className="relative z-20">
                <span className="text-[10px] uppercase tracking-wider text-[#8a684f] font-bold block mb-0.5">
                  {p3 ? cname(p3.category) : t('badgeRecommended')}
                </span>
                <h4 className="font-serif text-xl font-bold mb-2 line-clamp-1 text-[#1c1917]">
                  {p3 ? p3.name : (lang==='bn'?'প্রিমিয়াম এডিশন':'Premium Edition')}
                </h4>
                <a
                  href={p3 ? `/p/${p3.slug||p3.id}` : waUrl(S,null)}
                  className="inline-block px-4 py-2 rounded-xl text-xs font-semibold bg-[#5c412f] text-white hover:bg-[#432f22] transition-all shadow-xs"
                >
                  {p3 ? (lang==='bn'?'বিস্তারিত দেখুন':'View Details') : t('contactUs')}
                </a>
              </div>
            </div>

            {/* Card 4: Wide Bottom Spotlight Banner */}
            <div className="sm:col-span-2 rounded-[28px] bg-gradient-to-r from-[#e8decb] via-[#dfd3bc] to-[#d4c5a9] border border-[#c6b497] p-6 relative overflow-hidden min-h-[190px] flex items-center justify-between group shadow-card text-[#1c1917]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#faf8f5]/85 via-[#faf8f5]/55 to-transparent z-10"></div>
              <div className="absolute right-6 top-0 bottom-0 w-1/2 flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-500">
                {p4 ? (
                  <ProductImage src={p4.images?.[0]} product={p4} className="w-full h-full max-h-[150px] object-contain drop-shadow-lg"/>
                ) : (
                  <div className="text-7xl opacity-30 text-[#8a684f]">✨</div>
                )}
              </div>
              <div className="relative z-20 max-w-xs">
                <span className="text-xs uppercase tracking-widest text-[#5c412f] font-bold">
                  {p4 ? cname(p4.category) : t('spotlight')}
                </span>
                <h3 className="font-serif text-2xl font-bold mt-1 mb-3 line-clamp-1 text-[#1c1917]">
                  {p4 ? p4.name : t('trendingNow')}
                </h3>
                <a
                  href={p4 ? `/p/${p4.slug||p4.id}` : "/#products"}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#5c412f] text-white hover:bg-[#432f22] active:scale-95 transition-all shadow-sm"
                >
                  <span>{t('exploreShop')}</span>
                  <span>&nearr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Bottom Promotional Callout Banner in Warm Light Luxury Aesthetic
function BottomPromoBanner(){
  const {settings:S,t,lang}=useD();
  return (
    <section className="my-16 max-w-[1360px] mx-auto px-4 lg:px-10">
      <div className="relative rounded-[36px] bg-gradient-to-br from-[#ece4d8] via-[#e2d7c7] to-[#d5c6b2] border border-[#cbbbaa] text-[#1c1917] overflow-hidden p-10 sm:p-16 lg:p-20 text-center shadow-card">
        {/* Soft Ambient Radiance */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/40 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/40 blur-3xl pointer-events-none"></div>

        <div className="relative z-20 max-w-2xl mx-auto flex flex-col items-center">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5 tracking-tight text-[#1c1917]">
            {t('bottomTitle')}
          </h2>
          <p className="text-sm sm:text-base text-[#554a40] mb-8 max-w-lg leading-relaxed">
            {t('bottomSubtitle')}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={waUrl(S,null,lang==='bn'?"আসসালামু আলাইকুম তানজিদ মার্ট! আমি আপনাদের প্রোডাক্ট কালেকশন ও স্টক সম্পর্কে জানতে চাই।":"Hello Tamjid Mart! I want to inquire about products in stock.")}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-2xl bg-[#5c412f] text-white font-semibold text-base shadow-md hover:bg-[#432f22] hover:scale-105 active:scale-95 transition-all"
            >
              {t('chatWhatsApp')}
            </a>
            <a
              href={telUrl(S)}
              className="px-8 py-4 rounded-2xl bg-white/80 text-[#1c1917] font-semibold text-base border border-black/10 hover:bg-white transition-all shadow-xs"
            >
              {t('bottomCallBtn')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// Quick Contact Modal for a Product
function ContactModal({product,onClose}){
  const {cname,settings:S,t,lang}=useD();
  if(!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose}></div>
      <div className="relative bg-[#faf8f5] rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-2xl z-10 overflow-hidden border border-black/5">
        <button onClick={onClose} className="absolute top-5 right-5 text-2xl text-[#78716c] hover:text-[#1c1917] p-1" aria-label="Close">
          &times;
        </button>
        <div className="text-center">
          <div className="aspect-[4/3] rounded-2xl bg-[#eae7df]/60 flex items-center justify-center p-4 mb-4 max-h-48">
            <ProductImage src={product.images?.[0]} product={product}/>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#ede9e2] text-[#5c412f]">
            {cname(product.category)}
          </span>
          <h3 className="font-serif text-2xl font-bold text-[#1c1917] mt-2 mb-2">{product.name}</h3>
          <p className="text-xs text-[#78716c] mb-6 leading-relaxed">{product.description}</p>

          <div className="space-y-2.5">
            <a
              href={waUrl(S,product,lang==='bn'?`আসসালামু আলাইকুম তানজিদ মার্ট! আমি ${product.name} প্রোডাক্টটি নিতে আগ্রহী। স্টক ও মূল্য কি এভেইলেবল আছে?`:`Hello Tamjid Mart! I am interested in ${product.name}. Is this available in stock?`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full py-3.5 rounded-xl font-semibold bg-[#25d366] text-white text-xs hover:bg-[#1ebd59] flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>{t('chatWhatsApp')}</span>
            </a>
            <a
              href={telUrl(S)}
              onClick={onClose}
              className="w-full py-3.5 rounded-xl font-semibold bg-[#5c412f] text-white text-xs hover:bg-[#453022] flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>{t('callDirectly')} ({S.phone||'+8801700000000'})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Contact / Enquiry Form Component
function EnquiryForm({pre}){
  const {products:P,showToast,t,lang}=useD();
  const [form,setForm]=useState({name:'',phone:'',product:pre||'',message:''});
  const [submitting,setSubmitting]=useState(false);
  const [feedback,setFeedback]=useState('');

  useEffect(()=>{
    if(pre) setForm(f=>({...f,product:pre}));
  },[pre]);

  const handleSubmit=async(e)=>{
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      await api('/enquiry','POST',form);
      dl({event:'enquiry_submit',item_id:form.product});
      setForm({name:'',phone:'',product:'',message:''});
      setFeedback(t('formSuccess'));
      showToast(t('formSuccess'));
    } catch(err){
      setFeedback(err.message||(lang==='bn'?'মেসেজ পাঠানো সম্ভব হয়নি। দয়া করে সরাসরি হোয়াটসঅ্যাপে মেসেজ দিন।':'Could not send enquiry. Please contact us via WhatsApp.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-[32px] p-6 sm:p-10 max-w-xl mx-auto shadow-card border border-black/5 space-y-4">
      <div>
        <label className="block text-xs font-bold text-[#1c1917] mb-1.5">{t('formName')}</label>
        <input
          className="input"
          placeholder={t('formNamePlaceholder')}
          required
          maxLength={80}
          value={form.name}
          onChange={e=>setForm(o=>({...o,name:e.target.value}))}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-[#1c1917] mb-1.5">{t('formPhone')}</label>
        <input
          className="input"
          type="tel"
          placeholder={t('formPhonePlaceholder')}
          required
          maxLength={30}
          value={form.phone}
          onChange={e=>setForm(o=>({...o,phone:e.target.value}))}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-[#1c1917] mb-1.5">{t('formSneaker')}</label>
        <select
          className="input"
          value={form.product}
          onChange={e=>setForm(o=>({...o,product:e.target.value}))}
        >
          <option value="">{t('formSneakerGeneral')}</option>
          {P.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-[#1c1917] mb-1.5">{t('formMessage')}</label>
        <textarea
          className="input min-h-[100px]"
          placeholder={t('formMessagePlaceholder')}
          required
          maxLength={1500}
          value={form.message}
          onChange={e=>setForm(o=>({...o,message:e.target.value}))}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 rounded-xl font-semibold bg-[#5c412f] text-white text-sm hover:bg-[#453022] transition-colors shadow-sm disabled:opacity-50"
      >
        {submitting ? t('formSubmitting') : t('formSubmit')}
      </button>
      {feedback && (
        <p className="text-xs text-center font-medium text-[#5c412f] pt-2">{feedback}</p>
      )}
    </form>
  );
}

// Main Home View
export function Home(){
  const {settings:S,products:P,categories:C,cname,t,lang}=useD();
  const {search}=useLocation();
  const [selectedCat,setSelectedCat]=useState('all');
  const [searchQuery,setSearchQuery]=useState('');
  const [sortBy,setSortBy]=useState('new');
  const [viewMode,setViewMode]=useState('horizontal'); // 'horizontal' (cart card) or 'grid' (desktop-like 2/3 cols)

  // Check URL query parameters
  useEffect(()=>{
    const params=new URLSearchParams(search);
    const q=params.get('q');
    if(q) setSearchQuery(q);
  },[search]);

  useEffect(()=>{
    document.title=lang==='bn' ? `তানজিদ মার্ট | খাঁটি প্রিমিয়াম প্রোডাক্টস ও লাইফস্টাইল কালেকশন` : (S.seoTitle||`${S.siteName||'Tamjid Mart'} | ${S.tagline||'Curated Essentials & Lifestyle'}`);
  },[S,lang]);

  // Newly dropped items (first 6 items)
  const newlyDropped=useMemo(()=>{
    return [...P].sort((a,b)=>b.createdAt-a.createdAt).slice(0,6);
  },[P]);

  // Filtered and sorted products for all collection section
  const filteredProducts=useMemo(()=>{
    let list=[...P];
    if(selectedCat!=='all'){
      list=list.filter(p=>p.category===selectedCat);
    }
    if(searchQuery.trim()){
      const q=searchQuery.toLowerCase();
      list=list.filter(p=>(p.name+p.description+cname(p.category)).toLowerCase().includes(q));
    }
    if(sortBy==='az'){
      list.sort((a,b)=>a.name.localeCompare(b.name));
    } else {
      list.sort((a,b)=>b.createdAt-a.createdAt);
    }
    return list;
  },[P,selectedCat,searchQuery,sortBy,cname]);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroSection/>

      {/* 3-Card Feature Promo Grid */}
      <PromoCardsSection/>

      {/* Newly Dropped Collections Section */}
      <section id="new" className="my-8 sm:my-12 max-w-[1360px] mx-auto px-3 sm:px-4 lg:px-10">
        <div className="rounded-[28px] sm:rounded-[36px] bg-[#f4efe8] border border-[#e2d8cb] p-5 sm:p-10 lg:p-12 shadow-card">
          <div className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#e5dbcc] text-[#5c412f] border border-[#d3c4b1] mb-3">
              <span className="w-2 h-2 rounded-full bg-[#5c412f]"></span>
              {t('badgeNewDrops')}
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-[44px] font-bold text-[#1c1917] mb-2">
              {t('newTitle')}
            </h2>
            <p className="text-xs sm:text-base text-[#78716c]">
              {t('newSubtitle')}
            </p>
          </div>

          {/* Product Grid */}
          {newlyDropped.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {newlyDropped.map(p=>(
                <ProductCard key={p.id} p={p}/>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/60 rounded-3xl border border-black/5 p-6 text-[#78716c]">
              <p className="font-serif text-xl text-[#1c1917] mb-1">{lang==='bn'?'কোনো প্রোডাক্ট এখনো যোগ করা হয়নি':'No products added to the catalog yet'}</p>
              <p className="text-xs">{lang==='bn'?'অ্যাডমিন প্যানেল থেকে যেকোনো প্রোডাক্ট যোগ করুন অথবা সরাসরি হোয়াটসঅ্যাপে যোগাযোগ করুন।':'Add products from the admin portal or contact us on WhatsApp.'}</p>
            </div>
          )}

          {/* Centered "See More Collections" Button */}
          <div className="text-center mt-8 sm:mt-10">
            <a
              href="/#products"
              className="inline-block px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#eae4db] text-[#2c221e] font-semibold text-xs sm:text-sm hover:bg-[#ded6ca] transition-all hover:scale-105 active:scale-95 shadow-xs"
            >
              {t('seeMore')}
            </a>
          </div>
        </div>
      </section>

      {/* Most Recommend Collections For You (Mosaic / Bento Gallery) */}
      <RecommendedMosaicSection/>

      {/* Seasonal & All Products Section */}
      <section id="products" className="my-8 sm:my-12 max-w-[1360px] mx-auto px-3 sm:px-4 lg:px-10">
        <div className="rounded-[28px] sm:rounded-[36px] bg-[#fbf9f6] border border-[#e8e1d7] p-5 sm:p-10 lg:p-12 shadow-card">
          <div className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#eae2d7] text-[#5c412f] border border-[#d8ccbe] mb-3">
              <span className="w-2 h-2 rounded-full bg-[#5c412f]"></span>
              {t('badgeAllProducts')}
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-[44px] font-bold text-[#1c1917] mb-2">
              {t('summerTitle')}
            </h2>
            <p className="text-xs sm:text-base text-[#78716c]">
              {t('summerSubtitle')}
            </p>
          </div>

          {/* Filters, Search & View Switcher Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 sm:mb-8 bg-[#f4f1ea] p-2.5 sm:p-3 rounded-2xl border border-black/5">
            {/* Smooth Horizontal Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto py-1">
              <button
                onClick={()=>setSelectedCat('all')}
                className={`shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold transition-colors ${selectedCat==='all'?'bg-[#5c412f] text-white shadow-xs':'bg-white/80 text-[#665f59] hover:text-[#1c1917]'}`}
              >
                {t('filterAll')}
              </button>
              {C.map(c=>(
                <button
                  key={c.id}
                  onClick={()=>setSelectedCat(c.id)}
                  className={`shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold transition-colors ${selectedCat===c.id?'bg-[#5c412f] text-white shadow-xs':'bg-white/80 text-[#665f59] hover:text-[#1c1917]'}`}
                >
                  {cname(c.id)}
                </button>
              ))}
            </div>

            {/* Controls: Search, Sort & Layout Switcher */}
            <div className="flex items-center gap-2 justify-between md:justify-end">
              <input
                type="search"
                placeholder={t('filterByName')}
                value={searchQuery}
                onChange={e=>setSearchQuery(e.target.value)}
                className="input !w-32 sm:!w-44 !py-1.5 sm:!py-2 !text-xs !bg-white"
              />
              <select
                value={sortBy}
                onChange={e=>setSortBy(e.target.value)}
                className="input !w-auto !py-1.5 sm:!py-2 !text-xs !bg-white cursor-pointer"
              >
                <option value="new">{t('sortNewest')}</option>
                <option value="az">{t('sortAZ')}</option>
              </select>

              {/* View Switcher: Cart/List Card vs 2-Col Grid */}
              <div className="flex items-center bg-[#e5decf] p-1 rounded-xl shrink-0 gap-0.5">
                <button
                  onClick={()=>setViewMode('horizontal')}
                  className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${viewMode==='horizontal'?'bg-white text-[#5c412f] shadow-xs':'text-[#78716c] hover:text-[#1c1917]'}`}
                  title={t('viewList')}
                  aria-label={t('viewList')}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                  <span className="hidden sm:inline">{t('viewList')}</span>
                </button>
                <button
                  onClick={()=>setViewMode('grid')}
                  className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${viewMode==='grid'?'bg-white text-[#5c412f] shadow-xs':'text-[#78716c] hover:text-[#1c1917]'}`}
                  title={t('viewGrid')}
                  aria-label={t('viewGrid')}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                  </svg>
                  <span className="hidden sm:inline">{t('viewGrid')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid / Horizontal Cart Card View */}
          {filteredProducts.length > 0 ? (
            <div className={viewMode==='horizontal' ? "grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4" : "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8"}>
              {filteredProducts.map(p=>(
                <ProductCard key={p.id} p={p} layout={viewMode}/>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-black/5 p-8 text-[#78716c]">
              <p className="font-serif text-2xl text-[#1c1917] mb-2">{t('noSneakersFound')}</p>
              <p className="text-sm">{t('noSneakersHint')}</p>
              <button onClick={()=>{setSearchQuery('');setSelectedCat('all');}} className="btn btn-sm mt-4">
                {t('viewAllSneakers')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Promo Banner */}
      <BottomPromoBanner/>

      {/* Send an Enquiry Section */}
      <section id="contact" className="my-8 sm:my-12 max-w-[1360px] mx-auto px-4 lg:px-10">
        <div className="rounded-[36px] bg-[#ede6dc] border border-[#d9ccbd] p-6 sm:p-10 lg:p-12 shadow-card">
          <div className="text-center mb-8 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#ddd0bf] text-[#5c412f] border border-[#cab9a4] mb-3">
              <span className="w-2 h-2 rounded-full bg-[#5c412f]"></span>
              {t('badgeEnquiry')}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1c1917] mb-2">
              {t('enquiryTitle')}
            </h2>
            <p className="text-sm text-[#78716c]">
              {t('enquirySubtitle')}
            </p>
          </div>
          <EnquiryForm pre={new URLSearchParams(search).get('enquire')}/>
        </div>
      </section>
    </div>
  );
}

// Dedicated Product Detail Page (`/p/:slug`)
export function ProductPage(){
  const {slug}=useParams();
  const {products:P,cname,settings:S,t,lang}=useD();
  const [selectedImg,setSelectedImg]=useState(0);

  const p=P.find(x=>x.id===slug?.split('-').pop()||x.slug===slug);

  useEffect(()=>{
    if(!p) return;
    setSelectedImg(0);
    document.title=`${p.name} | ${lang==='bn'?'তানজিদ মার্ট':(S.siteName||'Tamjid Mart')}`;
    track(p.id,'view');
    dl({event:'view_item',item_id:p.id,item_name:p.name});
  },[p?.id,lang]);

  if(!p) return <NotFound/>;

  const related=P.filter(x=>x.id!==p.id && x.category===p.category).slice(0,3);

  return (
    <div className="max-w-[1360px] mx-auto px-3 sm:px-4 lg:px-10 py-4 sm:py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-[#78716c] mb-4 sm:mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Link to="/" className="hover:text-[#1c1917] shrink-0">{t('navHome')}</Link>
        <span>/</span>
        <a href="/#products" className="hover:text-[#1c1917] shrink-0">{cname(p.category)}</a>
        <span>/</span>
        <span className="text-[#1c1917] font-semibold truncate">{p.name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="bg-white rounded-[28px] sm:rounded-[36px] p-4 sm:p-10 border border-black/5 shadow-card grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Left Gallery */}
        <div className="lg:col-span-6 flex flex-col gap-3 sm:gap-4">
          <div className="aspect-[4/3] rounded-[22px] sm:rounded-[28px] bg-[#eae7df]/60 overflow-hidden flex items-center justify-center p-4 sm:p-6 border border-black/5">
            <ProductImage src={p.images?.[selectedImg]} product={p} className="w-full h-full object-contain drop-shadow-xl"/>
          </div>
          {p.images && p.images.length>1 && (
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
              {p.images.map((img,idx)=>(
                <button
                  key={idx}
                  onClick={()=>setSelectedImg(idx)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl sm:rounded-2xl bg-[#eae7df]/60 p-1.5 sm:p-2 border-2 transition-all ${selectedImg===idx?'border-[#5c412f]':'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={thumb(img)} alt="" className="w-full h-full object-contain"/>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Details */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#ede9e2] text-[#5c412f]">
              {cname(p.category)}
            </span>
            {p.badge && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {p.badge}
              </span>
            )}
            <span className="text-xs font-semibold text-emerald-600 ml-auto flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {t('inStockAt')}
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-[#1c1917] mb-2 sm:mb-3">
            {p.name}
          </h1>

          {/* Prominent Price Display */}
          {p.price && (
            <div className="text-xl sm:text-3xl font-extrabold text-[#5c412f] tracking-tight mb-3 sm:mb-4">
              {lang === 'bn' ? toBnNum(p.price) : p.price}
            </div>
          )}

          <p className="text-xs sm:text-sm text-[#78716c] leading-relaxed mb-4 sm:mb-6">
            {p.description}
          </p>

          {/* Highlights */}
          {p.highlights && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-5 rounded-2xl bg-[#faf8f5] border border-black/5">
              <h4 className="text-xs font-bold text-[#1c1917] mb-2.5 uppercase tracking-wider">{t('authenticFeatures')}</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#78716c]">
                {p.highlights.split('\n').filter(Boolean).map((h,i)=>(
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5c412f]"></span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <a
              href={waUrl(S,p,lang==='bn'?`আসসালামু আলাইকুম তানজিদ মার্ট! আমি ${p.name} সম্পর্কে বিস্তারিত জানতে ও অর্ডার করতে চাই।`:`Hello Tamjid Mart! I want to inquire and order ${p.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={()=>track(p.id,'contact')}
              className="flex-1 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-sm font-semibold bg-[#25d366] text-white hover:bg-[#1ebd59] transition-colors text-center shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <span>{t('orderWhatsApp')}</span>
            </a>
            <a
              href={telUrl(S)}
              onClick={()=>track(p.id,'contact')}
              className="flex-1 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-sm font-semibold bg-[#5c412f] text-white hover:bg-[#453022] transition-colors text-center shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <span>{t('callUs')}: {S.phone||'+8801700000000'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Related Collection */}
      {related.length > 0 && (
        <div className="mt-16">
          <h3 className="font-serif text-3xl font-bold text-[#1c1917] mb-6 text-center">
            {t('moreIn')} ({cname(p.category)})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map(r=>(
              <ProductCard key={r.id} p={r}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 404 Page
export function NotFound(){
  const {lang}=useD();
  return (
    <div className="max-w-[1240px] mx-auto px-6 py-24 text-center">
      <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#1c1917] mb-4">404</h1>
      <p className="text-base text-[#78716c] mb-8">
        {lang==='bn'?'আপনি যে পেজ বা প্রোডাক্টটি খুঁজছেন তা পাওয়া যায়নি।':'The product or collection you are looking for does not exist.'}
      </p>
      <Link to="/" className="btn">
        {lang==='bn'?'হোম পেজে ফিরে যান':'Return to Tamjid Mart'}
      </Link>
    </div>
  );
}

// Luxury Dark Footer
function Footer(){
  const {settings:S,showToast,t,lang,cname,categories:C}=useD();
  const [newsEmail,setNewsEmail]=useState('');
  const [subscribed,setSubscribed]=useState(false);

  const handleSubscribe=(e)=>{
    e.preventDefault();
    if(newsEmail.trim()){
      setSubscribed(true);
      showToast(t('subscribedMsg'));
      setNewsEmail('');
    }
  };

  return (
    <footer className="bg-[#111111] text-white pt-16 pb-12 mt-20">
      <div className="max-w-[1360px] mx-auto px-5 lg:px-10">
        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          {/* Brand & Newsletter Column */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="block">
              {S.logo ? (
                <div className="inline-block bg-white/95 px-3 py-1.5 rounded-xl shadow-xs">
                  <img src={S.logo} alt={S.siteName || "Tamjid Mart"} className="h-8 w-auto object-contain" />
                </div>
              ) : (
                <span className="font-serif text-3xl font-bold tracking-tight text-white block">
                  {lang==='bn'?'তানজিদ মার্ট':(S.siteName||'Tamjid Mart')}
                </span>
              )}
            </Link>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed">
              {t('footerAbout')}
            </p>

            {/* Newsletter Box */}
            <div className="pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300 block mb-2">{t('newsletterTitle')}</span>
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
                <input
                  type="email"
                  required
                  placeholder={t('newsletterPlaceholder')}
                  value={newsEmail}
                  onChange={e=>setNewsEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-white/40"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-white text-[#111111] text-xs font-bold hover:bg-neutral-200 transition-colors shrink-0"
                >
                  {subscribed ? '✓' : t('subscribeBtn')}
                </button>
              </form>
            </div>
          </div>

          {/* Categories Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">{t('categoriesCol')}</h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              {C.map(c=>(
                <li key={c.id}>
                  <a href="/#products" className="hover:text-white transition-colors">{cname(c.id)}</a>
                </li>
              ))}
              <li><a href="/#recommend" className="hover:text-white transition-colors">{t('trendingNow')}</a></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">{t('legalCol')}</h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><a href="/#contact" className="hover:text-white transition-colors">{t('privacyPolicy')}</a></li>
              <li><a href="/#contact" className="hover:text-white transition-colors">{t('termsConditions')}</a></li>
              <li><a href="/#contact" className="hover:text-white transition-colors">{t('refundPolicy')}</a></li>
              <li><a href="/#contact" className="hover:text-white transition-colors">{t('authenticityGuarantee')}</a></li>
              <li><Link to="/admin" className="text-[#c79d72] hover:underline font-semibold flex items-center gap-1 mt-1"><span>{t('adminPortal')}</span> <span>&rarr;</span></Link></li>
            </ul>
          </div>

          {/* Help Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">{t('helpCol')}</h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><a href="/#contact" className="hover:text-white transition-colors">{t('howToOrder')}</a></li>
              <li><a href="/#contact" className="hover:text-white transition-colors">{t('checkStock')}</a></li>
              <li><a href={telUrl(S)} className="hover:text-white transition-colors">{t('customerCare')}: {S.phone||'+8801700000000'}</a></li>
              <li><a href={`mailto:${S.email||'hello@tamjidmart.com'}`} className="hover:text-white transition-colors">{t('emailContact')}: {S.email||'hello@tamjidmart.com'}</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Row with Copyright and Social Links */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>&copy; {new Date().getFullYear()} {t('copyright')}</p>
          <div className="flex items-center gap-6">
            <a href={safe(S.facebook)} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Facebook</a>
            <a href={safe(S.instagram)} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
            <a href={safe(S.youtube)} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
