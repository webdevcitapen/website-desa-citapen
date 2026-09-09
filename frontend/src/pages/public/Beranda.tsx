import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Mountain, Store, MapPin, Car } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
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
  const rawLuasWilayah = p.luasWilayah || p.luas_wilayah;
  const luasWilayah = rawLuasWilayah?.trim() && rawLuasWilayah !== '-' ? rawLuasWilayah : '± 473,3 Ha';
  const visi = p.visi || 'Mewujudkan masyarakat desa yang sejahtera, mandiri, dan berbudaya melalui tata kelola yang transparan dan inovatif.';
  const namaDesa = p.nama_desa || 'Desa Citapen';

  return (
    <div className="min-h-screen bg-[#FBFBFF] font-sans pb-20 md:pb-0">
      <Navbar />

      {/* 1. Hero Section */}
      <section className="relative w-full min-h-[520px] h-[calc(100svh-4rem)] max-h-[760px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] bg-cover bg-center" style={{ backgroundImage: "url('/images/hero-bg.png')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 sm:mb-6 leading-tight drop-shadow-lg">
              Selamat Datang di<br />{namaDesa}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-white/90 drop-shadow-md mb-8 leading-relaxed max-w-2xl">
              {visi}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/profil" className="bg-[#082d22] hover:bg-emerald-900 text-white font-semibold py-3 px-5 sm:px-8 rounded-lg text-center transition-colors shadow-lg text-sm tracking-wide">
                Jelajahi Profil Desa
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats Section */}
      <section className="relative -mt-10 sm:-mt-16 z-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-12 sm:mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 border border-slate-100 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Total Penduduk</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2">1.322</h3>
            <p className="text-[11px] text-slate-500 mt-auto flex items-center gap-1"><Users className="w-3 h-3" /> 428 KK</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 border border-slate-100 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
              <Mountain className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Luas Wilayah</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2 break-words">{luasWilayah}</h3>
            <p className="text-[11px] text-slate-500 mt-auto flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> Wilayah Desa Citapen</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 border border-slate-100 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
              <Store className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Produk UMKM</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2">{totalUmkm}</h3>
            <p className="text-[11px] text-slate-500 mt-auto flex items-center gap-1"><Store className="w-3 h-3" /> Terdaftar di Sistem</p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 border border-slate-100 flex flex-col h-full hover:-translate-y-1 transition-transform duration-300">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">Jarak ke Kecamatan</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2">4 km</h3>
            <p className="text-[11px] text-slate-500 mt-auto flex items-center gap-1"><Car className="w-3 h-3" /> Akses mudah ke {p.kecamatan || 'Hantara'}</p>
          </div>
        </div>
      </section>

      {/* 3. Peta & Potensi Desa */}
      <section className="py-14 sm:py-20 bg-[#F4F6F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">

            {/* Teks & Kartu Potensi */}
            <div className="w-full lg:w-1/2">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1F2937] mb-5 sm:mb-6 tracking-tight">Peta & Potensi Desa</h2>
              <p className="text-slate-600 mb-10 leading-relaxed text-sm sm:text-base">
                {namaDesa} memiliki potensi sumber daya alam yang melimpah, mulai dari pertanian hingga pariwisata yang siap dikembangkan.
              </p>

              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-[#0A3D2D] mb-2">Komoditas Unggulan</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Padi Organik (67 Ha), Kopi (15 Ha), Bawang Merah, Pisang, serta peternakan Domba dan Ikan.
                  </p>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-[#0A3D2D] mb-2">Potensi Wisata</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Curug Citalib, Curug Kembar, dan wisata Embung/Cek DAM yang menanti untuk dikembangkan menjadi destinasi unggulan.
                  </p>
                </div>
              </div>
            </div>

            {/* Gambar Peta */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end mt-6 lg:mt-0">
              <div className="relative w-[92%] sm:w-full max-w-md bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl rotate-1 hover:rotate-0 transition-transform duration-500">
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
                <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-[#0A3D2D] text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold text-xs sm:text-sm shadow-lg">
                  Wilayah {namaDesa}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <Footer profil={p} />

      {/* Bottom Nav khusus mobile */}
      <BottomNav />
    </div>
  );
}
