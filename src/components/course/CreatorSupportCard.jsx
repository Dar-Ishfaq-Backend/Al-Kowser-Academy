import { ExternalLink, Youtube } from 'lucide-react';

export default function CreatorSupportCard({
  title = 'Support the Original YouTube Creator',
  description = 'These lessons belong to the original YouTube creator. Please visit the original channel, subscribe, like, and leave a respectful comment so they can keep sharing beneficial knowledge.',
  url,
  linkLabel = 'Open Original Playlist',
}) {
  if (!url) return null;

  return (
    <div className="glass-card border-gold/20 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <Youtube size={20} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-cream">{title}</p>
            <p className="text-xs text-slate-muted leading-relaxed mt-1">
              {description}
            </p>
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="btn-gold inline-flex items-center justify-center gap-2 text-sm"
        >
          <ExternalLink size={14} /> {linkLabel}
        </a>
      </div>
    </div>
  );
}
