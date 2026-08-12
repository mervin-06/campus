import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '../components/DashboardShell';
import { Panel, StatCard } from '../components/Cards';
import { Modal } from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { API_BASE_URL, apiRequest } from '../api/client';
import type { ComplaintRecord, NotificationRecord, StudentRecord } from '../types';

const sidebarItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'students', label: 'Students' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'announcements', label: 'Announcements' }
];

const emptyForm = {
  name: '',
  registerNumber: '',
  password: '',
  iatMarks: '18, 17, 19',
  internalMarks: '45, 47',
  attendance: '91',
  result: 'Pass'
};

export const AdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [postingNotification, setPostingNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const loadAdminData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const searchQuery = search ? `?search=${encodeURIComponent(search)}` : '';
      const complaintQuery = statusFilter !== 'All' ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const [studentResponse, complaintResponse, notificationResponse] = await Promise.all([
        apiRequest<StudentRecord[]>(`/students${searchQuery}`, {}, token),
        apiRequest<ComplaintRecord[]>(`/complaints${complaintQuery}`, {}, token),
        apiRequest<NotificationRecord[]>('/notifications', {}, token)
      ]);

      setStudents(studentResponse);
      setComplaints(complaintResponse);
      setNotifications(notificationResponse);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load admin data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, [token, search, statusFilter]);

  const metrics = useMemo(
    () => [
      { label: 'Students', value: students.length, helper: 'Seeded and managed records' },
      { label: 'Complaints', value: complaints.length, helper: 'Current filtered list' },
      { label: 'Pending Issues', value: complaints.filter((item) => item.status === 'Pending').length, helper: 'Need action now' },
      { label: 'Announcements', value: notifications.length, helper: 'Visible to all students' }
    ],
    [complaints, notifications.length, students.length]
  );

  const openCreateModal = () => {
    setEditingStudent(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (student: StudentRecord) => {
    setEditingStudent(student);
    setForm({
      name: student.name,
      registerNumber: student.registerNumber,
      password: '',
      iatMarks: student.academic.iatMarks.join(', '),
      internalMarks: student.academic.internalMarks.join(', '),
      attendance: String(student.academic.attendance),
      result: student.academic.result
    });
    setModalOpen(true);
  };

  const parseMarks = (value: string) =>
    value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => !Number.isNaN(item));

  const handleSaveStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const payload = {
      name: form.name,
      registerNumber: form.registerNumber,
      password: form.password,
      iatMarks: parseMarks(form.iatMarks),
      internalMarks: parseMarks(form.internalMarks),
      attendance: Number(form.attendance),
      result: form.result
    };

    try {
      if (editingStudent) {
        await apiRequest(`/students/${editingStudent.id}`, { method: 'PUT', body: JSON.stringify(payload) }, token);
        showToast('Student record updated.', 'success');
      } else {
        await apiRequest('/students', { method: 'POST', body: JSON.stringify(payload) }, token);
        showToast('Student record created.', 'success');
      }

      setModalOpen(false);
      await loadAdminData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save student.', 'error');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!token) return;

    try {
      await apiRequest(`/students/${studentId}`, { method: 'DELETE' }, token);
      showToast('Student deleted.', 'success');
      await loadAdminData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete student.', 'error');
    }
  };

  const handleUpdateComplaint = async (complaintId: string, status: ComplaintRecord['status']) => {
    if (!token) return;

    try {
      await apiRequest(`/complaints/${complaintId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
      showToast('Complaint status updated.', 'success');
      await loadAdminData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update complaint.', 'error');
    }
  };

  const handlePostNotification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      setPostingNotification(true);
      await apiRequest('/notifications', { method: 'POST', body: JSON.stringify({ message: notificationMessage }) }, token);
      setNotificationMessage('');
      showToast('Announcement posted.', 'success');
      await loadAdminData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to post notification.', 'error');
    } finally {
      setPostingNotification(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!token) return;

    try {
      await apiRequest(`/notifications/${notificationId}`, { method: 'DELETE' }, token);
      showToast('Announcement removed.', 'success');
      await loadAdminData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to remove announcement.', 'error');
    }
  };

  return (
    <DashboardShell
      title="Admin Command Center"
      subtitle="Manage records and campus operations"
      items={sidebarItems}
      activeItem={activeTab}
      onSelect={setActiveTab}
      onLogout={logout}
      userName={user?.name || 'Admin'}
    >
      {loading ? (
        <div className="screen-state">Loading admin controls...</div>
      ) : (
        <>
          <section className="stats-grid">
            {metrics.map((metric) => (
              <StatCard key={metric.label} {...metric} />
            ))}
          </section>

          {activeTab === 'overview' && (
            <div className="content-grid two-column">
              <Panel title="Quick Status">
                <div className="stack-list compact-list">
                  {complaints.slice(0, 4).map((complaint) => (
                    <article className="issue-card" key={complaint.id}>
                      <div className="issue-topline">
                        <strong>{complaint.studentName}</strong>
                        <span className={`status-badge ${complaint.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {complaint.status}
                        </span>
                      </div>
                      <p>{complaint.description}</p>
                    </article>
                  ))}
                </div>
              </Panel>
              <Panel title="Latest Announcements">
                <div className="stack-list compact-list">
                  {notifications.slice(0, 4).map((notification) => (
                    <article className="notice-card" key={notification._id}>
                      <strong>{notification.message}</strong>
                      <small>{new Date(notification.createdAt).toLocaleString()}</small>
                    </article>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === 'students' && (
            <Panel
              title="Student Management"
              action={<button className="primary-button" onClick={openCreateModal}>Add Student</button>}
            >
              <div className="toolbar-row">
                <input
                  className="search-input"
                  placeholder="Search by name or register number"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Register No</th>
                      <th>IAT</th>
                      <th>Internal</th>
                      <th>Attendance</th>
                      <th>Result</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.registerNumber}</td>
                        <td>{student.academic.iatMarks.join(', ')}</td>
                        <td>{student.academic.internalMarks.join(', ')}</td>
                        <td>{student.academic.attendance}%</td>
                        <td>{student.academic.result}</td>
                        <td className="action-cell">
                          <button className="ghost-button" onClick={() => openEditModal(student)}>Edit</button>
                          <button className="danger-button" onClick={() => handleDeleteStudent(student.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {activeTab === 'complaints' && (
            <Panel title="Issue Management">
              <div className="toolbar-row">
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="All">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div className="stack-list">
                {complaints.map((complaint) => (
                  <article className="issue-card detailed" key={complaint.id}>
                    <div className="issue-topline">
                      <div>
                        <strong>{complaint.studentName}</strong>
                        <small>{complaint.registerNumber}</small>
                      </div>
                      <span className={`status-badge ${complaint.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p>{complaint.description}</p>
                    <small>{complaint.location}</small>
                    {complaint.image && (
                      <img alt={complaint.description} className="preview-image issue-preview" src={`${API_BASE_URL.replace('/api', '')}${complaint.image}`} />
                    )}
                    <div className="pill-row">
                      {['Pending', 'In Progress', 'Resolved'].map((status) => (
                        <button
                          key={status}
                          className="ghost-button"
                          onClick={() => handleUpdateComplaint(complaint.id, status as ComplaintRecord['status'])}
                        >
                          Mark {status}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </Panel>
          )}

          {activeTab === 'announcements' && (
            <Panel title="Announcements">
              <form className="announcement-form" onSubmit={handlePostNotification}>
                <textarea
                  rows={3}
                  placeholder="Post a message to all students"
                  value={notificationMessage}
                  onChange={(event) => setNotificationMessage(event.target.value)}
                />
                <button className="primary-button" disabled={postingNotification} type="submit">
                  {postingNotification ? 'Posting...' : 'Post Announcement'}
                </button>
              </form>
              <div className="stack-list">
                {notifications.map((notification) => (
                  <article className="notice-card" key={notification._id}>
                    <div className="issue-topline">
                      <strong>{notification.message}</strong>
                      <button className="danger-button" onClick={() => handleDeleteNotification(notification._id)}>
                        Delete
                      </button>
                    </div>
                    <small>{new Date(notification.createdAt).toLocaleString()}</small>
                  </article>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}

      <Modal
        title={editingStudent ? 'Edit Student' : 'Add Student'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={handleSaveStudent}>
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Register Number
            <input
              value={form.registerNumber}
              onChange={(event) => setForm({ ...form, registerNumber: event.target.value })}
            />
          </label>
          <label>
            Password {editingStudent ? '(leave blank to keep current)' : ''}
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          <label>
            IAT Marks
            <input value={form.iatMarks} onChange={(event) => setForm({ ...form, iatMarks: event.target.value })} />
          </label>
          <label>
            Internal Marks
            <input
              value={form.internalMarks}
              onChange={(event) => setForm({ ...form, internalMarks: event.target.value })}
            />
          </label>
          <label>
            Attendance
            <input value={form.attendance} onChange={(event) => setForm({ ...form, attendance: event.target.value })} />
          </label>
          <label>
            Result
            <input value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value })} />
          </label>
          <button className="primary-button" type="submit">
            {editingStudent ? 'Save Changes' : 'Create Student'}
          </button>
        </form>
      </Modal>
    </DashboardShell>
  );
};
