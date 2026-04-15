import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Award, CalendarDays, BookOpen } from 'lucide-react';
import { verifyCertificateById } from '../../services/progressService';
import { LoadingSpinner } from '../../components/ui/index.jsx';

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return value || 'Unknown';
  }
}

export default function VerifyCertificate() {
  const { certificateId = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadVerification() {
      setLoading(true);
      setError('');
      try {
        const data = await verifyCertificateById(certificateId);
        if (!active) return;
        setVerification(data);
      } catch (loadError) {
        if (!active) return;
        console.error(loadError);
        setError(loadError.message || 'Failed to verify certificate');
        setVerification(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (certificateId) {
      loadVerification();
    } else {
      setLoading(false);
      setVerification(null);
      setError('Missing certificate id');
    }

    return () => {
      active = false;
    };
  }, [certificateId]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const isValid = Boolean(verification?.certificate_id);

  return (
    <div className="min-h-screen bg-navy text-cream pattern-overlay flex items-center justify-center p-6">
      <div className="w-full max-w-4xl rounded-[32px] border border-gold/20 bg-navy-dark/85 shadow-glass overflow-hidden">
        <div className="bg-gradient-to-r from-green/20 via-gold/10 to-green/20 px-8 py-10 text-center border-b border-gold/10">
          <p className="font-arabic text-gold text-2xl mb-3">الكوثر</p>
          <h1 className="font-display text-3xl md:text-4xl text-cream">Certificate Verification</h1>
          <p className="text-slate-muted mt-3 text-sm md:text-base">
            Scan result for certificate authenticity at Al Kawser Academy.
          </p>
        </div>

        <div className="p-8 md:p-10 space-y-8">
          <div
            className={`rounded-3xl border p-6 md:p-7 flex items-start gap-4 ${
              isValid
                ? 'border-green/30 bg-green/10'
                : 'border-red-400/25 bg-red-500/10'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isValid ? 'bg-green/20 text-green-light' : 'bg-red-500/15 text-red-300'
              }`}
            >
              {isValid ? <ShieldCheck size={26} /> : <ShieldAlert size={26} />}
            </div>
            <div className="space-y-2">
              <p className={`text-lg font-semibold ${isValid ? 'text-green-light' : 'text-red-200'}`}>
                {isValid ? 'Authentic certificate found' : 'Certificate not verified'}
              </p>
              <p className="text-sm text-slate-muted leading-7">
                {isValid
                  ? 'This certificate record exists in the academy system and matches an issued course completion.'
                  : (error || 'We could not find a matching certificate record for this id.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-navy-border/70 bg-navy/50 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gold mb-3">Certificate ID</p>
              <p className="font-mono text-sm md:text-base text-cream break-all">
                {certificateId}
              </p>
            </div>

            <div className="rounded-3xl border border-navy-border/70 bg-navy/50 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gold mb-3">Issued Date</p>
              <div className="flex items-center gap-3 text-cream">
                <CalendarDays size={18} className="text-gold" />
                <span>{formatDate(verification?.issued_at)}</span>
              </div>
            </div>

            <div className="rounded-3xl border border-navy-border/70 bg-navy/50 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gold mb-3">Student Name</p>
              <div className="flex items-center gap-3 text-cream">
                <Award size={18} className="text-gold" />
                <span>{verification?.student_name || 'Unavailable'}</span>
              </div>
            </div>

            <div className="rounded-3xl border border-navy-border/70 bg-navy/50 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gold mb-3">Course</p>
              <div className="flex items-center gap-3 text-cream">
                <BookOpen size={18} className="text-gold" />
                <span>{verification?.course_title || 'Unavailable'}</span>
              </div>
              {verification?.course_category ? (
                <p className="text-xs text-slate-muted mt-3">{verification.course_category}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gold/10 bg-white/5 px-5 py-4">
            <p className="text-sm text-slate-muted">
              Need to go back to the academy portal?
            </p>
            <Link to="/login" className="btn-gold">
              Open Academy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
