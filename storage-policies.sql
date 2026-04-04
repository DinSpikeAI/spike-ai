-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — Storage Bucket Security
-- Run AFTER creating a storage bucket named 'media' in Supabase
-- Dashboard → Storage → New Bucket → Name: media → Public: ON
-- ═══════════════════════════════════════════════════════════════

-- SELECT: Anyone can view files (public bucket)
CREATE POLICY "Public can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- INSERT: Any authenticated user can upload
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );

-- UPDATE: Only admins can update/replace files
CREATE POLICY "Admin can update media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- DELETE: Only admins can delete files
CREATE POLICY "Admin can delete media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- PERMISSIONS SUMMARY:
--   Public (no login):   SELECT only (view/download)
--   Regular user:        SELECT + INSERT (view + upload)
--   Admin:               SELECT + INSERT + UPDATE + DELETE (full)
-- ═══════════════════════════════════════════════════════════════
