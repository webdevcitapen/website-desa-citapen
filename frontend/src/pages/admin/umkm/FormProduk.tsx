import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Upload, AlertCircle, CheckCircle2 
} from 'lucide-react';
import api, { getImageUrl } from '../../../services/api';

export default function FormProduk() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [kategoriList, setKategoriList] = useState<any[]>([]);
  const [umkmId, setUmkmId] = useState('');
  const [umkmList, setUmkmList] = useState<any[]>([]);
  const [gambar, setGambar] = useState<File | null>(null);
  const [gambarPreview, setGambarPreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetching(true);
        // Fetch umkm list
        const umkmRes = await api.get('/umkm');
        if (umkmRes.data?.data) {
          setUmkmList(umkmRes.data.data);
        } else if (umkmRes.data) {
          setUmkmList(umkmRes.data);
        }

        // Fetch kategori list
        const kategoriRes = await api.get('/kategori');
        if (kategoriRes.data?.data) {
          setKategoriList(kategoriRes.data.data);
        } else if (kategoriRes.data) {
          setKategoriList(kategoriRes.data);
        }

        if (isEditMode) {
          const response = await api.get(`/produk/${id}`);
          const prodData = response.data?.data || response.data;
          
          if (prodData) {
            setNama(prodData.nama || '');
            setHarga(prodData.harga?.toString() || '');
            setDeskripsi(prodData.deskripsi || '');
            
            // Kategori bisa berupa object { id, nama } atau string/number id
            const katId = prodData.kategori?.id || prodData.kategori_id || '';
            setKategoriId(katId.toString());
            
            // UMKM bisa berupa object { id, nama } atau umkm_id
            if (prodData.umkm && prodData.umkm.id) {
              setUmkmId(prodData.umkm.id.toString());
            } else if (prodData.umkm_id) {
              setUmkmId(prodData.umkm_id.toString());
            }
            
            if (prodData.foto) {
              setGambarPreview(getImageUrl(prodData.foto));
            }
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.pesan || 'Gagal memuat data produk.');
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [id, isEditMode]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Format gambar harus JPG, JPEG, PNG, atau WEBP.');
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

  const handleHargaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setHarga(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!nama || !harga || !deskripsi || !umkmId || !kategoriId) {
      setError('Nama, Harga, UMKM, Kategori, dan Deskripsi produk wajib diisi.');
      return;
    }
    
    // Asumsi saat nambah produk, gambar opsional, jika wajib tinggal dibuka komentarnya.
    // if (!isEditMode && !gambar) {
    //   setError('Gambar produk wajib diunggah.');
    //   return;
    // }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('nama', nama);
      formData.append('harga', harga);
      formData.append('deskripsi', deskripsi);
      formData.append('umkm_id', umkmId);
      formData.append('kategori_id', kategoriId);
      
      if (gambar) {
        formData.append('foto', gambar);
      }

      if (isEditMode) {
        await api.put(`/produk/${id}`, formData);
        setSuccess('Produk berhasil diperbarui!');
      } else {
        await api.post('/produk', formData);
        setSuccess('Produk baru berhasil ditambahkan!');
      }
      
      setTimeout(() => {
        navigate('/admin/umkm/produk');
      }, 1500);
      
    } catch (err: any) {
      setError(err.response?.data?.pesan || 'Terjadi kesalahan saat menyimpan produk.');
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
          {isEditMode && (
            <Link to="/admin/umkm/produk" className="p-1 rounded hover:bg-slate-200 transition-colors mr-1">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <Link to="/admin/umkm/produk" className="hover:text-[#0A3D2D] transition-colors">Produk UMKM</Link>
          <span>›</span>
          <span className="text-slate-800 font-bold">{isEditMode ? 'Edit Produk' : 'Tambah Produk'}</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1F2937] tracking-tight">
          {isEditMode ? 'Edit Produk' : 'Tambah Produk Baru'}
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
          
          {/* Nama Produk */}
          <div>
            <label className="block text-[13px] font-extrabold text-slate-700 mb-2">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all text-[15px] font-medium text-slate-700 placeholder:text-slate-400"
              placeholder="Masukkan nama produk..."
              required
            />
          </div>

          {/* Kategori dan Harga (Grid 2 kolom) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[13px] font-extrabold text-slate-700 mb-2">
                Pemilik UMKM <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select 
                  value={umkmId}
                  onChange={(e) => setUmkmId(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-[15px] font-medium text-slate-700 outline-none focus:border-[#0A3D2D] appearance-none cursor-pointer"
                  style={{
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1.25rem center',
                    backgroundSize: '1em'
                  }}
                  required
                >
                  <option value="">Pilih UMKM</option>
                  {umkmList.map((u) => (
                    <option key={u.id} value={u.id}>{u.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-extrabold text-slate-700 mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select 
                  value={kategoriId}
                  onChange={(e) => setKategoriId(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-[15px] font-medium text-slate-700 outline-none focus:border-[#0A3D2D] appearance-none cursor-pointer"
                  style={{
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1.25rem center',
                    backgroundSize: '1em'
                  }}
                    required
                >
                  <option value="">Pilih Kategori</option>
                  {kategoriList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
            </div>
            
            
            <div>
              <label className="block text-[13px] font-extrabold text-slate-700 mb-2">Harga (Rp) <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-medium text-[15px]">Rp</span>
                </div>
                <input
                  type="text"
                  value={harga}
                  onChange={handleHargaChange}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all text-[15px] font-medium text-slate-700"
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Deskripsi Produk */}
          <div>
            <label className="block text-[13px] font-extrabold text-slate-700 mb-2">Deskripsi Produk</label>
            <textarea
              rows={4}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all text-[15px] font-medium text-slate-700 resize-y placeholder:text-slate-400"
              placeholder="Jelaskan detail produk, bahan, ukuran, dll..."
              required
            />
          </div>

          {/* Galeri Produk (Foto) */}
          <div>
            <label className="block text-[13px] font-extrabold text-slate-700 mb-2">
              {isEditMode ? 'Foto Produk' : 'Galeri Produk'}
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full rounded-2xl border-2 border-dashed transition-all p-8 md:p-12 flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group min-h-[200px] ${
                gambarPreview && isEditMode ? 'border-transparent bg-slate-900' : 'border-slate-300 bg-[#F8FAFC] hover:bg-slate-50'
              }`}
            >
              {gambarPreview ? (
                <>
                  <div className={`absolute inset-0 w-full h-full ${isEditMode ? 'opacity-40 mix-blend-overlay' : ''}`}>
                    <img src={gambarPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className={`relative z-10 flex flex-col items-center justify-center ${isEditMode ? 'text-white' : 'opacity-0 group-hover:opacity-100 bg-black/50 absolute inset-0 text-white'}`}>
                    <Upload className="w-8 h-8 mb-3" />
                    <span className="font-bold text-[15px]">{isEditMode ? 'Klik untuk mengganti foto' : 'Ganti Gambar'}</span>
                    {isEditMode && <span className="text-xs mt-2 opacity-80">JPG, JPEG, PNG, WEBP (Maks. 5MB)</span>}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <Upload className="w-10 h-10 text-slate-700 mb-4" strokeWidth={1.5} />
                  <p className="text-[15px] font-extrabold text-[#1F2937] mb-1">
                    Klik untuk unggah atau seret dan lepas file
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    JPG, JPEG, PNG, WEBP (MAKS. 5MB)
                  </p>
                </div>
              )}
            </div>
            {/* Input hidden */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.heic,.heif,.webp"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <hr className="border-slate-100 my-8" />
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Link
              to="/admin/umkm/produk"
              className="px-8 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-extrabold text-[13px] hover:bg-slate-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 rounded-xl bg-[#0A3D2D] text-white font-extrabold text-[13px] hover:bg-[#072a1f] transition-colors shadow-md hover:shadow-lg disabled:opacity-80 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                  Memproses...
                </>
              ) : (
                isEditMode ? 'Simpan Perubahan' : 'Simpan Produk'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
