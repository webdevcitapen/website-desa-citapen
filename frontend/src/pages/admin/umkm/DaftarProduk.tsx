import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';
import api, { getImageUrl } from '../../../services/api';
import ConfirmModal from '../../../components/ui/ConfirmModal';

interface ProdukItem {
  id: number;
  nama: string;
  harga: number | string | null;
  foto: string | null;
  kategori?: any;
  umkm?: any;
  pemilik_nama?: string; // fallback for dummy data
}

export default function DaftarProduk() {
  const [produkList, setProdukList] = useState<ProdukItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  
  // State untuk Filter UI
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua Kategori');
  const [statusFilter, setStatusFilter] = useState('Semua Status');

  useEffect(() => {
    fetchProduk();
  }, []);

  const fetchProduk = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch data produk (asumsi API /produk memberikan data untuk admin atau publik)
      const response = await api.get('/produk');
      if (response.data && response.data.data && response.data.data.daftar) {
        setProdukList(response.data.data.daftar);
      } else if (response.data && response.data.daftar) {
         setProdukList(response.data.daftar);
      } else if (Array.isArray(response.data?.data)) {
        // Backend /umkm style return array langsung
        setProdukList(response.data.data);
      } else if (Array.isArray(response.data)) {
        setProdukList(response.data);
      } else {
        // Fallback mock data jika API kosong untuk keperluan slicing UI
        setProdukList([
          { id: 1, nama: 'Keranjang Bambu Anyam', harga: 75000, kategori: 'Kerajinan', pemilik_nama: 'Kriya Bambu Lestari', foto: '/images/produk/keranjang.jpg' },
          { id: 2, nama: 'Madu Hutan Organik', harga: 120000, kategori: 'Makanan', pemilik_nama: 'Kelompok Tani Mekar', foto: '/images/produk/madu.jpg' },
          { id: 3, nama: 'Kopi Robusta Asli', harga: 45000, kategori: 'Pertanian', pemilik_nama: 'Koperasi Jaya Makmur', foto: '/images/produk/kopi.jpg' },
        ]);
      }
    } catch (err: any) {
      console.error('Gagal fetch produk', err);
      // Jika API belum siap, gunakan dummy data untuk presentasi UI slicing
      // Jangan tampilkan error jika backend belum siap, tetap tampilkan dummy agar halaman tidak blank
      if (err.response?.data?.pesan) {
        setError(err.response.data.pesan);
      }
      setProdukList([
        { id: 1, nama: 'Keranjang Bambu Anyam', harga: 75000, kategori: 'Kerajinan', pemilik_nama: 'Kriya Bambu Lestari', foto: '/images/produk/keranjang.jpg' },
        { id: 2, nama: 'Madu Hutan Organik', harga: 120000, kategori: 'Makanan', pemilik_nama: 'Kelompok Tani Mekar', foto: '/images/produk/madu.jpg' },
        { id: 3, nama: 'Kopi Robusta Asli', harga: 45000, kategori: 'Pertanian', pemilik_nama: 'Koperasi Jaya Makmur', foto: '/images/produk/kopi.jpg' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/produk/${id}`);
      setDeleteConfirm(null);
      fetchProduk();
    } catch (err: any) {
      alert(err.response?.data?.pesan || 'Gagal menghapus produk.');
      // Untuk simulasi slicing jika gagal API
      setProdukList(produkList.filter(p => p.id !== id));
      setDeleteConfirm(null);
    }
  };

  // Filter lokal sederhana - aman untuk null/undefined
  const filteredProduk = produkList.filter(item => {
    const namaLower = String(item.nama ?? '').toLowerCase();
    const pemilikLower = String(item.pemilik_nama ?? item.umkm?.nama ?? '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return namaLower.includes(q) || pemilikLower.includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0A3D2D] mb-2 tracking-tight">
            Produk UMKM
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Kelola daftar produk UMKM unggulan dari warga Desa Citapen.
          </p>
        </div>
        <Link 
          to="/admin/umkm/produk/tambah" 
          className="flex items-center justify-center gap-2 bg-[#0A3D2D] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-[#082d22] transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </Link>
      </div>

      {/* Toolbar (Search & Filter) */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama produk atau UMKM..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all bg-[#F8FAFC] focus:bg-white text-sm font-medium text-slate-700"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium text-slate-600 outline-none focus:border-[#0A3D2D] appearance-none cursor-pointer w-44"
            style={{
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1em'
            }}
          >
            <option value="Semua Kategori">Semua Kategori</option>
            <option value="Kerajinan">Kerajinan</option>
            <option value="Makanan">Makanan</option>
            <option value="Pertanian">Pertanian</option>
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium text-slate-600 outline-none focus:border-[#0A3D2D] appearance-none cursor-pointer w-44"
            style={{
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1em'
            }}
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Tersedia">Tersedia</option>
            <option value="Habis">Habis</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
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
              <tr className="bg-[#F8FAFC] border-b border-slate-200">
                <th className="px-6 py-4 text-[13px] font-bold text-slate-600 w-[35%]">Produk</th>
                <th className="px-6 py-4 text-[13px] font-bold text-slate-600">Kategori</th>
                <th className="px-6 py-4 text-[13px] font-bold text-slate-600">Pemilik / UMKM</th>
                <th className="px-6 py-4 text-[13px] font-bold text-slate-600">Harga</th>
                <th className="px-6 py-4 text-[13px] font-bold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A3D2D]"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredProduk.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 text-sm font-medium">
                    Tidak ada produk UMKM yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProduk.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    
                    {/* GAMBAR & NAMA PRODUK */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden">
                          <img 
                            src={item.foto ? (item.foto.startsWith('/') ? item.foto : getImageUrl(item.foto)) : '/images/logo.png'} 
                            alt={item.nama}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).onerror = null;
                              (e.target as HTMLImageElement).src = '/images/logo.png'; // fallback
                            }}
                          />
                        </div>
                        <p className="text-[15px] font-extrabold text-[#0A3D2D] leading-tight">
                          {item.nama}
                        </p>
                      </div>
                    </td>
                    
                    {/* KATEGORI */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      {item.kategori ? (
                        (() => {
                          const kategoriNama = String(item.kategori?.nama || item.kategori || '').trim();
                          const kategoriLower = kategoriNama.toLowerCase();
                          return (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${
                              kategoriLower === 'kerajinan' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                              kategoriLower === 'makanan' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                              'bg-blue-50 border-blue-200 text-blue-700'
                            }`}>
                              {kategoriNama || '-'}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    
                    {/* PEMILIK */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <p className="text-sm font-semibold text-slate-500">
                        {item.umkm?.nama || item.pemilik_nama || 'UMKM Lokal'}
                      </p>
                    </td>
                    
                    {/* HARGA */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <p className="text-[15px] font-bold text-slate-800">
                        Rp {Number(item.harga ?? 0).toLocaleString('id-ID')}
                      </p>
                    </td>
                    
                    {/* AKSI */}
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          to={`/admin/umkm/produk/edit/${item.id}`} 
                          className="p-2 text-slate-500 hover:text-[#0A3D2D] bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm hover:shadow"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-[18px] h-[18px]" />
                        </Link>
                        <button 
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-2 text-slate-500 hover:text-red-600 bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-sm hover:shadow"
                          title="Hapus Produk"
                        >
                          <Trash2 className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm!)}
        title="Hapus Produk?"
        message="Tindakan ini tidak dapat dibatalkan. Produk UMKM akan dihapus secara permanen dari daftar katalog."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
      
    </div>
  );
}
