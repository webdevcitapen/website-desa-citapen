-- =====================================================================
-- MIGRASI PERBAIKAN 2025-09-05
-- Memperbaiki 4 isu:
-- 1. Tabel berita kolom kategori belum ada -> tambah kategori VARCHAR(50) DEFAULT 'Umum'
-- 2. Validasi kategori produk masih nullable -> perbaiki NULL lama & set NOT NULL
-- 3. (Tidak ada migrasi skema untuk struktur fallback - hanya logika API)
-- 4. (Guard form - hanya backend ETag, tidak perlu migrasi)
--
-- Cara pakai (lokal psql):
--   psql -U hafizhtux -d desa_citapen -f database/migrasi-2025-09-05-perbaikan.sql
--
-- Cara pakai (Supabase SQL Editor):
--   Copy-paste seluruh isi file ini ke SQL Editor lalu Run.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. BERITA: tambah kolom kategori jika belum ada
-- ---------------------------------------------------------------------
ALTER TABLE public.berita
  ADD COLUMN IF NOT EXISTS kategori VARCHAR(50) DEFAULT 'Umum' NOT NULL;

-- Jika kolom sudah ada tetapi masih nullable / tanpa default, perbaiki:
-- (IF NOT EXISTS di atas tidak mengubah constraint jika kolom sudah ada)
DO $$
BEGIN
  -- Pastikan default 'Umum' ada
  BEGIN
    ALTER TABLE public.berita ALTER COLUMN kategori SET DEFAULT 'Umum';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Gagal set default kategori berita - mungkin kolom belum ada';
  END;

  -- Isi NULL lama dengan 'Umum' jika ada
  BEGIN
    UPDATE public.berita SET kategori = 'Umum' WHERE kategori IS NULL;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Gagal update kategori NULL pada berita';
  END;

  -- Pastikan NOT NULL (jika masih nullable)
  BEGIN
    ALTER TABLE public.berita ALTER COLUMN kategori SET NOT NULL;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Gagal SET NOT NULL kategori berita - cek data NULL masih ada';
  END;

  -- Tambahkan CHECK constraint untuk kategori valid (hapus dulu jika ada duplikat)
  BEGIN
    ALTER TABLE public.berita DROP CONSTRAINT IF EXISTS berita_kategori_check;
    ALTER TABLE public.berita
      ADD CONSTRAINT berita_kategori_check
      CHECK (kategori IN ('Umum','Infrastruktur','Kesehatan','Pendidikan','Pertanian','Ekonomi','Sosial','Budaya'));
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Gagal tambah check constraint kategori berita';
  END;
END $$;

-- Index untuk filter kategori berita
CREATE INDEX IF NOT EXISTS idx_berita_kategori ON public.berita (kategori);
CREATE INDEX IF NOT EXISTS idx_berita_dibuat_pada ON public.berita (dibuat_pada DESC);
CREATE INDEX IF NOT EXISTS idx_berita_penulis ON public.berita (penulis_id);

-- ---------------------------------------------------------------------
-- 2. PRODUK: perbaiki kategori_id yang masih NULL
-- ---------------------------------------------------------------------

-- Pastikan kategori default "Umum" ada untuk setiap admin
-- (Jika belum ada, buat kategori Umum milik admin pertama)
INSERT INTO public.kategori_produk (nama, pemilik_id)
SELECT 'Umum', pengguna.id
FROM public.pengguna
WHERE pengguna.peran = 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM public.kategori_produk kategori
    WHERE kategori.nama = 'Umum'
      AND kategori.pemilik_id = pengguna.id
  )
ORDER BY pengguna.id
LIMIT 1;

-- Jika tidak ada admin (edge case), coba buat dengan pemilik_id = 1
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.kategori_produk WHERE LOWER(nama) = 'umum') THEN
    BEGIN
      INSERT INTO public.kategori_produk (nama, pemilik_id)
      VALUES ('Umum', (SELECT id FROM public.pengguna ORDER BY id LIMIT 1))
      ;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Gagal membuat kategori Umum fallback tanpa admin';
    END;
  END IF;
END $$;

-- Ambil id kategori Umum sebagai fallback (ambil yang pertama)
DO $$
DECLARE
  id_umum BIGINT;
BEGIN
  SELECT id INTO id_umum FROM public.kategori_produk WHERE LOWER(nama) = 'umum' ORDER BY id LIMIT 1;
  IF id_umum IS NULL THEN
    RAISE NOTICE 'Tidak ada kategori Umum ditemukan, lewati backfill produk';
  ELSE
    -- Backfill produk yang kategori_id NULL
    UPDATE public.produk SET kategori_id = id_umum WHERE kategori_id IS NULL;
    RAISE NOTICE 'Berhasil backfill produk NULL ke kategori Umum id=%', id_umum;
  END IF;
END $$;

-- Ubah foreign key dari SET NULL ke RESTRICT (agar NOT NULL konsisten)
-- Hapus constraint lama jika ada, lalu buat ulang dengan RESTRICT
DO $$
BEGIN
  -- Hapus constraint lama jika bertipe SET NULL
  BEGIN
    ALTER TABLE public.produk DROP CONSTRAINT IF EXISTS produk_kategori_id_fkey;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Gagal drop FK produk_kategori_id_fkey';
  END;
  -- Buat ulang FK dengan RESTRICT
  BEGIN
    ALTER TABLE public.produk
      ADD CONSTRAINT produk_kategori_id_fkey
      FOREIGN KEY (kategori_id) REFERENCES public.kategori_produk(id) ON DELETE RESTRICT;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Gagal add FK produk_kategori_id_fkey RESTRICT - mungkin data masih NULL';
  END;
END $$;

-- Jadikan kategori_id NOT NULL setelah backfill
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.produk ALTER COLUMN kategori_id SET NOT NULL;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Gagal SET NOT NULL kategori_id produk - masih ada NULL?';
  END;
END $$;

-- Pastikan index kategori ada
CREATE INDEX IF NOT EXISTS idx_produk_kategori ON public.produk (kategori_id);
CREATE INDEX IF NOT EXISTS idx_produk_pemilik ON public.produk (pemilik_id);
CREATE INDEX IF NOT EXISTS idx_produk_umkm ON public.produk (umkm_id);
CREATE INDEX IF NOT EXISTS idx_produk_dibuat_pada ON public.produk (dibuat_pada DESC);

COMMIT;

-- ---------------------------------------------------------------------
-- SELESAI - Verifikasi
-- ---------------------------------------------------------------------
-- Jalankan query verifikasi setelah migrasi:
-- SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name='berita' AND column_name='kategori';
-- SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='produk' AND column_name='kategori_id';
-- SELECT COUNT(*) AS produk_null FROM produk WHERE kategori_id IS NULL; -- harus 0
-- SELECT COUNT(*) AS berita_null_kategori FROM berita WHERE kategori IS NULL; -- harus 0
-- SELECT * FROM berita LIMIT 3;
-- SELECT * FROM produk LIMIT 3;
