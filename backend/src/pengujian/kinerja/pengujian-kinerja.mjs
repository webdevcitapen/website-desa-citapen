/**
 * Pengujian kinerja (performance testing) memakai autocannon.
 * Mengukur kecepatan tanggapan endpoint penting aplikasi dan
 * menampilkan persentil latensi agar mudah dianalisis.
 * Jalankan: npm run test:kinerja
 * Variabel lingkungan opsional:
 *   TARGET_API  alamat api yang diuji (bawaan: http://localhost:3000)
 */

import autocannon from 'autocannon';

const targetApi = process.env.TARGET_API ?? 'http://localhost:3000';

/** Daftar endpoint yang diukur kinerjanya. */
const daftarEndpoint = [
  { nama: 'Kesehatan', url: '/api/kesehatan' },
  { nama: 'Daftar produk', url: '/api/produk?halaman=1&perHalaman=10' },
  { nama: 'Daftar berita', url: '/api/berita?halaman=1&perHalaman=10' },
  { nama: 'Daftar kategori', url: '/api/kategori' },
];

console.log('Mulai pengukuran kinerja...');
console.log(`Target: ${targetApi}`);
console.log('');

// Periksa ketersediaan server sebelum mengukur
try {
  const cek = await fetch(`${targetApi}/api/kesehatan`);
  if (cek.status !== 200 && cek.status !== 503) {
    console.warn(`Peringatan: server mengembalikan status ${cek.status} untuk /api/kesehatan`);
  }
} catch (kesalahan) {
  console.error('');
  console.error('=========== SERVER TIDAK DAPAT DIJANGKAU ===========');
  console.error(`Target        : ${targetApi}/api/kesehatan`);
  console.error(`Kesalahan     : ${kesalahan instanceof Error ? kesalahan.message : String(kesalahan)}`);
  console.error('');
  console.error('Pastikan server backend sedang berjalan sebelum menjalankan pengujian kinerja.');
  console.error('Cara: npm run dev di terminal lain, lalu npm run test:kinerja');
  console.error('===============================================');
  process.exit(1);
}

/** Mengukur kinerja satu endpoint dan menampilkan hasilnya. */
async function ukurEndpoint(nama, url) {
  const hasil = await autocannon({
    url: `${targetApi}${url}`,
    connections: 50,
    duration: 10,
    title: nama,
  });

  console.log(`---------- ${nama} (${url}) ----------`);
  console.log(`Permintaan/detik : ${hasil.requests.average}`);
  console.log(`Latensi rata-rata: ${hasil.latency.average} ms`);
  console.log(`Latensi p50       : ${hasil.latency.p50} ms`);
  console.log(`Latensi p90       : ${hasil.latency.p90} ms`);
  console.log(`Latensi p99       : ${hasil.latency.p99} ms`);
  console.log(`Kesalahan         : ${hasil.errors}`);
  console.log('');

  // Jika ada kesalahan, beri tanda peringatan
  if (hasil.errors > 0) {
    console.error(`PERINGATAN: endpoint ${nama} mengalami kesalahan`);
  }
}

// Ukur setiap endpoint secara berurutan
for (const endpoint of daftarEndpoint) {
  await ukurEndpoint(endpoint.nama, endpoint.url);
}

console.log('Pengukuran kinerja selesai.');
