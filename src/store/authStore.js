import { create } from 'zustand';
import { supabase, supabaseConfigError } from '../lib/supabase';

const DEFAULT_PUBLIC_SITE_URL = 'https://al-kowser-academy.vercel.app';

function isLocalOrigin(url) {
  if (!url) return false;

  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  } catch {
    return false;
  }
}

function getResetRedirectUrl() {
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin?.trim() : '';
  const publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
  const configured = import.meta.env.VITE_APP_URL?.trim();
  const safeRuntimeOrigin = !isLocalOrigin(runtimeOrigin) ? runtimeOrigin : '';
  const safeConfigured = !isLocalOrigin(configured) ? configured : '';
  const baseUrl =
    publicSiteUrl
    || safeRuntimeOrigin
    || safeConfigured
    || DEFAULT_PUBLIC_SITE_URL
    || configured
    || runtimeOrigin;
  return baseUrl ? `${baseUrl.replace(/\/$/, '')}/reset-password?mode=update` : undefined;
}

function requireSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }
  return supabase;
}

function deferProfileSync(get, userId) {
  window.setTimeout(() => {
    get().fetchProfile(userId).catch((err) => {
      console.error('Deferred profile sync error:', err);
    });
  }, 0);
}

const useAuthStore = create((set, get) => ({
  user:     null,
  profile:  null,
  loading:  true,

  /* ── Initialize on app mount ─────────────── */
  initialize: async () => {
    if (!supabase) {
      set({ loading: false });
      return;
    }

    try {
      const client = requireSupabase();
      const { data: { session } } = await client.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        await get().fetchProfile(session.user.id);
      }
    } catch (err) {
      console.error('Auth init error:', err);
    } finally {
      set({ loading: false });
    }

    // Listen to auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({ user: session.user });
        deferProfileSync(get, session.user.id);
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  /* ── Fetch user profile ───────────────────── */
  fetchProfile: async (userId) => {
    const client = requireSupabase();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) set({ profile: data });
  },

  /* ── Sign up ─────────────────────────────── */
  signUp: async ({ email, password, name }) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    return data;
  },

  /* ── Sign in ─────────────────────────────── */
  signIn: async ({ email, password }) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ user: data.user });
    await get().fetchProfile(data.user.id);
    return data;
  },

  /* ── Forgot / Reset password ─────────────── */
  sendPasswordResetEmail: async (email) => {
    const client = requireSupabase();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: getResetRedirectUrl(),
    });
    if (error) throw error;
  },

  updatePassword: async (password) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.updateUser({ password });
    if (error) throw error;
    set({ user: data.user || get().user });
    return data;
  },

  /* ── Sign out ────────────────────────────── */
  signOut: async (options = {}) => {
    const client = requireSupabase();
    const { error } = await client.auth.signOut(
      options.scope ? { scope: options.scope } : undefined,
    );
    if (error) throw error;
    set({ user: null, profile: null });
  },

  /* ── Update profile ──────────────────────── */
  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;

    const client = requireSupabase();
    const { data, error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (error) throw error;
    set({ profile: data });
    return data;
  },

  /* ── Update streak ───────────────────────── */
  updateStreak: async () => {
    const { profile } = get();
    if (!profile) return;

    const today     = new Date().toISOString().split('T')[0];
    const lastActive = profile.last_active;

    if (lastActive === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = lastActive === yesterday ? (profile.streak || 0) + 1 : 1;

    await get().updateProfile({ streak: newStreak, last_active: today });
  },

  isAdmin: () => get().profile?.role === 'admin',
}));

export default useAuthStore;
