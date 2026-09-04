import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getImageUrl } from '../../services/api';

interface CardProdukProps {
  id: number;
  foto?: string;
  nama: string;
  harga: number;
  deskripsi: string;
  kategori?: { nama: string };
}

export default function CardProduk({ id, foto, nama, harga, deskripsi, kategori }: CardProdukProps) {
  return (
    <div className="bg-[#F8F9FC] rounded-xl overflow-hidden border border-slate-100 flex flex-col">
      <div className="relative h-48 overflow-hidden bg-slate-200">
        <img
          src={foto ? getImageUrl(foto) : 'https://placehold.co/600x400'}
          alt={nama}
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x400?text=Produk'; }}
        />
        {kategori && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-slate-800 shadow-sm">
            {kategori.nama}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="font-bold text-lg text-slate-900 mb-3">{nama}</h3>
        <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-grow">{deskripsi}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-slate-900">Rp {harga?.toLocaleString('id-ID')}</span>
          <Link to={`/produk/${id}`} className="text-[#963c3c] font-semibold text-sm hover:underline flex items-center gap-1">
            Detail <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
