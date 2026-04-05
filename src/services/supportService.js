import { supabase } from '../lib/supabase';

const SUPPORT_BUCKET = 'support-attachments';

function sanitizeName(name = 'attachment') {
  return name.replace(/[^a-z0-9._-]+/gi, '-').replace(/-+/g, '-').toLowerCase();
}

async function getSignedAttachmentUrl(path) {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(SUPPORT_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error('Support attachment URL error:', error);
    return null;
  }

  return data?.signedUrl || null;
}

async function hydrateTicket(ticket) {
  if (!ticket) return ticket;

  return {
    ...ticket,
    screenshot_url: ticket.screenshot_path
      ? await getSignedAttachmentUrl(ticket.screenshot_path)
      : null,
  };
}

async function hydrateTickets(tickets) {
  return Promise.all((tickets || []).map(hydrateTicket));
}

export function isSupportSetupError(error) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return error?.code === '42P01'
    || message.includes('support_tickets')
    || message.includes('support-attachments');
}

export function getSupportSetupMessage() {
  return 'Support tools need the latest Supabase SQL setup before they can work.';
}

export async function createSupportTicket({
  userId,
  courseId,
  category,
  subject,
  message,
  paymentAmount,
  attachmentFile,
}) {
  let screenshotPath = null;

  if (attachmentFile) {
    const ext = attachmentFile.name.split('.').pop() || 'jpg';
    screenshotPath = `${userId}/${Date.now()}-${sanitizeName(subject || attachmentFile.name)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(SUPPORT_BUCKET)
      .upload(screenshotPath, attachmentFile, {
        upsert: false,
        contentType: attachmentFile.type || 'image/jpeg',
      });

    if (uploadError) throw uploadError;
  }

  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: userId,
      course_id: courseId || null,
      category,
      subject,
      message,
      payment_amount: paymentAmount ? Number(paymentAmount) : null,
      screenshot_path: screenshotPath,
    })
    .select(`
      *,
      course:courses(id, title)
    `)
    .single();

  if (error) throw error;
  return hydrateTicket(data);
}

export async function fetchUserSupportTickets(userId) {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(`
      *,
      course:courses(id, title)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return hydrateTickets(data || []);
}

export async function fetchAdminSupportTickets({ limit, status } = {}) {
  let query = supabase
    .from('support_tickets')
    .select(`
      *,
      user:profiles(name, email),
      course:courses(id, title)
    `)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;

  return hydrateTickets(data || []);
}

export async function updateSupportTicket(ticketId, updates) {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (updates.status === 'resolved' && !updates.resolved_at) {
    payload.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('support_tickets')
    .update(payload)
    .eq('id', ticketId)
    .select(`
      *,
      user:profiles(name, email),
      course:courses(id, title)
    `)
    .single();

  if (error) throw error;
  return hydrateTicket(data);
}

export async function deleteSupportTicket(ticketOrId) {
  const ticketId = typeof ticketOrId === 'string' ? ticketOrId : ticketOrId?.id;
  let screenshotPath = typeof ticketOrId === 'object' ? ticketOrId?.screenshot_path : null;

  if (!ticketId) {
    throw new Error('Support ticket id is required');
  }

  if (!screenshotPath) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('id, screenshot_path')
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    screenshotPath = data?.screenshot_path || null;
  }

  if (screenshotPath) {
    const { error: storageError } = await supabase.storage
      .from(SUPPORT_BUCKET)
      .remove([screenshotPath]);

    if (storageError) throw storageError;
  }

  const { error } = await supabase
    .from('support_tickets')
    .delete()
    .eq('id', ticketId);

  if (error) throw error;
  return true;
}
