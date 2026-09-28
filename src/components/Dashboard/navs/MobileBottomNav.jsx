import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './MobileBottomNav.module.css';
import { Home, Package, Users, UserCheck, BarChart2 } from 'lucide-react';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const isActive = (path) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <nav className={styles.bottomNav} aria-label="Mobile Bottom Navigation">
      <button
        className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}
        onClick={() => navigate('/')}
      >
        <Home size={22} className={styles.icon} />
        <span>Home</span>
      </button>

      <button
        className={`${styles.navItem} ${isActive('/inventory') ? styles.active : ''}`}
        onClick={() => navigate('/inventory')}
      >
        <Package size={22} className={styles.icon} />
        <span>Inventory</span>
      </button>

      <button
        className={`${styles.navItem} ${isActive('/customers') ? styles.active : ''}`}
        onClick={() => navigate('/customers')}
      >
        <Users size={22} className={styles.icon} />
        <span>Customers</span>
      </button>

      <button
        className={`${styles.navItem} ${isActive('/employees') ? styles.active : ''}`}
        onClick={() => navigate('/employees')}
      >
        <UserCheck size={22} className={styles.icon} />
        <span>Staff</span>
      </button>

      <button
        className={`${styles.navItem} ${isActive('/reports') ? styles.active : ''}`}
        onClick={() => navigate('/reports')}
      >
        <BarChart2 size={22} className={styles.icon} />
        <span>Reports</span>
      </button>
    </nav>
  );
}

