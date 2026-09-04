/**
 * Pembantu untuk mengirim tanggapan sukses dengan bentuk yang
 * seragam ke seluruh endpoint. Bentuk tanggapan:
 * { status: 'sukses', pesan: '...', data: {...} }
 */

import type { Response } from 'express';

/** Mengirim tanggapan sukses dengan data dan pesan opsional. */
export function kirimSukses(
  tanggapan: Response,
  data: unknown = null,
  pesan = 'Permintaan berhasil diproses',
  status = 200,
): void {
  tanggapan.status(status).json({
    status: 'sukses',
    pesan,
    data,
  });
}

/** Mengirim tanggapan sukses untuk pembuatan data baru (201). */
export function kirimSuksesDibuat(
  tanggapan: Response,
  data: unknown,
  pesan = 'Data berhasil dibuat',
): void {
  tanggapan.status(201).json({
    status: 'sukses',
    pesan,
    data,
  });
}

/** Mengirim tanggapan sukses tanpa isi data (204). */
export function kirimSuksesTanpaIsi(tanggapan: Response): void {
  tanggapan.status(204).end();
}
