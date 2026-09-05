/** Format tanggal yang aman untuk data dari API. */
export function formatTanggal(
  nilai: string | Date | null | undefined,
  opsi: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  if (!nilai) return '-';
  const tanggal = new Date(nilai);
  if (Number.isNaN(tanggal.getTime())) return '-';
  return tanggal.toLocaleDateString('id-ID', opsi);
}

/** Format harga tanpa mengubah nilai kosong menjadi Rp 0. */
export function formatHarga(nilai: number | string | null | undefined): string {
  if (nilai === null || nilai === undefined || nilai === '') return 'Harga belum tersedia';
  const harga = Number(nilai);
  if (!Number.isFinite(harga)) return 'Harga belum tersedia';
  return `Rp ${harga.toLocaleString('id-ID')}`;
}

/** Ambil pesan error API tanpa bergantung pada tipe axios di setiap komponen. */
export function pesanError(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const respons = (error as { response?: { data?: { pesan?: string; detail?: string[] } } }).response;
    if (respons?.data?.pesan) return respons.data.pesan;
    if (respons?.data?.detail?.length) return respons.data.detail.join(', ');
  }
  return fallback;
}