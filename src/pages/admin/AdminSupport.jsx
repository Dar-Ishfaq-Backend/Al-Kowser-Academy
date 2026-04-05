import { useEffect, useMemo, useState } from 'react';
import {
  Filter,
  Image as ImageIcon,
  LifeBuoy,
  Mail,
  Save,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  deleteSupportTicket,
  fetchAdminSupportTickets,
  getSupportSetupMessage,
  isSupportSetupError,
  updateSupportTicket,
} from '../../services/supportService';
import { Button, Card, LoadingSpinner, Modal, Select, Textarea } from '../../components/ui/index.jsx';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const STATUS_STYLES = {
  open: 'badge-gold',
  in_progress: 'badge-blue',
  resolved: 'badge-green',
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [setupError, setSetupError] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    setSetupError('');

    try {
      const data = await fetchAdminSupportTickets();
      setTickets(data);
      setDrafts(
        Object.fromEntries(data.map((ticket) => [
          ticket.id,
          {
            status: ticket.status,
            admin_response: ticket.admin_response || '',
          },
        ])),
      );
    } catch (err) {
      console.error(err);
      if (isSupportSetupError(err)) {
        setSetupError(getSupportSetupMessage());
      } else {
        toast.error('Failed to load support requests');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = useMemo(() => (
    statusFilter === 'all'
      ? tickets
      : tickets.filter((ticket) => ticket.status === statusFilter)
  ), [statusFilter, tickets]);

  const counts = useMemo(() => (
    tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, { open: 0, in_progress: 0, resolved: 0 })
  ), [tickets]);

  const updateDraft = (ticketId, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [ticketId]: {
        ...prev[ticketId],
        [key]: value,
      },
    }));
  };

  const handleSave = async (ticketId) => {
    setSavingId(ticketId);

    try {
      const updated = await updateSupportTicket(ticketId, drafts[ticketId]);
      setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? updated : ticket)));
      setDrafts((prev) => ({
        ...prev,
        [ticketId]: {
          status: updated.status,
          admin_response: updated.admin_response || '',
        },
      }));
      toast.success('Support ticket updated');
    } catch (err) {
      console.error(err);
      toast.error(isSupportSetupError(err) ? getSupportSetupMessage() : (err.message || 'Failed to update ticket'));
    } finally {
      setSavingId('');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      await deleteSupportTicket(deleteTarget);
      setTickets((prev) => prev.filter((ticket) => ticket.id !== deleteTarget.id));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });
      toast.success('Complaint and screenshot deleted permanently');
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(isSupportSetupError(err) ? getSupportSetupMessage() : (err.message || 'Failed to delete complaint'));
    } finally {
      setDeletingId('');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">Support Inbox</h1>
          <p className="text-slate-muted text-sm mt-1">
            Review complaints about certificates, payments, screenshots, and course access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gold" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="input-field min-w-[180px]"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {setupError && (
        <Card className="border border-gold/20 bg-gold/5">
          <p className="text-sm text-cream">{setupError}</p>
          <p className="text-xs text-slate-muted mt-2">
            Run the updated SQL script in Supabase so the support inbox table and bucket exist.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-slate-muted text-sm">All Requests</p>
          <p className="font-display text-3xl text-cream mt-1">{tickets.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-slate-muted text-sm">Open</p>
          <p className="font-display text-3xl text-gold mt-1">{counts.open || 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-slate-muted text-sm">In Progress</p>
          <p className="font-display text-3xl text-blue-400 mt-1">{counts.in_progress || 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-slate-muted text-sm">Resolved</p>
          <p className="font-display text-3xl text-green-light mt-1">{counts.resolved || 0}</p>
        </Card>
      </div>

      {filteredTickets.length === 0 ? (
        <Card className="text-center py-16">
          <LifeBuoy size={42} className="mx-auto text-navy-border mb-4" />
          <p className="text-sm text-slate-muted">No support requests in this filter.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg text-cream">{ticket.subject}</h2>
                    <span className={STATUS_STYLES[ticket.status] || 'badge-gold'}>
                      {ticket.status?.replace('_', ' ')}
                    </span>
                    <span className="badge-blue">{ticket.category}</span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-muted">
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {ticket.user?.email || 'Unknown email'}
                    </span>
                    <span>{ticket.user?.name || 'Unknown user'}</span>
                    <span>{ticket.course?.title || 'General issue'}</span>
                    <span>{new Date(ticket.created_at).toLocaleString()}</span>
                    {ticket.payment_amount ? <span>Amount ₹{ticket.payment_amount}</span> : null}
                  </div>
                </div>

                {ticket.screenshot_url ? (
                  <a
                    href={ticket.screenshot_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost inline-flex items-center gap-2 text-sm self-start"
                  >
                    <ImageIcon size={15} /> Open Screenshot
                  </a>
                ) : null}
              </div>

              <div className="rounded-2xl border border-navy-border bg-navy-dark/60 p-4">
                <p className="text-[11px] uppercase tracking-wider text-slate-muted mb-2">Student message</p>
                <p className="text-sm text-cream-muted leading-relaxed">{ticket.message}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4">
                <Select
                  label="Status"
                  value={drafts[ticket.id]?.status || ticket.status}
                  onChange={(event) => updateDraft(ticket.id, 'status', event.target.value)}
                  options={STATUS_OPTIONS}
                />

                <Textarea
                  label="Admin Response"
                  rows={4}
                  placeholder="Write the response or resolution details for the student..."
                  value={drafts[ticket.id]?.admin_response || ''}
                  onChange={(event) => updateDraft(ticket.id, 'admin_response', event.target.value)}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  variant="danger"
                  onClick={() => setDeleteTarget(ticket)}
                >
                  <Trash2 size={15} /> Delete Complaint
                </Button>
                <Button
                  variant="gold"
                  loading={savingId === ticket.id}
                  onClick={() => handleSave(ticket.id)}
                >
                  <Save size={15} /> Save Update
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => !deletingId && setDeleteTarget(null)}
        title="Delete Complaint"
      >
        <div className="space-y-4">
          <p className="text-sm text-cream-muted leading-relaxed">
            This will permanently delete the complaint message from the website and database.
            {deleteTarget?.screenshot_path ? ' The uploaded screenshot will also be removed from storage to free memory.' : ''}
          </p>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-semibold text-cream">{deleteTarget?.subject}</p>
            <p className="text-xs text-slate-muted mt-1">
              {deleteTarget?.user?.email || 'Unknown email'}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deletingId === deleteTarget?.id}
              onClick={handleDelete}
            >
              <Trash2 size={15} /> Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
