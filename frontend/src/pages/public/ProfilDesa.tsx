import { useState, useEffect } from 'react';
import { Map, Image as ImageIcon, X, ChevronLeft, ChevronRight, User } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BottomNav from '../../components/layout/BottomNav';
import api, { getImageUrl } from '../../services/api';

export default function ProfilDesa() {
  const [profilGeografis, setProfilGeografis] = useState<any>({});
  const [organisasi, setOrganisasi] = useState<any[]>([]);
  const [riwayatKades, setRiwayatKades] = useState<any[]>([]);
  const [galeri, setGaleri] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSejarahModalOpen, setIsSejarahModalOpen] = useState(false);
  const [galeriPage, setGaleriPage] = useState(1);
  const [selectedGaleri, setSelectedGaleri] = useState<any | null>(null);

  // Fallback statis jika backend belum ada data sejarah/visi/misi
  const SEJARAH_FALLBACK = `Sejarah Desa Citapen bermula dari sebuah pemukiman kecil di lereng bukit yang berkembang berkat gotong royong masyarakat. Secara administratif, Desa Citapen terus berbenah dan berkembang menjadi desa mandiri yang mempertahankan nilai-nilai luhur dan budaya lokal. Berbagai pembangunan fisik dan non-fisik telah dilakukan untuk menunjang kehidupan warga.`;
  const VISI_FALLBACK = 'Mewujudkan Desa Citapen yang Religius, Sejahtera, Mandiri, dan Berbudaya';
  const MISI_FALLBACK = [
    'Meningkatkan kualitas sumber daya manusia melalui pendidikan dan kesehatan.',
    'Meningkatkan perekonomian desa melalui pemberdayaan UMKM dan pertanian.',
    'Menjaga kelestarian lingkungan dan kearifan lokal.',
    'Mewujudkan tata kelola pemerintahan desa yang transparan dan akuntabel.'
  ];
  const NAMA_DESA = 'Desa Citapen';
  const KECAMATAN = 'Hantara';

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/profil-desa', { signal: controller.signal as any, headers: { 'Cache-Control': 'no-cache' } as any }),
          api.get('/struktur-organisasi', { signal: controller.signal as any, headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } as any, params: { _t: Date.now() } as any }),
          api.get('/riwayat-kuwu', { signal: controller.signal as any, headers: { 'Cache-Control': 'no-cache' } as any }),
          api.get('/galeri', { signal: controller.signal as any, headers: { 'Cache-Control': 'no-cache' } as any })
        ]);
        const [rProfil, rOrg, rRiwayat, rGaleri] = results;

        if (rProfil.status === 'fulfilled' && rProfil.value.data?.data) {
          setProfilGeografis(rProfil.value.data.data);
        } else if (rProfil.status === 'rejected') {
          console.error('Gagal memuat profil-desa', rProfil.reason);
        }

        if (rOrg.status === 'fulfilled') {
          const orgData = rOrg.value.data?.data;
          if (Array.isArray(orgData)) setOrganisasi(orgData);
          else if (Array.isArray(orgData?.daftar)) setOrganisasi(orgData.daftar);
          else console.warn('Format struktur-organisasi tidak dikenali', orgData);
        } else {
          console.error('Gagal memuat struktur-organisasi', rOrg.reason);
        }

        if (rRiwayat.status === 'fulfilled') {
          const riwayatData = rRiwayat.value.data?.data;
          if (Array.isArray(riwayatData)) setRiwayatKades(riwayatData);
          else if (Array.isArray(riwayatData?.daftar)) setRiwayatKades(riwayatData.daftar);
          else console.warn('Format riwayat-kuwu tidak dikenali', riwayatData);
        } else {
          console.error('Gagal memuat riwayat-kuwu', rRiwayat.reason);
        }

        if (rGaleri.status === 'fulfilled') {
          const gData = rGaleri.value.data?.data;
          if (Array.isArray(gData)) setGaleri(gData);
          else if (Array.isArray(gData?.daftar)) setGaleri(gData.daftar);
          else console.warn('Format galeri tidak dikenali', gData);
        } else {
          console.error('Gagal memuat galeri', rGaleri.reason);
        }
      } catch (err) {
        console.error('Gagal memuat data profil desa (outer)', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#FBFBFF]">
        <Navbar />
        <div className="flex-grow flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A3D2D]"></div>
        </div>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  const p = profilGeografis;
  const sejarahTampil = p.sejarah || SEJARAH_FALLBACK;
  const visiTampil = p.visi || VISI_FALLBACK;
  const misiTampil: string[] = p.misi
    ? String(p.misi).split('\n').map((s: string) => s.trim()).filter(Boolean)
    : MISI_FALLBACK;
  const galeriPerPage = 10;
  const totalGaleriPage = Math.max(1, Math.ceil(galeri.length / galeriPerPage));
  const galeriTampil = galeri.slice((galeriPage - 1) * galeriPerPage, galeriPage * galeriPerPage);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FBFBFF] pb-20 md:pb-0">
      <Navbar />

      {/* Header Banner */}
      <section className="relative h-[400px] lg:h-[500px] flex items-center overflow-hidden bg-[#FBFBFF]">
        <div className="absolute inset-0 bg-[url('/images/profil-banner.png')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBFBFF] via-[#FBFBFF]/10 to-transparent"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 tracking-tight mb-4 leading-tight">
              Mengenal Lebih Dekat <br />
              {NAMA_DESA}
            </h1>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed max-w-lg font-medium">
              Menelusuri jejak sejarah, visi misi, letak geografis, dan struktur organisasi yang membangun Desa dari dulu hingga kini.
            </p>
          </div>
        </div>
      </section>

      {/* Foto Landmark */}
      <section className="relative -mt-24 lg:-mt-32 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="relative rounded-2xl lg:rounded-[2rem] overflow-hidden shadow-xl border-4 lg:border-8 border-white bg-white aspect-[21/9] lg:aspect-[3/1]">
          <img
            src="/images/gapura-desa.png"
            alt="Gapura Desa"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 lg:bottom-8 lg:right-8 bg-white/95 backdrop-blur-md px-4 py-2 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center">
            <span className="text-[9px] lg:text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              {NAMA_DESA}, {KECAMATAN}
            </span>
          </div>
        </div>
      </section>

      {/* 1. Sejarah Singkat - urutan pertama sesuai permintaan */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Profil {NAMA_DESA}</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-800">SEJARAH DESA</h2>
        </div>

        <div className="text-left text-[15px] text-slate-600 leading-relaxed font-medium whitespace-pre-line line-clamp-4">
          {sejarahTampil}
        </div>
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={() => setIsSejarahModalOpen(true)}
            className="text-sm font-bold text-[#0A3D2D] border border-[#0A3D2D] rounded-xl px-5 py-2.5 hover:bg-[#0A3D2D] hover:text-white transition-colors"
          >
            Baca selengkapnya
          </button>
        </div>
      </section>

      {/* 2. Visi & Misi */}
      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F6F6FA] rounded-[2rem] p-8 lg:p-12 border border-slate-200 shadow-sm text-center">
            <h2 className="text-3xl font-bold text-[#0A3D2D] mb-3">Visi & Misi</h2>
            <p className="text-sm text-slate-500 mb-12">Arah kebijakan dan tujuan pembangunan yang memandu langkah ke masa depan.</p>

            <div className="mb-12 text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-1.5 bg-[#1C4E35] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-5 tracking-wide shadow-sm">
                Visi
              </div>
              <h3 className="text-xl lg:text-[22px] italic font-semibold text-slate-800 leading-relaxed whitespace-pre-line max-w-3xl mx-auto">
                "{visiTampil}"
              </h3>
            </div>

            <div className="text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-1.5 bg-[#FFD1BB] text-[#D3602D] text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-5 tracking-wide shadow-sm">
                Misi
              </div>
              <ul className="space-y-3 text-sm lg:text-[15px] text-slate-600 leading-relaxed font-medium max-w-3xl mx-auto text-center">
                {misiTampil.map((m, i) => (
                  <li key={i}>
                    <span className="font-bold text-slate-800 mr-1.5">{i + 1}.</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Letak Geografis & Wilayah */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-8">Letak Geografis & Wilayah</h2>

          <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
            {/* Luas Wilayah */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5">
                <Map className="w-7 h-7 text-[#0A3D2D]" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Total Luas Wilayah</p>
              <div className="text-center">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                  {p.luasWilayah || '-'}
                </span>
                {(() => {
                  const raw = p.luasWilayah || '';
                  const match = raw.match(/[\d,.]+/);
                  if (match) {
                    const cleanNum = match[0].replace(/\./g, '').replace(',', '.');
                    const num = parseFloat(cleanNum);
                    if (!isNaN(num) && num > 0) {
                      return (
                        <div className="mt-4">
                          <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-500 px-4 py-1.5 rounded-lg text-sm font-semibold border border-slate-100 shadow-sm">
                            ≈ {(num / 100).toLocaleString('id-ID', { maximumFractionDigits: 2 })} km²
                          </span>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Batas Wilayah */}
            <div className="bg-[#F8F9FC] rounded-3xl p-8 border border-slate-100 text-left">
              <div className="flex items-center gap-3 mb-6">
                <Map className="w-5 h-5 text-[#0A3D2D]" />
                <h3 className="text-lg font-bold text-slate-800">Batas Wilayah</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-2 hover:border-emerald-200 hover:shadow-md transition-all">
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider w-max">Utara</span>
                  <span className="text-sm font-semibold text-slate-700 leading-snug">
                    {p.batasUtara || '-'}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-2 hover:border-emerald-200 hover:shadow-md transition-all">
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider w-max">Selatan</span>
                  <span className="text-sm font-semibold text-slate-700 leading-snug">
                    {p.batasSelatan || '-'}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-2 hover:border-emerald-200 hover:shadow-md transition-all">
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider w-max">Barat</span>
                  <span className="text-sm font-semibold text-slate-700 leading-snug">
                    {p.batasBarat || '-'}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-2 hover:border-emerald-200 hover:shadow-md transition-all">
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider w-max">Timur</span>
                  <span className="text-sm font-semibold text-slate-700 leading-snug">
                    {p.batasTimur || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {(p.letakGeografis || p.deskripsiWilayah) && (
            <div className="mt-6 bg-[#F8F9FC] rounded-3xl p-8 border border-slate-100 text-left">
              {p.letakGeografis && (
                <div className="mb-4">
                  <h4 className="font-bold text-slate-700 text-sm mb-2">Letak Geografis:</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{p.letakGeografis}</p>
                </div>
              )}
              {p.deskripsiWilayah && (
                <div>
                  <h4 className="font-bold text-slate-700 text-sm mb-2">Deskripsi Wilayah:</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{p.deskripsiWilayah}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. Struktur Organisasi */}
      <section className="py-16 bg-[#F8FAFC] border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0A3D2D] mb-3">Struktur Organisasi</h2>
            <p className="text-sm text-slate-500">Perangkat Pemerintah Desa yang bertugas melayani masyarakat.</p>
          </div>

          {organisasi.length === 0 ? (
            <p className="text-slate-500 text-sm text-center">Belum ada struktur organisasi.</p>
          ) : (
            <div className="flex flex-col items-center w-full">
              {(() => {
                const getRoleLevel = (jabatan: string = '') => {
                  const j = jabatan.toLowerCase();
                  if (j.includes('kepala desa') || j.includes('kuwu')) return 1;
                  if (j.includes('sekretaris') || j.includes('sekdes')) return 2;
                  if (j.includes('dusun') || j.includes('kadus')) return 4;
                  return 3; // Kasi, Kaur, and others
                };

                const level1 = organisasi.filter(o => getRoleLevel(o.jabatan) === 1);
                const level2 = organisasi.filter(o => getRoleLevel(o.jabatan) === 2);
                const level3 = organisasi.filter(o => getRoleLevel(o.jabatan) === 3);
                const level4 = organisasi.filter(o => getRoleLevel(o.jabatan) === 4);

                const renderCard = (org: any, isLevel1: boolean = false) => (
                  <div key={org.id} className={`bg-white p-5 rounded-2xl text-center relative hover:-translate-y-1 transition-all duration-300 ${isLevel1 ? 'border-2 border-[#0A3D2D] shadow-xl w-[280px] z-10' : 'border border-slate-200 shadow-sm hover:shadow-md w-full sm:w-[250px]'}`}>
                    {org.foto ? (
                      <img src={getImageUrl(org.foto, { width: 200 })} alt={org.nama} loading="lazy" decoding="async" className={`${isLevel1 ? 'w-24 h-24' : 'w-20 h-20'} rounded-full object-cover mx-auto mb-4 border-4 border-white shadow-md`} onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <div className={`${isLevel1 ? 'w-24 h-24 text-3xl' : 'w-20 h-20 text-2xl'} rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 text-emerald-600 font-bold shadow-inner border-4 border-white`}>
                        <User className={isLevel1 ? 'w-10 h-10' : 'w-8 h-8'} />
                      </div>
                    )}
                    <h3 className={`font-bold text-slate-800 ${isLevel1 ? 'text-lg' : 'text-sm'} mb-2`}>{org.nama}</h3>
                    <div className="mb-2">
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold inline-block border border-emerald-100">
                        {org.jabatan}
                      </span>
                    </div>
                    {org.keterangan && <p className="text-[10px] text-slate-400 line-clamp-2 mt-2">{org.keterangan}</p>}
                  </div>
                );

                return (
                  <div className="flex flex-col items-center w-full gap-8 sm:gap-12">
                    {/* Tingkat 1: Kepala Desa */}
                    {level1.length > 0 && (
                      <div className="flex flex-col items-center w-full">
                        <div className="flex justify-center w-full">
                          {level1.map(org => renderCard(org, true))}
                        </div>
                      </div>
                    )}

                    {/* Tingkat 2: Sekretaris Desa */}
                    {level2.length > 0 && (
                      <div className="flex flex-col items-center w-full">
                        <div className="flex justify-center w-full">
                          {level2.map(org => renderCard(org))}
                        </div>
                      </div>
                    )}

                    {/* Tingkat 3: Kasi & Kaur */}
                    {level3.length > 0 && (
                      <div className="flex flex-col items-center w-full">
                        <div className="bg-slate-100 text-slate-500 text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest shadow-sm">
                          Kepala Seksi & Urusan
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full max-w-4xl justify-items-center">
                          {level3.map(org => renderCard(org))}
                        </div>
                      </div>
                    )}

                    {/* Tingkat 4: Kepala Dusun */}
                    {level4.length > 0 && (
                      <div className="flex flex-col items-center w-full">
                        <div className="bg-slate-100 text-slate-500 text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest shadow-sm">
                          Kepala Dusun
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 w-full max-w-2xl justify-items-center">
                          {level4.map(org => renderCard(org))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {/* 5. Riwayat Kepala Desa */}
      <section className="py-12 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#0A3D2D] mb-6 text-left">Riwayat Kepala Desa (Kuwu)</h2>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F6FA] text-slate-800 text-xs font-bold tracking-wider border-b border-slate-200">
                  <th className="p-4 w-16">Urutan</th>
                  <th className="p-4">Nama Kuwu</th>
                  <th className="p-4">Masa Jabatan</th>
                  <th className="p-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="text-sm font-semibold text-slate-600">
                {riwayatKades.map((kades: any) => (
                  <tr key={kades.id} className={`border-b border-slate-200 hover:bg-slate-50 transition`}>
                    <td className={`p-4 text-slate-500`}>{kades.urutan}</td>
                    <td className={`p-4 uppercase font-bold text-slate-700`}>{kades.nama}</td>
                    <td className={`p-4`}>{kades.masaJabatan}</td>
                    <td className={`p-4 text-xs`}>{kades.keterangan || '-'}</td>
                  </tr>
                ))}
                {riwayatKades.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">Belum ada data riwayat kepala desa.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 6. Galeri Desa - READ untuk publik, posisi di bawah Riwayat Kuwu */}
      <section className="py-12 pb-16 bg-[#F8FAFC] border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <ImageIcon className="w-6 h-6 text-[#0A3D2D]" />
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0A3D2D] text-left">Galeri Desa</h2>
            <span className="ml-auto text-xs bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-full font-bold">{galeri.length} foto</span>
          </div>
          <p className="text-sm text-slate-500 mb-8 text-left">Potret kegiatan, pembangunan, dan keindahan Desa Citapen.</p>

          {galeri.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Belum ada foto galeri.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galeriTampil.map((item: any) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedGaleri(item)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group text-left focus:outline-none focus:ring-2 focus:ring-[#0A3D2D] focus:ring-offset-2"
                >
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    <img
                      src={getImageUrl(item.foto, { width: 600 })}
                      alt={item.judul || 'Galeri Desa Citapen'}
                      loading="lazy"
                      decoding="async"
                      width={600}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.judul && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                        <h3 className="text-white font-bold text-sm line-clamp-1">{item.judul}</h3>
                      </div>
                    )}
                  </div>
                  {(item.judul || item.keterangan) && (
                    <div className="p-4">
                      {item.judul && <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{item.judul}</h4>}
                      {item.keterangan && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.keterangan}</p>}
                      <p className="text-[10px] text-slate-400 mt-2">{new Date(item.dibuatPada).toLocaleDateString('id-ID')}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          {totalGaleriPage > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                type="button"
                onClick={() => setGaleriPage((page) => Math.max(1, page - 1))}
                disabled={galeriPage === 1}
                aria-label="Halaman galeri sebelumnya"
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-slate-500">Halaman {galeriPage} dari {totalGaleriPage}</span>
              <button
                type="button"
                onClick={() => setGaleriPage((page) => Math.min(totalGaleriPage, page + 1))}
                disabled={galeriPage === totalGaleriPage}
                aria-label="Halaman galeri berikutnya"
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {isSejarahModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setIsSejarahModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sejarah-modal-title"
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Tutup sejarah desa"
              onClick={() => setIsSejarahModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id="sejarah-modal-title" className="pr-10 text-2xl font-bold text-[#0A3D2D]">Sejarah Desa</h2>
            <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-slate-600">{sejarahTampil}</p>
          </div>
        </div>
      )}

      {selectedGaleri && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
          onClick={() => setSelectedGaleri(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="galeri-modal-title"
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Tutup detail galeri"
              onClick={() => setSelectedGaleri(null)}
              className="absolute right-3 top-3 z-10 rounded-lg bg-white/90 p-2 text-slate-500 shadow hover:bg-white hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={getImageUrl(selectedGaleri.foto, { width: 1200 })}
              alt={selectedGaleri.judul || 'Galeri Desa Citapen'}
              className="max-h-[65vh] w-full rounded-xl bg-slate-100 object-contain"
            />
            <div className="px-1 pt-5">
              <h2 id="galeri-modal-title" className="pr-10 text-xl font-bold text-[#0A3D2D]">
                {selectedGaleri.judul || 'Galeri Desa Citapen'}
              </h2>
              {selectedGaleri.keterangan && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{selectedGaleri.keterangan}</p>
              )}
              {selectedGaleri.dibuatPada && (
                <p className="mt-3 text-xs text-slate-400">{new Date(selectedGaleri.dibuatPada).toLocaleDateString('id-ID')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer profil={{ nama_desa: NAMA_DESA }} />
      <BottomNav />
    </div>
  );
}
