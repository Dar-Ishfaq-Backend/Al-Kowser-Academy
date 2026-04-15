import { useEffect, useMemo, useState } from 'react';
import { Award, Download, Upload, ShieldCheck, BadgeCheck, FileImage } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { fetchAllCoursesAdmin, fetchCourseById, enrollInCourse } from '../../services/courseService';
import { fetchUserCertificates, issueCertificate, markCourseCompleteForUser } from '../../services/progressService';
import { generateCertificatePdf, generateCertificatePng, downloadCertificate } from '../../services/certificateService';
import {
  fetchCertificateSettings,
  getCertificateSetupMessage,
  isCertificateSetupError,
  upsertCertificateSettings,
  uploadCertificateAsset,
} from '../../services/certificateSettingsService';
import { compressImageFile, formatFileSize } from '../../utils/imageCompression';
import { Card, LoadingSpinner } from '../../components/ui/index.jsx';
import CertificateCanvas, {
  CERTIFICATE_HEIGHT,
  CERTIFICATE_WIDTH,
} from '../../components/certificates/CertificateCanvas';

const ASSETS = [
  { key: 'logo_url', label: 'Logo', hint: 'Shown at the top-left of every certificate.' },
  { key: 'seal_url', label: 'Seal', hint: 'Displayed in the center badge area.' },
  { key: 'signature_url', label: 'Signature', hint: 'Appears above the signature line.' },
];

const ADMIN_PREVIEW_SCALE = 0.42;

