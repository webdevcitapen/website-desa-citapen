/**
 * Script obfuscation untuk hasil kompilasi backend.
 * Mengubah seluruh file JavaScript di `dist/` menjadi kode yang
 * sangat sulit dibaca manusia (seperti bundle React/Vue produksi),
 * tetapi tetap dapat dijalankan oleh Node.js.
 *
 * Teknik yang dipakai:
 * - controlFlowFlattening (mengacak alur kontrol)
 * - stringArray dengan encoding base64 (mengacak string)
 * - identifierNamesGenerator hexadecimal (nama variabel acak)
 * - compact, splitStrings, simplify (minify + susah dibaca)
 *
 * Keamanan:
 * - renameGlobals: false agar tidak merusak variabel global Node/Express
 * - transformObjectKeys: false agar struktur JSON API tetap benar
 * - debugProtection/selfDefending dimatikan untuk kompatibilitas backend
 * - import ESM dipertahankan (string import tidak diacak sembarangan)
 *
 * Dijalankan otomatis setelah `tsc` melalui `npm run build`.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import JavaScriptObfuscator from 'javascript-obfuscator';

// Direktori hasil kompilasi
const DIST_DIR = 'dist';

// Opsi obfuscator yang aman untuk Node.js + Express + ESM
// Disesuaikan agar tetap runnable 100% tetapi sangat sulit dibaca
const OPSI_OBFUSCATOR = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: false,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 5,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.75,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
  target: 'node',
};

/**
 * Mengaburkan satu berkas JavaScript.
 * @param {string} filePath - Path absolut/relatif berkas
 */
async function obfuscateBerkas(filePath) {
  const kodeAsli = await fs.readFile(filePath, 'utf8');

  // Lewati berkas kosong
  if (kodeAsli.trim().length === 0) {
    return;
  }

  // Lewati berkas yang bukan JavaScript valid (mis. sudah ter-obfuscate kosong)
  try {
    const hasil = JavaScriptObfuscator.obfuscate(
      kodeAsli,
      OPSI_OBFUSCATOR,
    ).getObfuscatedCode();

    await fs.writeFile(filePath, hasil, 'utf8');
    console.log(`  ✓ ${filePath} -> ter-obfuscate (${kodeAsli.length} -> ${hasil.length} chars)`);
  } catch (kesalahan) {
    console.error(`  ✗ Gagal obfuscate ${filePath}:`, kesalahan.message);
    throw kesalahan;
  }
}

/**
 * Menghapus semua source map agar kode asli tidak bocor.
 */
async function hapusSourceMap() {
  const berkasMap = await glob(`${DIST_DIR}/**/*.map`, { nodir: true });
  const buildInfo = await glob(`${DIST_DIR}/**/*.tsbuildinfo`, { nodir: true });
  const semuaUntukDihapus = [...berkasMap, ...buildInfo];

  for (const berkas of semuaUntukDihapus) {
    try {
      await fs.unlink(berkas);
      console.log(`  - menghapus ${berkas}`);
    } catch {
      // abaikan jika sudah terhapus
    }
  }

  if (semuaUntukDihapus.length === 0) {
    console.log('  (tidak ada source map untuk dihapus)');
  }
}

/**
 * Membersihkan jejak sourceMappingURL di dalam file JS compact.
 * TSC dengan sourceMap:false sudah tidak menyisipkan, tapi jaga-jaga.
 */
async function bersihkanSourceMappingURL(filePath) {
  let kode = await fs.readFile(filePath, 'utf8');
  const barisAwal = kode.length;
  // Hapus komentar //# sourceMappingURL=... dan //@ sourceMappingURL=...
  kode = kode.replace(/\/\/# sourceMappingURL=.*$/gm, '');
  kode = kode.replace(/\/\/@ sourceMappingURL=.*$/gm, '');
  if (kode.length !== barisAwal) {
    await fs.writeFile(filePath, kode, 'utf8');
  }
}

async function utama() {
  console.log('🔒 Memulai obfuscation hasil build...');

  // Cari semua file JS di dist
  const daftarBerkas = await glob(`${DIST_DIR}/**/*.js`, { nodir: true });

  if (daftarBerkas.length === 0) {
    console.error(`❌ Tidak ada berkas .js ditemukan di ${DIST_DIR}/`);
    console.error('   Pastikan sudah menjalankan tsc terlebih dahulu.');
    process.exit(1);
  }

  console.log(`📁 Ditemukan ${daftarBerkas.length} berkas untuk di-obfuscate:`);

  for (const berkas of daftarBerkas) {
    await obfuscateBerkas(berkas);
    await bersihkanSourceMappingURL(berkas);
  }

  console.log('\n🧹 Menghapus source map...');
  await hapusSourceMap();

  // Hapus juga jejak komentar peta jika masih ada
  console.log('\n✅ Obfuscation selesai! Dist sekarang tidak bisa dibaca manusia.');
  console.log('   Contoh: kode akan tampak seperti React production build (minified + acak).');
  console.log('   Jalankan `npm start` untuk memastikan masih bisa berjalan.');
}

utama().catch((kesalahan) => {
  console.error('❌ Obfuscation gagal:', kesalahan);
  process.exit(1);
});
