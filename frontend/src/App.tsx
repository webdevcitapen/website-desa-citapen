import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Public langsung (critical) tetap eager agar first paint cepat
import Beranda from './pages/public/Beranda';
import ProfilDesa from './pages/public/ProfilDesa';
import Berita from './pages/public/Berita';
import DetailBerita from './pages/public/DetailBerita';
import Umkm from './pages/public/Umkm';
import Login from './pages/auth/Login';
import InformasiPendaftaran from './pages/auth/InformasiPendaftaran';

// Admin Pages - lazy loaded (hemat 60-70% bundle awal)
// Sebelumnya semua admin di-import eager → bundle besar → lambat di Vercel
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const DaftarBerita = lazy(() => import('./pages/admin/berita/DaftarBerita'));
const FormBerita = lazy(() => import('./pages/admin/berita/FormBerita'));
const DaftarPengguna = lazy(() => import('./pages/admin/pengguna/DaftarPengguna'));
const FormPengguna = lazy(() => import('./pages/admin/pengguna/FormPengguna'));
const EditPengguna = lazy(() => import('./pages/admin/pengguna/EditPengguna'));
const ProfilAdmin = lazy(() => import('./pages/admin/ProfilAdmin'));
const ProfilPengguna = lazy(() => import('./pages/admin/ProfilPengguna'));
const DaftarProduk = lazy(() => import('./pages/admin/umkm/DaftarProduk'));
const FormProduk = lazy(() => import('./pages/admin/umkm/FormProduk'));
const DaftarUMKM = lazy(() => import('./pages/admin/umkm/DaftarUMKM'));
const FormUMKM = lazy(() => import('./pages/admin/umkm/FormUMKM'));
const DaftarKategori = lazy(() => import('./pages/admin/umkm/DaftarKategori'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFF]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0A3D2D]"></div>
    </div>
  );
}

// Dummy component removed

function getUserRole(): string | null {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      return u?.peran || null;
    }
  } catch {}
  return null;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const role = getUserRole();
  if (role === 'publikasi') {
    return <Navigate to="/admin/berita" replace />;
  }
  return <>{children}</>;
}

function AdminIndexRedirect() {
  const role = getUserRole();
  if (role === 'publikasi') {
    return <Navigate to="/admin/berita" replace />;
  }
  return <Navigate to="/admin/dashboard" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Beranda />} />
        <Route path="/profil" element={<ProfilDesa />} />
        <Route path="/berita" element={<Berita />} />
        <Route path="/berita/:id" element={<DetailBerita />} />
        <Route path="/umkm" element={<Umkm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/informasi-pendaftaran" element={<InformasiPendaftaran />} />

        {/* Admin Routes - lazy dengan Suspense */}
        <Route path="/admin" element={<Suspense fallback={<LoadingFallback />}><AdminLayout /></Suspense>}>
          <Route index element={<AdminIndexRedirect />} />
          <Route path="dashboard" element={<Suspense fallback={<LoadingFallback />}><RequireAdmin><Dashboard /></RequireAdmin></Suspense>} />
          <Route path="pengguna" element={<Suspense fallback={<LoadingFallback />}><RequireAdmin><DaftarPengguna /></RequireAdmin></Suspense>} />
          <Route path="pengguna/tambah" element={<Suspense fallback={<LoadingFallback />}><RequireAdmin><FormPengguna /></RequireAdmin></Suspense>} />
          <Route path="pengguna/edit/:id" element={<Suspense fallback={<LoadingFallback />}><RequireAdmin><EditPengguna /></RequireAdmin></Suspense>} />
          <Route path="profil" element={<Suspense fallback={<LoadingFallback />}><RequireAdmin><ProfilAdmin /></RequireAdmin></Suspense>} />
          <Route path="profil-saya" element={<Suspense fallback={<LoadingFallback />}><ProfilPengguna /></Suspense>} />
          
          <Route path="berita" element={<Suspense fallback={<LoadingFallback />}><DaftarBerita /></Suspense>} />
          <Route path="berita/tambah" element={<Suspense fallback={<LoadingFallback />}><FormBerita /></Suspense>} />
          <Route path="berita/edit/:id" element={<Suspense fallback={<LoadingFallback />}><FormBerita /></Suspense>} />
          
          <Route path="umkm" element={<RequireAdmin><Navigate to="/admin/umkm/data" replace /></RequireAdmin>} />
          <Route path="umkm/data" element={<Suspense fallback={<LoadingFallback />}><RequireAdmin><DaftarUMKM /></RequireAdmin></Suspense>} />
          <Route path="umkm/data/tambah" element={<Suspense fallback={<LoadingFallback />}><RequireAdmin><FormUMKM /></RequireAdmin></Suspense>} />
          <Route path="umkm/data/edit/:id" element={<Suspense fallback={<LoadingFallback />}><RequireAdmin><FormUMKM /></RequireAdmin></Suspense>} />
          <Route path="umkm/kategori" element={<Suspense fallback={<LoadingFallback />}><RequireAdmin><DaftarKategori /></RequireAdmin></Suspense>} />
          <Route path="umkm/produk" element={<Suspense fallback={<LoadingFallback />}><RequireAdmin><DaftarProduk /></RequireAdmin></Suspense>} />
          <Route path="umkm/produk/tambah" element={<Suspense fallback={<LoadingFallback />}><RequireAdmin><FormProduk /></RequireAdmin></Suspense>} />
          <Route path="umkm/produk/edit/:id" element={<Suspense fallback={<LoadingFallback />}><RequireAdmin><FormProduk /></RequireAdmin></Suspense>} />
        </Route>
      </Routes>
    </Router>
  );
}
