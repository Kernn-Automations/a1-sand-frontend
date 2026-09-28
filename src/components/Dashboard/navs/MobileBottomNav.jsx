import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './MobileBottomNav.module.css';
import { Home, Package, Users, UserCheck, BarChart2, FileText } from 'lucide-react';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const isActive = (path) => {
    if (path === '/') return currentPath === '/' || currentPath === '';
    return currentPath.startsWith(path);
  };

  return (
    <nav className={styles.bottomNav} aria-label="Mobile Bottom Navigation">
      <button
        className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}
        onClick={() => navigate('/')}
        aria-label="Home"
      >
        <div className={styles.iconWrapper}>
          <Home size={19} className={styles.icon} />
          {isActive('/') && <div className={styles.activeIndicator} />}
        </div>
        <span>Home</span>
      </button>

      <button
        className={`${styles.navItem} ${isActive('/sales') ? styles.active : ''}`}
        onClick={() => navigate('/sales')}
        aria-label="Sales"
      >
        <div className={styles.iconWrapper}>
          <FileText size={19} className={styles.icon} />
          {isActive('/sales') && <div className={styles.activeIndicator} />}
        </div>
        <span>Sales</span>
      </button>

      <button
        className={`${styles.navItem} ${isActive('/inventory') ? styles.active : ''}`}
        onClick={() => navigate('/inventory')}
        aria-label="Inventory"
      >
        <div className={styles.iconWrapper}>
          <Package size={19} className={styles.icon} />
          {isActive('/inventory') && <div className={styles.activeIndicator} />}
        </div>
        <span>Inventory</span>
      </button>

      <button
        className={`${styles.navItem} ${isActive('/customers') ? styles.active : ''}`}
        onClick={() => navigate('/customers')}
        aria-label="Customers"
      >
        <div className={styles.iconWrapper}>
          <Users size={19} className={styles.icon} />
          {isActive('/customers') && <div className={styles.activeIndicator} />}
        </div>
        <span>Customers</span>
      </button>

      <button
        className={`${styles.navItem} ${isActive('/employees') ? styles.active : ''}`}
        onClick={() => navigate('/employees')}
        aria-label="Staff"
      >
        <div className={styles.iconWrapper}>
          <UserCheck size={19} className={styles.icon} />
          {isActive('/employees') && <div className={styles.activeIndicator} />}
        </div>
        <span>Staff</span>
      </button>

      <button
        className={`${styles.navItem} ${isActive('/reports') ? styles.active : ''}`}
        onClick={() => navigate('/reports')}
        aria-label="Reports"
      >
        <div className={styles.iconWrapper}>
          <BarChart2 size={19} className={styles.icon} />
          {isActive('/reports') && <div className={styles.activeIndicator} />}
        </div>
        <span>Reports</span>
      </button>
    </nav>
  );
}
