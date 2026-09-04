import { useState, useEffect } from 'react';
import { Plus, Trash2, Tags, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
import ConfirmModal from '../../../components/ui/ConfirmModal';

interface Kategori {
  id: number;
  nama: string;
}

export default function DaftarKategori() {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [namaKategoriBaru, setNamaKategoriBaru] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchKategori = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/kategori');
      if (response.data?.data) {
        setKategoriList(response.data.data);
      } else if (response.data) {
        setKategoriList(response.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data kategori', err);
      setError('Gagal memuat daftar kategori.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKategori();
  }, []);

  const handleTambahKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKategoriBaru.trim()) return;

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await api.post('/kategori', { nama: namaKategoriBaru.trim() });
      setSuccess('Kategori baru berhasil ditambahkan!');
      setNamaKategoriBaru('');
      fetchKategori();
    } catch (err: any) {
      setError(err.response?.data?.pesan || 'Gagal menambahkan kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      setError(null);
      setSuccess(null);
      await api.delete(`/kategori/${id}`);
      setDeleteConfirm(null);
      setSuccess('Kategori berhasil dihapus!');
      fetchKategori();
    } catch (err: any) {
      setError(err.response?.data?.pesan || 'Gagal menghapus kategori. Kategori ini mungkin sedang digunakan oleh suatu produk.');
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0A3D2D] mb-2 tracking-tight">
          Kategori Produk
        </h1>
        <p className="text-sm font-medium text-slate-500">
          Kelola daftar kategori yang dapat dipilih pada saat penambahan produk UMKM.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">{success}</p>
        </div>
      )}

      {/* Form Tambah */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-[15px] font-extrabold text-slate-800 mb-4">Tambah Kategori Baru</h2>
        <form onSubmit={handleTambahKategori} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Misal: Kerajinan Tangan..." 
              value={namaKategoriBaru}
              onChange={(e) => setNamaKategoriBaru(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all text-sm font-medium text-slate-700"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting || !namaKategoriBaru.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0A3D2D] text-white rounded-xl font-bold text-sm shadow-sm hover:bg-[#082d22] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Simpan Kategori
          </button>
        </form>
      </div>

      {/* Tabel Kategori */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 text-center">No</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A3D2D]"></div>
                    </div>
                  </td>
                </tr>
              ) : kategoriList.length > 0 ? (
                kategoriList.map((kategori, index) => (
                  <tr key={kategori.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-slate-400 text-center">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                          <Tags className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-800">{kategori.nama}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setDeleteConfirm(kategori.id)}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white border border-red-200 text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors shadow-sm"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500 text-sm font-medium">
                    Belum ada data kategori.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm!)}
        title="Hapus Kategori?"
        message="Tindakan ini tidak dapat dibatalkan. Kategori ini mungkin tidak dapat dihapus jika masih ada produk yang terkait dengannya."
        confirmText="Hapus Kategori"
        cancelText="Batal"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
