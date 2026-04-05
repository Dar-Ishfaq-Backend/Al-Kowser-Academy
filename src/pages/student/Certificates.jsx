import { useEffect, useState } from 'react';
import { Award, Download, Calendar, HeartHandshake, IndianRupee, LifeBuoy } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { fetchUserCertificates } from '../../services/progressService';
import { generateCertificatePng, downloadCertificate } from '../../services/certificateService';
import { LoadingSpinner, Card } from '../../components/ui/index.jsx';
import toast from 'react-hot-toast';

const DONATION_AMOUNTS = [100, 200, 350, 500, 800, 1000];

function buildUpiLink(amount) {
  const params = new URLSearchParams({
    pa: 'mohdashfaq1416-1@okicici',
    pn: 'Ishfaq Dar',
    am: String(amount),
    cu: 'INR',
    tn: 'Support Al Kawser LMS',
  });

  return `upi://pay?${params.toString()}`;
}

export default function Certificates() {
  const { user, profile }          = useAuthStore();
  const [certs, setCerts]          = useState([]);
  const [loading, setLoading]      = useState(true);
  const [downloading, setDownload] = useState('');

  useEffect(() => {
    if (user) fetchUserCertificates(user.id).then(setCerts).finally(() => setLoading(false));
  }, [user]);

  const handleDownload = async (cert) => {
    setDownload(cert.id);
    try {
      const png = await generateCertificatePng({
        studentName:   profile?.name || 'Student',
        courseName:    cert.course?.title || 'Islamic Studies',
        certificateId: cert.certificate_id,
        completionDate: cert.issued_at,
        category:      cert.course?.category,
      });
      downloadCertificate(png, `AlKawser-Cert-${cert.certificate_id}.png`);
      toast.success('Certificate downloaded!');
    } catch (err) {
      toast.error('Failed to generate certificate');
    } finally {
      setDownload('');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">My Certificates</h1>
        <p className="text-slate-muted text-sm mt-1">
          Certificates of completion from your Islamic studies
        </p>
      </div>

      <Card className="overflow-hidden border-gold/20">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-center">
          <div className="space-y-3">
            <div className="rounded-[2rem] border border-gold/20 bg-white p-4 shadow-gold">
              <img
                src="/upi-qr.jpeg"
                alt="Support Al Kawser with UPI"
                className="w-full rounded-[1.5rem] object-cover"
              />
            </div>
            <p className="text-center text-xs text-slate-muted">
              Scan the QR above with any UPI app
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold/20 to-green/20 border border-gold/20 flex items-center justify-center">
                <HeartHandshake size={21} className="text-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gold uppercase tracking-[0.2em]">Support The Mission</p>
                <h2 className="font-display text-2xl text-cream">Help Another Student Learn</h2>
              </div>
            </div>

            <p className="text-sm text-cream-muted leading-relaxed">
              If Al Kawser has benefited you, please help us keep Islamic education, certificates, student support, and course hosting available for the next learner. Even a small contribution can sponsor real progress for someone else.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DONATION_AMOUNTS.map((amount) => (
                <a
                  key={amount}
                  href={buildUpiLink(amount)}
                  className="rounded-2xl border border-gold/20 bg-gold/10 hover:bg-gold/20 transition-all px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold text-cream"
                >
                  <IndianRupee size={15} className="text-gold" />
                  {amount}
                </a>
              ))}
            </div>

            <div className="rounded-2xl border border-green/20 bg-green/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cream">Need help with a certificate or payment?</p>
                <p className="text-xs text-slate-muted mt-1">
                  Send a complaint with screenshot proof and the admin can review it from the dashboard.
                </p>
              </div>
              <Link to="/support" className="btn-ghost inline-flex items-center justify-center gap-2 text-sm">
                <LifeBuoy size={15} /> Open Support
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {certs.length === 0 ? (
        <Card className="text-center py-20 border-dashed">
          <Award size={48} className="text-navy-border mx-auto mb-4" />
          <h3 className="font-display text-lg text-cream mb-2">No Certificates Yet</h3>
          <p className="text-slate-muted text-sm max-w-xs mx-auto">
            Complete a course to earn your certificate of achievement.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {certs.map(cert => (
            <div key={cert.id}
              className="glass-card overflow-hidden hover:border-gold/30 hover:shadow-gold transition-all duration-300">

              {/* Certificate preview banner */}
              <div className="relative h-32 bg-gradient-to-br from-navy-dark via-navy to-green/20
                flex items-center justify-center border-b border-navy-border overflow-hidden pattern-overlay">
                <div className="absolute inset-0 bg-geometric opacity-20" />
                <div className="relative text-center">
                  <p className="font-arabic text-gold text-lg mb-1">الكوثر</p>
                  <p className="font-display text-xs tracking-[0.3em] text-cream-muted uppercase">
                    Certificate of Completion
                  </p>
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-2" />
                </div>

                {/* Corner ornaments */}
                <div className="absolute top-2 left-2 w-6 h-6 border-l border-t border-gold/30" />
                <div className="absolute top-2 right-2 w-6 h-6 border-r border-t border-gold/30" />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-l border-b border-gold/30" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-r border-b border-gold/30" />
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-display text-sm font-semibold text-cream">
                    {cert.course?.title}
                  </h3>
                  <p className="text-xs text-slate-muted mt-0.5">{cert.course?.category}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-muted">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(cert.issued_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                  <span className="font-mono text-[10px] text-gold/70">
                    {cert.certificate_id}
                  </span>
                </div>

                <button
                  onClick={() => handleDownload(cert)}
                  disabled={downloading === cert.id}
                  className="btn-gold w-full text-sm flex items-center justify-center gap-2"
                >
                  {downloading === cert.id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <><Download size={15} /> Download PNG</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
