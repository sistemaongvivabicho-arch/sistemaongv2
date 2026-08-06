import { supabase } from '../context/lib/supabase';
import { AnimalDocument } from '../types/animalDocument';

function mapFromDb(row: any): AnimalDocument {
  return {
    id: row.id,
    animalId: row.animal_id,
    documentType: row.document_type,
    customName: row.custom_name,
    fileName: row.file_name,
    filePath: row.file_path,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    documentDate: row.document_date,
    observation: row.observation,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function fetchDocumentsByAnimal(animalId: string): Promise<AnimalDocument[]> {
  const { data, error } = await supabase
    .from('animal_documents')
    .select('*')
    .eq('animal_id', animalId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapFromDb);
}

export async function uploadDocument(
  animalId: string,
  file: File,
  documentType: string,
  customName?: string,
  documentDate?: string,
  observation?: string,
  uploadedBy?: string
): Promise<AnimalDocument> {
  const ext = file.name.split('.').pop() || 'bin';
  const filePath = `${animalId}/${documentType}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('animal-documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from('animal_documents')
    .insert({
      animal_id: animalId,
      document_type: documentType,
      custom_name: customName,
      file_name: file.name,
      file_path: filePath,
      mime_type: file.type,
      file_size: file.size,
      document_date: documentDate,
      observation: observation,
      uploaded_by: uploadedBy
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return mapFromDb(data);
}

export async function updateDocument(
  documentId: string,
  updates: {
    documentType?: string;
    customName?: string;
    documentDate?: string;
    observation?: string;
  }
): Promise<AnimalDocument> {
  const dbUpdates: any = {};
  if (updates.documentType !== undefined) dbUpdates.document_type = updates.documentType;
  if (updates.customName !== undefined) dbUpdates.custom_name = updates.customName;
  if (updates.documentDate !== undefined) dbUpdates.document_date = updates.documentDate;
  if (updates.observation !== undefined) dbUpdates.observation = updates.observation;
  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('animal_documents')
    .update(dbUpdates)
    .eq('id', documentId)
    .select()
    .single();

  if (error) throw error;
  return mapFromDb(data);
}

export async function replaceDocumentFile(
  documentId: string,
  file: File
): Promise<AnimalDocument> {
  const { data: existing, error: fetchError } = await supabase
    .from('animal_documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (fetchError) throw fetchError;

  await supabase.storage.from('animal-documents').remove([existing.file_path]);

  const ext = file.name.split('.').pop() || 'bin';
  const newFilePath = `${existing.animal_id}/${existing.document_type}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('animal-documents')
    .upload(newFilePath, file);

  if (uploadError) throw uploadError;

  const { data, error: updateError } = await supabase
    .from('animal_documents')
    .update({
      file_name: file.name,
      file_path: newFilePath,
      mime_type: file.type,
      file_size: file.size,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)
    .select()
    .single();

  if (updateError) throw updateError;
  return mapFromDb(data);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('animal_documents')
    .select('file_path')
    .eq('id', documentId)
    .single();

  if (fetchError) throw fetchError;

  await supabase.storage.from('animal-documents').remove([existing.file_path]);

  const { error } = await supabase
    .from('animal_documents')
    .delete()
    .eq('id', documentId);

  if (error) throw error;
}

export function getDocumentUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('animal-documents')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function getDocumentSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('animal-documents')
    .createSignedUrl(filePath, 3600);

  if (error) throw error;
  return data.signedUrl;
}
