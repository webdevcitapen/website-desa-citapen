import { useState, useEffect, useRef } from 'react';
import { 
  Map, Users, FileText, Plus, Trash2, Edit2, Save, X, CheckCircle2, AlertCircle, Image as ImageIcon, ScrollText, Eye
} from 'lucide-react';
import api, { getImageUrl } from '../../services/api';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function ProfilAdmin() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSejarah, setIsSavingSejarah] = useState(false);
  const [isSavingVisiMisi, setIsSavingVisiMisi] = useState(false);
  const [isSavingGaleri, setIsSavingGaleri] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Perubahan berhasil disimpan ke database.');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [isLoading, setIsLoading] = useState(true);

  // Form Data Profil Desa (Geografis)
  const [luasWilayah, setLuasWilayah] = useState('');
  const [batasUtara, setBatasUtara] = useState('');
  const [batasSelatan, setBatasSelatan] = useState('');
  const [batasTimur, setBatasTimur] = useState('');
  const [batasBarat, setBatasBarat] = useState('');
  const [letakGeografis, setLetakGeografis] = useState('');
  const [deskripsiWilayah, setDeskripsiWilayah] = useState('');

  // Sejarah, Visi, Misi
  const [sejarah, setSejarah] = useState('');
  const [visi, setVisi] = useState('');
  const [misi, setMisi] = useState('');

  // State untuk Struktur Organisasi Dinamis
  const [organisasi, setOrganisasi] = useState<any[]>([]);
  const [formOrg, setFormOrg] = useState({ nama: '', jabatan: '', urutan: 0, keterangan: '' });
  const [fileOrg, setFileOrg] = useState<File | null>(null);
  const [previewOrg, setPreviewOrg] = useState<string | null>(null);
  const orgFileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingOrg, setIsEditingOrg] = useState<number | null>(null);
  const [deleteOrgConfirm, setDeleteOrgConfirm] = useState<number | null>(null);
  const [deleteRiwayatConfirm, setDeleteRiwayatConfirm] = useState<number | null>(null);
  const [deleteGaleriConfirm, setDeleteGaleriConfirm] = useState<number | null>(null);

  // State untuk Riwayat Kepala Desa
  const [riwayatKades, setRiwayatKades] = useState<any[]>([]);
  const [formRiwayat, setFormRiwayat] = useState({ nama: '', masaJabatan: '', urutan: 0, keterangan: '' });
  const [isEditingRiwayat, setIsEditingRiwayat] = useState<number | null>(null);

  // State untuk Galeri
  const [galeri, setGaleri] = useState<any[]>([]);
  const [formGaleri, setFormGaleri] = useState({ judul: '', keterangan: '', urutan: 0 });
  const [fileGaleri, setFileGaleri] = useState<File | null>(null);
  const [previewGaleri, setPreviewGaleri] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToastMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const handleError = (err: any, fallbackMsg: string) => {
    const pesan = err?.response?.data?.pesan || fallbackMsg;
    const detail = err?.response?.data?.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      showToastMsg(`${pesan}:\n${detail.join('\n')}`, 'error');
    } else {
      showToastMsg(pesan, 'error');
    }
  };

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/profil-desa'),
        api.get('/struktur-organisasi'),
        api.get('/riwayat-kuwu'),
        api.get('/galeri')
      ]);
      const [rProfil, rOrg, rRiwayat, rGaleri] = results;

      if (rProfil.status === 'fulfilled' && rProfil.value.data?.data) {
        const d = rProfil.value.data.data;
        setLuasWilayah(d.luasWilayah || '');
        setBatasUtara(d.batasUtara || '');
        setBatasSelatan(d.batasSelatan || '');
        setBatasTimur(d.batasTimur || '');
        setBatasBarat(d.batasBarat || '');
        setLetakGeografis(d.letakGeografis || '');
        setDeskripsiWilayah(d.deskripsiWilayah || '');
        setSejarah(d.sejarah || '');
        setVisi(d.visi || '');
        setMisi(d.misi || '');
      } else if (rProfil.status === 'rejected') {
        console.error('Gagal profil-desa', rProfil.reason);
      }

      if (rOrg.status === 'fulfilled') {
        const orgData = rOrg.value.data?.data;
        if (Array.isArray(orgData)) setOrganisasi(orgData);
        else if (Array.isArray(orgData?.daftar)) setOrganisasi(orgData.daftar);
      } else {
        console.error('Gagal struktur-organisasi', rOrg.reason);
      }

      if (rRiwayat.status === 'fulfilled') {
        const riwayatData = rRiwayat.value.data?.data;
        if (Array.isArray(riwayatData)) setRiwayatKades(riwayatData);
        else if (Array.isArray(riwayatData?.daftar)) setRiwayatKades(riwayatData.daftar);
      } else {
        console.error('Gagal riwayat-kuwu', rRiwayat.reason);
      }

      if (rGaleri.status === 'fulfilled') {
        const gData = rGaleri.value.data?.data;
        if (Array.isArray(gData)) setGaleri(gData);
        else if (Array.isArray(gData?.daftar)) setGaleri(gData.daftar);
      } else {
        console.error('Gagal galeri', rGaleri.reason);
      }
    } catch (err) {
      console.error('Gagal mengambil data profil', err);
      showToastMsg('Gagal memuat data dari server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler Profil Desa Geografis
  const handleSaveProfil = async () => {
    setIsSaving(true);

    try {
      await api.put('/profil-desa', {
        luasWilayah,
        batasUtara,
        batasSelatan,
        batasBarat,
        batasTimur,
        letakGeografis: letakGeografis || null,
        deskripsiWilayah: deskripsiWilayah || null,
      });
      showToastMsg('Data geografis berhasil disimpan.');
    } catch (err: any) {
      handleError(err, 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler Sejarah
  const handleSaveSejarah = async () => {
    setIsSavingSejarah(true);

    try {
      await api.put('/profil-desa/sejarah', { sejarah });
      showToastMsg('Sejarah desa berhasil disimpan.');
    } catch (err: any) {
      handleError(err, 'Gagal menyimpan sejarah.');
    } finally {
      setIsSavingSejarah(false);
    }
  };

  // Handler Visi Misi
  const handleSaveVisiMisi = async () => {
    setIsSavingVisiMisi(true);

    try {
      await api.put('/profil-desa/visi-misi', { visi, misi });
      showToastMsg('Visi & Misi berhasil disimpan.');
    } catch (err: any) {
      handleError(err, 'Gagal menyimpan visi misi.');
    } finally {
      setIsSavingVisiMisi(false);
    }
  };

  // Handler Struktur Organisasi
  const handleSaveOrganisasi = async () => {

    if (!formOrg.nama || !formOrg.jabatan) {
      showToastMsg('Nama dan Jabatan wajib diisi.', 'error');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('nama', formOrg.nama);
      formData.append('jabatan', formOrg.jabatan);
      formData.append('urutan', formOrg.urutan.toString());
      if (formOrg.keterangan) formData.append('keterangan', formOrg.keterangan);
      if (fileOrg) {
        formData.append('foto', fileOrg);
      } else if (isEditingOrg !== null && previewOrg === null) {
        // User menghapus foto yang sudah ada (preview dibersihkan tanpa upload baru)
        // Kirim flag agar backend menghapus file lama
        const original = organisasi.find((o: any) => o.id === isEditingOrg);
        if (original?.foto) {
          formData.append('hapusFoto', 'true');
        }
      }

      if (isEditingOrg !== null) {
        await api.put(`/struktur-organisasi/${isEditingOrg}`, formData);
      } else {
        await api.post('/struktur-organisasi', formData);
      }
      setFormOrg({ nama: '', jabatan: '', urutan: 0, keterangan: '' });
      setFileOrg(null);
      setPreviewOrg(null);
      setIsEditingOrg(null);
      await fetchData();
      showToastMsg(isEditingOrg ? 'Struktur organisasi diperbarui.' : 'Anggota baru ditambahkan.');
    } catch (err: any) {
      handleError(err, 'Terjadi kesalahan pada struktur organisasi.');
    }
  };

  const handleOrgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        showToastMsg('Format gambar harus JPG, PNG, atau WEBP.', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToastMsg('Ukuran gambar maksimal 2MB.', 'error');
        return;
      }
      setFileOrg(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewOrg(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const hapusOrganisasi = async (id: number) => {
    try {
      await api.delete(`/struktur-organisasi/${id}`);
      setDeleteOrgConfirm(null);
      await fetchData();
      showToastMsg('Anggota dihapus.');
    } catch (err: any) {
      handleError(err, 'Gagal menghapus.');
      setDeleteOrgConfirm(null);
    }
  };

  const editOrganisasi = (org: any) => {
    setIsEditingOrg(org.id);
    setFormOrg({
      nama: org.nama,
      jabatan: org.jabatan,
      urutan: org.urutan,
      keterangan: org.keterangan || ''
    });
    setFileOrg(null);
    setPreviewOrg(org.foto ? getImageUrl(org.foto) : null);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Handler Riwayat Kuwu
  const handleSaveRiwayat = async () => {

    try {
      const payload: any = { nama: formRiwayat.nama, masaJabatan: formRiwayat.masaJabatan, urutan: formRiwayat.urutan };
      if (formRiwayat.keterangan) payload.keterangan = formRiwayat.keterangan;
      if (isEditingRiwayat !== null) {
        await api.put(`/riwayat-kuwu/${isEditingRiwayat}`, payload);
      } else {
        await api.post('/riwayat-kuwu', payload);
      }
      setFormRiwayat({ nama: '', masaJabatan: '', urutan: 0, keterangan: '' });
      setIsEditingRiwayat(null);
      await fetchData();
      showToastMsg(isEditingRiwayat ? 'Riwayat diperbarui.' : 'Riwayat baru ditambahkan.');
    } catch (err: any) {
      handleError(err, 'Terjadi kesalahan pada riwayat kuwu.');
    }
  };

  const hapusRiwayat = async (id: number) => {
    try {
      await api.delete(`/riwayat-kuwu/${id}`);
      setDeleteRiwayatConfirm(null);
      await fetchData();
      showToastMsg('Riwayat dihapus.');
    } catch (err: any) {
      handleError(err, 'Gagal menghapus.');
      setDeleteRiwayatConfirm(null);
    }
  };

  const editRiwayat = (riwayat: any) => {
    setIsEditingRiwayat(riwayat.id);
    setFormRiwayat({
      nama: riwayat.nama,
      masaJabatan: riwayat.masaJabatan,
      urutan: riwayat.urutan,
      keterangan: riwayat.keterangan || ''
    });
    window.scrollTo({ top: 600, behavior: 'smooth' });
  };

  // Handler Galeri
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) {
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
      if (!formatDiizinkan.includes(f.type.toLowerCase())) {
        showToastMsg('Format foto galeri harus JPG, JPEG, PNG, HEIC, HEIF, atau WEBP.', 'error');
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        showToastMsg('Ukuran foto galeri maksimal 5MB sesuai batas backend.', 'error');
        return;
      }
    }


    setFileGaleri(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewGaleri(url);
    } else {
      setPreviewGaleri(null);
    }
  };

  const handleUploadGaleri = async () => {
    if (!fileGaleri) {
      showToastMsg('Foto galeri wajib dipilih (jpg, jpeg, png, heic).', 'error');
      return;
    }
    setIsSavingGaleri(true);

    try {
      const fd = new FormData();
      fd.append('foto', fileGaleri);
      if (formGaleri.judul) fd.append('judul', formGaleri.judul);
      if (formGaleri.keterangan) fd.append('keterangan', formGaleri.keterangan);
      fd.append('urutan', String(formGaleri.urutan));
      await api.post('/galeri', fd);
      setFormGaleri({ judul: '', keterangan: '', urutan: 0 });
      setFileGaleri(null);
      setPreviewGaleri(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchData();
      showToastMsg('Galeri berhasil ditambahkan.');
    } catch (err: any) {
      handleError(err, 'Gagal mengunggah galeri.');
    } finally {
      setIsSavingGaleri(false);
    }
  };

  const hapusGaleri = async (id: number) => {
    try {
      await api.delete(`/galeri/${id}`);
      setDeleteGaleriConfirm(null);
      await fetchData();
      showToastMsg('Galeri dihapus.');
    } catch (err: any) {
      handleError(err, 'Gagal menghapus galeri.');
      setDeleteGaleriConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0A3D2D]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1F2937] mb-2 tracking-tight">
          Profil Desa
        </h1>
        <p className="text-sm font-medium text-slate-500">
          Kelola urutan: Sejarah → Visi & Misi → Letak Geografis → Struktur Organisasi → Riwayat Kuwu → Galeri.
        </p>
      </div>

      {/* Quick Navigation */}<div className="space-y-6">
        
        {/* 1. Sejarah Desa */}
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <ScrollText className="w-5 h-5 text-[#0A3D2D]" />
            <h2 className="text-lg font-bold text-[#0A3D2D]">1. Sejarah Desa</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-extrabold text-[#1F2937] mb-2">Sejarah Desa Citapen</label>
              <textarea
                rows={8}
                placeholder="Tulis sejarah desa minimal 20 karakter..."
                value={sejarah}
                onChange={(e) => setSejarah(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none bg-white text-sm font-medium text-slate-700 resize-y whitespace-pre-line"
              />
              <p className="text-xs text-slate-400 mt-2">{sejarah.length} karakter • minimal 20</p>
            </div>
            <div className="flex justify-end">
              <button onClick={handleSaveSejarah} disabled={isSavingSejarah} className="bg-[#0A3D2D] text-white font-bold py-2 px-6 rounded-xl shadow-md hover:bg-[#072a1f] transition-all flex items-center gap-2 disabled:opacity-80">
                {isSavingSejarah ? 'Menyimpan...' : <><Save className="w-4 h-4"/> Simpan Sejarah</>}
              </button>
            </div>
          </div>
        </div>

        {/* 2. Visi & Misi */}
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Eye className="w-5 h-5 text-[#0A3D2D]" />
            <h2 className="text-lg font-bold text-[#0A3D2D]">2. Visi & Misi</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-[13px] font-extrabold text-[#1F2937] mb-2">Visi Desa</label>
              <textarea
                rows={3}
                placeholder="Visi minimal 10 karakter..."
                value={visi}
                onChange={(e) => setVisi(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] outline-none bg-white text-sm font-medium text-slate-700 resize-y"
              />
              <p className="text-xs text-slate-400 mt-1">{visi.length} karakter • minimal 10</p>
            </div>
            <div>
              <label className="block text-[13px] font-extrabold text-[#1F2937] mb-2">Misi Desa</label>
              <textarea
                rows={6}
                placeholder="Misi minimal 20 karakter, pisahkan dengan baris baru atau nomor..."
                value={misi}
                onChange={(e) => setMisi(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] outline-none bg-white text-sm font-medium text-slate-700 resize-y whitespace-pre-line"
              />
              <p className="text-xs text-slate-400 mt-1">{misi.length} karakter • minimal 20</p>
            </div>
            <div className="flex justify-end">
              <button onClick={handleSaveVisiMisi} disabled={isSavingVisiMisi} className="bg-[#0A3D2D] text-white font-bold py-2 px-6 rounded-xl shadow-md hover:bg-[#072a1f] transition-all flex items-center gap-2 disabled:opacity-80">
                {isSavingVisiMisi ? 'Menyimpan...' : <><Save className="w-4 h-4"/> Simpan Visi & Misi</>}
              </button>
            </div>
          </div>
        </div>

        {/* 3. Data Geografis & Wilayah */}
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Map className="w-5 h-5 text-[#0A3D2D]" />
            <h2 className="text-lg font-bold text-[#0A3D2D]">3. Letak Geografis & Wilayah</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[13px] font-extrabold text-[#1F2937] mb-2">Luas Wilayah</label>
              <input 
                type="text" 
                placeholder="Contoh: 473,300 Ha"
                value={luasWilayah}
                onChange={(e) => setLuasWilayah(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] focus:ring-1 focus:ring-[#0A3D2D] outline-none transition-all text-sm font-medium text-slate-700 bg-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[13px] font-extrabold text-[#1F2937] mb-2">Batas Utara</label>
                <input type="text" value={batasUtara} onChange={(e) => setBatasUtara(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] outline-none bg-white text-sm font-medium text-slate-700" />
              </div>
              <div>
                <label className="block text-[13px] font-extrabold text-[#1F2937] mb-2">Batas Selatan</label>
                <input type="text" value={batasSelatan} onChange={(e) => setBatasSelatan(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] outline-none bg-white text-sm font-medium text-slate-700" />
              </div>
              <div>
                <label className="block text-[13px] font-extrabold text-[#1F2937] mb-2">Batas Timur</label>
                <input type="text" value={batasTimur} onChange={(e) => setBatasTimur(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] outline-none bg-white text-sm font-medium text-slate-700" />
              </div>
              <div>
                <label className="block text-[13px] font-extrabold text-[#1F2937] mb-2">Batas Barat</label>
                <input type="text" value={batasBarat} onChange={(e) => setBatasBarat(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] outline-none bg-white text-sm font-medium text-slate-700" />
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-extrabold text-[#1F2937] mb-2">Letak Geografis</label>
              <textarea 
                rows={3}
                value={letakGeografis}
                onChange={(e) => setLetakGeografis(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] outline-none bg-white text-sm font-medium text-slate-700 resize-y"
              />
            </div>
            <div>
              <label className="block text-[13px] font-extrabold text-[#1F2937] mb-2">Deskripsi Wilayah</label>
              <textarea 
                rows={3}
                value={deskripsiWilayah}
                onChange={(e) => setDeskripsiWilayah(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0A3D2D] outline-none bg-white text-sm font-medium text-slate-700 resize-y"
              />
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={handleSaveProfil}
                disabled={isSaving}
                className="bg-[#0A3D2D] text-white font-bold py-2 px-6 rounded-xl shadow-md hover:bg-[#072a1f] transition-all flex items-center gap-2 disabled:opacity-80"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Geografis'}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Struktur Organisasi */}
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[#0A3D2D]" />
            <h2 className="text-lg font-bold text-[#0A3D2D]">4. Struktur Organisasi</h2>
            <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">{organisasi.length} anggota</span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Data tampil di halaman publik Profil Desa. Urutkan via angka urutan terkecil tampil paling atas.</p>
          
          {/* Form Tambah/Edit */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">{isEditingOrg ? 'Edit Anggota' : 'Tambah Anggota Baru'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Nama Lengkap *" value={formOrg.nama} onChange={(e) => setFormOrg({...formOrg, nama: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#0A3D2D] outline-none" />
              <input type="text" placeholder="Jabatan * (contoh: Kepala Desa)" value={formOrg.jabatan} onChange={(e) => setFormOrg({...formOrg, jabatan: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#0A3D2D] outline-none" />
              <input type="number" placeholder="Urutan Tampil (misal: 1)" value={formOrg.urutan} onChange={(e) => setFormOrg({...formOrg, urutan: parseInt(e.target.value) || 0})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#0A3D2D] outline-none" />
              <input type="text" placeholder="Keterangan Tambahan (Opsional)" value={formOrg.keterangan} onChange={(e) => setFormOrg({...formOrg, keterangan: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#0A3D2D] outline-none" />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-2">Foto Anggota (Opsional)</label>
              <div className="flex items-center gap-4">
                {previewOrg ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 shrink-0">
                    <img src={previewOrg} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div>
                  <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" className="hidden" ref={orgFileInputRef} onChange={handleOrgImageChange} />
                  <button onClick={() => orgFileInputRef.current?.click()} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold border border-slate-200 transition-colors">
                    Pilih Foto
                  </button>
                  {previewOrg && (
                    <button onClick={() => { setFileOrg(null); setPreviewOrg(null); }} className="text-xs text-red-500 hover:text-red-700 font-bold ml-3">
                      Hapus
                    </button>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">Format JPG, PNG, WEBP max 2MB (Rasio 1:1 direkomendasikan)</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleSaveOrganisasi} className="bg-[#0A3D2D] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#072a1f]">
                {isEditingOrg ? <Save className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                {isEditingOrg ? 'Update' : 'Tambahkan'}
              </button>
              {isEditingOrg !== null && (
                <button onClick={() => { setIsEditingOrg(null); setFormOrg({nama: '', jabatan: '', urutan: 0, keterangan: ''}) }} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-300">
                  <X className="w-4 h-4"/> Batal
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {organisasi.map((org) => (
              <div key={org.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl group hover:border-emerald-200 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{org.nama} <span className="text-xs text-slate-400 font-normal ml-2">Urutan: {org.urutan}</span></h4>
                  <p className="text-xs text-slate-500">{org.jabatan} {org.keterangan ? `- ${org.keterangan}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => editOrganisasi(org)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={() => setDeleteOrgConfirm(org.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
            {organisasi.length === 0 && <p className="text-sm text-slate-500 text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">Belum ada data struktur organisasi. Tambahkan di form atas.</p>}
          </div>
        </div>

        {/* 5. Riwayat Kepala Desa */}
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-[#0A3D2D]" />
            <h2 className="text-lg font-bold text-[#0A3D2D]">5. Riwayat Kepala Desa (Kuwu)</h2>
            <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">{riwayatKades.length} riwayat</span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Tampil di publik sebagai tabel urutan masa jabatan.</p>
          
          {/* Form Tambah/Edit */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">{isEditingRiwayat ? 'Edit Riwayat' : 'Tambah Riwayat Baru'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Nama Kuwu *" value={formRiwayat.nama} onChange={(e) => setFormRiwayat({...formRiwayat, nama: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#0A3D2D] outline-none" />
              <input type="text" placeholder="Masa Jabatan * (Contoh: 1947 - 1957)" value={formRiwayat.masaJabatan} onChange={(e) => setFormRiwayat({...formRiwayat, masaJabatan: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#0A3D2D] outline-none" />
              <input type="number" placeholder="Urutan Tampil *" value={formRiwayat.urutan} onChange={(e) => setFormRiwayat({...formRiwayat, urutan: parseInt(e.target.value) || 0})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#0A3D2D] outline-none" />
              <input type="text" placeholder="Keterangan (Opsional)" value={formRiwayat.keterangan} onChange={(e) => setFormRiwayat({...formRiwayat, keterangan: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#0A3D2D] outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveRiwayat} className="bg-[#0A3D2D] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#072a1f]">
                {isEditingRiwayat ? <Save className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                {isEditingRiwayat ? 'Update' : 'Tambahkan'}
              </button>
              {isEditingRiwayat !== null && (
                <button onClick={() => { setIsEditingRiwayat(null); setFormRiwayat({nama: '', masaJabatan: '', urutan: 0, keterangan: ''}) }} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-300">
                  <X className="w-4 h-4"/> Batal
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-extrabold text-[12px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-16">Urutan</th>
                  <th className="px-6 py-4">Nama Kepala Desa</th>
                  <th className="px-6 py-4">Masa Jabatan</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {riwayatKades.map((riwayat) => (
                  <tr key={riwayat.id} className="hover:bg-slate-50 group">
                    <td className="px-6 py-4 font-bold text-slate-500">{riwayat.urutan}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{riwayat.nama}</td>
                    <td className="px-6 py-4 text-slate-600">{riwayat.masaJabatan}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs max-w-[200px] truncate">{riwayat.keterangan || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => editRiwayat(riwayat)} className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => setDeleteRiwayatConfirm(riwayat.id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {riwayatKades.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada riwayat kepala desa. Tambahkan di form atas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Galeri Desa */}
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="w-5 h-5 text-[#0A3D2D]" />
            <h2 className="text-lg font-bold text-[#0A3D2D]">6. Galeri Desa</h2>
            <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">{galeri.length} foto</span>
          </div>
          <p className="text-xs text-slate-500 mb-6">Kelola foto galeri yang tampil di halaman publik Profil Desa (posisi paling bawah, setelah Riwayat Kuwu). Format: jpg, jpeg, png, heic, webp, maksimal 5MB.</p>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Tambah Foto Galeri Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Judul Foto (Opsional)" value={formGaleri.judul} onChange={(e) => setFormGaleri({...formGaleri, judul: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#0A3D2D] outline-none" />
              <input type="number" placeholder="Urutan Tampil (0 = paling atas)" value={formGaleri.urutan} onChange={(e) => setFormGaleri({...formGaleri, urutan: parseInt(e.target.value) || 0})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#0A3D2D] outline-none" />
              <input type="text" placeholder="Keterangan (Opsional)" value={formGaleri.keterangan} onChange={(e) => setFormGaleri({...formGaleri, keterangan: e.target.value})} className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#0A3D2D] outline-none md:col-span-2" />
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-2">Foto Galeri * (wajib)</label>
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.heic,.heif,.webp" onChange={handleFileChange} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-[#0A3D2D] file:text-white file:text-xs file:font-bold hover:file:bg-[#072a1f]" />
                {previewGaleri && (
                  <div className="mt-4 relative w-full max-w-xs h-48 rounded-xl overflow-hidden border border-slate-200">
                    <img src={previewGaleri} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => {setFileGaleri(null); setPreviewGaleri(null); if(fileInputRef.current) fileInputRef.current.value='';}} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80"><X className="w-4 h-4"/></button>
                  </div>
                )}
              </div>
            </div>
            <button onClick={handleUploadGaleri} disabled={isSavingGaleri || !fileGaleri} className="bg-[#0A3D2D] text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#072a1f] disabled:opacity-50 disabled:cursor-not-allowed">
              {isSavingGaleri ? 'Mengunggah...' : <><Plus className="w-4 h-4"/> Upload Galeri</>}
            </button>
          </div>

          {galeri.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">Belum ada foto galeri. Upload foto pertama di atas.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galeri.map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img src={getImageUrl(item.foto)} alt={item.judul || 'Galeri'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => (e.currentTarget.src='/placeholder.svg')} />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full">Urutan: {item.urutan}</div>
                    <button onClick={() => setDeleteGaleriConfirm(item.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{item.judul || 'Tanpa Judul'}</h4>
                    {item.keterangan && <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.keterangan}</p>}
                    <p className="text-[10px] text-slate-400 mt-2">{new Date(item.dibuatPada).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Save Toast Notification */}
      <div className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 transition-all duration-500 z-50 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-start gap-3 ${toastType === 'success' ? 'bg-[#0A3D2D] text-white' : 'bg-red-600 text-white'}`}>
          {toastType === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-200 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-bold">{toastType === 'success' ? 'Berhasil' : 'Terjadi Kesalahan'}</p>
            <p className={`text-xs mt-1 whitespace-pre-wrap max-w-sm ${toastType === 'success' ? 'text-emerald-100/70' : 'text-red-100'}`}>{toastMsg}</p>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteOrgConfirm !== null}
        onClose={() => setDeleteOrgConfirm(null)}
        onConfirm={() => hapusOrganisasi(deleteOrgConfirm!)}
        title="Hapus Struktur Organisasi?"
        message="Tindakan ini tidak dapat dibatalkan. Anggota ini akan dihapus dari struktur organisasi desa."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

      <ConfirmModal
        isOpen={deleteRiwayatConfirm !== null}
        onClose={() => setDeleteRiwayatConfirm(null)}
        onConfirm={() => hapusRiwayat(deleteRiwayatConfirm!)}
        title="Hapus Riwayat Kuwu?"
        message="Tindakan ini tidak dapat dibatalkan. Riwayat kuwu ini akan dihapus secara permanen."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

      <ConfirmModal
        isOpen={deleteGaleriConfirm !== null}
        onClose={() => setDeleteGaleriConfirm(null)}
        onConfirm={() => hapusGaleri(deleteGaleriConfirm!)}
        title="Hapus Galeri?"
        message="Tindakan ini tidak dapat dibatalkan. Foto galeri akan dihapus permanen dari server."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

    </div>
  );
}

