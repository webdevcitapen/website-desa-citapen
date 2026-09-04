/**
 * Pengujian unit: utilitas paginasi.
 * Memastikan perhitungan halaman, batas, dan lewati benar.
 */

import { describe, expect, it } from 'vitest';
import {
  buatParameterPaginasi,
  hitungTotalHalaman,
} from '../../utils/paginasi.js';
import { KesalahanPermintaan } from '../../utils/kesalahan.js';

describe('utilitas paginasi', () => {
  it('memakai nilai default ketika tidak ada parameter', () => {
    const parameter = buatParameterPaginasi(undefined, undefined);

    expect(parameter.halaman).toBe(1);
    expect(parameter.perHalaman).toBe(10);
    expect(parameter.batas).toBe(10);
    expect(parameter.lewati).toBe(0);
  });

  it('menghitung lewati dengan benar untuk halaman kedua', () => {
    const parameter = buatParameterPaginasi('2', '10');

    expect(parameter.halaman).toBe(2);
    expect(parameter.lewati).toBe(10);
  });

  it('menolak halaman yang bukan bilangan bulat positif', () => {
    expect(() => buatParameterPaginasi('nol', undefined)).toThrow(
      KesalahanPermintaan,
    );
    expect(() => buatParameterPaginasi('0', undefined)).toThrow(
      KesalahanPermintaan,
    );
    expect(() => buatParameterPaginasi('-3', undefined)).toThrow(
      KesalahanPermintaan,
    );
  });

  it('menolak jumlah per halaman yang melebihi batas maksimal', () => {
    expect(() => buatParameterPaginasi('1', '999')).toThrow(
      KesalahanPermintaan,
    );
    expect(() => buatParameterPaginasi('1', '0')).toThrow(
      KesalahanPermintaan,
    );
  });

  it('menghitung total halaman dengan pembulatan ke atas', () => {
    expect(hitungTotalHalaman(0, 10)).toBe(0);
    expect(hitungTotalHalaman(25, 10)).toBe(3);
    expect(hitungTotalHalaman(50, 10)).toBe(5);
  });
});
