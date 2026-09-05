import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, ArrowLeft, MessageCircle } from 'lucide-react';
import api from '../../services/api';

export default function Login() {
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!nik || !password) {
      setError('Mohon isi Username dan Kata Sandi');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/autentikasi/masuk', {
        username: nik,
        kataSandi: password
      });

      if (response.data && response.data.data && response.data.data.token) {
        const token = response.data.data.token;
        const pengguna = response.data.data.pengguna;
        localStorage.setItem('token', token);
        if (pengguna) {
          localStorage.setItem('user', JSON.stringify(pengguna));
        }
        // Arahkan berdasarkan peran: publikasi -> berita, admin -> dashboard
        const peran = pengguna?.peran;
        if (peran === 'publikasi') {
          navigate('/admin/berita');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        if (response.data && response.data.token) {
           const token = response.data.token;
           const pengguna = response.data.pengguna;
           localStorage.setItem('token', token);
           if (pengguna) localStorage.setItem('user', JSON.stringify(pengguna));
           const peran = pengguna?.peran;
           if (peran === 'publikasi') {
             navigate('/admin/berita');
           } else {
             navigate('/admin/dashboard');
           }
        } else {
          setError('Respons login tidak valid. Silakan coba lagi atau hubungi administrator.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.pesan || 'Gagal login. Silakan periksa kembali Username dan Kata Sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppAdmin = () => {
    navigate('/informasi-pendaftaran');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg-login.jpg')" }}
      ></div>
      {/* Overlay to ensure form readability over the image */}
      <div className="absolute inset-0 z-0 bg-slate-900/30 backdrop-blur-sm"></div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-[#F8F9F3]/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col items-center">
        
        {/* Logo */}
        <div className="mb-4">
          <img src="/images/logo.png" alt="Logo Kuningan" className="w-12 h-16 object-contain drop-shadow-md" />
        </div>

        {/* Title */}
        <div className="text-center mb-5 w-full">
          <h1 className="text-xl md:text-2xl font-extrabold text-[#0A3D2D] mb-1.5 leading-tight">
            Selamat Datang Di Desa Citapen
          </h1>
          <p className="text-[11px] md:text-xs font-medium text-slate-600">
            Kec. Hantara, Kab. Kuningan
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-medium text-center">
              {error}
            </div>
          )}
          
          {/* NIK Field */}
          <div className="mb-4">
            <label className="block text-[11px] font-bold text-slate-800 mb-1.5" htmlFor="nik">
              NIK / Nama Pengguna
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                id="nik"
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="Masukkan Username Anda"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D2D] focus:border-transparent transition-all placeholder:text-slate-400 font-medium text-slate-800"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-bold text-slate-800" htmlFor="password">
                Kata Sandi
              </label>
              <button type="button" className="text-[10px] md:text-[11px] font-bold text-slate-500 hover:text-[#0A3D2D] transition-colors">
                Lupa kata sandi?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D2D] focus:border-transparent transition-all placeholder:text-slate-400 font-medium text-slate-800"
                required
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center mb-5">
            <input
              id="remember_me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 text-[#0A3D2D] focus:ring-[#0A3D2D] border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember_me" className="ml-2 block text-[11px] md:text-xs text-slate-600 font-medium cursor-pointer">
              Ingat saya selama 30 hari
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#0A3D2D] hover:bg-[#082d22] disabled:bg-slate-400 text-white py-2.5 rounded-xl font-bold text-sm transition-colors mb-3 shadow-lg shadow-[#0A3D2D]/20"
          >
            {isLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
            ) : (
              <>
                Masuk
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Back Button */}
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 bg-transparent border border-slate-300 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </form>

        {/* WhatsApp Admin */}
        <div className="w-full text-center border-t border-slate-200 pt-5">
          <p className="text-[10px] md:text-[11px] text-slate-500 mb-3 leading-relaxed font-medium">
            Belum punya akun? Hubungi Admin melalui WhatsApp untuk pembuatan akun.
          </p>
          <button
            onClick={handleWhatsAppAdmin}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            Hubungi Admin Desa
          </button>
        </div>

      </div>
    </div>
  );
}
