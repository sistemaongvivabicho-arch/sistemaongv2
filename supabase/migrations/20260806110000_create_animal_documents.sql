-- Create animal_documents table
CREATE TABLE IF NOT EXISTS animal_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  custom_name TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  document_date TEXT,
  observation TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE animal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "animal_documents_select" ON animal_documents
  FOR SELECT USING (is_active_collaborator());

CREATE POLICY "animal_documents_insert" ON animal_documents
  FOR INSERT WITH CHECK (is_active_collaborator());

CREATE POLICY "animal_documents_update" ON animal_documents
  FOR UPDATE USING (is_active_collaborator());

CREATE POLICY "animal_documents_delete" ON animal_documents
  FOR DELETE USING (is_admin());

-- Index for faster queries
CREATE INDEX idx_animal_documents_animal_id ON animal_documents(animal_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('animal-documents', 'animal-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "animal_documents_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'animal-documents' AND is_active_collaborator());

CREATE POLICY "animal_documents_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'animal-documents' AND is_active_collaborator());

CREATE POLICY "animal_documents_storage_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'animal-documents' AND is_admin());
