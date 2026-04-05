import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { Button, Input } from '../../components/ui/index.jsx';

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp }            = useAuthStore();
  const navigate              = useNavigate();

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signUp({ email: form.email, password: form.password, name: form.name });
      toast.success('Account created! Check your email to confirm, then sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4 pattern-overlay">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-gold/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green to-gold
            flex items-center justify-center mx-auto mb-4 shadow-gold-lg">
            <span className="font-arabic text-navy text-3xl font-bold">ك</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-gold tracking-wider mb-1">Al Kawser</h1>
          <p className="text-xs text-slate-muted tracking-[0.2em] uppercase">Islamic Learning Platform</p>
        </div>

        <div className="glass-card p-8 border-gold/10 shadow-glass">
          <h2 className="font-display text-lg font-semibold text-cream mb-6">Create Your Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" type="text" icon={User}
              placeholder="Your name" value={form.name} onChange={set('name')} />

            <Input label="Email Address" type="email" icon={Mail}
              placeholder="you@example.com" value={form.email} onChange={set('email')} />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-cream-muted">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted">
                  <Lock size={16} />
                </span>
                <input type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password} onChange={set('password')}
                  className="input-field pl-9 pr-10" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-muted hover:text-cream">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Input label="Confirm Password" type="password" icon={Lock}
              placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} />

            <Button type="submit" loading={loading} className="w-full mt-2" variant="gold">
              {loading ? 'Creating Account…' : 'Create Account'}
            </Button>
          </form>

          <div className="gold-divider mt-6" />

          <p className="text-center text-sm text-slate-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-gold hover:text-gold-light font-semibold">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
