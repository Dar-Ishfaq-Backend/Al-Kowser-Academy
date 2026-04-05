import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseConfigError } from '../lib/supabase';

function requireSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError || 'Supabase is not configured');
  }
  return supabase;
}

function makeSignupClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase Auth is not configured');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function sanitizeProfileUpdates(updates = {}) {
  return {
    ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
    ...(updates.role !== undefined ? { role: updates.role } : {}),
    ...(updates.bio !== undefined ? { bio: updates.bio.trim() || null } : {}),
    ...(updates.avatar_url !== undefined ? { avatar_url: updates.avatar_url.trim() || null } : {}),
    ...(updates.streak !== undefined ? { streak: Math.max(0, Number(updates.streak) || 0) } : {}),
  };
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForProfile(userId, attempts = 12) {
  const client = requireSupabase();

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;

    await wait(250);
  }

  throw new Error('User was created, but the profile record is not ready yet. Please try again in a moment.');
}

export async function fetchAdminUsers() {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateManagedUser(userId, updates) {
  const client = requireSupabase();
  const payload = sanitizeProfileUpdates(updates);

  const { data, error } = await client
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function createManagedUser({ email, password, name, role, bio, avatar_url, streak }) {
  const client = requireSupabase();
  const signupClient = makeSignupClient();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  if (!normalizedEmail) {
    throw new Error('Email is required');
  }

  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (!normalizedName) {
    throw new Error('Name is required');
  }

  const { data: existingProfile, error: existingError } = await client
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingProfile) {
    throw new Error('A user with this email already exists');
  }

  const { data, error } = await signupClient.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: { name: normalizedName },
    },
  });

  if (error) throw error;

  const createdUser = data?.user;
  if (!createdUser?.id) {
    throw new Error('Supabase did not return the created user');
  }

  await signupClient.auth.signOut();
  await waitForProfile(createdUser.id);

  const profile = await updateManagedUser(createdUser.id, {
    name: normalizedName,
    role,
    bio,
    avatar_url,
    streak,
  });

  return {
    profile,
    requiresEmailConfirmation: !data?.session,
  };
}
