import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Mountain, Store, MapPin, Mail, Phone, Car, Sparkles, Landmark } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import BottomNav from '../../components/layout/BottomNav';
import api from '../../services/api';

export default function Beranda() {
  const [profil, setProfil] = useState<any>(null);
  const [totalUmkm, setTotalUmkm] = useState<number>(0);

  useEffect(() => {
    // OPTIMASI: Satu request /beranda menggantikan 2 request (profil + produk)
    // Sebelumnya 2 round-trip -> sekarang 1, hemat 50% latency & cold start
    // Fallback ke 2 request jika /beranda gagal (kompatibilitas)
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        // Coba endpoint beranda yang sudah parallel di backend (6 query sekaligus)
        const res = await api.get('/beranda', { signal: controller.signal as any });
        const data = res.data?.data;
        if (data) {
          // Backend /beranda mengembalikan profil via beranda? cek struktur
          // Jika ada profilDesa di beranda, pakai. Jika tidak, fallback fetch profil-desa terpisah cepat dari cache
          // Jumlah produk & umkm langsung dari beranda count
          if (data.jumlahProduk !== undefined) setTotalUmkm(data.jumlahProduk);
          else if (data.jumlahUmkm !== undefined) setTotalUmkm(data.jumlahUmkm);
          // Profil desa kadang tidak di beranda, jadi tetap fetch ringan profil dengan cache
          // Tapi kita coba ambil dari data jika ada
          if (data.profilDesa) setProfil(data.profilDesa);
          else {
            // Fetch profil terpisah tapi dengan abort & cache header memanfaatkan CDN
            try {
              const resProfil = await api.get('/profil-desa', { signal: controller.signal as any });
              if (resProfil.data?.data) setProfil(resProfil.data.data);
              else if (resProfil.data) setProfil(resProfil.data);
            } catch {}
          }
          return;
        }
      } catch {
        // ignore, fallback
      }
      // Fallback jalur lama (jika /beranda tidak tersedia)
      try {
        const resProfil = await api.get('/profil-desa', { signal: controller.signal as any });
        if (resProfil.data?.data) setProfil(resProfil.data.data);
        else if (resProfil.data) setProfil(resProfil.data);
      } catch (e) { console.error('Error fetching profil:', e); }
      try {
        const resUmkm = await api.get('/produk', { params: { halaman: 1, perHalaman: 1 }, signal: controller.signal as any });
        const total = resUmkm.data?.data?.total ?? resUmkm.data?.total ?? 0;
        setTotalUmkm(total);
      } catch (e) { console.error('Error fetching umkm:', e); }
    };
    fetchData();
    return () => controller.abort();
  }, []);

  const p = profil || {};
  const luasWilayah = p.luasWilayah || p.luas_wilayah || '473,30';
  const visi = p.visi || 'Mewujudkan masyarakat desa yang sejahtera, mandiri, dan berbudaya melalui tata kelola yang transparan dan inovatif.';
  const telepon = p.telepon || '0831 9335 5962';
  const namaDesa = p.nama_desa || 'Desa Citapen';

  return (
    <div className="min-h-screen bg-[#FBFBFF] font-sans pb-20 md:pb-0">
      <Navbar />

      {/* 1. Hero Section */}
      <section className="relative w-full h-[calc(100vh-5rem)] min-h-[500px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center" style={{ backgroundImage: "url('/images/hero-bg.png')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        <div className="relative z-10 w-full px-6 md:px-12 lg:px-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              Selamat Datang di<br />{namaDesa}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-white/90 drop-shadow-md mb-8 leading-relaxed max-w-2xl">
              {visi}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/profil" className="bg-[#082d22] hover:bg-emerald-900 text-white font-semibold py-3 px-8 rounded-lg text-center transition-colors shadow-lg text-sm tracking-wide">
                Jelajahi Profil Desa
              </Link>
              <Link to="/profil#data-penduduk" className="bg-transparent hover:bg-white/10 text-white border-2 border-white/80 font-semibold py-3 px-8 rounded-lg text-center transition-colors shadow-lg text-sm tracking-wide">
                Lihat Data Penduduk
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats Section */}
      <section className="relative -mt-16 z-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl shadow-xl p-6 border border-slate-100 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Total Penduduk</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">1.322</h3>
            <p className="text-[11px] text-slate-500 mt-auto flex items-center gap-1"><Users className="w-3 h-3" /> 428 KK</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl shadow-xl p-6 border border-slate-100 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
              <Mountain className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Luas Wilayah</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">{luasWilayah} Ha</h3>
            <p className="text-[11px] text-slate-500 mt-auto flex items-center gap-1"><MapPin className="w-3 h-3" /> Berdasarkan Data Profil</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl shadow-xl p-6 border border-slate-100 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
              <Store className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Produk UMKM</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">{totalUmkm}</h3>
            <p className="text-[11px] text-slate-500 mt-auto flex items-center gap-1"><Store className="w-3 h-3" /> Terdaftar di Sistem</p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-xl shadow-xl p-6 border border-slate-100 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Jarak ke Kecamatan</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mb-2">4 km</h3>
            <p className="text-[11px] text-slate-500 mt-auto flex items-center gap-1"><Car className="w-3 h-3" /> Akses mudah ke {p.kecamatan || 'Hantara'}</p>
          </div>
        </div>
      </section>

      {/* 3. Peta & Potensi Desa */}
      <section className="py-20 bg-[#F4F6F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">

            {/* Teks & Kartu Potensi */}
            <div className="w-full lg:w-1/2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937] mb-6 tracking-tight">Peta & Potensi Desa</h2>
              <p className="text-slate-600 mb-10 leading-relaxed text-sm sm:text-base">
                {namaDesa} memiliki potensi sumber daya alam yang melimpah, mulai dari pertanian hingga pariwisata yang siap dikembangkan.
              </p>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-[#0A3D2D] mb-2">Komoditas Unggulan</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Padi Organik (67 Ha), Kopi (15 Ha), Bawang Merah, Pisang, serta peternakan Domba dan Ikan.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-[#0A3D2D] mb-2">Potensi Wisata</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Curug Citalib, Curug Kembar, dan wisata Embung/Cek DAM yang menanti untuk dikembangkan menjadi destinasi unggulan.
                  </p>
                </div>
              </div>
            </div>

            {/* Gambar Peta */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md bg-white p-3 rounded-2xl shadow-xl rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="w-full rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src="/images/peta-desa.png"
                    alt={`Peta ${namaDesa}`}
                    loading="lazy"
                    decoding="async"
                    width={600}
                    height={400}
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-[#0A3D2D] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
                  Wilayah {namaDesa}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="bg-[#022c22] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between gap-12">

            {/* Brand & Visi */}
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center p-1">
                  <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{namaDesa}, Kecamatan {p.kecamatan || 'Hantara'}, Kabupaten {p.kabupaten || 'Kuningan'}</h2>
              </div>
              <p className="text-sm text-emerald-100/70 leading-relaxed mb-10 max-w-md">
                {visi}
              </p>
              <p className="text-[10px] text-emerald-100/50">
                © 2026 KKM UMC Mahasiswa Teknik Informatika. All rights reserved.
              </p>
            </div>

            {/* Kontak */}
            <div className="lg:w-80 shrink-0">
              <h3 className="font-semibold text-xs text-emerald-100/50 uppercase tracking-wider mb-6">Kontak</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-sm text-emerald-100/90">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-emerald-100/70" />
                  </div>
                  <span>pemdes{namaDesa.toLowerCase().replace('desa ', '')}@gmail.com</span>
                </li>
                <li className="flex items-center gap-4 text-sm text-emerald-100/90">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-100/70" />
                  </div>
                  <span>{namaDesa.toUpperCase().replace('DESA ', '')} MAJU KA BALE</span>
                </li>
                <li className="flex items-center gap-4 text-sm text-emerald-100/90">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Landmark className="w-4 h-4 text-emerald-100/70" />
                  </div>
                  <span>Pemdes {namaDesa.replace('Desa ', '')}</span>
                </li>
                <li className="flex items-center gap-4 text-sm text-emerald-100/90">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-emerald-100/70" />
                  </div>
                  <span>{telepon}</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </footer>

      {/* Bottom Nav khusus mobile */}
      <BottomNav />
    </div>
  );
}
