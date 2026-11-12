-- Ensure document objects cannot be downloaded through public Storage URLs.
-- The existing storage.objects policies restrict authenticated access to each
-- user's own folder.
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE
SET public = false;
