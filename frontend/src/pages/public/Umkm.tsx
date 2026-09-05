import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageCircle, Store, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BottomNav from '../../components/layout/BottomNav';
import api, { getImageUrl } from '../../services/api';
import { formatHarga } from '../../utils/format';

// Interface for UMKM
interface UmkmItem {
  id: number;
  kategori?: { id: number; nama: string } | null;
  kategoriId?: number | null;
  nama: string;
  deskripsi: string;
  harga: number;
  foto: string | null;
  dibuatPada?: string;
  dibuat_pada?: string;
  umkm?: {
    nama: string;
    nomorHp: string | null;
  } | null;
}

interface Kategori {
  id: number;
  nama: string;
}

const SORT_UMKM = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'terlama', label: 'Terlama' },
  { value: 'harga-asc', label: 'Harga Termurah' },
  { value: 'harga-desc', label: 'Harga Termahal' },
  { value: 'nama-asc', label: 'Nama A-Z' },
  { value: 'nama-desc', label: 'Nama Z-A' },
];

export default function Umkm() {
  const [umkmList, setUmkmList] = useState<UmkmItem[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('terbaru');
  const [halaman, setHalaman] = useState(1);
  const perHalaman = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [resProduk, resKategori] = await Promise.all([
          (async () => {
            // Ambil semua produk (max 50 per halaman, loop)
            let all: UmkmItem[] = [];
            let page = 1;
            let tHalaman = 1;
            do {
              const r = await api.get(`/produk?halaman=${page}&perHalaman=50`);
              let daftar: UmkmItem[] = [];
              let th = 1;
              if (r.data?.data?.daftar) {
                daftar = r.data.data.daftar;
                th = r.data.data.totalHalaman || 1;
              } else if (r.data?.daftar) {
                daftar = r.data.daftar;
                th = r.data.totalHalaman || 1;
              } else if (Array.isArray(r.data?.data)) {
                daftar = r.data.data;
              } else if (Array.isArray(r.data)) {
                daftar = r.data;
              }
              all = [...all, ...daftar];
              tHalaman = th;
              page++;
              if (daftar.length === 0) break;
            } while (page <= tHalaman);
            return all;
          })(),
          api.get('/kategori')
        ]);

        setUmkmList(resProduk);

        let kData: Kategori[] = [];
        if (Array.isArray(resKategori.data?.data)) kData = resKategori.data.data;
        else if (Array.isArray(resKategori.data)) kData = resKategori.data;
        setKategoriList(kData);
      } catch (error) {
        console.error("Gagal mengambil data produk", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setHalaman(1);
  }, [searchQuery, kategoriFilter, sortBy]);

  const filteredAndSorted = useMemo(() => {
    let result = [...umkmList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.nama.toLowerCase().includes(q) ||
        item.deskripsi.toLowerCase().includes(q) ||
        (item.umkm?.nama && item.umkm.nama.toLowerCase().includes(q)) ||
        (item.kategori?.nama && item.kategori.nama.toLowerCase().includes(q))
      );
    }

    if (kategoriFilter !== 'Semua') {
      result = result.filter(item => item.kategori?.nama === kategoriFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'harga-asc') return (a.harga || 0) - (b.harga || 0);
      if (sortBy === 'harga-desc') return (b.harga || 0) - (a.harga || 0);
      if (sortBy === 'nama-asc') return a.nama.localeCompare(b.nama);
      if (sortBy === 'nama-desc') return b.nama.localeCompare(a.nama);
      const da = new Date(a.dibuatPada || (a as any).dibuat_pada || 0).getTime();
      const db = new Date(b.dibuatPada || (b as any).dibuat_pada || 0).getTime();
      if (sortBy === 'terbaru') return db - da;
      if (sortBy === 'terlama') return da - db;
      return 0;
    });

    return result;
  }, [umkmList, searchQuery, kategoriFilter, sortBy]);

  const total = filteredAndSorted.length;
  const totalHalaman = Math.max(1, Math.ceil(total / perHalaman));
  const halamanAktif = Math.min(halaman, totalHalaman);
  const paginated = filteredAndSorted.slice((halamanAktif - 1) * perHalaman, halamanAktif * perHalaman);

  const handleTambahProduk = () => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/admin/umkm/produk/tambah');
    } else {
      navigate('/login');
    }
  };

  const handleWhatsApp = (noWa: string | undefined, produkName: string) => {
    if (!noWa) return;
    const cleaned = noWa.replace(/[^0-9]/g, '');
    const withCountry = cleaned.startsWith('0') ? '62' + cleaned.slice(1) : cleaned;
    const message = encodeURIComponent(`Halo, saya tertarik dengan produk ${produkName} dari Desa Citapen.`);
    window.open(`https://wa.me/${withCountry}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FBFBFF] pb-20 md:pb-0 relative">
      <Navbar />

      {/* Floating Action Button */}
      <button 
        onClick={handleTambahProduk}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 bg-[#0A3D2D] text-white px-5 py-3 rounded-full shadow-lg hover:bg-[#082d22] transition-colors flex items-center gap-2 font-semibold"
      >
        <Plus className="w-5 h-5" />
        Tambah Produk
      </button>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-12 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A3D2D] mb-3">UMKM Desa</h1>
          <p className="text-slate-600 max-w-2xl text-sm md:text-base leading-relaxed">
            Data potensi usaha, pengembangan produk, dan etalase UMKM warga desa kami.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari produk, UMKM, deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none bg-[#F8FAFC] focus:bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium text-slate-700 outline-none focus:border-[#0A3D2D] focus:bg-white appearance-none cursor-pointer"
                style={{
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1em'
                }}
              >
                <option value="Semua">Semua Kategori</option>
                {kategoriList.map(k => (
                  <option key={k.id} value={k.nama}>{k.nama}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium text-slate-700 outline-none focus:border-[#0A3D2D] focus:bg-white appearance-none cursor-pointer"
                style={{
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1em'
                }}
              >
                {SORT_UMKM.map(o => (
                  <option key={o.value} value={o.value}>Sort: {o.label}</option>
                ))}
              </select>
            </div>
          </div>
          {(searchQuery || kategoriFilter !== 'Semua') && (
            <div className="mt-3 text-xs text-slate-500">
              Menampilkan {total} dari {umkmList.length} produk
              <button onClick={() => { setSearchQuery(''); setKategoriFilter('Semua'); }} className="ml-2 text-[#0A3D2D] font-bold hover:underline">Reset</button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A3D2D]"></div>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-emerald-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Produk</h2>
            <p className="text-slate-500 text-center max-w-md">Tidak ada produk yang sesuai dengan filter atau pencarian Anda.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginated.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col h-full">
                  <div className="relative h-56 w-full bg-slate-100">
                    <img src={item.foto ? getImageUrl(item.foto) : '/images/hero-bg.png'} alt={item.nama} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }} />
                    {item.kategori && item.kategori.nama && (
                      <div className="absolute top-4 left-4 bg-white text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm tracking-wide">
                        {item.kategori.nama}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 md:p-8 flex flex-col flex-grow">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-1 leading-snug">
                      {item.nama}
                    </h3>
                    {item.umkm?.nama && (
                      <p className="text-xs font-bold text-emerald-600 mb-3">{item.umkm.nama}</p>
                    )}
                    <p className="text-slate-500 text-sm md:text-[15px] line-clamp-3 leading-relaxed flex-grow mb-6">
                      {item.deskripsi}
                    </p>
                    
                    <div className="mb-6">
                      <span className="text-slate-800 font-extrabold text-[15px]">
                        {formatHarga(item.harga)}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => handleWhatsApp(item.umkm?.nomorHp || undefined, item.nama)}
                      className="w-full flex items-center justify-center gap-2 bg-[#8B5E3C] hover:bg-[#7a5133] text-white py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!item.umkm?.nomorHp}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Hubungi via WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalHalaman > 1 && (
              <div className="flex flex-col items-center mt-10 gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => setHalaman(p => Math.max(1, p - 1))} disabled={halamanAktif === 1} className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalHalaman }, (_, i) => i + 1).slice(Math.max(0, halamanAktif - 3), Math.min(totalHalaman, halamanAktif + 2)).map(no => (
                    <button key={no} onClick={() => setHalaman(no)} className={`w-9 h-9 rounded-xl font-bold text-sm ${no === halamanAktif ? 'bg-[#0A3D2D] text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {no}
                    </button>
                  ))}
                  <button onClick={() => setHalaman(p => Math.min(totalHalaman, p + 1))} disabled={halamanAktif === totalHalaman} className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">Halaman {halamanAktif} dari {totalHalaman} • Total {total} produk</p>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
