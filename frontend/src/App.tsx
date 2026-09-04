import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Beranda from './pages/public/Beranda';
import ProfilDesa from './pages/public/ProfilDesa';
import Berita from './pages/public/Berita';
import DetailBerita from './pages/public/DetailBerita';
import Umkm from './pages/public/Umkm';
import Login from './pages/auth/Login';
import InformasiPendaftaran from './pages/auth/InformasiPendaftaran';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import DaftarBerita from './pages/admin/berita/DaftarBerita';
import FormBerita from './pages/admin/berita/FormBerita';
import DaftarPengguna from './pages/admin/pengguna/DaftarPengguna';
import FormPengguna from './pages/admin/pengguna/FormPengguna';
import EditPengguna from './pages/admin/pengguna/EditPengguna';
import ProfilAdmin from './pages/admin/ProfilAdmin';
import ProfilPengguna from './pages/admin/ProfilPengguna';

import DaftarProduk from './pages/admin/umkm/DaftarProduk';
import FormProduk from './pages/admin/umkm/FormProduk';
import DaftarUMKM from './pages/admin/umkm/DaftarUMKM';
import FormUMKM from './pages/admin/umkm/FormUMKM';
import DaftarKategori from './pages/admin/umkm/DaftarKategori';

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

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminIndexRedirect />} />
          <Route path="dashboard" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
          <Route path="pengguna" element={<RequireAdmin><DaftarPengguna /></RequireAdmin>} />
          <Route path="pengguna/tambah" element={<RequireAdmin><FormPengguna /></RequireAdmin>} />
          <Route path="pengguna/edit/:id" element={<RequireAdmin><EditPengguna /></RequireAdmin>} />
          <Route path="profil" element={<RequireAdmin><ProfilAdmin /></RequireAdmin>} />
          <Route path="profil-saya" element={<ProfilPengguna />} />
          
          <Route path="berita" element={<DaftarBerita />} />
          <Route path="berita/tambah" element={<FormBerita />} />
          <Route path="berita/edit/:id" element={<FormBerita />} />
          
          <Route path="umkm" element={<RequireAdmin><Navigate to="/admin/umkm/data" replace /></RequireAdmin>} />
          <Route path="umkm/data" element={<RequireAdmin><DaftarUMKM /></RequireAdmin>} />
          <Route path="umkm/data/tambah" element={<RequireAdmin><FormUMKM /></RequireAdmin>} />
          <Route path="umkm/data/edit/:id" element={<RequireAdmin><FormUMKM /></RequireAdmin>} />
          <Route path="umkm/kategori" element={<RequireAdmin><DaftarKategori /></RequireAdmin>} />
          <Route path="umkm/produk" element={<RequireAdmin><DaftarProduk /></RequireAdmin>} />
          <Route path="umkm/produk/tambah" element={<RequireAdmin><FormProduk /></RequireAdmin>} />
          <Route path="umkm/produk/edit/:id" element={<RequireAdmin><FormProduk /></RequireAdmin>} />
        </Route>
      </Routes>
    </Router>
  );
}
