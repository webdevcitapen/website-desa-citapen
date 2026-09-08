import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Share2, Link as LinkIcon } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BottomNav from '../../components/layout/BottomNav';
import api, { getImageUrl } from '../../services/api';
import { formatTanggal } from '../../utils/format';

// Interface
interface DetailBeritaData {
  id: number;
  kategori?: string;
  judul: string;
  isi: string;
  gambar: string;
  dibuatPada: string;
  penulis?: {
    namaLengkap: string;
  };
}

  export default function DetailBerita() {
    const { id } = useParams<{ id: string }>();
    const [berita, setBerita] = useState<DetailBeritaData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchDetail = async () => {
        try {
          setIsLoading(true);
          const response = await api.get(`/berita/${id}`);
          if (response.data && response.data.data) {
            setBerita(response.data.data);
          } else if (response.data && response.data.id) {
            setBerita(response.data);
          }
        } catch (error) {
          console.error("Gagal memuat detail berita", error);
          setError('Detail berita tidak dapat dimuat. Silakan coba lagi.');
        } finally {
          setIsLoading(false);
        }
      };

    fetchDetail();
    window.scrollTo(0, 0);
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: berita?.judul,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan disalin ke papan klip!');
    }
  };

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

  if (!berita) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[#FBFBFF]">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p role="alert" className="text-sm font-semibold text-red-600">{error || 'Berita tidak ditemukan.'}</p>
          <button onClick={() => window.location.reload()} className="rounded-xl bg-[#0A3D2D] px-5 py-2.5 text-sm font-bold text-white">Coba lagi</button>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FBFBFF] pb-20 md:pb-0">
      <Navbar />

      <main className="flex-grow w-full py-8 lg:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Article Card */}
          <article className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            
            {/* Top Info */}
            <div className="p-6 md:p-10 pb-6">
              <div className="flex items-center gap-4 mb-6">
                <span className="bg-[#FFEDD5] text-[#C2410C] text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider uppercase">
                  {berita.kategori || "Berita"}
                </span>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatTanggal(berita.dibuatPada)}
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 leading-tight mb-8">
                {berita.judul}
              </h1>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1C4E35] text-white flex items-center justify-center font-bold text-sm uppercase">
                  {(berita.penulis?.namaLengkap || "A")[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{berita.penulis?.namaLengkap || "Admin"}</p>
                  <p className="text-xs text-slate-500">Pemerintah Desa Citapen</p>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-slate-100">
              <img src={getImageUrl(berita.gambar, { width: 900 })} alt={berita.judul} loading="eager" decoding="async" fetchPriority="high" width={900} height={506} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }} />
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-10 pt-8 text-slate-700">
              <div className="text-[15px] md:text-base leading-relaxed text-slate-800 whitespace-pre-wrap">
                {berita.isi}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 border-t border-slate-100 flex justify-end items-center gap-4 bg-[#FAFAFC]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-800">Bagikan:</span>
                <button onClick={handleShare} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-sm">
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleShare} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-sm">
                  <LinkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </article>

        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
