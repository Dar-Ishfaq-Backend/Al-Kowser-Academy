export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green to-gold
            flex items-center justify-center shadow-gold-lg">
            <span className="font-arabic text-navy text-2xl font-bold">ك</span>
          </div>
          {spinner}
        </div>
      </div>
    );
  }
  return spinner;
}
