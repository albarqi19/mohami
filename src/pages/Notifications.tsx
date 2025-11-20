import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Check, 
  X, 
  Info,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileText,
  User,
  Clock,
  Search,
  Settings
} from 'lucide-react';
import type { Notification } from '../types';

// Mock data for demonstration
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'مهمة جديدة تم تعيينها',
    message: 'تم تعيين مهمة "مراجعة العقد التجاري" لك من قبل المدير',
    type: 'task_assigned',
    userId: 'user-1',
    isRead: false,
    createdAt: new Date('2025-09-20T09:30:00'),
    actionUrl: '/tasks/1',
    metadata: {
      taskId: '1',
      assignedBy: 'admin',
      priority: 'high'
    }
  },
  {
    id: '2',
    title: 'موعد جلسة قريب',
    message: 'لديك جلسة محكمة غداً الساعة 10:00 صباحاً للقضية العقارية',
    type: 'hearing_reminder',
    userId: 'user-1',
    isRead: false,
    createdAt: new Date('2025-09-20T08:00:00'),
    actionUrl: '/cases/1',
    metadata: {
      caseId: '1',
      hearingDate: '2025-09-21T10:00:00',
      court: 'المحكمة التجارية'
    }
  },
  {
    id: '3',
    title: 'مهمة متأخرة',
    message: 'المهمة "إعداد مذكرة الدفاع" تجاوزت الموعد النهائي المحدد',
    type: 'task_due',
    userId: 'user-2',
    isRead: true,
    createdAt: new Date('2025-09-19T16:00:00'),
    actionUrl: '/tasks/2',
    metadata: {
      taskId: '2',
      dueDate: '2025-09-18',
      daysPastDue: 2
    }
  },
  {
    id: '4',
    title: 'وثيقة جديدة تم رفعها',
    message: 'تم رفع وثيقة جديدة "شهادة التسجيل العقاري" للقضية العقارية',
    type: 'document_shared',
    userId: 'user-1',
    isRead: true,
    createdAt: new Date('2025-09-19T14:30:00'),
    actionUrl: '/documents/2',
    metadata: {
      documentId: '2',
      caseId: '1',
      uploadedBy: 'user-2'
    }
  },
  {
    id: '5',
    title: 'تحديث حالة القضية',
    message: 'تم تحديث حالة القضية التجارية إلى "قيد المراجعة"',
    type: 'case_update',
    userId: 'user-3',
    isRead: false,
    createdAt: new Date('2025-09-19T11:15:00'),
    actionUrl: '/cases/3',
    metadata: {
      caseId: '3',
      oldStatus: 'active',
      newStatus: 'review'
    }
  },
  {
    id: '6',
    title: 'تذكير: اجتماع مع العميل',
    message: 'لديك اجتماع مع عميل القضية العقارية بعد ساعتين',
    type: 'hearing_reminder',
    userId: 'user-1',
    isRead: false,
    createdAt: new Date('2025-09-20T07:00:00'),
    actionUrl: '/cases/1',
    metadata: {
      meetingTime: '2025-09-20T11:00:00',
      clientName: 'أحمد السعيد',
      location: 'المكتب الرئيسي'
    }
  }
];

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <User style={{ height: '20px', width: '20px', color: 'var(--color-primary)' }} />;
      case 'task_due':
        return <AlertTriangle style={{ height: '20px', width: '20px', color: 'var(--color-error)' }} />;
      case 'hearing_reminder':
        return <Calendar style={{ height: '20px', width: '20px', color: 'var(--color-warning)' }} />;
      case 'document_shared':
        return <FileText style={{ height: '20px', width: '20px', color: 'var(--color-success)' }} />;
      case 'case_update':
        return <Info style={{ height: '20px', width: '20px', color: 'var(--color-info)' }} />;
      case 'system':
        return <Clock style={{ height: '20px', width: '20px', color: 'var(--color-purple-500)' }} />;
      default:
        return <Bell style={{ height: '20px', width: '20px', color: 'var(--color-gray-500)' }} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task_assigned': return 'var(--color-primary)';
      case 'task_due': return 'var(--color-error)';
      case 'hearing_reminder': return 'var(--color-warning)';
      case 'document_shared': return 'var(--color-success)';
      case 'case_update': return 'var(--color-info)';
      case 'system': return 'var(--color-purple-500)';
      default: return 'var(--color-gray-500)';
    }
  };

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'task_assigned': return 'تكليف مهمة';
      case 'task_due': return 'مهمة متأخرة';
      case 'hearing_reminder': return 'تذكير';
      case 'document_shared': return 'وثيقة مشتركة';
      case 'case_update': return 'تحديث قضية';
      case 'system': return 'نظام';
      default: return type;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `منذ ${diffInDays} يوم`;
    
    return date.toLocaleDateString('ar-SA');
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'read' && notif.isRead) || 
                         (filter === 'unread' && !notif.isRead);
    
    const matchesType = typeFilter === 'all' || notif.type === typeFilter;
    
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesType && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="page-layout">
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text)',
            margin: 0,
            marginBottom: '8px'
          }}>
            التنبيهات والإشعارات
            {unreadCount > 0 && (
              <span style={{
                display: 'inline-block',
                marginRight: '12px',
                padding: '4px 8px',
                backgroundColor: 'var(--color-error)',
                color: 'white',
                borderRadius: '12px',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: 0
          }}>
            متابعة جميع التحديثات والتذكيرات المهمة
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={markAllAsRead}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'var(--color-success)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer'
            }}
          >
            <CheckCircle style={{ height: '18px', width: '18px' }} />
            تعيين الكل كمقروء
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer'
            }}
          >
            <Settings style={{ height: '18px', width: '18px' }} />
            إعدادات التنبيهات
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
        padding: '20px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)'
      }}>
        {/* Search */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
            marginBottom: '6px'
          }}>
            البحث
          </label>
          <div style={{
            position: 'relative'
          }}>
            <Search style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              height: '18px',
              width: '18px',
              color: 'var(--color-text-secondary)'
            }} />
            <input
              type="text"
              placeholder="البحث في التنبيهات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text)',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
            marginBottom: '6px'
          }}>
            الحالة
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">جميع التنبيهات</option>
            <option value="unread">غير مقروءة</option>
            <option value="read">مقروءة</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
            marginBottom: '6px'
          }}>
            نوع التنبيه
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">جميع الأنواع</option>
            <option value="task_assigned">تكليف مهمة</option>
            <option value="task_due">مهمة متأخرة</option>
            <option value="hearing_reminder">تذكير</option>
            <option value="document_shared">وثيقة مشتركة</option>
            <option value="case_update">تحديث قضية</option>
            <option value="system">نظام</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {filteredNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: `1px solid ${notification.isRead ? 'var(--color-border)' : getNotificationColor(notification.type)}`,
              borderRadius: '12px',
              padding: '20px',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => !notification.isRead && markAsRead(notification.id)}
          >
            {!notification.isRead && (
              <div style={{
                position: 'absolute',
                top: '0',
                right: '0',
                left: '0',
                height: '3px',
                backgroundColor: getNotificationColor(notification.type),
                borderRadius: '12px 12px 0 0'
              }} />
            )}
            
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                backgroundColor: `${getNotificationColor(notification.type)}20`,
                borderRadius: '12px',
                flexShrink: 0
              }}>
                {getNotificationIcon(notification.type)}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div>
                    <h4 style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: notification.isRead ? 'var(--font-weight-medium)' : 'var(--font-weight-semibold)',
                      color: 'var(--color-text)',
                      margin: '0 0 4px 0'
                    }}>
                      {notification.title}
                    </h4>
                    <span style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: getNotificationColor(notification.type),
                      backgroundColor: `${getNotificationColor(notification.type)}20`,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {getNotificationTypeText(notification.type)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!notification.isRead && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          backgroundColor: 'var(--color-success)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Check style={{ height: '16px', width: '16px' }} />
                      </motion.button>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        backgroundColor: 'var(--color-error)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <X style={{ height: '16px', width: '16px' }} />
                    </motion.button>
                  </div>
                </div>
                
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  margin: '0 0 12px 0',
                  lineHeight: 1.5
                }}>
                  {notification.message}
                </p>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Clock style={{ height: '14px', width: '14px' }} />
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                  
                  {notification.actionUrl && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-primary)',
                        backgroundColor: `var(--color-primary)10`,
                        border: '1px solid var(--color-primary)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer'
                      }}
                    >
                      عرض التفاصيل
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--color-text-secondary)'
        }}>
          <Bell style={{ 
            height: '48px', 
            width: '48px', 
            color: 'var(--color-text-secondary)',
            margin: '0 auto 16px'
          }} />
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-medium)',
            margin: '0 0 8px 0'
          }}>
            لا توجد تنبيهات
          </h3>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            margin: 0
          }}>
            لم يتم العثور على تنبيهات تطابق المعايير المحددة
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
