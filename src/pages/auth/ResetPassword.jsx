import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Button, Input, LoadingSpinner } from '../../components/ui/index.jsx';

function getHashParams(hash) {
  return new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
}

function clearRecoveryTokensFromUrl() {
  if (typeof window === 'undefined') return;
  const cleanUrl = `${window.location.origin}${window.location.pathname}?mode=update`;
  window.history.replaceState({}, document.title, cleanUrl);
}

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sendPasswordResetEmail, updatePassword, signOut } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const hashParams = useMemo(() => getHashParams(location.hash), [location.hash]);
  const wantsPasswordUpdate = (
    searchParams.get('mode') === 'update'
    || searchParams.get('type') === 'recovery'
    || hashParams.get('type') === 'recovery'
    || searchParams.has('code')
    || searchParams.has('token_hash')
    || hashParams.has('access_token')
  );

  useEffect(() => {
    let active = true;

    async function resolveRecoverySession() {
      if (!wantsPasswordUpdate || !supabase) {
        if (active) {
          setRecoveryReady(false);
          setCheckingRecovery(false);
        }
        return;
      }

      try {
        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');
        const recoveryType = searchParams.get('type') || hashParams.get('type');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          clearRecoveryTokensFromUrl();
        } else if (tokenHash && recoveryType === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (error) throw error;
          clearRecoveryTokensFromUrl();
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (active) {
          setRecoveryReady(Boolean(session?.user));
        }
      } catch (err) {
        console.error('Password recovery session error:', err);
        if (active) setRecoveryReady(false);
      } finally {
        if (active) setCheckingRecovery(false);
      }
    }

    resolveRecoverySession();

    const subscription = supabase?.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setRecoveryReady(Boolean(session?.user));
        setCheckingRecovery(false);
      }
    }).data.subscription;

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [hashParams, searchParams, wantsPasswordUpdate]);

  const handleSendReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(email.trim());
      toast.success('Password reset email sent. Check your inbox.');
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!password || !confirm) {
      toast.error('Please fill in both password fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      await signOut();
      toast.success('Password updated. Please sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (checkingRecovery) {
    return <LoadingSpinner fullScreen />;
  }

  const showUpdateForm = wantsPasswordUpdate && recoveryReady;
  const showRecoveryExpired = wantsPasswordUpdate && !recoveryReady;

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4 pattern-overlay">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-muted hover:text-cream transition-colors mb-6"
        >
          <ArrowLeft size={15} /> Back to Sign In
        </Link>

        <div className="glass-card p-8 border-gold/10 shadow-glass">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green to-gold flex items-center justify-center mx-auto mb-4 shadow-gold-lg">
              <span className="font-arabic text-navy text-3xl font-bold">ك</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-gold">
              {showUpdateForm ? 'Set New Password' : 'Forgot Password'}
            </h1>
            <p className="text-sm text-slate-muted mt-2 leading-relaxed">
              {showUpdateForm
                ? 'Choose a new password for your Al Kawser account.'
                : 'Enter your email and we will send you a secure password reset link.'}
            </p>
          </div>

          {showRecoveryExpired ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                This recovery link is invalid or has expired. Request a fresh reset email below.
              </div>

              <form onSubmit={handleSendReset} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  icon={Mail}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <Button type="submit" loading={loading} className="w-full" variant="gold">
                  {loading ? 'Sending…' : 'Send New Reset Link'}
                </Button>
              </form>
            </div>
          ) : showUpdateForm ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-cream-muted">New Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="input-field pl-9 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-muted hover:text-cream"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Input
                label="Confirm New Password"
                type={showPw ? 'text' : 'password'}
                icon={KeyRound}
                placeholder="Repeat your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />

              <Button type="submit" loading={loading} className="w-full" variant="gold">
                {loading ? 'Updating…' : 'Update Password'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSendReset} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <Button type="submit" loading={loading} className="w-full" variant="gold">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
