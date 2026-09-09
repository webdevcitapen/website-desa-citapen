import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../services/api';
import ConfirmModal from '../../../components/ui/ConfirmModal';

// Interface disesuaikan dengan backend
interface BeritaItem {
  id: number;
  judul: string;
  isi: string;
  gambar?: string | null;
  dibuat_pada?: string;
  dibuatPada?: string;
  penulis?: {
    id: number;
    namaLengkap: string;
    username?: string;
  } | null;
  penulis_nama?: string; 
}

export default function DaftarBerita() {
  const [beritaList, setBeritaList] = useState<BeritaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<{ id: number; peran: string } | null>(null);
  const [halaman, setHalaman] = useState(1);
  const perHalaman = 10;

  const fetchBerita = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Ambil seluruh data berita (loop paginasi) agar pagination client-side bisa menampilkan semua
      let all: BeritaItem[] = [];
      let page = 1;
      let tHalaman = 1;
      do {
        const response = await api.get(`/berita?halaman=${page}&perHalaman=50`);
        let daftar: BeritaItem[] = [];
        let th = 1;
        if (response.data?.data?.daftar) {
          daftar = response.data.data.daftar;
          th = response.data.data.totalHalaman || 1;
        } else if (response.data?.daftar) {
          daftar = response.data.daftar;
          th = response.data.totalHalaman || 1;
        }
        all = [...all, ...daftar];
        tHalaman = th;
        page++;
        if (daftar.length === 0) break;
      } while (page <= tHalaman);
      setBeritaList(all);
    } catch (err: any) {
      setError(err.response?.data?.pesan || 'Gagal mengambil data berita.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/autentikasi/saya');
        if (response.data && response.data.data) {
          setUserProfile(response.data.data);
        } else if (response.data?.id) {
          setUserProfile(response.data);
        }
      } catch (err) {
        console.error('Gagal memuat profil admin', err);
      }
    };
    fetchUser();
    fetchBerita();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/berita/${id}`);
      setDeleteConfirm(null);
      await fetchBerita();
    } catch (err: any) {
      setError(err.response?.data?.pesan || 'Gagal menghapus berita.');
    }
  };

  // Role-based filtering: publikasi hanya lihat berita miliknya
  const visibleBerita = useMemo(() => {
    if (userProfile?.peran === 'publikasi') {
      return beritaList.filter(item => item.penulis?.id === userProfile.id);
    }
    return beritaList;
  }, [beritaList, userProfile]);

  // Search filter (judul, isi)
  const filteredBerita = useMemo(() => {
    if (!searchQuery.trim()) return visibleBerita;
    const q = searchQuery.toLowerCase();
    return visibleBerita.filter(item => 
      item.judul.toLowerCase().includes(q) || 
      item.isi.toLowerCase().includes(q)
    );
  }, [visibleBerita, searchQuery]);

  // Reset halaman saat search berubah
  useEffect(() => {
    setHalaman(1);
  }, [searchQuery]);

  const total = filteredBerita.length;
  const totalHalaman = Math.max(1, Math.ceil(total / perHalaman));
  const halamanAktif = Math.min(halaman, totalHalaman);
  const paginated = filteredBerita.slice((halamanAktif - 1) * perHalaman, halamanAktif * perHalaman);

  const getPenulisNama = (item: BeritaItem) => {
    if (item.penulis?.namaLengkap) return item.penulis.namaLengkap;
    if (item.penulis_nama) return item.penulis_nama;
    return 'Admin';
  };

  const getTanggal = (item: BeritaItem) => {
    const t = item.dibuatPada || item.dibuat_pada;
    if (!t) return '-';
    return new Date(t).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const canEdit = (item: BeritaItem) => {
    if (!userProfile) return false;
    return item.penulis?.id === userProfile.id;
  };

  const canDelete = (item: BeritaItem) => {
    if (!userProfile) return false;
    if (userProfile.peran === 'admin') return true;
    return item.penulis?.id === userProfile.id;
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0A3D2D] mb-2 tracking-tight">
            Artikel Berita
          </h1>
          <p className="text-sm font-medium text-slate-500">
            {userProfile?.peran === 'publikasi'
              ? `Menampilkan ${total} berita milik Anda.`
              : `Kelola pengumuman dan berita terbaru untuk warga Desa Citapen. Total ${total} artikel.`}
          </p>
        </div>
        <Link 
          to="/admin/berita/tambah" 
          className="flex items-center justify-center gap-2 bg-[#0A3D2D] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#082d22] transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Berita
        </Link>
      </div>

      {/* Toolbar Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari artikel (judul, isi)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all bg-white text-sm font-medium text-slate-700"
          />
        </div>
        <div className="text-xs text-slate-500 flex items-center px-3">
          {userProfile?.peran === 'publikasi' ? 'Mode Publikasi: hanya berita Anda' : 'Mode Admin: semua berita'}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-bold border border-red-100">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC]">
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest w-[45%]">Judul Berita</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Penulis</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Tanggal Publikasi</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A3D2D]"></div>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 text-sm font-medium">
                    {searchQuery ? 'Tidak ada artikel yang sesuai pencarian.' : 'Tidak ada artikel yang ditemukan.'}
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    
                    {/* JUDUL BERITA */}
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm font-bold text-slate-800 mb-1 line-clamp-1">{item.judul}</p>
                        <p className="text-xs text-slate-400 font-medium line-clamp-1 leading-relaxed">
                          {item.isi.replace(/<[^>]+>/g, '')}
                        </p>
                      </div>
                    </td>
                    
                    {/* PENULIS */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-slate-600 font-medium">
                        {getPenulisNama(item)}
                      </p>
                      {userProfile?.peran === 'admin' && item.penulis?.id === userProfile?.id && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Anda</span>
                      )}
                    </td>
                    
                    {/* TANGGAL PUBLIKASI */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-slate-600 font-medium">
                        {getTanggal(item)}
                      </p>
                    </td>
                    
                    {/* AKSI */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        {canEdit(item) && (
                          <Link 
                            to={`/admin/berita/edit/${item.id}`} 
                            className="text-slate-400 hover:text-[#0A3D2D] transition-colors p-1.5 hover:bg-slate-100 rounded"
                            title="Edit Berita"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        )}
                        {canDelete(item) && (
                          <button 
                            onClick={() => setDeleteConfirm(item.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded"
                            title="Hapus Berita"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {!canEdit(item) && !canDelete(item) && (
                          <span className="text-[11px] font-medium text-slate-400 italic">Hanya Penulis</span>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex flex-col items-center mt-6 gap-2">
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
          <p className="text-xs text-slate-400">Halaman {halamanAktif} dari {totalHalaman} • Total {total} artikel (max {perHalaman}/halaman)</p>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm!)}
        title="Hapus Berita?"
        message="Tindakan ini tidak dapat dibatalkan. Berita ini akan dihapus secara permanen dari sistem."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
      
    </div>
  );
}
