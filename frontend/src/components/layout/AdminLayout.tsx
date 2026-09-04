import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Map, 
  FileText, 
  Store, 
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import api, { getImageUrl } from '../../services/api';
import ConfirmModal from '../ui/ConfirmModal';

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    '/admin/umkm': path.startsWith('/admin/umkm')
  });

  const [userProfile, setUserProfile] = useState<{ namaLengkap: string; peran: string; fotoProfil?: string } | null>(null);

  // Proteksi Autentikasi Dasar & Ambil Profil
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get('/autentikasi/saya');
        if (response.data && response.data.data) {
          setUserProfile(response.data.data);
        }
      } catch (error) {
        console.error('Gagal memuat profil', error);
        // Jika token tidak valid
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    setShowLogoutConfirm(false);
    navigate('/');
  };

  const allNavItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, role: 'admin' },
    { name: 'Manajemen Pengguna', path: '/admin/pengguna', icon: Users, role: 'admin' },
    { name: 'Profil Desa', path: '/admin/profil', icon: Map, role: 'admin' },
    { name: 'Berita', path: '/admin/berita', icon: FileText },
    { 
      name: 'UMKM', 
      path: '/admin/umkm', 
      icon: Store, 
      role: 'admin',
      subItems: [
        { name: 'Data UMKM', path: '/admin/umkm/data' },
        { name: 'Kategori Produk', path: '/admin/umkm/kategori' },
        { name: 'Data Produk', path: '/admin/umkm/produk' }
      ]
    },
  ];

  // Filter navigasi berdasarkan role
  // Publikasi hanya boleh lihat Berita dan Profil Saya (profil saya tidak di allNavItems tapi di bottom)
  const navItems = allNavItems.filter(item => {
    if (item.role && userProfile?.peran !== item.role) {
      return false;
    }
    // Publikasi: hanya izinkan Berita (tanpa role) — Dashboard, Manajemen Pengguna, Profil Desa, UMKM sudah role admin jadi otomatis terfilter
    if (userProfile?.peran === 'publikasi') {
      // Hanya Berita yang boleh (dan tidak ada role). Dashboard sudah terfilter karena butuh admin.
      if (item.path === '/admin/berita') return true;
      return false;
    }
    return true;
  });

  // Guard: jika publikasi mencoba akses halaman terlarang, paksa ke /admin/berita
  useEffect(() => {
    if (!userProfile) return;
    if (userProfile.peran !== 'publikasi') return;
    const allowedPrefixes = ['/admin/berita', '/admin/profil-saya'];
    const isAllowed = allowedPrefixes.some(p => path === p || path.startsWith(p + '/'));
    // /admin tanpa subpath juga tidak diizinkan -> redirect ke berita
    if (!isAllowed && path.startsWith('/admin')) {
      navigate('/admin/berita', { replace: true });
    }
  }, [userProfile, path, navigate]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleSubMenu = (itemPath: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [itemPath]: !prev[itemPath]
    }));
  };

  return (
    <div className="min-h-screen bg-[#FBFBFF] flex">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" 
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#F8F9FA] border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo Area */}
        <div className="h-24 flex items-center justify-center border-b border-slate-200 px-6 shrink-0 relative">
          <div className="flex flex-col items-center">
            <img src="/images/logo.png" alt="Logo" className="w-10 h-12 object-contain mb-1" />
            <span className="text-sm font-bold text-slate-800 tracking-tight leading-none mb-0.5">DESA CITAPEN</span>
            <span className="text-[9px] text-slate-500 font-medium">kec. Hantara, Kab. Kuningan</span>
          </div>
          {/* Close button for mobile */}
          <button onClick={closeMobileMenu} className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          {navItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isPathActive = path === item.path || path.startsWith(item.path + '/');
            const isActive = hasSubItems ? isPathActive : path === item.path;
            const Icon = item.icon;
            
            return (
              <div key={item.path}>
                {hasSubItems ? (
                  <button
                    onClick={() => toggleSubMenu(item.path)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${
                      isActive 
                        ? 'bg-[#0A3D2D] text-white shadow-md shadow-[#0A3D2D]/20' 
                        : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      {item.name}
                    </div>
                    {openMenus[item.path] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${
                      isActive 
                        ? 'bg-[#0A3D2D] text-white shadow-md shadow-[#0A3D2D]/20' 
                        : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    {item.name}
                  </Link>
                )}

                {/* Sub Items */}
                {hasSubItems && openMenus[item.path] && (
                  <div className="mt-1 ml-4 border-l-2 border-slate-200 pl-3 space-y-1">
                    {item.subItems!.map((sub) => {
                      const isSubActive = path === sub.path || path.startsWith(sub.path + '/');
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          onClick={closeMobileMenu}
                          className={`block px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                            isSubActive
                              ? 'bg-emerald-50 text-[#0A3D2D]'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions (Profile & Logout) */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <Link
            to="/admin/profil-saya"
            onClick={closeMobileMenu}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${
              path === '/admin/profil-saya'
                ? 'bg-[#0A3D2D] text-white shadow-md shadow-[#0A3D2D]/20' 
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <User className={`w-5 h-5 ${path === '/admin/profil-saya' ? 'text-white' : 'text-slate-500'}`} />
            Profil Saya
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center">
            {/* Mobile menu toggle */}
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden p-2 mr-3 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile */}
          <Link to="/admin/profil-saya" className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-xl transition cursor-pointer">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {userProfile ? userProfile.namaLengkap : 'Memuat...'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                {userProfile?.peran === 'admin' ? 'ADMIN DESA' : userProfile?.peran === 'publikasi' ? 'PUBLIKASI' : '...'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
              {userProfile?.fotoProfil ? (
                <img 
                  src={getImageUrl(userProfile.fotoProfil)} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[#0A3D2D] font-bold uppercase">
                  {(userProfile?.namaLengkap || 'A').charAt(0)}
                </span>
              )}
            </div>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <ConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Keluar dari Sistem?"
        message="Anda akan keluar dari sesi saat ini. Anda perlu masuk kembali untuk mengakses panel admin."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        type="logout"
      />

    </div>
  );
}
