import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';

export default function FormUMKM() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [nama, setNama] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [deskripsi, setDeskripsi] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      const fetchUmkm = async () => {
        try {
          const response = await api.get(`/umkm/${id}`);
          const data = response.data?.data || response.data;
          
          if (data) {
            setNama(data.nama || '');
            setNomorHp(data.nomorHp || '');
            setAlamat(data.alamat || '');
            setDeskripsi(data.deskripsi || '');
          }
        } catch (error) {
          console.error('Gagal memuat data UMKM', error);
          setError('Gagal memuat data UMKM.');
        } finally {
          setIsFetching(false);
        }
      };

      fetchUmkm();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!nama) {
      setError('Nama UMKM wajib diisi');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('nama', nama);
      if (nomorHp) formData.append('nomor_hp', nomorHp);
      if (alamat) formData.append('alamat', alamat);
      if (deskripsi) formData.append('deskripsi', deskripsi);

      if (isEditMode) {
        await api.put(`/umkm/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Data UMKM berhasil diperbarui!');
      } else {
        await api.post('/umkm', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('UMKM baru berhasil ditambahkan!');
      }
      
      setTimeout(() => {
        navigate('/admin/umkm/data');
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.pesan || 'Terjadi kesalahan saat menyimpan UMKM.');
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0A3D2D]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 px-4 sm:px-6">
      
      {/* Breadcrumb & Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
          <Link to="/admin/umkm/data" className="hover:text-[#0A3D2D] transition-colors">Data UMKM</Link>
          <span>›</span>
          <span className="text-slate-800 font-bold">{isEditMode ? 'Edit UMKM' : 'Tambah UMKM'}</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1F2937] tracking-tight">
          {isEditMode ? 'Edit UMKM' : 'Tambah UMKM Baru'}
        </h1>
      </div>

      {/* Alerts */}
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

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10 lg:p-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Nama UMKM */}
          <div>
            <label className="block text-[13px] font-extrabold text-slate-700 mb-2">
              Nama UMKM <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all text-[15px] font-medium text-slate-700 placeholder:text-slate-400"
              placeholder="Masukkan nama UMKM..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[13px] font-extrabold text-slate-700 mb-2">
                Nomor WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nomorHp}
                onChange={(e) => setNomorHp(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all text-[15px] font-medium text-slate-700 placeholder:text-slate-400"
                placeholder="Misal: 081234567890"
                required
              />
            </div>
            
            <div>
              <label className="block text-[13px] font-extrabold text-slate-700 mb-2">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all text-[15px] font-medium text-slate-700 placeholder:text-slate-400"
                placeholder="Alamat lengkap UMKM..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-extrabold text-slate-700 mb-2">Deskripsi UMKM</label>
            <textarea
              rows={3}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all text-[15px] font-medium text-slate-700 resize-y placeholder:text-slate-400"
              placeholder="Jelaskan tentang UMKM ini..."
            />
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Link
              to="/admin/umkm/data"
              className="px-6 py-3.5 rounded-xl font-bold text-[15px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-center"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0A3D2D] hover:bg-[#082d22] text-white rounded-xl font-bold text-[15px] transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