export default function AdminCertificates() {
  const { user, profile } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [settingsReady, setSettingsReady] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [previewUrl, setPreviewUrl] = useState('');
  const [downloadFormat, setDownloadFormat] = useState('png');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [allCourses, certs] = await Promise.all([
          fetchAllCoursesAdmin(),
          fetchUserCertificates(user.id),
        ]);
        setCourses(allCourses || []);
        setCertificates(certs || []);
        setSelectedCourseId(allCourses?.[0]?.id || '');
      } catch (error) {
        console.error(error);
        toast.error('Failed to load courses');
      }

      try {
        const certSettings = await fetchCertificateSettings();
        setSettings(certSettings || {});
        setSettingsReady(true);
      } catch (error) {
        console.error(error);
        if (isCertificateSetupError(error)) {
          setSettingsReady(false);
          toast.error(getCertificateSetupMessage());
        } else {
          toast.error('Failed to load certificate settings');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  );

  const previewPayload = useMemo(() => ({
    studentName: profile?.name || 'Admin',
    courseName: selectedCourse?.title || 'Select a course',
    certificateId: 'PREVIEW-ALKAWSER',
    completionDate: new Date().toISOString(),
    category: selectedCourse?.category || 'Islamic Studies',
    logoUrl: settings.logo_url,
    sealUrl: settings.seal_url,
    signatureUrl: settings.signature_url,
  }), [profile?.name, selectedCourse?.category, selectedCourse?.title, settings.logo_url, settings.seal_url, settings.signature_url]);

  const handleUpload = async (field, file) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, [field]: true }));
    try {
      const compressed = await compressImageFile(file, {
        minSizeKB: 25,
        maxSizeKB: 180,
        targetSizeKB: 90,
        maxDimension: 1400,
      });
      const assetUrl = await uploadCertificateAsset(compressed, field.replace('_url', ''));
      const next = await upsertCertificateSettings({
        ...settings,
        [field]: assetUrl,
      });
      setSettings(next);
      toast.success(`${field.replace('_url', '')} updated`);
    } catch (error) {
      console.error(error);
      if (isCertificateSetupError(error)) {
        toast.error(getCertificateSetupMessage());
      } else {
        toast.error(error.message || 'Failed to upload image');
      }
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleRemove = async (field) => {
    setSaving(true);
    try {
      const next = await upsertCertificateSettings({
        ...settings,
        [field]: '',
      });
      setSettings(next);
      toast.success('Removed');
    } catch (error) {
      console.error(error);
      if (isCertificateSetupError(error)) {
        toast.error(getCertificateSetupMessage());
      } else {
        toast.error('Failed to update settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedCourse || !profile) return;
    setSaving(true);
    try {
      const png = await generateCertificatePng({
        studentName: profile.name || 'Admin',
        courseName: selectedCourse.title,
        certificateId: 'PREVIEW-ALKAWSER',
        completionDate: new Date().toISOString(),
        category: selectedCourse.category,
        logoUrl: settings.logo_url,
        sealUrl: settings.seal_url,
        signatureUrl: settings.signature_url,
      });
      setPreviewUrl(png);
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate preview');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!user || !selectedCourseId) return;
    setSaving(true);
    try {
      await enrollInCourse(user.id, selectedCourseId);
      const course = await fetchCourseById(selectedCourseId);
      await markCourseCompleteForUser(user.id, course);
      await issueCertificate(user.id, selectedCourseId);
      const updated = await fetchUserCertificates(user.id);
      setCertificates(updated);
      toast.success('Course completed and certificate issued');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to mark course complete');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (cert) => {
    if (!profile) return;
    try {
      const payload = {
        studentName: profile?.name || 'Admin',
        courseName: cert.course?.title || 'Course',
        certificateId: cert.certificate_id,
        completionDate: cert.issued_at,
        category: cert.course?.category,
        logoUrl: settings.logo_url,
        sealUrl: settings.seal_url,
        signatureUrl: settings.signature_url,
      };

      if (downloadFormat === 'pdf') {
        const pdfBlob = await generateCertificatePdf(payload);
        downloadCertificate(pdfBlob, `AlKawser-Cert-${cert.certificate_id}.pdf`);
      } else {
        const png = await generateCertificatePng(payload);
        downloadCertificate(png, `AlKawser-Cert-${cert.certificate_id}.png`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate certificate');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-slate-muted text-sm mb-1">Admin Panel</p>
        <h1 className="font-display text-2xl font-bold text-cream">Certificates</h1>
        <p className="text-slate-muted text-sm mt-1">
          Upload logos, seals, and signatures, then preview or issue certificates instantly.
        </p>
      </div>

      {!settingsReady && (
        <Card className="p-6 border-gold/30 bg-gold/10">
          <p className="text-sm font-semibold text-gold">Certificate setup required</p>
          <p className="text-xs text-slate-muted mt-2">
            Run the latest Supabase SQL to create <code>certificate_settings</code> and the
            <code>certificate-assets</code> storage bucket. Then refresh this page.
          </p>
        </Card>
      )}

      <Card className={`p-6 space-y-6 ${!settingsReady ? 'opacity-60 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Upload size={18} className="text-gold" />
          </div>
          <div>
            <p className="text-sm font-semibold text-cream">Certificate Assets</p>
            <p className="text-xs text-slate-muted">Upload optional images used on every certificate.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ASSETS.map((asset) => {
            const url = settings?.[asset.key];
            return (
              <div key={asset.key} className="rounded-2xl border border-navy-border/70 bg-navy-dark/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-cream">{asset.label}</p>
                    <p className="text-[11px] text-slate-muted">{asset.hint}</p>
                  </div>
                  <FileImage size={18} className="text-gold/70" />
                </div>

                <div className="rounded-xl border border-white/10 bg-navy-dark/60 p-3 flex items-center justify-center min-h-[110px]">
                  {url ? (
                    <img src={url} alt={asset.label} className="max-h-[90px] object-contain" />
                  ) : (
                    <p className="text-xs text-slate-muted">No image uploaded</p>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleUpload(asset.key, event.target.files?.[0])}
                    className="text-xs text-slate-muted"
                    disabled={uploading[asset.key]}
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-muted">
                    <span>Auto-compresses to ~{formatFileSize(90 * 1024)}</span>
                    {url && (
                      <button
                        onClick={() => handleRemove(asset.key)}
                        className="text-xs text-red-300 hover:text-red-200"
                        disabled={saving}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green/10 border border-green/20 flex items-center justify-center">
            <ShieldCheck size={18} className="text-green-light" />
          </div>
          <div>
            <p className="text-sm font-semibold text-cream">Admin Preview Tools</p>
            <p className="text-xs text-slate-muted">
              Mark lessons complete and issue a certificate so you can preview it immediately.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_200px_200px] gap-3">
          <select
            value={selectedCourseId}
            onChange={(event) => setSelectedCourseId(event.target.value)}
            className="input-field"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>

          <button
            onClick={handlePreview}
            className="btn-ghost flex items-center justify-center gap-2"
            disabled={!selectedCourseId || saving}
          >
            <BadgeCheck size={16} /> Generate PNG Preview
          </button>

          <button
            onClick={handleMarkComplete}
            className="btn-gold flex items-center justify-center gap-2"
            disabled={!selectedCourseId || saving}
          >
            <Award size={16} /> Issue Certificate
          </button>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-navy-dark/70 p-4 space-y-3 overflow-x-auto">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gold uppercase tracking-[0.2em]">Live Preview</p>
            <p className="text-[11px] text-slate-muted">
              This updates directly from the current certificate layout and selected course.
            </p>
          </div>
          <div
            className="mx-auto origin-top-left"
            style={{
              width: `${CERTIFICATE_WIDTH * ADMIN_PREVIEW_SCALE}px`,
              height: `${CERTIFICATE_HEIGHT * ADMIN_PREVIEW_SCALE}px`,
            }}
          >
            <div
              style={{
                width: `${CERTIFICATE_WIDTH}px`,
                height: `${CERTIFICATE_HEIGHT}px`,
                transform: `scale(${ADMIN_PREVIEW_SCALE})`,
                transformOrigin: 'top left',
              }}
            >
              <CertificateCanvas {...previewPayload} />
            </div>
          </div>
        </div>

        {previewUrl && (
          <div className="rounded-2xl border border-gold/20 bg-navy-dark/70 p-4">
            <p className="text-xs text-gold uppercase tracking-[0.2em] mb-3">Generated PNG Preview</p>
            <img src={previewUrl} alt="Certificate preview" className="w-full rounded-xl" />
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Award size={18} className="text-blue-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-cream">Issued Certificates</p>
            <p className="text-xs text-slate-muted">Your admin certificates for quick downloads.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-muted">
          <span className="uppercase tracking-[0.2em]">Download as</span>
          <select
            value={downloadFormat}
            onChange={(event) => setDownloadFormat(event.target.value)}
            className="input-field !py-1 !text-xs max-w-[140px]"
          >
            <option value="png">PNG</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        {certificates.length === 0 ? (
          <div className="rounded-2xl border border-navy-border/70 bg-navy-dark/60 p-6 text-center text-sm text-slate-muted">
            No certificates issued yet. Use the tools above to generate one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="rounded-2xl border border-navy-border/70 bg-navy-dark/60 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-cream">{cert.course?.title}</p>
                  <p className="text-[11px] text-slate-muted">{cert.course?.category}</p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-muted">
                  <span>{new Date(cert.issued_at).toLocaleDateString('en-GB')}</span>
                  <span className="font-mono text-gold/70">{cert.certificate_id}</span>
                </div>
                <button
                  onClick={() => handleDownload(cert)}
                  className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
                >
                  <Download size={15} /> Download PNG
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
