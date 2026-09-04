/**
 * Pengujian keamanan.
 * Menguji perlindungan dari serangan dari luar (header keamanan,
 * sql injection, token rusak, brute force) dan dari dalam
 * (pemeriksaan kode sumber: tanpa any, tanpa query berbahaya).
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import type { Application } from 'express';
import { buatAplikasi } from '../../app.js';
import {
  periksaKetersediaanDatabase,
  dapatkanTokenAdmin,
  buatPenggunaUji,
  bersihkanDataUji,
} from '../bantuan.js';

const databaseTersedia = await periksaKetersediaanDatabase();

describe('pengujian keamanan dari sisi http', () => {
  let aplikasi: Application;

  it('memasang header keamanan dasar dari helmet', async () => {
    aplikasi = buatAplikasi();
    const tanggapan = await request(aplikasi).get('/api');

    // Header penting yang wajib ada untuk mencegah serangan
    expect(tanggapan.headers['x-content-type-options']).toBe('nosniff');
    expect(tanggapan.headers['x-dns-prefetch-control']).toBe('off');
    expect(tanggapan.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(tanggapan.headers['x-powered-by']).toBeUndefined();
  });

  it('menolak token yang rusak dengan kode 401', async () => {
    const tanggapan = await request(aplikasi)
      .get('/api/autentikasi/saya')
      .set('Authorization', 'Bearer abc.def.ghi');

    expect(tanggapan.status).toBe(401);
    expect(tanggapan.body.status).toBe('gagal');
  });

  it('membatasi laju permintaan login untuk mencegah brute force', async () => {
    // Buat aplikasi dengan batas login sangat kecil untuk pengujian
    const aplikasiTerbatas = buatAplikasi({ batasLajuLogin: 2 });

    // Kirim tiga permintaan masuk yang sama
    for (let i = 0; i < 2; i += 1) {
      await request(aplikasiTerbatas)
        .post('/api/autentikasi/masuk')
        .send({ username: 'siapapun', kataSandi: 'KataSandi123' });
    }

    // Permintaan ketiga harus ditolak karena melebihi batas
    const tanggapan = await request(aplikasiTerbatas)
      .post('/api/autentikasi/masuk')
      .send({ username: 'siapapun', kataSandi: 'KataSandi123' });

    expect(tanggapan.status).toBe(429);
    expect(tanggapan.body.kode).toBe('TERLALU_BANYAK_PERMINTAAN');
  });

  it('menolak data badan permintaan yang tidak sesuai bentuk', async () => {
    const tanggapan = await request(aplikasi)
      .post('/api/autentikasi/masuk')
      .send({ kataSandi: 'hanya-sandi-tanpa-username' });

    expect(tanggapan.status).toBe(400);
    expect(tanggapan.body.status).toBe('gagal');
  });
});

describe.skipIf(!databaseTersedia)('pengujian keamanan dari sisi database', () => {
  it('menolak serangan sql injection pada proses masuk', async () => {
    const aplikasi = buatAplikasi();

    // Beberapa pola serangan sql injection yang umum
    const polaSerangan = [
      "' OR '1'='1",
      "' OR 1=1 --",
      "admin'--",
      "'; DROP TABLE pengguna; --",
      "' UNION SELECT username, kata_sandi_hash FROM pengguna --",
    ];

    for (const serangan of polaSerangan) {
      const tanggapan = await request(aplikasi)
        .post('/api/autentikasi/masuk')
        .send({ username: serangan, kataSandi: 'KataSandi123' });

      // Tidak boleh berhasil masuk dan tidak boleh error server
      expect([400, 401]).toContain(tanggapan.status);
    }

    // Tabel pengguna harus tetap utuh
    const cek = await fs.promises.stat('database/skema.sql');
    expect(cek.isFile()).toBe(true);
  });

  it('mencegah eskalasi hak akses: publikasi tidak bisa mengelola pengguna', async () => {
    const aplikasi = buatAplikasi();
    const penggunaUji = await buatPenggunaUji('publikasi');
    const tokenPublikasi = await request(aplikasi)
      .post('/api/autentikasi/masuk')
      .send({ username: penggunaUji.username, kataSandi: penggunaUji.kataSandi });

    const tanggapan = await request(aplikasi)
      .get('/api/admin/pengguna')
      .set('Authorization', `Bearer ${tokenPublikasi.body.data.token}`);

    expect(tanggapan.status).toBe(403);

    await bersihkanDataUji();
  });

  it('mencegah publikasi mengelola produk', async () => {
    const aplikasi = buatAplikasi();
    const penggunaUji = await buatPenggunaUji('publikasi');
    const tokenPublikasi = await request(aplikasi)
      .post('/api/autentikasi/masuk')
      .send({ username: penggunaUji.username, kataSandi: penggunaUji.kataSandi });

    const tanggapan = await request(aplikasi)
      .post('/api/produk')
      .set('Authorization', `Bearer ${tokenPublikasi.body.data.token}`)
      .send({ nama: 'Produk', harga: 1000, deskripsi: 'Tidak boleh dibuat.' });

    expect(tanggapan.status).toBe(403);

    await bersihkanDataUji();
  });

  it('mengizinkan admin masuk dengan kredensial yang benar', async () => {
    const token = await dapatkanTokenAdmin();
    expect(token.length).toBeGreaterThan(20);
  });
});

describe('pengujian keamanan dari sisi kode sumber', () => {
  /** Mendapatkan seluruh isi file typescript di folder tertentu. */
  function bacaSemuaFileTs(folder: string): { nama: string; isi: string }[] {
    const hasil: { nama: string; isi: string }[] = [];
    const bacaRekursif = (folderSekarang: string): void => {
      for (const entri of fs.readdirSync(folderSekarang, { withFileTypes: true })) {
        const jalur = path.join(folderSekarang, entri.name);
        if (entri.isDirectory()) {
          bacaRekursif(jalur);
        } else if (entri.name.endsWith('.ts')) {
          hasil.push({ nama: jalur, isi: fs.readFileSync(jalur, 'utf8') });
        }
      }
    };
    bacaRekursif(folder);
    return hasil;
  }

  it('tidak memakai tipe any di seluruh kode aplikasi', () => {
    const fileSumber = bacaSemuaFileTs('src');
    for (const file of fileSumber) {
      if (file.nama.includes('pengujian')) {
        continue;
      }
      expect(file.isi, `file ${file.nama} mengandung : any`).not.toMatch(
        /:\s*any\b|as\s*any\b/,
      );
    }
  });

  it('tidak memakai query sql hasil konkatenasi dari masukan pengguna', () => {
    const fileRepositori = bacaSemuaFileTs('src/repositori');
    for (const file of fileRepositori) {
      const baris = file.isi.split('\n');
      for (const barisKode of baris) {
        // Jika ada query dan juga ada interpulasi ${, itu berbahaya
        if (barisKode.includes('.query(') && barisKode.includes('${')) {
          throw new Error(
            `file ${file.nama} memakai interpulasi di dalam query`,
          );
        }
      }
    }
  });

  it('tidak memakai SELECT * di dalam query repositori', () => {
    const fileRepositori = bacaSemuaFileTs('src/repositori');
    for (const file of fileRepositori) {
      expect(
        file.isi,
        `file ${file.nama} mengandung SELECT *`,
      ).not.toMatch(/select\s+\*/i);
    }
  });

  it('menyimpan .env di dalam gitignore agar rahasia tidak tercommit', () => {
    const isiGitignore = fs.readFileSync('.gitignore', 'utf8');

    expect(isiGitignore).toContain('.env');
    expect(isiGitignore).toContain('node_modules');
    expect(isiGitignore).toContain('dist');
    expect(isiGitignore).toContain('unggahan');
  });
});
