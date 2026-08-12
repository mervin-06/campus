import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '../components/DashboardShell';
import { Panel, StatCard } from '../components/Cards';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { API_BASE_URL, apiRequest } from '../api/client';
import type { AcademicData, ComplaintRecord, NotificationRecord } from '../types';

const sidebarItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'report', label: 'Report Issue' },
  { id: 'notifications', label: 'Notifications' }
];

export const StudentDashboard = () => {
  const { user, token, logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [academic, setAcademic] = useState<AcademicData | null>(null);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [form, setForm] = useState({
    description: '',
    location: '',
    image: null as File | null
  });

  const loadDashboard = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [academicResponse, complaintResponse, notificationResponse] = await Promise.all([
        apiRequest<AcademicData>('/students/me/academic', {}, token),
        apiRequest<ComplaintRecord[]>('/complaints', {}, token),
        apiRequest<NotificationRecord[]>('/notifications', {}, token)
      ]);
      setAcademic(academicResponse);
      setComplaints(complaintResponse);
      setNotifications(notificationResponse);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [token]);

  const metrics = useMemo(
    () => [
      { label: 'Attendance', value: `${academic?.attendance ?? 0}%`, helper: 'Current semester' },
      { label: 'IAT Average', value: academic ? Math.round(academic.iatMarks.reduce((a, b) => a + b, 0) / academic.iatMarks.length) : 0, helper: 'Across tests' },
      { label: 'Open Complaints', value: complaints.filter((item) => item.status !== 'Resolved').length, helper: 'Needs follow-up' },
      { label: 'Latest Result', value: academic?.result ?? 'Pending', helper: 'Academic status' }
    ],
    [academic, complaints]
  );

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setForm((current) => ({ ...current, image: file }));
    setPreview(file ? URL.createObjectURL(file) : '');
  };

  const handleSubmitComplaint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const payload = new FormData();
    payload.append('description', form.description);
    payload.append('location', form.location);

    if (form.image) {
      payload.append('image', form.image);
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit complaint.');
      }

      showToast('Complaint submitted successfully.', 'success');
      setForm({ description: '', location: '', image: null });
      setPreview('');
      await loadDashboard();
      setActiveTab('overview');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to submit complaint.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell
      title="Student Dashboard"
      subtitle="Academics, issues, and notices"
      items={sidebarItems}
      activeItem={activeTab}
      onSelect={setActiveTab}
      onLogout={logout}
      userName={user?.name || 'Student'}
    >
      {loading ? (
        <div className="screen-state">Loading your dashboard...</div>
      ) : (
        <>
          <section className="stats-grid">
            {metrics.map((metric) => (
              <StatCard key={metric.label} {...metric} />
            ))}
          </section>

          {activeTab === 'overview' && academic && (
            <div className="content-grid two-column">
              <Panel title="Academic Snapshot">
                <div className="marks-grid">
                  <div>
                    <span className="muted-label">IAT Marks</span>
                    <div className="pill-row">
                      {academic.iatMarks.map((mark, index) => (
                        <span key={`iat-${index}`} className="score-pill">
                          Test {index + 1}: {mark}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="muted-label">Internal Marks</span>
                    <div className="pill-row">
                      {academic.internalMarks.map((mark, index) => (
                        <span key={`internal-${index}`} className="score-pill secondary">
                          Internal {index + 1}: {mark}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel title="My Complaints">
                <div className="stack-list compact-list">
                  {complaints.map((complaint) => (
                    <article className="issue-card" key={complaint.id}>
                      <div className="issue-topline">
                        <strong>{complaint.location}</strong>
                        <span className={`status-badge ${complaint.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {complaint.status}
                        </span>
                      </div>
                      <p>{complaint.description}</p>
                    </article>
                  ))}
                  {!complaints.length && <p className="empty-state">No complaints submitted yet.</p>}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === 'report' && (
            <Panel title="Report A Campus Issue">
              <form className="form-grid" onSubmit={handleSubmitComplaint}>
                <label>
                  Problem Description
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Broken pipe near hostel entrance"
                  />
                </label>
                <label>
                  Location
                  <input
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                    placeholder="Block A, 2nd Floor"
                  />
                </label>
                <label>
                  Upload Image
                  <input accept="image/*" onChange={handleImageChange} type="file" />
                </label>
                {preview && <img alt="Complaint preview" className="preview-image" src={preview} />}
                <button className="primary-button" disabled={submitting} type="submit">
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </form>
            </Panel>
          )}

          {activeTab === 'notifications' && (
            <Panel title="Admin Notifications">
              <div className="stack-list">
                {notifications.map((notification) => (
                  <article className="notice-card" key={notification._id}>
                    <strong>{notification.message}</strong>
                    <small>{new Date(notification.createdAt).toLocaleString()}</small>
                  </article>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
    </DashboardShell>
  );
};
