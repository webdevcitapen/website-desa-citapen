import { Link } from 'react-router-dom';
import { UserCheck, MessageSquare, ArrowLeft } from 'lucide-react';

export default function InformasiPendaftaran() {
  const handleWhatsApp = () => {
    const noWa = '6281234567890'; // Ganti dengan nomor WA admin sesungguhnya
    const message = encodeURIComponent('Halo Admin Desa Citapen, saya ingin mengajukan pembuatan akun baru (Mohon informasikan Nama Lengkap dan Peran yang diinginkan).');
    window.open(`https://wa.me/${noWa}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans bg-[#FBFBFF] p-4 md:p-8">
      
      {/* Main Card */}
      <div className="bg-white max-w-md w-full rounded-[2rem] shadow-sm border border-slate-200 p-8 md:p-10 flex flex-col items-center">
        
        {/* Top Icon */}
        <div className="w-16 h-16 bg-[#F0EFFF] rounded-full flex items-center justify-center mb-6">
          <UserCheck className="w-8 h-8 text-[#0A3D2D]" />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] mb-4 text-center tracking-tight">
          Daftar Akun
        </h1>
        <p className="text-sm md:text-[15px] text-slate-600 text-center mb-8 leading-relaxed font-medium px-2">
          Untuk menjaga keamanan dan validitas data desa, pendaftaran akun Admin dan UMKM dibantu melalui verifikasi WhatsApp.
        </p>

        {/* Steps */}
        <div className="space-y-6 mb-8 w-full">
          
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-[#113C2B] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
              1
            </div>
            <div className="pt-1">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Klik tombol WhatsApp</h3>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                Mulai obrolan dengan admin desa kami.
              </p>
            </div>
          </div>
          
          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-[#113C2B] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
              2
            </div>
            <div className="pt-1">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Kirim pesan Nama & Peran</h3>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                Sebutkan nama lengkap Anda dan peran yang ingin didaftarkan (Admin/UMKM).
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-[#113C2B] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
              3
            </div>
            <div className="pt-1">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Tunggu verifikasi</h3>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                Admin akan memverifikasi data Anda dan mengirimkan detail login.
              </p>
            </div>
          </div>

        </div>

        {/* Button */}
        <button 
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-2 bg-[#0A3D2D] hover:bg-[#082d22] text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-[#0A3D2D]/20"
        >
          <MessageSquare className="w-5 h-5" />
          Chat Admin via WhatsApp
        </button>

      </div>

      {/* Back to Login Link */}
      <div className="mt-8">
        <Link to="/login" className="flex items-center gap-2 font-bold text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </Link>
      </div>

    </div>
  );
}
