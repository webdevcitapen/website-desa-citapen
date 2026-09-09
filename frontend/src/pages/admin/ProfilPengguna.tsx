import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Key, Mail, Phone, Camera, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import api, { getImageUrl } from '../../services/api';

export default function ProfilPengguna() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profil Dasar
  const [profil, setProfil] = useState({
    username: '',
    namaLengkap: '',
    email: '',
    nomorHp: '',
    fotoProfil: '',
    peran: ''
  });

  // State untuk form terpisah
  const [usernameBaru, setUsernameBaru] = useState('');
  const [kataSandiLama, setKataSandiLama] = useState('');
  const [kataSandiBaru, setKataSandiBaru] = useState('');
  const [konfirmasiSandi, setKonfirmasiSandi] = useState('');

  // Notifikasi
  const [notif, setNotif] = useState<{ tipe: 'sukses' | 'error', pesan: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfil();
  }, []);

  const fetchProfil = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/autentikasi/saya');
      if (response.data && response.data.data) {
        const data = response.data.data;
        setProfil({
          username: data.username || '',
          namaLengkap: data.namaLengkap || '',
          email: data.email || '',
          nomorHp: data.nomorHp || '',
          fotoProfil: data.fotoProfil || '',
          peran: data.peran || ''
        });
        setUsernameBaru(data.username || '');
      }
    } catch (error) {
      console.error('Gagal memuat profil', error);
      showNotif('error', 'Gagal memuat data profil');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotif = (tipe: 'sukses' | 'error', pesan: string) => {
    setNotif({ tipe, pesan });
    setTimeout(() => setNotif(null), 5000);
  };

  const handleSimpanProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.put('/autentikasi/profil', {
        namaLengkap: profil.namaLengkap,
        email: profil.email || undefined,
        nomorHp: profil.nomorHp || undefined
      });
      showNotif('sukses', 'Profil berhasil diperbarui');
    } catch (error: any) {
      console.error('Gagal simpan profil', error);
      showNotif('error', error.response?.data?.pesan || error.response?.data?.detail?.join('\n') || 'Gagal menyimpan profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUbahUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameBaru) return;
    try {
      setIsSaving(true);
      await api.put('/autentikasi/username', { usernameBaru });
      showNotif('sukses', 'Username berhasil diubah');
      setProfil(prev => ({ ...prev, username: usernameBaru }));
    } catch (error: any) {
      console.error('Gagal ubah username', error);
      showNotif('error', error.response?.data?.pesan || error.response?.data?.detail?.join('\n') || 'Gagal mengubah username');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUbahKataSandi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kataSandiBaru !== konfirmasiSandi) {
      showNotif('error', 'Konfirmasi kata sandi tidak cocok');
      return;
    }
    if (!kataSandiLama || !kataSandiBaru) {
      showNotif('error', 'Semua kolom kata sandi wajib diisi');
      return;
    }

    try {
      setIsSaving(true);
      await api.put('/autentikasi/kata-sandi', {
        kataSandiLama,
        kataSandiBaru
      });
      showNotif('sukses', 'Kata sandi berhasil diubah');
      setKataSandiLama('');
      setKataSandiBaru('');
      setKonfirmasiSandi('');
    } catch (error: any) {
      console.error('Gagal ubah sandi', error);
      showNotif('error', error.response?.data?.pesan || error.response?.data?.detail?.join('\n') || 'Gagal mengubah kata sandi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formatDiizinkan = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/heic',
      'image/heif',
      'image/heif-sequence',
      'image/heic-sequence',
      'image/webp',
    ];
    if (!formatDiizinkan.includes(file.type.toLowerCase())) {
      showNotif('error', 'Format foto harus JPG, JPEG, PNG, HEIC, HEIF, atau WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotif('error', 'Ukuran foto maksimal 5MB sesuai batas backend.');
      return;
    }

    const formData = new FormData();
    formData.append('foto', file);

    try {
      setIsSaving(true);
      const res = await api.put('/autentikasi/foto-profil', formData);
      showNotif('sukses', 'Foto profil berhasil diperbarui');
      // Update local state with new photo from response
      if (res.data?.data?.fotoProfil) {
        setProfil(prev => ({ ...prev, fotoProfil: res.data.data.fotoProfil }));
      } else {
        // Fallback: refetch profile
        fetchProfil();
      }
    } catch (error: any) {
      console.error('Gagal upload foto', error);
      showNotif('error', error.response?.data?.pesan || error.response?.data?.detail?.join('\n') || 'Gagal mengunggah foto');
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A3D2D]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Profil Saya</h1>
        <p className="text-slate-500">Kelola informasi pribadi dan pengaturan keamanan akun Anda.</p>
      </div>

      {/* Save Toast Notification */}
      <div className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 transition-all duration-500 z-50 ${notif ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-start gap-3 ${notif?.tipe === 'sukses' ? 'bg-[#0A3D2D] text-white' : 'bg-red-600 text-white'}`}>
          {notif?.tipe === 'sukses' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-200 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-bold">{notif?.tipe === 'sukses' ? 'Berhasil' : 'Terjadi Kesalahan'}</p>
            <p className={`text-xs mt-1 whitespace-pre-wrap max-w-sm ${notif?.tipe === 'sukses' ? 'text-emerald-100/70' : 'text-red-100'}`}>{notif?.pesan}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Kiri: Foto Profil & Info Cepat */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100">
                {profil.fotoProfil ? (
                  <img src={getImageUrl(profil.fotoProfil)} alt="Foto Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0A3D2D] text-white text-4xl font-bold uppercase">
                    {profil.namaLengkap.charAt(0)}
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleUploadFoto} 
                accept="image/jpeg,image/png,image/jpg,image/heic,image/heif,image/webp"
                className="hidden" 
              />
            </div>
            
            <h2 className="text-xl font-bold text-slate-800">{profil.namaLengkap}</h2>
            <p className="text-slate-500 font-medium mb-4">@{profil.username}</p>
            <span className="inline-block bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {profil.peran === 'admin' ? 'Admin' : profil.peran === 'publikasi' ? 'Publikasi' : profil.peran}
            </span>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-[#0A3D2D]" />
              Ubah Username
            </h3>
            <form onSubmit={handleUbahUsername}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Username Baru</label>
                <input
                  type="text"
                  required
                  value={usernameBaru}
                  onChange={e => setUsernameBaru(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0A3D2D]/20 focus:border-[#0A3D2D] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving || usernameBaru === profil.username}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#0A3D2D] hover:bg-[#082d22] disabled:bg-slate-300 transition-colors"
              >
                {isSaving ? 'Menyimpan...' : 'Perbarui Username'}
              </button>
            </form>
          </div>
        </div>

        {/* Kolom Kanan: Form Data */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Form Informasi Dasar */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <User className="w-5 h-5 text-[#0A3D2D]" />
              Informasi Dasar
            </h3>
            <form onSubmit={handleSimpanProfil} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={profil.namaLengkap}
                      onChange={e => setProfil({...profil, namaLengkap: e.target.value})}
                      className="w-full pl-11 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D2D]/20 focus:border-[#0A3D2D] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={profil.email}
                      onChange={e => setProfil({...profil, email: e.target.value})}
                      className="w-full pl-11 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D2D]/20 focus:border-[#0A3D2D] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nomor HP</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={profil.nomorHp}
                      onChange={e => setProfil({...profil, nomorHp: e.target.value})}
                      className="w-full pl-11 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D2D]/20 focus:border-[#0A3D2D] transition-all"
                    />
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 py-2.5 px-6 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#0A3D2D] hover:bg-[#082d22] disabled:bg-slate-300 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>

          {/* Form Keamanan */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Lock className="w-5 h-5 text-[#0A3D2D]" />
              Keamanan Akun
            </h3>
            <form onSubmit={handleUbahKataSandi} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kata Sandi Lama</label>
                <input
                  type="password"
                  required
                  value={kataSandiLama}
                  onChange={e => setKataSandiLama(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D2D]/20 focus:border-[#0A3D2D] transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Kata Sandi Baru</label>
                  <input
                    type="password"
                    required
                    value={kataSandiBaru}
                    onChange={e => setKataSandiBaru(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D2D]/20 focus:border-[#0A3D2D] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Konfirmasi Sandi Baru</label>
                  <input
                    type="password"
                    required
                    value={konfirmasiSandi}
                    onChange={e => setKonfirmasiSandi(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D2D]/20 focus:border-[#0A3D2D] transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving || !kataSandiLama || !kataSandiBaru || kataSandiBaru !== konfirmasiSandi}
                  className="flex items-center gap-2 py-2.5 px-6 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-800 hover:bg-black disabled:bg-slate-300 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Perbarui Sandi'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
