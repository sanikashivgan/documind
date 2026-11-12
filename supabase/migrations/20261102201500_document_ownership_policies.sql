-- Assumes public.documents exists with a UUID user_id column and the
-- "documents" Storage bucket already exists.
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documind_documents_select_own" ON public.documents;
DROP POLICY IF EXISTS "documind_documents_insert_own" ON public.documents;
DROP POLICY IF EXISTS "documind_documents_update_own" ON public.documents;
DROP POLICY IF EXISTS "documind_documents_delete_own" ON public.documents;
DROP POLICY IF EXISTS "documind_documents_owner_guard" ON public.documents;

CREATE POLICY "documind_documents_select_own"
ON public.documents
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "documind_documents_insert_own"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "documind_documents_update_own"
ON public.documents
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "documind_documents_delete_own"
ON public.documents
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- This restrictive guard prevents any broader permissive table policy from
-- granting access to another user's documents.
CREATE POLICY "documind_documents_owner_guard"
ON public.documents
AS RESTRICTIVE
FOR ALL
TO public
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "documind_documents_storage_select_own" ON storage.objects;
DROP POLICY IF EXISTS "documind_documents_storage_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "documind_documents_storage_update_own" ON storage.objects;
DROP POLICY IF EXISTS "documind_documents_storage_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "documind_documents_storage_owner_guard" ON storage.objects;

CREATE POLICY "documind_documents_storage_select_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

CREATE POLICY "documind_documents_storage_insert_own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

CREATE POLICY "documind_documents_storage_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

CREATE POLICY "documind_documents_storage_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- Leave other buckets unchanged while preventing broad policies from
-- granting cross-user access to objects in the "documents" bucket.
CREATE POLICY "documind_documents_storage_owner_guard"
ON storage.objects
AS RESTRICTIVE
FOR ALL
TO public
USING (
  bucket_id <> 'documents'
  OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
)
WITH CHECK (
  bucket_id <> 'documents'
  OR (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
