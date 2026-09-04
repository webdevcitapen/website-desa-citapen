/**
 * Pengujian tekanan (stress testing) memakai autocannon.
 * Menekan server dengan koneksi sangat banyak untuk memastikan
 * aplikasi tetap stabil dan tidak mati di bawah beban ekstrem.
 * Jalankan: npm run test:stress
 * Variabel lingkungan opsional:
 *   TARGET_API  alamat api yang diuji (bawaan: http://localhost:3000)
 */

import autocannon from 'autocannon';

const targetApi = process.env.TARGET_API ?? 'http://localhost:3000';

console.log('Mulai pengujian tekanan dengan beban sangat tinggi...');
console.log(`Target: ${targetApi}`);
console.log('');

// Periksa ketersediaan server sebelum menekan
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
  console.error('Pastikan server backend sedang berjalan sebelum menjalankan pengujian tekanan.');
  console.error('Cara: npm run dev di terminal lain, lalu npm run test:stress');
  console.error('===============================================');
  process.exit(1);
}

// Tekan server dengan koneksi yang sangat banyak
const hasil = await autocannon({
  url: `${targetApi}/api/kesehatan`,
  connections: 500,
  pipelining: 10,
  duration: 30,
  title: 'Pengujian tekanan ekstrem',
});

console.log('');
console.log('=========== HASIL PENGUJIAN TEKANAN ===========');
console.log(`Koneksi aktif     : ${hasil.connections}`);
console.log(`Pipelining        : ${hasil.pipelining ?? 1}`);
console.log(`Durasi            : ${hasil.duration} detik`);
console.log(`Permintaan total  : ${hasil.requests.total}`);
console.log(`Permintaan/detik  : ${hasil.requests.average}`);
console.log(`Latensi p50       : ${hasil.latency.p50} ms`);
console.log(`Latensi p99       : ${hasil.latency.p99} ms`);
console.log(`Kesalahan         : ${hasil.errors}`);
console.log(`Waktu terhenti    : ${hasil.timeouts} ms`);
console.log('===============================================');

// Server dianggap lulus jika tidak ada kesalahan
if (hasil.errors > 0 || hasil.timeouts > 0) {
  console.error('SERVER TIDAK LULUS UJI TEKANAN');
  process.exit(1);
}
console.log('Server lulus uji tekanan dan tetap stabil.');
