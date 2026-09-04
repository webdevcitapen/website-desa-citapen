/**
 * Pengujian sanity (kewarasan).
 * Pemeriksaan singkat bahwa bagian-bagian penting aplikasi
 * merespons dengan benar setelah perubahan kode.
 */

import { describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import { buatAplikasi } from '../../app.js';

describe('pengujian sanity', () => {
  const aplikasi: Application = buatAplikasi();

  it('rute utama merespons dengan benar', async () => {
    const tanggapan = await request(aplikasi).get('/api');

    expect(tanggapan.status).toBe(200);
    expect(tanggapan.body.status).toBe('sukses');
  });

  it('endpoint kesehatan merespons tanpa terkecuali', async () => {
    const tanggapan = await request(aplikasi).get('/api/kesehatan');

    // Kesehatan selalu mengembalikan status layanan walau database mati
    expect([200, 503]).toContain(tanggapan.status);
    expect(tanggapan.body.status).toBe('sukses');
    expect(['terhubung', 'tidak terhubung']).toContain(
      tanggapan.body.data.database,
    );
  });

  it('rute yang dilindungi menolak pengunjung tanpa token', async () => {
    const tanggapan = await request(aplikasi).get('/api/autentikasi/saya');

    expect(tanggapan.status).toBe(401);
  });

  it('rute yang tidak dikenal dikembalikan sebagai 404', async () => {
    const tanggapan = await request(aplikasi).get('/api/tidak-ada');

    expect(tanggapan.status).toBe(404);
  });
});
