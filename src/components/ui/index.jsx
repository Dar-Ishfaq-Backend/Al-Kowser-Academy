// ─── Button ──────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md',
  className = '', loading = false, ...props }) {

  const variants = {
    primary: 'btn-primary',
    gold:    'btn-gold',
    ghost:   'btn-ghost',
    danger:  'border border-red-500/40 text-red-400 hover:bg-red-500/10 px-6 py-2.5 rounded-xl transition-all duration-200 active:scale-95',
  };
  const sizes = { sm: 'text-sm px-4 py-1.5', md: '', lg: 'text-lg px-8 py-3.5' };

  return (
    <button
      className={`relative inline-flex items-center justify-center gap-2 font-semibold
        ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </span>
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, icon: Icon, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-cream-muted">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted">
            <Icon size={16} />
          </span>
        )}
        <input
          className={`input-field ${Icon ? 'pl-9' : ''} ${error ? 'border-red-500/60 focus:border-red-500' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-cream-muted">{label}</label>
      )}
      <textarea
        className={`input-field resize-none ${error ? 'border-red-500/60' : ''}`}
        rows={4}
        {...props}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-sm font-semibold text-cream-muted">{label}</label>}
      <select className={`input-field ${error ? 'border-red-500/60' : ''}`} {...props}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass-card p-6 ${hover ? 'hover:border-gold/30 hover:shadow-gold transition-all duration-300 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value = 0, label, showPercent = true, height = 'h-2' }) {
  return (
    <div className="space-y-1.5">
      {(label || showPercent) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-xs text-slate-muted">{label}</span>}
          {showPercent && (
            <span className="text-xs font-bold text-gold">{Math.round(value)}%</span>
          )}
        </div>
      )}
      <div className={`progress-track ${height}`}>
        <div
          className="progress-fill"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'gold' }) {
  const v = { gold: 'badge-gold', green: 'badge-green', blue: 'badge-blue' };
  return <span className={v[variant] || 'badge-gold'}>{children}</span>;
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size]} border-2 border-navy-border border-t-gold rounded-full animate-spin`} />
      <span className="text-xs text-slate-muted font-display tracking-widest">Loading…</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-navy flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }
  return spinner;
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-navy-dark/80 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} glass-card border-gold/20 shadow-gold-lg animate-slide-up max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-navy-border">
            <h2 className="font-display text-lg text-cream">{title}</h2>
            <button onClick={onClose} className="text-slate-muted hover:text-cream transition-colors p-1">
              ✕
            </button>
          </div>
        )}
        <div className={title ? 'p-6' : 'p-6'}>{children}</div>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'gold', trend }) {
  const colors = {
    gold:  'text-gold bg-gold/10 border-gold/20',
    green: 'text-green-light bg-green/10 border-green/20',
    blue:  'text-blue-400 bg-blue-500/10 border-blue-500/20',
    red:   'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <Card className="animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-muted text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-cream font-display">{value}</p>
          {trend && <p className="text-xs text-green-light mt-1">{trend}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${colors[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
  );
}

export default { Button, Input, Textarea, Select, Card, ProgressBar, Badge, LoadingSpinner, Modal, StatCard };
