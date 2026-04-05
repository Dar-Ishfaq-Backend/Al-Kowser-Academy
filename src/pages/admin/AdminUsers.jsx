import { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  PencilLine,
  Search,
  Shield,
  User,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import {
  createManagedUser,
  fetchAdminUsers,
  updateManagedUser,
} from '../../services/adminUserService';
import {
  Badge,
  Button,
  Card,
  Input,
  LoadingSpinner,
  Modal,
  Select,
  Textarea,
} from '../../components/ui/index.jsx';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Admin' },
];

const CREATE_FORM_DEFAULTS = {
  email: '',
  password: '',
  name: '',
  role: 'student',
  avatar_url: '',
  bio: '',
  streak: 0,
};

function normalizeEditForm(user) {
  return {
    name: user?.name || '',
    role: user?.role || 'student',
    avatar_url: user?.avatar_url || '',
    bio: user?.bio || '',
    streak: Number(user?.streak) || 0,
  };
}

function sortByNewest(a, b) {
  return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
}

export default function AdminUsers() {
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState(CREATE_FORM_DEFAULTS);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(normalizeEditForm(null));
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) => (
      user.name?.toLowerCase().includes(term)
      || user.email?.toLowerCase().includes(term)
      || user.role?.toLowerCase().includes(term)
    ));
  }, [search, users]);

  const counts = useMemo(() => ({
    total: users.length,
    admins: users.filter((user) => user.role === 'admin').length,
    students: users.filter((user) => user.role !== 'admin').length,
  }), [users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers((data || []).sort(sortByNewest));
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const setCreateField = (key) => (event) => {
    setCreateForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const setEditField = (key) => (event) => {
    setEditForm((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const openCreateModal = () => {
    setCreateForm(CREATE_FORM_DEFAULTS);
    setCreateOpen(true);
  };

  const openEditModal = (user) => {
    setEditTarget(user);
    setEditForm(normalizeEditForm(user));
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setEditForm(normalizeEditForm(null));
  };

  const handleCreateUser = async () => {
    if (!createForm.email.trim() || !createForm.password || !createForm.name.trim()) {
      toast.error('Email, password, and name are required');
      return;
    }

    setCreateSaving(true);
    try {
      const { profile, requiresEmailConfirmation } = await createManagedUser(createForm);
      setUsers((prev) => [profile, ...prev].sort(sortByNewest));
      setCreateOpen(false);
      setCreateForm(CREATE_FORM_DEFAULTS);
      toast.success(
        requiresEmailConfirmation
          ? 'User created. They must confirm their email before first login.'
          : 'User created successfully',
      );
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setCreateSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editTarget) return;

    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const isDemotingLastAdmin = (
      editTarget.role === 'admin'
      && editForm.role !== 'admin'
      && counts.admins <= 1
    );

    if (isDemotingLastAdmin) {
      toast.error('Keep at least one admin account');
      return;
    }

    setEditSaving(true);
    try {
      const updated = await updateManagedUser(editTarget.id, editForm);
      setUsers((prev) => prev
        .map((user) => (user.id === updated.id ? updated : user))
        .sort(sortByNewest));
      closeEditModal();

      if (updated.id === currentUser?.id && updated.role !== 'admin') {
        toast.success('Your role was updated. This account will lose admin access on the next refresh.');
      } else {
        toast.success('User updated successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">Manage Users</h1>
          <p className="text-slate-muted text-sm mt-1">
            Add new accounts and edit names, roles, streaks, bios, and avatars from one place.
          </p>
        </div>

        <Button variant="gold" onClick={openCreateModal}>
          <UserPlus size={16} /> Add New User
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-slate-muted text-sm">Total Accounts</p>
          <p className="font-display text-3xl text-cream mt-1">{counts.total}</p>
        </Card>
        <Card className="p-5">
          <p className="text-slate-muted text-sm">Admins</p>
          <p className="font-display text-3xl text-gold mt-1">{counts.admins}</p>
        </Card>
        <Card className="p-5">
          <p className="text-slate-muted text-sm">Students</p>
          <p className="font-display text-3xl text-green-light mt-1">{counts.students}</p>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email, or role…"
          className="input-field pl-9"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <Card className="text-center py-16">
          <User size={42} className="mx-auto text-navy-border mb-4" />
          <p className="text-sm text-slate-muted">No users matched this search.</p>
        </Card>
      ) : (
        <div className="glass-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-navy-border bg-navy-dark/40">
                  {['User', 'Role', 'Streak', 'Joined', 'Profile', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      className="text-left text-[11px] text-slate-muted font-semibold p-4 uppercase tracking-wider"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-navy-border/40 hover:bg-navy-border/20 transition-colors ${
                      index === filteredUsers.length - 1 ? 'border-none' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green to-gold flex items-center justify-center text-navy text-sm font-bold flex-shrink-0">
                          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-cream truncate">{user.name || 'Unnamed User'}</p>
                          <p className="text-xs text-slate-muted truncate">{user.email || 'No email available'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.role === 'admin' ? 'gold' : 'green'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-sm text-cream">
                        <Flame size={13} className="text-gold" />
                        {user.streak || 0}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-muted">
                      {new Date(user.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-4 max-w-[260px]">
                      <p className="text-xs text-slate-muted line-clamp-2">
                        {user.bio || 'No bio added yet'}
                      </p>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}>
                        <PencilLine size={14} /> Edit User
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => !createSaving && setCreateOpen(false)}
        title="Add New User"
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email *"
              type="email"
              placeholder="student@example.com"
              value={createForm.email}
              onChange={setCreateField('email')}
            />
            <Input
              label="Password *"
              type="password"
              placeholder="At least 8 characters"
              value={createForm.password}
              onChange={setCreateField('password')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              placeholder="Student name"
              value={createForm.name}
              onChange={setCreateField('name')}
            />
            <Select
              label="Role"
              value={createForm.role}
              onChange={setCreateField('role')}
              options={ROLE_OPTIONS}
            />
          </div>

          <Input
            label="Avatar URL"
            placeholder="https://..."
            value={createForm.avatar_url}
            onChange={setCreateField('avatar_url')}
          />

          <Textarea
            label="Bio"
            rows={4}
            placeholder="Optional short bio or internal note"
            value={createForm.bio}
            onChange={setCreateField('bio')}
          />

          <p className="text-xs text-slate-muted leading-relaxed">
            If email confirmation is enabled in Supabase Auth, the new user will need to verify their email before the first login.
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={createSaving}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleCreateUser} loading={createSaving}>
              <UserPlus size={15} /> Create User
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => !editSaving && closeEditModal()}
        title="Edit User"
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              value={editTarget?.email || ''}
              disabled
            />
            <Select
              label="Role"
              value={editForm.role}
              onChange={setEditField('role')}
              options={ROLE_OPTIONS}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_140px] gap-4">
            <Input
              label="Full Name"
              value={editForm.name}
              onChange={setEditField('name')}
            />
            <Input
              label="Streak"
              type="number"
              min="0"
              value={editForm.streak}
              onChange={setEditField('streak')}
            />
          </div>

          <Input
            label="Avatar URL"
            placeholder="https://..."
            value={editForm.avatar_url}
            onChange={setEditField('avatar_url')}
          />

          <Textarea
            label="Bio"
            rows={4}
            placeholder="Short bio or admin note"
            value={editForm.bio}
            onChange={setEditField('bio')}
          />

          <div className="rounded-2xl border border-navy-border bg-navy-dark/60 p-4">
            <p className="text-sm text-cream">Login email cannot be edited here.</p>
            <p className="text-xs text-slate-muted mt-1">
              Supabase Auth controls login email and password, while this admin screen manages the user profile and role.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeEditModal} disabled={editSaving}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleUpdateUser} loading={editSaving}>
              <Shield size={15} /> Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
