import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import api, { getImageUrl } from '../../../services/api';

export default function FormBerita() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [gambar, setGambar] = useState<File | null>(null);
  const [gambarPreview, setGambarPreview] = useState<string | null>(null);
  const [kategori, setKategori] = useState('Pilih Kategori');
  const [namaPenulis, setNamaPenulis] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfilPenulis = async () => {
      try {
        const response = await api.get('/autentikasi/saya');
        const profil = response.data?.data || response.data;
        setNamaPenulis(profil?.namaLengkap || '');
      } catch {
        setNamaPenulis('');
      }
    };

    fetchProfilPenulis();

    if (isEditMode) {
      const fetchDetail = async () => {
        try {
          const response = await api.get(`/berita/${id}`);
          const berita = response.data?.data || response.data;
          if (berita) {
            setJudul(berita.judul);
            setIsi(berita.isi);
            setKategori(berita.kategori || 'Pilih Kategori');
            setGambarPreview(getImageUrl(berita.gambar));
          }
        } catch (err: any) {
          setError(err.response?.data?.pesan || 'Gagal memuat data berita.');
        } finally {
          setIsFetching(false);
        }
      };
      fetchDetail();
    }
  }, [id, isEditMode]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Format gambar harus JPG, PNG, atau WEBP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran gambar maksimal 5MB sesuai batas backend.');
        return;
      }

      setGambar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGambarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!judul.trim() || isi.trim().length < 20) {
      setError('Judul wajib diisi dan isi berita minimal 20 karakter.');
      return;
    }
    if (!isEditMode && !gambar) {
      setError('Gambar berita wajib diunggah.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('judul', judul);
      formData.append('isi', isi);
      if (kategori && kategori !== 'Pilih Kategori') {
        formData.append('kategori', kategori);
      }
      if (gambar) {
        formData.append('gambar', gambar);
      }

      if (isEditMode) {
        await api.put(`/berita/${id}`, formData, { timeout: 30000 });
        setSuccess('Berita berhasil diperbarui!');
      } else {
        await api.post('/berita', formData, { timeout: 30000 });
        setSuccess('Berita berhasil diterbitkan!');
      }
      
      setTimeout(() => {
        navigate('/admin/berita');
      }, 1500);
      
    } catch (err: any) {
      const pesan = err.code === 'ECONNABORTED'
        ? 'Permintaan terlalu lama. Periksa backend dan ukuran gambar, lalu coba lagi.'
        : err.response?.data?.pesan
          || (err.response?.status ? `Server menolak permintaan (${err.response.status}).` : null)
          || 'Backend tidak dapat dihubungi. Pastikan server berjalan di port 3000.';
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail) && detail.length > 0) {
        setError(`${pesan}: ${detail.join(', ')}`);
      } else {
        setError(pesan);
      }
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

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 lg:p-10">
        
        {/* Header di dalam Card */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#1F2937] mb-2 tracking-tight">
            Formulir Berita
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Tambah atau edit informasi berita desa untuk dipublikasikan ke portal utama.
          </p>
          <hr className="border-slate-200 mt-6" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Judul Berita */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Judul Berita</label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all text-sm font-medium text-slate-700"
              placeholder="Masukkan judul berita yang menarik..."
              required
              minLength={5}
            />
          </div>

          {/* Kategori dan Penulis (Grid 2 kolom) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
              <select 
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 outline-none focus:border-[#0A3D2D] appearance-none cursor-pointer"
                style={{
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1em'
                }}
              >
                <option value="Pilih Kategori" disabled>Pilih Kategori</option>
                <option>Pendidikan & Literasi</option>
                <option>Kesehatan & Lingkungan</option>
                <option>Ekonomi & UMKM</option>
                <option>Teknologi & Inovasi</option>
                <option>Sosial & Keagamaan</option>
                <option>Pembangunan & Infrastruktur</option>
                <option>Kegiatan Desa & Umum</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Penulis</label>
              <input 
                type="text" 
                disabled 
                value={namaPenulis || 'Memuat nama penulis...'}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Gambar Utama */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Gambar Utama</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 transition-colors p-8 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group min-h-[160px]"
            >
              {gambarPreview ? (
                <>
                  <div className="absolute inset-0 w-full h-full">
                    <img src={gambarPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col">
                     <Upload className="w-8 h-8 text-white mb-2" />
                     <span className="text-white font-bold text-sm">Ganti Gambar</span>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-500 mb-3" />
                  <p className="text-sm font-bold text-slate-700 mb-1">
                    Upload file <span className="font-normal">atau drag and drop</span>
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    PNG, JPG, WEBP maksimal 5MB (Rekomendasi 16:9)
                  </p>
                </>
              )}
            </div>
            {/* Input hidden */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Isi Berita */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Isi Berita</label>
            <textarea
              rows={10}
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none text-sm font-medium text-slate-700 resize-y leading-relaxed"
              placeholder="Tuliskan isi berita selengkapnya di sini..."
              required
              minLength={20}
            />
            <p className="mt-2 text-xs text-slate-400">
              Isi berita hanya mendukung teks biasa dan tautan.
            </p>
          </div>

          <hr className="border-slate-100 my-8" />
          
          {/* Action Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 rounded-xl bg-[#0A3D2D] text-white font-bold text-sm hover:bg-[#072a1f] transition-all shadow-md hover:shadow-lg disabled:opacity-80 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  Memproses...
                </>
              ) : (
                isEditMode ? 'Simpan Perubahan' : 'Publikasikan Berita'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
