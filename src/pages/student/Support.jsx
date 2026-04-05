import { useEffect, useState } from 'react';
import {
  CircleDollarSign,
  ImagePlus,
  LifeBuoy,
  MessageSquareText,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { fetchUserEnrollments } from '../../services/courseService';
import {
  createSupportTicket,
  fetchUserSupportTickets,
  getSupportSetupMessage,
  isSupportSetupError,
} from '../../services/supportService';
import { compressImageFile, formatFileSize } from '../../utils/imageCompression';
import { Button, Card, Input, Select, Textarea, LoadingSpinner } from '../../components/ui/index.jsx';

const CATEGORY_OPTIONS = [
  { value: 'certificate', label: 'Certificate issue' },
  { value: 'payment', label: 'Payment issue' },
  { value: 'course_access', label: 'Course access' },
  { value: 'technical', label: 'Technical problem' },
  { value: 'other', label: 'Other help' },
];

const STATUS_STYLES = {
  open: 'badge-gold',
  in_progress: 'badge-blue',
  resolved: 'badge-green',
};

export default function Support() {
  const { user } = useAuthStore();

  const [enrollments, setEnrollments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [form, setForm] = useState({
    category: 'certificate',
    course_id: '',
    subject: '',
    message: '',
    payment_amount: '',
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  useEffect(() => () => {
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
  }, [screenshotPreview]);

  const loadData = async () => {
    setLoading(true);
    setSetupError('');

    try {
      const [userEnrollments, userTickets] = await Promise.all([
        fetchUserEnrollments(user.id),
        fetchUserSupportTickets(user.id),
      ]);
      setEnrollments(userEnrollments.filter((item) => item.course));
      setTickets(userTickets);
    } catch (err) {
      console.error(err);
      if (isSupportSetupError(err)) {
        setSetupError(getSupportSetupMessage());
      } else {
        toast.error('Failed to load support center');
      }
    } finally {
      setLoading(false);
    }
  };

  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleScreenshotChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file);
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
      setScreenshotFile(compressed);
      setScreenshotPreview(URL.createObjectURL(compressed));
      toast.success(`Screenshot compressed to ${formatFileSize(compressed.size)}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Could not process screenshot');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Please add both a subject and message');
      return;
    }

    setSubmitting(true);

    try {
      const ticket = await createSupportTicket({
        userId: user.id,
        courseId: form.course_id || null,
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
        paymentAmount: form.payment_amount || null,
        attachmentFile: screenshotFile,
      });

      setTickets((prev) => [ticket, ...prev]);
      setForm({
        category: form.category,
        course_id: '',
        subject: '',
        message: '',
        payment_amount: '',
      });
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview('');
      setScreenshotFile(null);
      toast.success('Support request submitted successfully');
    } catch (err) {
      console.error(err);
      toast.error(isSupportSetupError(err) ? getSupportSetupMessage() : (err.message || 'Failed to submit support request'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">Support Center</h1>
        <p className="text-slate-muted text-sm mt-1">
          Report certificate, payment, playlist, or access issues and we will review them from the admin dashboard.
        </p>
      </div>

      {setupError && (
        <Card className="border border-gold/20 bg-gold/5">
          <p className="text-sm text-cream">{setupError}</p>
          <p className="text-xs text-slate-muted mt-2">
            Run the updated Supabase SQL script once, then this support inbox will start working.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green/20 to-gold/20 border border-gold/20 flex items-center justify-center">
              <LifeBuoy size={20} className="text-gold" />
            </div>
            <div>
              <h2 className="font-display text-lg text-cream">Raise a Complaint</h2>
              <p className="text-xs text-slate-muted">
                Screenshots are compressed automatically to roughly 100-180 KB before upload.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Issue Type"
                value={form.category}
                onChange={setField('category')}
                options={CATEGORY_OPTIONS}
              />
              <Select
                label="Related Course"
                value={form.course_id}
                onChange={setField('course_id')}
                options={[
                  { value: '', label: 'No specific course' },
                  ...enrollments.map((enrollment) => ({
                    value: enrollment.course_id,
                    label: enrollment.course.title,
                  })),
                ]}
              />
            </div>

            <Input
              label="Subject"
              placeholder="Short title for your issue"
              value={form.subject}
              onChange={setField('subject')}
            />

            {form.category === 'payment' && (
              <Input
                label="Payment Amount"
                type="number"
                min="0"
                step="1"
                icon={CircleDollarSign}
                placeholder="Enter the amount you paid"
                value={form.payment_amount}
                onChange={setField('payment_amount')}
              />
            )}

            <Textarea
              label="Message"
              rows={6}
              placeholder="Explain the issue clearly so the admin can resolve it faster..."
              value={form.message}
              onChange={setField('message')}
            />

            <div className="space-y-3">
              <label className="text-sm font-semibold text-cream-muted">Screenshot</label>
              <label className="flex items-center gap-3 rounded-2xl border border-dashed border-navy-border hover:border-gold/40 p-4 cursor-pointer transition-all">
                <div className="w-11 h-11 rounded-2xl bg-navy-dark border border-navy-border flex items-center justify-center">
                  <ImagePlus size={18} className="text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-cream">Upload payment proof or error screenshot</p>
                  <p className="text-xs text-slate-muted">
                    JPG and PNG are compressed on the go before they are sent.
                  </p>
                </div>
                <input type="file" accept="image/*" className="sr-only" onChange={handleScreenshotChange} />
              </label>

              {screenshotPreview && (
                <div className="rounded-2xl border border-navy-border overflow-hidden bg-navy-dark">
                  <img src={screenshotPreview} alt="Screenshot preview" className="w-full max-h-72 object-contain" />
                  <div className="px-4 py-3 text-xs text-slate-muted">
                    Ready to upload: {formatFileSize(screenshotFile?.size)}
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" variant="gold" loading={submitting} className="w-full">
              <Send size={16} /> {submitting ? 'Submitting…' : 'Submit Complaint'}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold/20 to-green/20 border border-gold/20 flex items-center justify-center">
              <MessageSquareText size={20} className="text-green-light" />
            </div>
            <div>
              <h2 className="font-display text-lg text-cream">My Requests</h2>
              <p className="text-xs text-slate-muted">Track your latest complaints and responses.</p>
            </div>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-12 text-slate-muted text-sm">
              No support requests yet.
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-2xl border border-navy-border bg-navy-dark/60 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-cream">{ticket.subject}</p>
                      <p className="text-xs text-slate-muted mt-1">
                        {ticket.course?.title || 'General issue'} • {new Date(ticket.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={STATUS_STYLES[ticket.status] || 'badge-gold'}>
                      {ticket.status?.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-sm text-cream-muted leading-relaxed">{ticket.message}</p>

                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="badge-blue">{ticket.category}</span>
                    {ticket.payment_amount ? <span className="badge-gold">Amount ₹{ticket.payment_amount}</span> : null}
                    {ticket.screenshot_url ? (
                      <a
                        href={ticket.screenshot_url}
                        target="_blank"
                        rel="noreferrer"
                        className="badge-green"
                      >
                        View screenshot
                      </a>
                    ) : null}
                  </div>

                  {ticket.admin_response && (
                    <div className="rounded-xl border border-green/20 bg-green/10 p-3">
                      <p className="text-[11px] uppercase tracking-wider text-green-light mb-1">Admin reply</p>
                      <p className="text-sm text-cream-muted">{ticket.admin_response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
