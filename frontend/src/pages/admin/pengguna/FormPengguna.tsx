import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '../../../services/api';

export default function FormPengguna() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    namaLengkap: '',
    username: '',
    email: '',
    nomorHp: '',
    peran: '',
    kataSandi: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      // Pastikan email tidak dikirim jika kosong karena bisa error validasi
      const payload = {
        ...formData,
        email: formData.email.trim() === '' ? null : formData.email,
        nomorHp: formData.nomorHp.trim() === '' ? null : formData.nomorHp
      };

      await api.post('/admin/pengguna', payload);
      
      // Kembali ke daftar jika sukses
      navigate('/admin/pengguna');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.pesan || 'Terjadi kesalahan saat mendaftarkan akun.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-12">
      
      {/* Header Form */}
      <div className="flex items-start gap-4 mb-8">
        <Link 
          to="/admin/pengguna"
          className="mt-1 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <img src="/images/logo-kuningan.png" alt="Logo" className="w-8 h-8 object-contain" />
            <h1 className="text-2xl font-extrabold text-[#0A3D2D]">
              Tambah Akun Baru
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 ml-11">
            Buat kredensial akses untuk staf atau warga.
          </p>
        </div>
      </div>

      {/* Card Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Nama Lengkap */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nama Lengkap
            </label>
            <input 
              type="text"
              name="namaLengkap"
              value={formData.namaLengkap}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all bg-white text-slate-700 text-sm font-medium"
            />
          </div>

          {/* Username (Tambahan wajib backend) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Username <span className="text-slate-400 font-normal">(untuk login)</span>
            </label>
            <input 
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Masukkan username tanpa spasi"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all bg-white text-slate-700 text-sm font-medium"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Alamat Email <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan alamat email aktif"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all bg-white text-slate-700 text-sm font-medium"
            />
          </div>

          {/* Nomor HP */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nomor Handphone <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input 
              type="text"
              name="nomorHp"
              value={formData.nomorHp}
              onChange={handleChange}
              placeholder="Masukkan nomor handphone"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all bg-white text-slate-700 text-sm font-medium"
            />
          </div>

          {/* Peran Sistem */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Peran Sistem
            </label>
            <select 
              name="peran"
              value={formData.peran}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all bg-white text-slate-700 text-sm font-medium appearance-none"
              style={{
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1em'
              }}
            >
              <option value="" disabled>Pilih peran pengguna</option>
              <option value="publikasi">Publikasi</option>
            </select>
          </div>

          {/* Kata Sandi */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Kata Sandi Awal
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                name="kataSandi"
                value={formData.kataSandi}
                onChange={handleChange}
                placeholder="Buat kata sandi"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all bg-white text-slate-700 text-sm font-medium pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-2">
              Minimal 8 karakter, kombinasi huruf dan angka.
            </p>
          </div>

          <hr className="border-slate-100 my-8" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link 
              to="/admin/pengguna"
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Batal
            </Link>
            <button 
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-sm hover:bg-[#143425] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                'Buat Akun'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
