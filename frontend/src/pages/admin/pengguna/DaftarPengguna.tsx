import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, UserPlus } from 'lucide-react';
import api from '../../../services/api';
import ConfirmModal from '../../../components/ui/ConfirmModal';

interface PenggunaData {
  id: number;
  username: string;
  namaLengkap: string;
  email: string | null;
  peran: 'admin' | 'publikasi';
  fotoProfil?: string | null;
}

export default function DaftarPengguna() {
  const [penggunaList, setPenggunaList] = useState<PenggunaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const fetchPengguna = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/pengguna');
      if (response.data && response.data.data && response.data.data.daftar) {
        setPenggunaList(response.data.data.daftar);
      } else if (response.data && response.data.daftar) {
        setPenggunaList(response.data.daftar);
      }
    } catch (error) {
      console.error('Gagal mengambil data pengguna', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPengguna();
    
    // Ambil info user yang sedang login untuk mencegah penghapusan akun sendiri
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/autentikasi/saya');
        const userData = response.data?.data || response.data;
        if (userData && userData.id) {
          setCurrentUserId(userData.id);
        }
      } catch (error) {
        console.error('Gagal mengambil data user saat ini', error);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      setIsDeleting(true);
      await api.delete(`/admin/pengguna/${id}`);
      setDeleteConfirm(null);
      fetchPengguna();
    } catch (error: any) {
      console.error('Gagal menghapus pengguna', error);
      alert(error.response?.data?.pesan || 'Gagal menghapus pengguna.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (peran: string) => {
    switch (peran) {
      case 'admin':
        return <span className="bg-[#D1FAE5] text-[#065F46] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">Admin</span>;
      case 'publikasi':
        return <span className="bg-[#E0F2FE] text-[#0369A1] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">Publikasi</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">{peran}</span>;
    }
  };

  const getAksesKhusus = (peran: string) => {
    switch (peran) {
      case 'admin': return 'Administrator Sistem (Semua Akses)';
      case 'publikasi': return 'Publikasi Berita';
      default: return 'Tidak Ada';
    }
  };

  // Helper untuk inisial nama
  const getInitials = (nama: string) => {
    return nama
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0A3D2D] mb-2 tracking-tight">
            Manajemen Akses Pengguna
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Tinjau dan kelola akses administratif dan bisnis.
          </p>
        </div>
        <Link 
          to="/admin/pengguna/tambah"
          className="flex items-center justify-center gap-2 bg-[#0A3D2D] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#082d22] transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          + Tambah Akun Baru
        </Link>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Container for horizontal scroll on mobile */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest w-[30%]">Nama Pengguna</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Peran</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Akses Khusus</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A3D2D]"></div>
                    </div>
                  </td>
                </tr>
              ) : penggunaList.length > 0 ? (
                penggunaList.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    
                    {/* NAMA PENGGUNA */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        {user.fotoProfil ? (
                          <img src={user.fotoProfil} alt={user.namaLengkap} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                            {getInitials(user.namaLengkap || user.username)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-800">{user.namaLengkap}</p>
                          <p className="text-xs text-slate-400 font-medium">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* EMAIL */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-slate-600 font-medium">{user.email || '-'}</p>
                    </td>
                    
                    {/* PERAN */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.peran)}
                    </td>
                    
                    {/* AKSES KHUSUS */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-slate-600 font-medium">{getAksesKhusus(user.peran)}</p>
                    </td>
                    
                    {/* AKSI */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <Link 
                          to={`/admin/pengguna/edit/${user.id}`}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0A3D2D] hover:bg-slate-50 transition-colors shadow-sm"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        {currentUserId !== user.id && (
                          <button 
                            onClick={() => setDeleteConfirm(user.id)}
                            className="w-8 h-8 rounded-lg bg-white border border-red-200 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors shadow-sm"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-sm font-medium">
                    Belum ada data pengguna yang terdaftar.
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
        title="Hapus Pengguna?"
        message="Tindakan ini tidak dapat dibatalkan. Pengguna ini akan dihapus secara permanen dari sistem dan tidak bisa login kembali."
        confirmText="Hapus Pengguna"
        cancelText="Batal"
        type="danger"
        isLoading={isDeleting}
      />

    </div>
  );
}
