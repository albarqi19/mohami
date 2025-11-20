import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Moon, Sun, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDark, setIsDark] = React.useState(() => {
    // Load theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });
  const [notifications] = React.useState(3);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);
  const notificationsRef = React.useRef<HTMLDivElement | null>(null);

  // Apply theme on mount
  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدير';
      case 'lawyer':
        return 'محامي';
      case 'legal_assistant':
        return 'مساعد قانوني';
      case 'client':
        return 'عميل';
      default:
        return role;
    }
  };

  const pageMeta = React.useMemo(() => {
    const metaMap = [
      {
        test: /^\/dashboard$/, // Dashboard root
        title: 'لوحة التحكم',
        subtitle: 'متابعة الأداء العام',
        accent: 'var(--color-primary)',
      },
      {
        test: /^\/cases/,
        title: 'القضايا',
        subtitle: 'إدارة الملفات القانونية',
        accent: 'var(--color-teal-500)',
      },
      {
        test: /^\/tasks/,
        title: 'المهام',
        subtitle: 'تنظيم الأعمال اليومية',
        accent: 'var(--color-warning)',
      },
      {
        test: /^\/documents/,
        title: 'الوثائق',
        subtitle: 'إدارة المستندات والمرفقات',
        accent: 'var(--color-accent)',
      },
      {
        test: /^\/reports/,
        title: 'التقارير',
        subtitle: 'تحليلات ومؤشرات الأداء',
        accent: 'var(--color-orange-500)',
      },
      {
        test: /^\/notifications/,
        title: 'التنبيهات',
        subtitle: 'مركز التحذيرات والتحديثات',
        accent: 'var(--color-info)',
      },
      {
        test: /^\/settings/,
        title: 'الإعدادات',
        subtitle: 'تهيئة الحساب والتفضيلات',
        accent: 'var(--color-teal-600)',
      },
    ];

    const current = metaMap.find((meta) => meta.test.test(location.pathname));
    return (
      current ?? {
        title: 'الصفحة الحالية',
        subtitle: '',
        accent: 'var(--color-primary)',
      }
    );
  }, [location.pathname]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header" role="banner">
      <div className="header__content">
        <div className="header__leading">
          <motion.button
            type="button"
            className="header__icon-button lg:hidden"
            aria-label="فتح القائمة الجانبية"
            whileTap={{ scale: 0.92 }}
            onClick={onMenuClick}
          >
            <Menu size={22} />
          </motion.button>

          <div className="header__page-context">
            <span className="header__page-indicator" style={{ backgroundColor: pageMeta.accent }} aria-hidden />
            <div className="header__page-copy">
              <h2 className="header__page-title">{pageMeta.title}</h2>
              {pageMeta.subtitle && <p className="header__page-subtitle">{pageMeta.subtitle}</p>}
            </div>
          </div>
        </div>

        <div className="header__search hidden md:block" role="search">
          <Search size={18} className="header__search-icon" aria-hidden />
          <input
            type="search"
            placeholder="البحث في القضايا..."
            className="header__search-input"
            aria-label="بحث في القضايا"
          />
        </div>

        <div className="header__actions">
          <div className="header__notifications-wrapper" ref={notificationsRef}>
            <motion.button
              type="button"
              className="header__icon-button"
              aria-haspopup="true"
              aria-expanded={showNotifications}
              aria-label="عرض الإشعارات"
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <Bell size={22} />
              {notifications > 0 && <span className="header__badge">{notifications}</span>}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  className="header__popover"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <NotificationCenter
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            className="header__icon-button"
            aria-label={isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
            aria-pressed={isDark}
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
          >
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </motion.button>

          <div className="header__profile-wrapper" ref={profileMenuRef}>
            <motion.button
              type="button"
              className="header__profile"
              aria-haspopup="true"
              aria-expanded={showUserMenu}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowUserMenu((prev) => !prev)}
            >
              <span className="header__avatar">
                <User size={18} />
              </span>
              <span className="header__profile-info">
                <span className="header__profile-name">{user?.name || 'غير محدد'}</span>
                <span className="header__profile-role">{getRoleDisplayName(user?.role || '')}</span>
              </span>
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  className="header__dropdown"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="header__dropdown-header">
                    <p className="header__dropdown-name">{user?.name}</p>
                    <p className="header__dropdown-email">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    className="header__dropdown-action"
                    onClick={handleLogout}
                  >
                    تسجيل الخروج
                    <LogOut size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="header__search header__search--mobile md:hidden" role="search">
        <Search size={18} className="header__search-icon" aria-hidden />
        <input
          type="search"
          placeholder="البحث..."
          className="header__search-input"
          aria-label="بحث في القضايا"
        />
      </div>
    </header>
  );
};

export default Header;
