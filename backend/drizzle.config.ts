/**
 * Konfigurasi Drizzle Kit untuk migrasi & introspeksi database.
 * Dipakai dengan: npx drizzle-kit generate / push / studio
 *
 * Cara pakai:
 *   1. Atur DATABASE_URL di .env (lokal atau supabase)
 *   2. Jika pakai Supabase pooler (6543), atur DATABASE_SSL=true di .env
 *   3. Jalankan: npx drizzle-kit generate  -> buat file sql di ./drizzle
 *              npx drizzle-kit push      -> push skema ke DB langsung
 *              npx drizzle-kit studio    -> buka Drizzle Studio (GUI)
 */

import { defineConfig } from 'drizzle-kit';

// Tentukan SSL manual untuk Supabase (sama logikanya dengan src/config/database.ts)
// drizzle-kit memakai `ssl` terpisah dari url; jika DATABASE_URL mengandung supabase
// atau DATABASE_SSL=true, aktifkan ssl dengan rejectUnauthorized:false agar tidak
// error self-signed certificate di Supabase pooler (6543).
function tentukanSslDrizzle(): boolean | { rejectUnauthorized: boolean } | undefined {
  const sslEnv = process.env.DATABASE_SSL?.toLowerCase();
  if (sslEnv === 'true' || sslEnv === '1' || sslEnv === 'require') return { rejectUnauthorized: false };
  if (sslEnv === 'false' || sslEnv === '0' || sslEnv === 'disable') return undefined;
  const url = (process.env.DATABASE_URL ?? '').toLowerCase();
  if (url.includes('supabase') || url.includes('pooler.supabase')) return { rejectUnauthorized: false };
  if (url.includes('sslmode=require') || url.includes('ssl=true')) return { rejectUnauthorized: false };
  return undefined;
}

const sslOpsi = tentukanSslDrizzle();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://hafizhtux:1234567890@localhost:5432/desa_citapen',
    // drizzle-kit: untuk pg, `ssl` bisa boolean atau object. Hanya set jika perlu (Supabase).
    ...(sslOpsi ? { ssl: sslOpsi as never } : {}),
  },
  verbose: true,
  strict: true,
});
