import type { ReactNode } from 'react';

export const StatCard = ({ label, value, helper }: { label: string; value: string | number; helper: string }) => (
  <div className="stat-card">
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{helper}</small>
  </div>
);

export const Panel = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <section className="panel">
    <div className="panel-header">
      <h3>{title}</h3>
      {action},
    </div>
    {children}
  </section>
);
