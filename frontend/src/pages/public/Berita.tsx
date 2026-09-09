import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Plus, ArrowRight, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BottomNav from '../../components/layout/BottomNav';
import api, { getImageUrl } from '../../services/api';
import { formatTanggal } from '../../utils/format';

export interface BeritaItem {
  id: number;
  kategori?: string;
  judul: string;
  isi: string;
  gambar: string | null;
  dibuatPada: string;
  dibuat_pada?: string;
  penulis?: { id: number; namaLengkap: string };
}

const KATEGORI_BERITA = ['Semua', 'Umum', 'Infrastruktur', 'Kesehatan', 'Pendidikan', 'Pertanian', 'Ekonomi', 'Sosial', 'Budaya'];
const SORT_OPTIONS = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'terlama', label: 'Terlama' },
  { value: 'judul-asc', label: 'Judul A-Z' },
  { value: 'judul-desc', label: 'Judul Z-A' },
];

export default function Berita() {
  const [berita, setBerita] = useState<BeritaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('terbaru');
  const [halaman, setHalaman] = useState(1);
  const [totalHalaman, setTotalHalaman] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const perHalaman = 10;
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setHalaman(1);
  }, [debouncedSearch, kategoriFilter, sortBy]);

  useEffect(() => {
    const fetchBerita = async () => {
      // Batalkan request sebelumnya
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        setIsLoading(true);
        const params: Record<string, string | number> = {
          halaman,
          perHalaman,
        };
        if (debouncedSearch) params.cari = debouncedSearch;
        if (kategoriFilter !== 'Semua') params.kategori = kategoriFilter;

        const response = await api.get('/berita', { params, signal: controller.signal as any });
        let daftar: BeritaItem[] = [];
        let tHalaman = 1;
        let total = 0;
        if (response.data?.data?.daftar) {
          daftar = response.data.data.daftar;
          tHalaman = response.data.data.totalHalaman || 1;
          total = response.data.data.total || daftar.length;
        } else if (response.data?.daftar) {
          daftar = response.data.daftar;
          tHalaman = response.data.totalHalaman || 1;
          total = response.data.total || daftar.length;
        } else if (Array.isArray(response.data?.data)) {
          daftar = response.data.data;
        }

        // Sort client-side hanya untuk judul-asc/desc (karena backend hanya sort terbaru)
        // Untuk terbaru/terlama sudah di-handle server (desc), tapi kita tetap pastikan
        if (sortBy === 'judul-asc') daftar = [...daftar].sort((a, b) => a.judul.localeCompare(b.judul));
        else if (sortBy === 'judul-desc') daftar = [...daftar].sort((a, b) => b.judul.localeCompare(a.judul));
        else if (sortBy === 'terlama') daftar = [...daftar].sort((a, b) => new Date(a.dibuatPada || (a as any).dibuat_pada || 0).getTime() - new Date(b.dibuatPada || (b as any).dibuat_pada || 0).getTime());

        setBerita(daftar);
        setTotalHalaman(Math.max(1, tHalaman));
        setTotalData(total);
      } catch (error: any) {
        if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
        console.error('Gagal mengambil data berita', error);
        setBerita([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBerita();
    return () => abortRef.current?.abort();
  }, [halaman, debouncedSearch, kategoriFilter, sortBy]);

  // Featured: 3 terbaru dari halaman 1 saja; jika halaman >1, featured tidak tampil
  const isHalamanSatu = halaman === 1 && !debouncedSearch && kategoriFilter === 'Semua' && sortBy === 'terbaru';
  const featured = isHalamanSatu ? berita.slice(0, 3) : [];
  const rest = isHalamanSatu ? berita.slice(3) : berita;

  // Untuk featured case, total list sebenarnya adalah totalData - 3
  // Tapi pagination server sudah hitung totalData, jadi kita tampilkan langsung
  const halamanAktif = halaman;

  const handleTambahBerita = () => {
    const token = localStorage.getItem('token');
    if (token) navigate('/admin/berita/tambah');
    else navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FBFBFF] pb-20 md:pb-0 relative">
      <Navbar />
      <button onClick={handleTambahBerita} className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 bg-[#0A3D2D] text-white px-5 py-3 rounded-full shadow-lg hover:bg-[#082d22] transition-colors flex items-center gap-2 font-semibold">
        <Plus className="w-5 h-5" /> Tambah Berita
      </button>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-12 pb-24">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A3D2D] mb-3">Berita Desa Terkini</h1>
          <p className="text-slate-600 max-w-2xl text-sm md:text-base leading-relaxed">Dapatkan informasi terbaru mengenai Desa Citapen.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cari berita (judul, isi)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none bg-[#F8FAFC] focus:bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={kategoriFilter} onChange={(e) => setKategoriFilter(e.target.value)} className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium text-slate-700 outline-none focus:border-[#0A3D2D] focus:bg-white appearance-none cursor-pointer" style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}>
                {KATEGORI_BERITA.map(k => <option key={k} value={k}>{k === 'Semua' ? 'Semua Kategori' : k}</option>)}
              </select>
            </div>
            <div className="relative">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium text-slate-700 outline-none focus:border-[#0A3D2D] focus:bg-white appearance-none cursor-pointer" style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
              </select>
            </div>
          </div>
          {(debouncedSearch || kategoriFilter !== 'Semua') && (
            <div className="mt-3 text-xs text-slate-500">
              Menampilkan {totalData} berita
              {debouncedSearch && <> • Cari: <span className="font-bold text-[#0A3D2D]">"{debouncedSearch}"</span></>}
              {kategoriFilter !== 'Semua' && <> • Kategori: <span className="font-bold text-[#0A3D2D]">{kategoriFilter}</span></>}
              <button onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setKategoriFilter('Semua'); }} className="ml-2 text-[#0A3D2D] font-bold hover:underline">Reset</button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A3D2D]"></div></div>
        ) : berita.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4"><Calendar className="w-8 h-8 text-emerald-700" /></div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Berita</h2>
            <p className="text-slate-500 text-center max-w-md">Tidak ada berita yang sesuai dengan filter atau pencarian Anda.</p>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="mb-12">
                <h2 className="text-lg font-bold text-[#0A3D2D] mb-4">Berita Terbaru</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featured.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
                      <div className="h-48 w-full overflow-hidden bg-slate-100">
                        <img src={getImageUrl(item.gambar, { width: 600 })} alt={item.judul} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }} />
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-2"><Calendar className="w-3.5 h-3.5" />{formatTanggal(item.dibuatPada || (item as any).dibuat_pada)}{item.kategori && <span className="ml-2 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{item.kategori}</span>}</div>
                        <h3 className="text-base font-bold text-slate-800 mb-2 line-clamp-2 leading-tight">{item.judul}</h3>
                        <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed flex-grow mb-3">{item.isi}</p>
                        <Link to={`/berita/${item.id}`} className="inline-flex items-center gap-1.5 text-[#0A3D2D] font-bold text-xs hover:underline mt-auto">Baca Selengkapnya <ArrowRight className="w-3 h-3" /></Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-[#0A3D2D] mb-4">Daftar Berita {totalData > 0 && <span className="text-sm font-normal text-slate-500">(Total {totalData} • Hal {halamanAktif}/{totalHalaman})</span>}</h2>
              {rest.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">Tidak ada berita lain. {featured.length > 0 ? 'Semua berita sudah tampil di 3 terbaru.' : ''}</div>
              ) : (
                <>
                  <div className="space-y-4">
                    {rest.map((item) => (
                      <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition">
                        <div className="sm:w-48 h-48 sm:h-auto w-full bg-slate-100 shrink-0 overflow-hidden">
                          <img src={getImageUrl(item.gambar, { width: 400 })} alt={item.judul} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }} />
                        </div>
                        <div className="p-5 flex flex-col flex-grow">
                          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-2"><Calendar className="w-3.5 h-3.5" />{formatTanggal(item.dibuatPada || (item as any).dibuat_pada, { day: 'numeric', month: 'short', year: 'numeric' })}{item.kategori && <span className="ml-2 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{item.kategori}</span>}</div>
                          <h3 className="text-base font-bold text-slate-800 mb-2 line-clamp-1">{item.judul}</h3>
                          <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed flex-grow">{item.isi}</p>
                          <Link to={`/berita/${item.id}`} className="inline-flex items-center gap-1.5 text-[#0A3D2D] font-bold text-xs hover:underline mt-3">Baca Selengkapnya <ArrowRight className="w-3 h-3" /></Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalHalaman > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button onClick={() => setHalaman(p => Math.max(1, p - 1))} disabled={halamanAktif === 1} className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
                      {Array.from({ length: totalHalaman }, (_, i) => i + 1).slice(Math.max(0, halamanAktif - 3), Math.min(totalHalaman, halamanAktif + 2)).map(no => (
                        <button key={no} onClick={() => setHalaman(no)} className={`w-9 h-9 rounded-xl font-bold text-sm ${no === halamanAktif ? 'bg-[#0A3D2D] text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{no}</button>
                      ))}
                      <button onClick={() => setHalaman(p => Math.min(totalHalaman, p + 1))} disabled={halamanAktif === totalHalaman} className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  )}
                  <p className="text-center text-xs text-slate-400 mt-3">Halaman {halamanAktif} dari {totalHalaman} • Total {totalData} berita</p>
                </>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
