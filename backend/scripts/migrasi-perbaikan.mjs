/**
 * Skrip migrasi perbaikan 2025-09-05 untuk database desa_citapen.
 * Menjalankan file database/migrasi-2025-09-05-perbaikan.sql via node-postgres.
 * Dipakai agar migrasi bisa dijalankan dengan `node scripts/migrasi-perbaikan.mjs`
 * tanpa harus buka psql manual. Aman untuk dijalankan berulang (idempotent).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca DATABASE_URL dari process.env atau .env
try {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const dotenv = require('dotenv');
  dotenv.config();
} catch {
  // dotenv opsional, abaikan jika tidak ada
}

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://hafizhtux:1234567890@localhost:5432/desa_citapen';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

async function jalankanMigrasi() {
  const fileMigrasi = path.join(__dirname, '../database/migrasi-2025-09-05-perbaikan.sql');
  const sql = fs.readFileSync(fileMigrasi, 'utf8');

  console.log('Menjalankan migrasi perbaikan 2025-09-05...');
  console.log(`Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

  const client = await pool.connect();
  try {
    // Jalankan sebagai satu transaksi; file SQL sudah mengandung BEGIN/COMMIT
    await client.query(sql);
    console.log('✅ Migrasi berhasil dijalankan.');

    // Verifikasi cepat
    const cekBerita = await client.query(
      `SELECT column_name, is_nullable, column_default
         FROM information_schema.columns
        WHERE table_name='berita' AND column_name='kategori'`,
    );
    console.log('Kolom berita.kategori:', cekBerita.rows[0]);

    const cekProduk = await client.query(
      `SELECT column_name, is_nullable
         FROM information_schema.columns
        WHERE table_name='produk' AND column_name='kategori_id'`,
    );
    console.log('Kolom produk.kategori_id:', cekProduk.rows[0]);

    const cekNullProduk = await client.query(`SELECT COUNT(*)::int AS jml FROM produk WHERE kategori_id IS NULL`);
    console.log('Produk dengan kategori NULL:', cekNullProduk.rows[0].jml);

    const cekNullBerita = await client.query(`SELECT COUNT(*)::int AS jml FROM berita WHERE kategori IS NULL`);
    console.log('Berita dengan kategori NULL:', cekNullBerita.rows[0].jml);

    const cekIndexBerita = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename='berita' AND indexname='idx_berita_kategori'`,
    );
    console.log('Index idx_berita_kategori:', cekIndexBerita.rows.length > 0 ? 'ADA' : 'TIDAK ADA');

    if (cekNullProduk.rows[0].jml === 0 && cekNullBerita.rows[0].jml === 0) {
      console.log('✅ Verifikasi migrasi: tidak ada data NULL, kolom siap.');
    } else {
      console.warn('⚠️ Masih ada data NULL yang perlu diperiksa manual.');
    }
  } catch (err) {
    console.error('❌ Migrasi gagal:', err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

jalankanMigrasi();
