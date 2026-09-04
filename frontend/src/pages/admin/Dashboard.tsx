import { useState, useEffect } from 'react';
import { Users, Store, Newspaper, TrendingUp, Minus } from 'lucide-react';
import api from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    pengguna: 0,
    produk: 0,
    berita: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [berandaRes, penggunaRes] = await Promise.all([
          api.get('/beranda'),
          api.get('/admin/pengguna?batas=1')
        ]);
        
        setStats({
          produk: berandaRes.data?.data?.jumlahProduk || 0,
          berita: berandaRes.data?.data?.jumlahBerita || 0,
          pengguna: penggunaRes.data?.data?.total || 0,
        });
      } catch (error) {
        console.error("Gagal memuat statistik", error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0A3D2D] mb-2 tracking-tight">
            Dashboard Utama
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Ringkasan aktivitas dan metrik penting Desa Citapen, Kec. Hantara, Kab. Kuningan
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Pengguna */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-[#E6F0EB] text-[#0A3D2D] rounded-full flex items-center justify-center shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 bg-[#D1FAE5] text-[#065F46] px-2.5 py-1 rounded-full text-xs font-bold">
              <TrendingUp className="w-3 h-3" />
              Aktif
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">Total Pengguna Terdaftar</p>
            <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">{stats.pengguna}</h3>
          </div>
        </div>

        {/* Card 2: Produk UMKM */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-[#FFEDD5] text-[#C2410C] rounded-full flex items-center justify-center shadow-inner">
              <Store className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold">
              <Minus className="w-3 h-3" />
              Stabil
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">Produk UMKM</p>
            <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">{stats.produk}</h3>
          </div>
        </div>

        {/* Card 3: Berita Terbit */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col relative overflow-hidden">
          {/* Subtle gradient background for variety as seen in mockup */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-12 h-12 bg-[#E0E7FF] text-[#3730A3] rounded-full flex items-center justify-center shadow-inner">
              <Newspaper className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold">
              <Minus className="w-3 h-3" />
              Update
            </div>
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Berita Terbit</p>
              <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">{stats.berita}</h3>
            </div>
            <span className="text-xs font-medium text-slate-400 pb-1">Total Artikel</span>
          </div>
        </div>

      </div>

    </div>
  );
}
