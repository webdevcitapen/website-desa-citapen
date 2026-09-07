import { useState, useEffect } from 'react';
import { Mail, Sparkles, Landmark } from 'lucide-react';
import api from '../../services/api';

export default function Footer({ profil: propProfil }: { profil?: any }) {
  const [profil, setProfil] = useState<any>(propProfil || null);

  useEffect(() => {
    if (!propProfil) {
      const fetchProfil = async () => {
        try {
          const response = await api.get('/profil-desa');
          if (response.data && response.data.data) {
            setProfil(response.data.data);
          } else if (response.data) {
            setProfil(response.data);
          }
        } catch (err) {
          console.error('Gagal mengambil profil di footer', err);
        }
      };
      fetchProfil();
    } else {
      setProfil(propProfil);
    }
  }, [propProfil]);

  const p = profil || {};
  const namaDesa = p.nama_desa || 'Desa Citapen';
  const kecamatan = p.kecamatan || 'Hantara';
  const kabupaten = p.kabupaten || 'Kuningan';
  const visi = p.visi || 'Mewujudkan masyarakat desa yang sejahtera, mandiri, dan berbudaya melalui tata kelola yang transparan dan inovatif.';

  return (
    <footer className="bg-[#022c22] text-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between gap-12">
          
          {/* Brand & Visi */}
          <div className="max-w-xl">
            <h2 className="text-xl font-bold mb-4">{namaDesa}, Kecamatan {kecamatan}, Kabupaten {kabupaten}</h2>
            <p className="text-sm text-emerald-100/70 leading-relaxed mb-12 max-w-md">
              {visi}
            </p>
            <p className="text-[10px] text-emerald-100/50">
              © 2026 KKM UMC Mahasiswa Teknik Informatika. All rights reserved.
            </p>
          </div>

          {/* Kontak */}
          <div className="md:w-80">
            <h3 className="font-semibold text-xs text-emerald-100/50 uppercase tracking-wider mb-6">Kontak</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-emerald-100/90">
                <Mail className="w-4 h-4 text-emerald-100/70" />
                <span>pemdes{namaDesa.toLowerCase().replace('desa ', '')}@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-emerald-100/90">
                <Sparkles className="w-4 h-4 text-emerald-100/70" />
                <span>{namaDesa.toUpperCase().replace('DESA ', '')} Maju Ka Bale</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-emerald-100/90">
                <Landmark className="w-4 h-4 text-emerald-100/70" />
                <span>Pemdes {namaDesa.replace('Desa ', '')}</span>
              </li>
            </ul>
          </div>
          
        </div>
      </div>
    </footer>
  );
}
