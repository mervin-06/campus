import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: 'Dr. Lakshmi HOD',
    registerNumber: 'ADMIN001',
    password: 'password123'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
    }
  }, [navigate, user]);

  const quickCredentials = useMemo(
    () => [
      { label: 'Admin Demo', name: 'Dr. Lakshmi HOD', registerNumber: 'ADMIN001' },
      { label: 'Student Demo', name: 'Aarav Kumar', registerNumber: 'CC2026001' }
    ],
    []
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await login(form);
      showToast('Login successful.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Login failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="screen-state">Preparing CampusConnect...</div>;
  }

  return (
    <div className="auth-layout">
      <section className="hero-panel">
        <span className="eyebrow">Smart campus command center</span>
        <h1>STUDENT PORTAL</h1>
        <p>
          One polished workspace for academic visibility, campus issue reporting, and fast admin communication.
        </p>
        <div className="hero-grid">
          <div className="hero-chip">Academic insights</div>
          <div className="hero-chip">Issue tracking</div>
          <div className="hero-chip">Role-based access</div>
          <div className="hero-chip">Realtime-ready UI</div>
        </div>
      </section>

      <section className="auth-card">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Secure login</span>
            <h2>Welcome back</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
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
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="demo-box">
          <strong>Demo accounts</strong>
          {quickCredentials.map((credential) => (
            <button
              key={credential.label}
              className="demo-button"
              onClick={() =>
                setForm({
                  name: credential.name,
                  registerNumber: credential.registerNumber,
                  password: 'password123'
                })
              }
              type="button"
            >
              {credential.label}
            </button>
          ))}
          <p>Password for seeded users: <code>password123</code></p>
        </div>
      </section>
    </div>
  );
};
