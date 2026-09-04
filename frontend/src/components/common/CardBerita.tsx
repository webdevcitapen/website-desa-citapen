import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { getImageUrl } from '../../services/api';

interface CardBeritaProps {
  id: number;
  gambar?: string;
  judul: string;
  ringkasan: string;
  tanggal: string;
}

export default function CardBerita({ id, gambar, judul, ringkasan, tanggal }: CardBeritaProps) {
  const dateObj = new Date(tanggal);
  const tanggalFormat = `${dateObj.getDate()} ${dateObj.toLocaleString('id-ID', { month: 'short' })} ${dateObj.getFullYear()}`;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col">
      <div className="relative h-48 overflow-hidden bg-slate-200">
        <img
          src={gambar ? getImageUrl(gambar) : 'https://placehold.co/600x400'}
          alt={judul}
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x400?text=Berita'; }}
        />
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-3">
          <Calendar className="w-3.5 h-3.5" />
          {tanggalFormat}
        </div>
        <h3 className="font-bold text-lg text-slate-900 mb-3 line-clamp-2 leading-snug">
          {judul}
        </h3>
        <p className="text-slate-500 text-sm line-clamp-3 flex-grow">
          {ringkasan}
        </p>
        <Link to={`/berita/${id}`} className="mt-4 text-slate-800 text-sm font-semibold hover:underline">
          Baca selengkapnya
        </Link>
      </div>
    </div>
  );
}
