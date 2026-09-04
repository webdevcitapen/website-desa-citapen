import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Store } from 'lucide-react';
import api from '../../../services/api';
import ConfirmModal from '../../../components/ui/ConfirmModal';

interface Umkm {
  id: number;
  nama: string;
  nomorHp: string | null;
  alamat: string | null;
}

export default function DaftarUMKM() {
  const [umkmList, setUmkmList] = useState<Umkm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUmkm = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/umkm');
      if (response.data && response.data.data) {
        setUmkmList(response.data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data UMKM', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUmkm();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      await api.delete(`/umkm/${id}`);
      setDeleteConfirm(null);
      fetchUmkm();
    } catch (error: any) {
      console.error('Gagal menghapus UMKM', error);
      alert(error.response?.data?.pesan || 'Gagal menghapus UMKM.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUmkm = umkmList.filter(u => 
    u.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0A3D2D] mb-2 tracking-tight">
            Data UMKM
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Kelola daftar UMKM (Usaha Mikro Kecil Menengah) di Desa Citapen.
          </p>
        </div>
        <Link 
          to="/admin/umkm/data/tambah" 
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0A3D2D] text-white rounded-xl font-bold text-sm shadow-sm hover:bg-[#082d22] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tambah UMKM
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama UMKM..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all bg-[#F8FAFC] focus:bg-white text-sm font-medium text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Info UMKM</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No. WhatsApp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A3D2D]"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredUmkm.length > 0 ? (
                filteredUmkm.map((umkm) => (
                  <tr key={umkm.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                          <Store className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{umkm.nama}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {umkm.nomorHp || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {umkm.alamat || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/admin/umkm/data/edit/${umkm.id}`}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0A3D2D] hover:bg-slate-50 transition-colors shadow-sm"
                          title="Edit UMKM"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button 
                          onClick={() => setDeleteConfirm(umkm.id)}
                          className="w-8 h-8 rounded-lg bg-white border border-red-200 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors shadow-sm"
                          title="Hapus UMKM"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 text-sm font-medium">
                    Belum ada data UMKM.
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
        title="Hapus Data UMKM?"
        message="Tindakan ini tidak dapat dibatalkan. Menghapus UMKM ini akan melepaskan keterkaitan produk yang dimiliki oleh UMKM ini."
        confirmText="Hapus UMKM"
        cancelText="Batal"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
