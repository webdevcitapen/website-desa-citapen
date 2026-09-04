import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Logo Kuningan" className="w-8 h-10 object-contain" />
            <span className="text-xl font-bold text-slate-800 tracking-tight">Desa Citapen</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-sm py-2 transition ${path === '/' ? 'font-bold text-slate-800 border-b-2 border-[#0A3D2D]' : 'font-semibold text-slate-500 hover:text-slate-800'}`}>Beranda</Link>
            <Link to="/profil" className={`text-sm py-2 transition ${path.startsWith('/profil') ? 'font-bold text-slate-800 border-b-2 border-[#0A3D2D]' : 'font-semibold text-slate-500 hover:text-slate-800'}`}>Profil</Link>
            <Link to="/berita" className={`text-sm py-2 transition ${path.startsWith('/berita') ? 'font-bold text-slate-800 border-b-2 border-[#0A3D2D]' : 'font-semibold text-slate-500 hover:text-slate-800'}`}>Berita</Link>
            <Link to="/umkm" className={`text-sm py-2 transition ${path.startsWith('/umkm') ? 'font-bold text-slate-800 border-b-2 border-[#0A3D2D]' : 'font-semibold text-slate-500 hover:text-slate-800'}`}>UMKM</Link>
          </div>

          {/* Login Button */}
          <Link to="/login" className="px-6 py-2.5 bg-[#0A3D2D] text-white text-xs font-bold rounded hover:bg-[#082d22] transition tracking-wider shadow-md">
            LOGIN
          </Link>
        </div>
      </div>
    </nav>
  );
}
