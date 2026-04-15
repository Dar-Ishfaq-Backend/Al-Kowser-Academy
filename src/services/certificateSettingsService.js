import { supabase } from '../lib/supabase';

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
const SETTINGS_TABLE = 'certificate_settings';
const ASSET_BUCKET = 'certificate-assets';

export function isCertificateSetupError(error) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return error?.code === '42P01'
    || message.includes('certificate_settings')
    || message.includes('certificate-assets')
    || message.includes('bucket');
}

export function getCertificateSetupMessage() {
  return 'Certificate settings require the latest Supabase SQL setup (table + storage bucket).';
}

export async function fetchCertificateSettings() {
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select('*')
    .eq('id', SETTINGS_ID)
    .maybeSingle();

  if (error) throw error;
  return data || { id: SETTINGS_ID };
}

export async function upsertCertificateSettings(updates = {}) {
  const payload = {
    id: SETTINGS_ID,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadCertificateAsset(file, type = 'asset') {
  if (!file) throw new Error('Please select a file');

  const ext = (file.name || '').split('.').pop() || 'png';
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const fileName = `${type}-${Date.now()}.${safeExt}`;
  const path = `global/${fileName}`;

  const { error } = await supabase
    .storage
    .from(ASSET_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
