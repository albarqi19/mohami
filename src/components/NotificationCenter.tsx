import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell,
  X,
  Check,
  AlertTriangle,
  Info,
  FileText,
  Clock,
  Settings,
  CheckCheck,
  Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'reminder' | 'task' | 'case' | 'document';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isImportant: boolean;
  actionUrl?: string;
  relatedId?: string;
  sender?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [showSettings, setShowSettings] = useState(false);

  // Mock notifications data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'reminder',
      title: 'موعد جلسة محكمة',
      message: 'جلسة قضية النزاع التجاري مقررة غداً الساعة 10:00 صباحاً',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      isRead: false,
      isImportant: true,
      actionUrl: '/cases/1',
      relatedId: 'case-1'
    },
    {
      id: '2',
      type: 'task',
      title: 'مهمة جديدة مُسندة إليك',
      message: 'تم إسناد مهمة "مراجعة العقد التجاري" إليك بواسطة أحمد محامي',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: false,
      isImportant: false,
      actionUrl: '/tasks/2',
      relatedId: 'task-2',
      sender: 'أحمد محامي'
    },
    {
      id: '3',
      type: 'document',
      title: 'وثيقة جديدة مُضافة',
      message: 'تم رفع وثيقة "تقرير الخبير" إلى قضية النزاع العقاري',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      isRead: true,
      isImportant: false,
      actionUrl: '/documents/3',
      relatedId: 'doc-3',
      sender: 'سارة محامية'
    },
    {
      id: '4',
      type: 'warning',
      title: 'مهمة متأخرة',
      message: 'مهمة "إعداد مذكرة الدفاع" تجاوزت الموعد المحدد',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      isRead: true,
      isImportant: true,
      actionUrl: '/tasks/4',
      relatedId: 'task-4'
    },
    {
      id: '5',
      type: 'case',
      title: 'تحديث حالة قضية',
      message: 'تم تحديث حالة قضية "النزاع التجاري" إلى "قيد المراجعة"',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true,
      isImportant: false,
      actionUrl: '/cases/5',
      relatedId: 'case-5',
      sender: 'محمد محامي'
    },
    {
      id: '6',
      type: 'success',
      title: 'تم قبول الطلب',
      message: 'تم قبول طلب التأجيل لقضية "النزاع العمالي"',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isRead: true,
      isImportant: false,
      actionUrl: '/cases/6',
      relatedId: 'case-6'
    }
  ];

  useEffect(() => {
    setNotifications(mockNotifications);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />;
      case 'success': return <Check size={20} style={{ color: 'var(--color-success)' }} />;
      case 'error': return <X size={20} style={{ color: 'var(--color-error)' }} />;
      case 'reminder': return <Clock size={20} style={{ color: 'var(--color-primary)' }} />;
      case 'task': return <CheckCheck size={20} style={{ color: 'var(--color-info)' }} />;
      case 'case': return <FileText size={20} style={{ color: 'var(--color-primary)' }} />;
      case 'document': return <FileText size={20} style={{ color: 'var(--color-success)' }} />;
      default: return <Info size={20} style={{ color: 'var(--color-info)' }} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'var(--color-warning)';
      case 'success': return 'var(--color-success)';
      case 'error': return 'var(--color-error)';
      case 'reminder': return 'var(--color-primary)';
      case 'task': return 'var(--color-info)';
      case 'case': return 'var(--color-primary)';
      case 'document': return 'var(--color-success)';
      default: return 'var(--color-info)';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `منذ ${minutes} دقيقة`;
    } else if (hours < 24) {
      return `منذ ${hours} ساعة`;
    } else if (days < 7) {
      return `منذ ${days} يوم`;
    } else {
      return timestamp.toLocaleDateString('ar-SA');
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.isRead;
      case 'important': return notification.isImportant;
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const importantCount = notifications.filter(n => n.isImportant && !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    onNotificationClick?.(notification);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      zIndex: 1000,
      padding: '20px',
      paddingTop: '60px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-background)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Bell size={24} style={{ color: 'var(--color-primary)' }} />
              <h2 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
                margin: 0
              }}>
                الإشعارات
              </h2>
              {unreadCount > 0 && (
                <span style={{
                  backgroundColor: 'var(--color-error)',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary)10';
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
                title="إعدادات"
              >
                <Settings size={16} />
              </button>
              
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-error)20';
                  e.currentTarget.style.color = 'var(--color-error)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
                title="إغلاق"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '12px'
          }}>
            {[
              { key: 'all', label: 'الكل', count: notifications.length },
              { key: 'unread', label: 'غير مقروءة', count: unreadCount },
              { key: 'important', label: 'مهمة', count: importantCount }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: filter === tab.key ? 'var(--color-primary)' : 'transparent',
                  color: filter === tab.key ? 'white' : 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  if (filter !== tab.key) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)20';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== tab.key) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    backgroundColor: filter === tab.key ? 'rgba(255, 255, 255, 0.3)' : 'var(--color-primary)20',
                    color: filter === tab.key ? 'white' : 'var(--color-primary)',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={markAllAsRead}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  border: '1px solid var(--color-primary)',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-primary)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
              >
                <CheckCheck size={14} />
                قراءة الكل
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px'
        }}>
          <AnimatePresence>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: '16px',
                    margin: '4px 0',
                    borderRadius: '8px',
                    backgroundColor: notification.isRead ? 'transparent' : 'var(--color-primary)05',
                    border: `1px solid ${notification.isRead ? 'var(--color-border)' : 'var(--color-primary)20'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)30';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.isRead ? 'transparent' : 'var(--color-primary)05';
                    e.currentTarget.style.borderColor = notification.isRead ? 'var(--color-border)' : 'var(--color-primary)20';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}>
                    {/* Type Icon */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      backgroundColor: `${getTypeColor(notification.type)}20`,
                      borderRadius: '8px',
                      flexShrink: 0
                    }}>
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '4px'
                      }}>
                        <h4 style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: notification.isRead ? 'var(--font-weight-medium)' : 'var(--font-weight-semibold)',
                          color: 'var(--color-text)',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {notification.title}
                          {notification.isImportant && (
                            <span style={{
                              width: '6px',
                              height: '6px',
                              backgroundColor: 'var(--color-error)',
                              borderRadius: '50%'
                            }} />
                          )}
                          {!notification.isRead && (
                            <span style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: 'var(--color-primary)',
                              borderRadius: '50%'
                            }} />
                          )}
                        </h4>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: 'transparent',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            opacity: 0.7,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-error)20';
                            e.currentTarget.style.color = 'var(--color-error)';
                            e.currentTarget.style.opacity = '1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                            e.currentTarget.style.opacity = '0.7';
                          }}
                          title="حذف"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)',
                        margin: '0 0 8px 0',
                        lineHeight: 1.4
                      }}>
                        {notification.message}
                      </p>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)'
                      }}>
                        <span>{formatTimestamp(notification.timestamp)}</span>
                        {notification.sender && (
                          <span>بواسطة {notification.sender}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)'
              }}>
                <Bell size={48} style={{ 
                  marginBottom: '16px', 
                  opacity: 0.3 
                }} />
                <h3 style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-medium)',
                  margin: '0 0 8px 0'
                }}>
                  لا توجد إشعارات
                </h3>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  margin: 0
                }}>
                  ستظهر الإشعارات الجديدة هنا
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
                padding: '20px 24px'
              }}
            >
              <h3 style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
                margin: '0 0 16px 0'
              }}>
                إعدادات الإشعارات
              </h3>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {[
                  { key: 'email', label: 'إشعارات البريد الإلكتروني' },
                  { key: 'push', label: 'إشعارات فورية' },
                  { key: 'reminder', label: 'تذكيرات المواعيد' },
                  { key: 'task', label: 'إشعارات المهام' }
                ].map(setting => (
                  <label key={setting.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)'
                  }}>
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: 'var(--color-primary)'
                      }}
                    />
                    {setting.label}
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default NotificationCenter;
