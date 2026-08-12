import type { ReactNode } from 'react';

interface SidebarItem {
  id: string;
  label: string;
}

interface DashboardShellProps {
  title: string;
  subtitle: string;
  items: SidebarItem[];
  activeItem: string;
  onSelect: (id: string) => void;
  onLogout: () => void;
  userName: string;
  children: ReactNode;
}

export const DashboardShell = ({
  title,
  subtitle,
  items,
  activeItem,
  onSelect,
  onLogout,
  userName,
  children
}: DashboardShellProps) => (
  <div className="app-shell">
    <aside className="sidebar">
      <div>
        <div className="brand-mark">CC</div>
        <h1>STUDENT PORTAL</h1>
        <p>{subtitle}</p>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={item.id === activeItem ? 'nav-item active' : 'nav-item'}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span>{userName}</span>
        <button className="ghost-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
    <main className="dashboard-main">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Campus operations</span>
          <h2>{title}</h2>
        </div>
      </header>
      {children}
    </main>
  </div>
);
