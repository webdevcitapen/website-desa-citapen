import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageCircle, Store, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const [umkmList, setUmkmList] = useState<any[]>([]); // Menyimpan daftar profil UMKM
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [umkmFilter, setUmkmFilter] = useState('Semua'); // Filter toko
  const [sortBy, setSortBy] = useState('terbaru');
  
  const [halaman, setHalaman] = useState(1);
  const [totalHalaman, setTotalHalaman] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const perHalaman = 9;
  
  const [selectedUmkm, setSelectedUmkm] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<UmkmItem | null>(null);

  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);
  useEffect(() => setHalaman(1), [debouncedSearch, kategoriFilter, umkmFilter, sortBy]);

  // Fetch kategori dan umkm
  useEffect(() => {
    // Fetch Kategori
    api.get('/kategori').then(r => {
      let kData: Kategori[] = [];
      if (Array.isArray(r.data?.data)) kData = r.data.data;
      else if (Array.isArray(r.data)) kData = r.data;
      else if (Array.isArray(r.data?.data?.daftar)) kData = r.data.data.daftar;
      setKategoriList(kData);
    }).catch(() => {});

    // Fetch UMKM
    api.get('/umkm').then(r => {
      let uData: any[] = [];
      if (Array.isArray(r.data?.data)) uData = r.data.data;
      else if (Array.isArray(r.data)) uData = r.data;
      else if (Array.isArray(r.data?.data?.daftar)) uData = r.data.data.daftar;
      setUmkmList(uData);
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
        }

        if (umkmFilter !== 'Semua') {
          const u = umkmList.find(x => x.nama === umkmFilter);
          if (u) params.umkmId = u.id;
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
  }, [halaman, debouncedSearch, kategoriFilter, umkmFilter, sortBy, kategoriList, umkmList]);

  // Tutup modal saat tombol Escape ditekan
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedUmkm(null);
    };
    if (selectedUmkm) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedUmkm]);

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
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 sm:pt-12 pb-28">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#0A3D2D] mb-3">UMKM Desa</h1>
          <p className="text-slate-600 max-w-2xl text-sm md:text-base leading-relaxed">Data potensi usaha, pengembangan produk, dan etalase UMKM warga desa kami.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-5 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Cari produk, UMKM..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none bg-[#F8FAFC] focus:bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400" /></div>
            <div className="relative"><Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" /><select value={kategoriFilter} onChange={(e) => setKategoriFilter(e.target.value)} className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium text-slate-700 outline-none focus:border-[#0A3D2D] focus:bg-white appearance-none cursor-pointer" style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}><option value="Semua">Semua Kategori</option>{kategoriList.map(k => <option key={k.id} value={k.nama}>{k.nama}</option>)}</select></div>
            <div className="relative"><Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" /><select value={umkmFilter} onChange={(e) => setUmkmFilter(e.target.value)} className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium text-slate-700 outline-none focus:border-[#0A3D2D] focus:bg-white appearance-none cursor-pointer" style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}><option value="Semua">Semua Toko</option>{umkmList.map(u => <option key={u.id} value={u.nama}>{u.nama}</option>)}</select></div>
            <div className="relative"><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium text-slate-700 outline-none focus:border-[#0A3D2D] focus:bg-white appearance-none cursor-pointer" style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}>{SORT_UMKM.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}</select></div>
          </div>
          {(debouncedSearch || kategoriFilter !== 'Semua' || umkmFilter !== 'Semua') && (
            <div className="mt-3 text-xs text-slate-500">
              Menampilkan {totalData} produk
              {debouncedSearch && <> • Cari: <span className="font-bold text-[#0A3D2D]">"{debouncedSearch}"</span></>}
              {kategoriFilter !== 'Semua' && <> • Kategori: <span className="font-bold text-[#0A3D2D]">{kategoriFilter}</span></>}
              {umkmFilter !== 'Semua' && <> • Toko: <span className="font-bold text-[#0A3D2D]">{umkmFilter}</span></>}
              <button onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setKategoriFilter('Semua'); setUmkmFilter('Semua'); }} className="ml-2 text-[#0A3D2D] font-bold hover:underline">Reset</button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {produkList.map((item) => (
                <div key={item.id} onClick={() => setSelectedProduct(item)} className="cursor-pointer group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-1">
                  <div className="relative aspect-[3/4] w-full bg-slate-100">
                    <img src={item.foto ? getImageUrl(item.foto, { width: 600 }) : '/images/hero-bg.png'} alt={item.nama} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }} />
                    {item.kategori && item.kategori.nama && (<div className="absolute top-4 left-4 bg-white text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm tracking-wide">{item.kategori.nama}</div>)}
                  </div>
                  <div className="p-5 sm:p-8 flex flex-col flex-grow">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-1 leading-snug">{item.nama}</h3>
                    {item.umkm?.nama && (
                      <p 
                        onClick={(e) => { e.stopPropagation(); 
                          const u = umkmList.find(x => x.nama === item.umkm?.nama);
                          setSelectedUmkm(u || { nama: item.umkm?.nama, nomorHp: item.umkm?.nomorHp });
                        }}
                        className="text-xs font-bold text-emerald-600 mb-3 cursor-pointer hover:text-emerald-800 hover:underline w-max transition-colors inline-block"
                      >
                        {item.umkm.nama}
                      </p>
                    )}
                    <p className="text-slate-500 text-sm md:text-[15px] line-clamp-3 leading-relaxed flex-grow mb-6">{item.deskripsi}</p>
                    <div className="mb-6"><span className="text-slate-800 font-extrabold text-[15px]">{formatHarga(item.harga)}</span></div>
                    <button onClick={(e) => { e.stopPropagation(); handleWhatsApp(item.umkm?.nomorHp || undefined, item.nama); }} className="w-full flex items-center justify-center gap-2 bg-[#8B5E3C] hover:bg-[#7a5133] text-white py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!item.umkm?.nomorHp}><MessageCircle className="w-4 h-4" />Hubungi via WhatsApp</button>
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

      
      {/* Modal Detail Produk */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedProduct(null)}
          ></div>
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col md:flex-row">
            {/* Left: Image (Portrait format like card) */}
            <div className="md:w-[45%] bg-slate-100 flex shrink-0">
               <img src={selectedProduct.foto ? getImageUrl(selectedProduct.foto, { width: 600 }) : '/images/hero-bg.png'} alt={selectedProduct.nama} className="w-full h-64 md:h-full object-cover" />
            </div>
            
            {/* Right: Info */}
            <div className="p-6 flex flex-col flex-grow overflow-y-auto max-h-[60vh] md:max-h-[90vh]">
              <div className="flex justify-end mb-2">
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors absolute top-4 right-4 md:static md:mb-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 pr-6 md:pr-0">
                {selectedProduct.kategori && selectedProduct.kategori.nama && (
                   <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] md:text-xs font-bold px-3 py-1 rounded-full mb-3">{selectedProduct.kategori.nama}</span>
                )}
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 leading-tight">{selectedProduct.nama}</h2>
                <div className="text-lg md:text-xl font-extrabold text-[#0A3D2D] mb-4">{formatHarga(selectedProduct.harga)}</div>
              </div>

              <div className="text-sm md:text-[15px] text-slate-600 mb-6 leading-relaxed">
                <p className="whitespace-pre-wrap">{selectedProduct.deskripsi}</p>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100">
                <h4 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Informasi UMKM</h4>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm md:text-base">{selectedProduct.umkm?.nama}</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedProduct(null);
                    handleWhatsApp(selectedProduct.umkm?.nomorHp || undefined, selectedProduct.nama);
                  }} 
                  className="w-full flex items-center justify-center gap-2 bg-[#8B5E3C] hover:bg-[#7a5133] text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!selectedProduct.umkm?.nomorHp}
                >
                  <MessageCircle className="w-5 h-5" /> Hubungi Penjual via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal UMKM Profil */}
      {selectedUmkm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedUmkm(null)}
          ></div>
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-2 shadow-sm border border-emerald-200">
                  <Store className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setSelectedUmkm(null)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-1">{selectedUmkm.nama}</h3>
              {selectedUmkm.alamat ? (
                <p className="text-sm text-slate-500 font-medium mb-3 flex items-start gap-1.5">
                   <svg className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   {selectedUmkm.alamat}
                </p>
              ) : (
                <p className="text-sm text-slate-500 font-medium mb-3">UMKM Desa Citapen</p>
              )}
              
              {selectedUmkm.deskripsi && (
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 mb-5 max-h-32 overflow-y-auto">
                  {selectedUmkm.deskripsi}
                </p>
              )}
              
              <div className="flex flex-col gap-3 mt-6">
                <button 
                  onClick={() => {
                    setUmkmFilter(selectedUmkm.nama);
                    setSelectedUmkm(null);
                  }}
                  className="w-full flex justify-center items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2.5 rounded-xl font-bold text-sm transition-colors border border-emerald-200"
                >
                  <Store className="w-4 h-4" />
                  Lihat Semua Produk Toko Ini
                </button>
                <button 
                  onClick={() => handleWhatsApp(selectedUmkm.nomorHp, 'semua dari etalase Anda')}
                  disabled={!selectedUmkm.nomorHp}
                  className="w-full flex justify-center items-center gap-2 bg-[#0A3D2D] hover:bg-[#082d22] text-white py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4" />
                  Hubungi Penjual via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}
