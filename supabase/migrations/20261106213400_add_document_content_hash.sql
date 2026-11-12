ALTER TABLE public.documents
ADD COLUMN content_hash text;

ALTER TABLE public.documents
ADD CONSTRAINT documents_content_hash_sha256_format
CHECK (content_hash IS NULL OR content_hash ~ '^[0-9a-f]{64}$');

CREATE UNIQUE INDEX documents_user_content_hash_unique
ON public.documents (user_id, content_hash)
WHERE content_hash IS NOT NULL;
