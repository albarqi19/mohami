import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  FileText,
  CheckSquare,
  Upload,
  BarChart3,
  Users,
  Bell,
  Settings,
  LogOut,
  X,
  MoonStar,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  // Auto-close mobile sidebar on desktop resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280 && isOpen) {
        onClose();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  const menuItems = [
    { icon: Home, label: 'لوحة التحكم', path: '/dashboard', roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { icon: FileText, label: 'القضايا', path: '/cases', roles: ['admin', 'lawyer', 'legal_assistant'] },
    { icon: CheckSquare, label: 'المهام', path: '/tasks', roles: ['admin', 'lawyer', 'legal_assistant'] },
    { icon: FileText, label: 'قضاياي', path: '/my-cases', roles: ['client'] },
    { icon: Upload, label: 'الوثائق', path: '/documents', roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { icon: Clock, label: 'سجل الأنشطة', path: '/activities', roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { icon: BarChart3, label: 'التقارير', path: '/reports', roles: ['admin', 'lawyer'] },
    { icon: Users, label: 'المستخدمين', path: '/users', roles: ['admin'] },
    { icon: Bell, label: 'التنبيهات', path: '/notifications', roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { icon: MessageSquare, label: 'إعدادات الواتساب', path: '/whatsapp-settings', roles: ['admin'] },
    { icon: Settings, label: 'الإعدادات', path: '/settings', roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
  ];

  const visibleMenuItems = menuItems.filter((item) => user && item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    onClose();
  };

  const renderNavLinks = (onNavigate?: () => void) => (
    <ul className="sidebar__nav-list">
      {visibleMenuItems.map((item) => {
        const Icon = item.icon;

        return (
          <li key={item.path} className="sidebar__item">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                clsx('sidebar__link', isActive && 'sidebar__link--active')
              }
              onClick={onNavigate}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );

  const sidebarBody = (closeHandler?: () => void) => (
    <div className="sidebar__container">
      <div className="sidebar__brand">
        <div className="sidebar__brand-group">
          <span className="sidebar__brand-icon" aria-hidden>
            <MoonStar size={22} />
          </span>
          <div className="sidebar__brand-info">
            <h1 className="sidebar__brand-title">نظام إدارة المحاماة</h1>
            <span className="sidebar__brand-subtitle">منصة متكاملة للقضايا والمهام</span>
          </div>
        </div>

        {closeHandler && (
          <button
            type="button"
            className="sidebar__close-button"
            aria-label="إغلاق القائمة"
            onClick={closeHandler}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="sidebar__nav" aria-label="روابط التنقل الرئيسية">
        {renderNavLinks(closeHandler)}
      </nav>

      <div className="sidebar__footer">
        <button type="button" className="sidebar__logout" onClick={handleLogout}>
          تسجيل الخروج
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:flex lg:flex-shrink-0" aria-hidden={isOpen}>
        <aside className="sidebar" aria-label="القائمة الجانبية" role="navigation">
          {sidebarBody()}
        </aside>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className={clsx('sidebar', 'sidebar--mobile')}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            role="dialog"
            aria-modal="true"
          >
            {sidebarBody(onClose)}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
