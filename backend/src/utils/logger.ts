/**
 * Pencatat log (logger) aplikasi berbasis pino.
 * Pino dipilih karena sangat ringan dan cepat, cocok untuk
 * menangani traffic yang sangat tinggi.
 */

import pino from 'pino';
import { lingkungan } from '../config/env.js';

// Pencatat log utama aplikasi
export const logger = pino({
  level: lingkungan.LOG_TINGKAT,
  // Tampilan log yang enak dibaca ketika sedang pengembangan
  transport:
    lingkungan.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: false,
            translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
  base: undefined,
});
