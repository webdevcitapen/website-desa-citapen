/**
 * Pengujian asap (smoke test).
 * Pemeriksaan paling dasar setelah server dinyalakan: aplikasi
 * dapat dirakit, merespons permintaan, dan melindungi rute privat.
 * Pengujian ini tidak membutuhkan database.
 */

import { describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import { buatAplikasi } from '../../app.js';

describe('pengujian asap', () => {
  it('aplikasi dapat dirakit tanpa kesalahan', () => {
    const aplikasi = buatAplikasi();
    expect(aplikasi).toBeDefined();
  });

  it('server merespons permintaan kesehatan', async () => {
    const aplikasi: Application = buatAplikasi();

    const tanggapan = await request(aplikasi).get('/api/kesehatan');

    expect(tanggapan.status).toBeGreaterThanOrEqual(200);
    expect(tanggapan.status).toBeLessThanOrEqual(503);
  });

  it('rute utama menampilkan nama layanan', async () => {
    const aplikasi: Application = buatAplikasi();

    const tanggapan = await request(aplikasi).get('/api');

    expect(tanggapan.status).toBe(200);
    expect(tanggapan.body.data.nama).toContain('citapen');
  });

  it('rute privat menolak permintaan tanpa autentikasi', async () => {
    const aplikasi: Application = buatAplikasi();

    const tanggapan = await request(aplikasi).get('/api/autentikasi/saya');

    expect(tanggapan.status).toBe(401);
  });
});
