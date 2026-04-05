import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { Button, Input } from '../../components/ui/index.jsx';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn }            = useAuthStore();
  const navigate              = useNavigate();
  const location              = useLocation();
  const from                  = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await signIn({ email: form.email, password: form.password });
      toast.success('Welcome back! 🌙');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4 pattern-overlay">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96
          bg-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64
          bg-gold/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green to-gold
            flex items-center justify-center mx-auto mb-4 shadow-gold-lg">
            <span className="font-arabic text-navy text-3xl font-bold">ك</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-gold tracking-wider mb-1">
            Al Kawser
          </h1>
          <p className="text-xs text-slate-muted tracking-[0.2em] uppercase">
            Islamic Learning Platform
          </p>
          <div className="font-arabic text-cream-muted text-lg mt-3 opacity-70">
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </div>
        </div>

        {/* Card */}
        <div className="glass-card p-8 border-gold/10 shadow-glass">
          <h2 className="font-display text-lg font-semibold text-cream mb-6">
            Sign In to Your Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-cream-muted">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted">
                  <Lock size={16} />
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field pl-9 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-muted hover:text-cream"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link
                  to="/reset-password"
                  className="text-xs text-gold hover:text-gold-light font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full" variant="gold">
              {loading ? 'Signing In…' : 'Sign In'}
            </Button>
          </form>

          <div className="gold-divider mt-6" />

          <p className="text-center text-sm text-slate-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold hover:text-gold-light font-semibold">
              Create Account
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-slate-muted/60 mt-6">
          © {new Date().getFullYear()} Al Kawser · All Rights Reserved
        </p>
      </div>
    </div>
  );
}
