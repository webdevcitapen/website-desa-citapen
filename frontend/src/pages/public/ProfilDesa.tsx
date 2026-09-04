import { useState, useEffect } from 'react';
import { Map, Image as ImageIcon } from 'lucide-react';
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

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FBFBFF] pb-20 md:pb-0">
      <Navbar />

      {/* Header Banner */}
      <section className="relative h-[400px] lg:h-[500px] flex items-center overflow-hidden bg-[#FBFBFF]">
        <div className="absolute inset-0 bg-[url('/images/profil-banner.jpg')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBFBFF] via-[#FBFBFF]/80 to-transparent"></div>

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
            src="/images/gapura-desa.svg"
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
        <div className="flex justify-start mb-8">
          <div className="inline-flex items-center gap-1.5 bg-[#EBF1FF] text-[#3460DC] text-xs font-bold px-3.5 py-1.5 rounded-full tracking-wide">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
            Sejarah Desa
          </div>
        </div>

        <div className="text-center mb-10">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Profil {NAMA_DESA}</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-800">SEJARAH SINGKAT</h2>
        </div>

        <div className="text-left text-[15px] text-slate-600 space-y-5 leading-relaxed font-medium whitespace-pre-line">
          {sejarahTampil}
        </div>
      </section>

      {/* 2. Visi & Misi */}
      <section className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F6F6FA] rounded-[2rem] p-8 lg:p-12 border border-slate-200 shadow-sm text-center">
            <h2 className="text-3xl font-bold text-[#0A3D2D] mb-3">Visi & Misi</h2>
            <p className="text-sm text-slate-500 mb-12">Arah kebijakan dan tujuan pembangunan yang memandu langkah ke masa depan.</p>

            <div className="mb-12 text-left">
              <div className="inline-flex items-center gap-1.5 bg-[#1C4E35] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-5 tracking-wide shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Visi
              </div>
              <h3 className="text-xl lg:text-[22px] italic font-semibold text-slate-800 leading-relaxed whitespace-pre-line">
                "{visiTampil}"
              </h3>
            </div>

            <div className="text-left">
              <div className="inline-flex items-center gap-1.5 bg-[#FFD1BB] text-[#D3602D] text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-5 tracking-wide shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                Misi
              </div>
              <ul className="space-y-3 text-sm lg:text-[15px] text-slate-600 leading-relaxed font-medium list-disc list-inside">
                {misiTampil.map((m, i) => (
                  <li key={i}>{m}</li>
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
              <div className="w-12 h-12 bg-[#E8F3EF] rounded-xl flex items-center justify-center mb-4">
                <Map className="w-6 h-6 text-[#0A3D2D]" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Luas Wilayah</p>
              <p className="text-4xl font-bold text-slate-800">{p.luasWilayah || '0'} <span className="text-lg text-slate-500 font-medium">Ha / km²</span></p>
            </div>

            {/* Batas Wilayah */}
            <div className="bg-[#F8F9FC] rounded-3xl p-8 border border-slate-100 text-left">
              <div className="flex items-center gap-3 mb-6">
                <Map className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-bold text-slate-800">Batas Wilayah</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-3 lg:p-4 rounded-2xl border border-slate-100 flex justify-between items-center gap-4">
                  <span className="bg-[#EBF1FF] text-[#3460DC] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap">Utara (Kaler)</span>
                  <span className="text-xs lg:text-sm font-medium text-slate-700 text-right">{p.batasUtara || '-'}</span>
                </div>
                <div className="bg-white p-3 lg:p-4 rounded-2xl border border-slate-100 flex justify-between items-center gap-4">
                  <span className="bg-[#EBF1FF] text-[#3460DC] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap">Selatan (Kidul)</span>
                  <span className="text-xs lg:text-sm font-medium text-slate-700 text-right">{p.batasSelatan || '-'}</span>
                </div>
                <div className="bg-white p-3 lg:p-4 rounded-2xl border border-slate-100 flex justify-between items-center gap-4">
                  <span className="bg-[#EBF1FF] text-[#3460DC] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap">Barat (Kulon)</span>
                  <span className="text-xs lg:text-sm font-medium text-slate-700 text-right">{p.batasBarat || '-'}</span>
                </div>
                <div className="bg-white p-3 lg:p-4 rounded-2xl border border-slate-100 flex justify-between items-center gap-4">
                  <span className="bg-[#EBF1FF] text-[#3460DC] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap">Timur (Wetan)</span>
                  <span className="text-xs lg:text-sm font-medium text-slate-700 text-right">{p.batasTimur || '-'}</span>
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
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#0A3D2D] mb-3 text-left">Struktur Organisasi</h2>
          <p className="text-sm text-slate-500 mb-12 text-left">Perangkat Pemerintah Desa yang bertugas melayani masyarakat.</p>

          <div className="w-full flex flex-wrap justify-center gap-4">
            {organisasi.map((org: any) => (
              <div key={org.id} className="bg-[#FBFBFF] p-5 rounded-2xl border border-slate-200 text-center w-full sm:w-[250px] hover:border-emerald-200 hover:shadow-md transition-all">
                {org.foto ? (
                  <img src={getImageUrl(org.foto)} alt={org.nama} className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-white shadow" onError={(e) => (e.currentTarget.style.display='none')} />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#E8F3EF] flex items-center justify-center mx-auto mb-3 text-[#0A3D2D] font-bold text-xl">
                    {org.nama.charAt(0).toUpperCase()}
                  </div>
                )}
                <h3 className="font-bold text-slate-800 text-sm mb-1">{org.nama}</h3>
                <p className="text-xs text-[#0A3D2D] font-bold mb-1">{org.jabatan}</p>
                {org.keterangan && <p className="text-[10px] text-slate-400 line-clamp-2">{org.keterangan}</p>}
                <p className="text-[10px] text-slate-300 mt-2">Urutan {org.urutan}</p>
              </div>
            ))}
            {organisasi.length === 0 && (
              <p className="text-slate-500 text-sm">Belum ada struktur organisasi.</p>
            )}
          </div>
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
              <p className="text-slate-400 text-xs mt-1">Admin dapat menambah galeri via halaman Admin → Profil Desa → Galeri Desa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galeri.map((item: any) => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    <img
                      src={getImageUrl(item.foto)}
                      alt={item.judul || 'Galeri Desa Citapen'}
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
                      <p className="text-[10px] text-slate-400 mt-2">Urutan {item.urutan} • {new Date(item.dibuatPada).toLocaleDateString('id-ID')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer profil={{ nama_desa: NAMA_DESA }} />
      <BottomNav />
    </div>
  );
}
