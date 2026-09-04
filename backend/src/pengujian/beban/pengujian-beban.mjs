/**
 * Pengujian beban (load testing) memakai autocannon.
 * Menjalankan server dulu lalu jalankan:
 *   npm run test:beban
 * Variabel lingkungan opsional:
 *   TARGET_API  alamat api yang diuji (bawaan: http://localhost:3000)
 *   LAMA_UJI    lama pengujian dalam detik (bawaan: 20)
 */

import autocannon from 'autocannon';

// Tentukan target dan durasi pengujian dari lingkungan
const targetApi = process.env.TARGET_API ?? 'http://localhost:3000';
const lamaUji = Number(process.env.LAMA_UJI ?? 20);

// Periksa dulu apakah server dapat dijangkau sebelum membebani
async function periksaKetersediaanServer() {
  try {
    const tanggapan = await fetch(`${targetApi}/api/kesehatan`);
    // 200 (sehat) atau 503 (db belum terhubung) sama-sama dianggap server hidup
    if (tanggapan.status !== 200 && tanggapan.status !== 503) {
      console.error(`Server mengembalikan status tidak terduga: ${tanggapan.status}`);
    }
  } catch (kesalahan) {
    console.error('');
    console.error('=========== SERVER TIDAK DAPAT DIJANGKAU ===========');
    console.error(`Target        : ${targetApi}/api/kesehatan`);
    console.error(`Kesalahan     : ${kesalahan instanceof Error ? kesalahan.message : String(kesalahan)}`);
    console.error('');
    console.error('Pastikan server backend sedang berjalan sebelum menjalankan pengujian beban.');
    console.error('Cara menjalankan:');
    console.error('  1. Buka terminal baru');
    console.error('  2. Jalankan: npm run dev');
    console.error('  3. Tunggu hingga muncul "Server desa citapen berjalan"');
    console.error('  4. Di terminal lain jalankan: npm run test:beban');
    console.error('Atau jika port berbeda, jalankan: TARGET_API=http://localhost:3001 npm run test:beban');
    console.error('===============================================');
    process.exit(1);
  }
}

await periksaKetersediaanServer();

// Jalankan beban dengan jumlah koneksi yang wajar
const hasil = await autocannon({
  url: `${targetApi}/api/kesehatan`,
  connections: 100,
  duration: lamaUji,
  title: 'Pengujian beban endpoint kesehatan',
});

console.log('');
console.log('=========== HASIL PENGUJIAN BEBAN ===========');
console.log(`Target        : ${targetApi}/api/kesehatan`);
console.log(`Koneksi       : ${hasil.connections}`);
console.log(`Durasi        : ${hasil.duration} detik`);
console.log(`Permintaan    : ${hasil.requests.total}`);
console.log(`Permintaan/dtk: ${hasil.requests.average}`);
console.log(`Latensi 50%   : ${hasil.latency.p50} ms`);
console.log(`Latensi 95%   : ${hasil.latency.p95} ms`);
console.log(`Latensi 99%   : ${hasil.latency.p99} ms`);
console.log(`Kesalahan     : ${hasil.errors}`);
console.log(`Status 2xx     : ${hasil['2xx'] ?? 0}`);
console.log(`Status 4xx     : ${hasil['4xx'] ?? 0}`);
console.log(`Status 5xx     : ${hasil['5xx'] ?? 0}`);
console.log('=============================================');

// Deteksi server tidak jalan: 0 permintaan + banyak kesalahan jaringan
if (hasil.requests.total === 0 && hasil.errors > 0) {
  console.error('TERDAPAT KESALAHAN PADA PENGUJIAN BEBAN');
  console.error('Tidak ada permintaan yang berhasil. Kemungkinan server belum berjalan.');
  console.error('Pastikan server aktif di ' + targetApi + ' sebelum menguji beban.');
  process.exit(1);
}

// Gagal jika ada kesalahan jaringan yang mencurigakan
if (hasil.errors > 0) {
  console.error('TERDAPAT KESALAHAN PADA PENGUJIAN BEBAN');
  console.error(`Terjadi ${hasil.errors} kesalahan jaringan selama pengujian.`);
  process.exit(1);
}
console.log('Pengujian beban selesai tanpa kesalahan.');
