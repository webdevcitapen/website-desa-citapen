import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageCircle, Store, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BottomNav from '../../components/layout/BottomNav';
import api, { getImageUrl } from '../../services/api';
import { formatHarga } from '../../utils/format';

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
  umkm?: { nama: string; nomorHp: string | null } | null;
}
interface Kategori { id: number; nama: string; }
const SORT_UMKM = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'terlama', label: 'Terlama' },
  { value: 'harga-asc', label: 'Harga Termurah' },
  { value: 'harga-desc', label: 'Harga Termahal' },
  { value: 'nama-asc', label: 'Nama A-Z' },
  { value: 'nama-desc', label: 'Nama Z-A' },
];

export default function Umkm() {
  const [produkList, setProdukList] = useState<UmkmItem[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('terbaru');
  const [halaman, setHalaman] = useState(1);
  const [totalHalaman, setTotalHalaman] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const perHalaman = 9;
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);
  useEffect(() => setHalaman(1), [debouncedSearch, kategoriFilter, sortBy]);

  // Fetch kategori sekali
  useEffect(() => {
    api.get('/kategori').then(r => {
      let kData: Kategori[] = [];
      if (Array.isArray(r.data?.data)) kData = r.data.data;
      else if (Array.isArray(r.data)) kData = r.data;
      else if (Array.isArray(r.data?.data?.daftar)) kData = r.data.data.daftar;
      setKategoriList(kData);
    }).catch(() => {});
  }, []);

  // Fetch produk dengan server-side pagination + filter
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const params: Record<string, string | number> = { halaman, perHalaman };
        if (debouncedSearch) params.cari = debouncedSearch;
        if (kategoriFilter !== 'Semua') {
          const kat = kategoriList.find(k => k.nama === kategoriFilter);
          if (kat) params.kategoriId = kat.id;
          else params.cari = debouncedSearch ? `${debouncedSearch} ${kategoriFilter}` : kategoriFilter;
        }
        const r = await api.get('/produk', { params, signal: controller.signal as any });
        let daftar: UmkmItem[] = [];
        let th = 1;
        let total = 0;
        if (r.data?.data?.daftar) {
          daftar = r.data.data.daftar;
          th = r.data.data.totalHalaman || 1;
          total = r.data.data.total || daftar.length;
        } else if (r.data?.daftar) {
          daftar = r.data.daftar;
          th = r.data.totalHalaman || 1;
          total = r.data.total || daftar.length;
        } else if (Array.isArray(r.data?.data)) daftar = r.data.data;
        else if (Array.isArray(r.data)) daftar = r.data;

        // Sort client-side untuk harga/nama karena backend hanya sort terbaru
        let sorted = [...daftar];
        if (sortBy === 'harga-asc') sorted.sort((a,b)=>(a.harga||0)-(b.harga||0));
        else if (sortBy === 'harga-desc') sorted.sort((a,b)=>(b.harga||0)-(a.harga||0));
        else if (sortBy === 'nama-asc') sorted.sort((a,b)=>a.nama.localeCompare(b.nama));
        else if (sortBy === 'nama-desc') sorted.sort((a,b)=>b.nama.localeCompare(a.nama));
        else if (sortBy === 'terlama') sorted.sort((a,b)=> new Date((a as any).dibuatPada || (a as any).dibuat_pada || 0).getTime() - new Date((b as any).dibuatPada || (b as any).dibuat_pada || 0).getTime());

        setProdukList(sorted);
        setTotalHalaman(Math.max(1, th));
        setTotalData(total);
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        console.error('Gagal mengambil data produk', err);
      } finally { setIsLoading(false); }
    };
    fetchData();
    return () => controller.abort();
  }, [halaman, debouncedSearch, kategoriFilter, sortBy, kategoriList]);

  const handleTambahProduk = () => {
    const token = localStorage.getItem('token');
    if (token) navigate('/admin/umkm/produk/tambah');
    else navigate('/login');
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
      <button onClick={handleTambahProduk} className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 bg-[#0A3D2D] text-white px-5 py-3 rounded-full shadow-lg hover:bg-[#082d22] transition-colors flex items-center gap-2 font-semibold"><Plus className="w-5 h-5" />Tambah Produk</button>
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-12 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A3D2D] mb-3">UMKM Desa</h1>
          <p className="text-slate-600 max-w-2xl text-sm md:text-base leading-relaxed">Data potensi usaha, pengembangan produk, dan etalase UMKM warga desa kami.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Cari produk, UMKM, deskripsi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none bg-[#F8FAFC] focus:bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400" /></div>
            <div className="relative"><Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" /><select value={kategoriFilter} onChange={(e) => setKategoriFilter(e.target.value)} className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium text-slate-700 outline-none focus:border-[#0A3D2D] focus:bg-white appearance-none cursor-pointer" style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}><option value="Semua">Semua Kategori</option>{kategoriList.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}</select></div>
            <div className="relative"><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium text-slate-700 outline-none focus:border-[#0A3D2D] focus:bg-white appearance-none cursor-pointer" style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}>{SORT_UMKM.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}</select></div>
          </div>
          {(debouncedSearch || kategoriFilter !== 'Semua') && (
            <div className="mt-3 text-xs text-slate-500">
              Menampilkan {totalData} produk
              {debouncedSearch && <> • Cari: <span className="font-bold text-[#0A3D2D]">"{debouncedSearch}"</span></>}
              {kategoriFilter !== 'Semua' && <> • Kategori: <span className="font-bold text-[#0A3D2D]">{kategoriFilter}</span></>}
              <button onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setKategoriFilter('Semua'); }} className="ml-2 text-[#0A3D2D] font-bold hover:underline">Reset</button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A3D2D]"></div></div>
        ) : produkList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4"><Store className="w-8 h-8 text-emerald-700" /></div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Produk</h2>
            <p className="text-slate-500 text-center max-w-md">Tidak ada produk yang sesuai dengan filter atau pencarian Anda.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {produkList.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col h-full">
                  <div className="relative h-56 w-full bg-slate-100">
                    <img src={item.foto ? getImageUrl(item.foto, { width: 600 }) : '/images/hero-bg.png'} alt={item.nama} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }} />
                    {item.kategori && item.kategori.nama && (<div className="absolute top-4 left-4 bg-white text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm tracking-wide">{item.kategori.nama}</div>)}
                  </div>
                  <div className="p-6 md:p-8 flex flex-col flex-grow">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-1 leading-snug">{item.nama}</h3>
                    {item.umkm?.nama && (<p className="text-xs font-bold text-emerald-600 mb-3">{item.umkm.nama}</p>)}
                    <p className="text-slate-500 text-sm md:text-[15px] line-clamp-3 leading-relaxed flex-grow mb-6">{item.deskripsi}</p>
                    <div className="mb-6"><span className="text-slate-800 font-extrabold text-[15px]">{formatHarga(item.harga)}</span></div>
                    <button onClick={() => handleWhatsApp(item.umkm?.nomorHp || undefined, item.nama)} className="w-full flex items-center justify-center gap-2 bg-[#8B5E3C] hover:bg-[#7a5133] text-white py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!item.umkm?.nomorHp}><MessageCircle className="w-4 h-4" />Hubungi via WhatsApp</button>
                  </div>
                </div>
              ))}
            </div>
            {totalHalaman > 1 && (
              <div className="flex flex-col items-center mt-10 gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => setHalaman(p => Math.max(1, p - 1))} disabled={halaman === 1} className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
                  {Array.from({ length: totalHalaman }, (_, i) => i + 1).slice(Math.max(0, halaman - 3), Math.min(totalHalaman, halaman + 2)).map(no => (
                    <button key={no} onClick={() => setHalaman(no)} className={`w-9 h-9 rounded-xl font-bold text-sm ${no === halaman ? 'bg-[#0A3D2D] text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{no}</button>
                  ))}
                  <button onClick={() => setHalaman(p => Math.min(totalHalaman, p + 1))} disabled={halaman === totalHalaman} className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <p className="text-xs text-slate-400">Halaman {halaman} dari {totalHalaman} • Total {totalData} produk</p>
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
