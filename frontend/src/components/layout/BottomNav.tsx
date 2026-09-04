import { Link, useLocation } from 'react-router-dom';
import { Home, User, Newspaper, Store } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 py-2 px-6 flex justify-between items-center pb-safe">
      <Link to="/" className={`flex flex-col items-center gap-1.5 ${path === '/' ? 'text-[#0A3D2D]' : 'text-slate-500'}`}>
        <div className={`p-2 rounded-full transition-colors ${path === '/' ? 'bg-[#0A3D2D] text-white shadow-md' : 'hover:bg-slate-50'}`}>
          <Home className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold">Home</span>
      </Link>
      
      <Link to="/profil" className={`flex flex-col items-center gap-1.5 ${path === '/profil' ? 'text-[#0A3D2D]' : 'text-slate-500'}`}>
        <div className={`p-2 rounded-full transition-colors ${path === '/profil' ? 'bg-[#0A3D2D] text-white shadow-md' : 'hover:bg-slate-50'}`}>
          <User className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold">Profile</span>
      </Link>
      
      <Link to="/berita" className={`flex flex-col items-center gap-1.5 ${path === '/berita' ? 'text-[#0A3D2D]' : 'text-slate-500'}`}>
        <div className={`p-2 rounded-full transition-colors ${path === '/berita' ? 'bg-[#0A3D2D] text-white shadow-md' : 'hover:bg-slate-50'}`}>
          <Newspaper className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold">Berita</span>
      </Link>
      
      <Link to="/umkm" className={`flex flex-col items-center gap-1.5 ${path === '/umkm' ? 'text-[#0A3D2D]' : 'text-slate-500'}`}>
        <div className={`p-2 rounded-full transition-colors ${path === '/umkm' ? 'bg-[#0A3D2D] text-white shadow-md' : 'hover:bg-slate-50'}`}>
          <Store className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold">UMKM</span>
      </Link>
    </div>
  );
}
