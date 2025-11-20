import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Calendar,
  User,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { Activity } from '../types';

// Mock data for demonstration
const mockCases: { [key: string]: { title: string; fileNumber: string } } = {
  'case-1': { title: 'قضية عقارية', fileNumber: 'LAW-2025-001' },
  'case-2': { title: 'قضية عمالية', fileNumber: 'LAW-2025-002' },
  'case-3': { title: 'قضية تجارية', fileNumber: 'LAW-2025-003' },
};

const mockUsers: { [key: string]: { name: string; role: string } } = {
  'user-1': { name: 'أحمد محمد', role: 'محامي' },
  'user-2': { name: 'فاطمة أحمد', role: 'محامية' },
  'user-3': { name: 'محمد علي', role: 'مساعد قانوني' },
  'admin': { name: 'مدير النظام', role: 'مدير' },
};

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'case_created',
    title: 'إنشاء قضية جديدة',
    description: 'تم إنشاء قضية عقارية جديدة وتعيين الفريق القانوني المختص',
    caseId: 'case-1',
    performedBy: 'admin',
    performedAt: new Date('2025-09-15T09:00:00'),
    metadata: {
      caseType: 'عقارية',
      priority: 'عالية'
    }
  },
  {
    id: '2',
    type: 'document_uploaded',
    title: 'رفع وثائق القضية',
    description: 'تم رفع العقد الأصلي وشهادة التسجيل العقاري',
    caseId: 'case-1',
    performedBy: 'user-1',
    performedAt: new Date('2025-09-15T10:30:00'),
    metadata: {
      documentCount: 2,
      documentTypes: ['عقد', 'شهادة']
    }
  },
  {
    id: '3',
    type: 'task_assigned',
    title: 'تكليف بمراجعة العقد',
    description: 'تم تكليف المحامي أحمد محمد بمراجعة العقد التجاري وتحديد النقاط القانونية',
    caseId: 'case-1',
    taskId: 'task-1',
    performedBy: 'admin',
    performedAt: new Date('2025-09-16T14:00:00'),
    metadata: {
      assignedTo: 'أحمد محمد',
      priority: 'عالية',
      dueDate: '2025-09-25'
    }
  },
  {
    id: '4',
    type: 'hearing_scheduled',
    title: 'جدولة جلسة محكمة',
    description: 'تم تحديد موعد الجلسة القادمة في المحكمة التجارية',
    caseId: 'case-3',
    performedBy: 'user-2',
    performedAt: new Date('2025-09-18T11:00:00'),
    metadata: {
      court: 'المحكمة التجارية',
      hearingDate: '2025-10-15',
      hearingTime: '10:00'
    }
  },
  {
    id: '5',
    type: 'comment_added',
    title: 'إضافة ملاحظة قانونية',
    description: 'تم إضافة ملاحظة حول استراتيجية الدفاع المقترحة',
    caseId: 'case-2',
    performedBy: 'user-2',
    performedAt: new Date('2025-09-19T16:30:00'),
    metadata: {
      commentLength: 'طويلة',
      category: 'استراتيجية'
    }
  },
  {
    id: '6',
    type: 'task_completed',
    title: 'إنجاز مهمة',
    description: 'تم إنجاز مهمة إعداد مذكرة الدفاع بنجاح',
    caseId: 'case-2',
    taskId: 'task-2',
    performedBy: 'user-1',
    performedAt: new Date('2025-09-20T09:45:00'),
    metadata: {
      completionTime: '3 أيام',
      quality: 'ممتازة'
    }
  },
  {
    id: '7',
    type: 'client_meeting',
    title: 'اجتماع مع العميل',
    description: 'تم عقد اجتماع مع العميل لمناقشة تطورات القضية',
    caseId: 'case-1',
    performedBy: 'user-1',
    performedAt: new Date('2025-09-21T13:00:00'),
    metadata: {
      duration: '45 دقيقة',
      location: 'المكتب',
      attendees: ['العميل', 'المحامي الرئيسي']
    }
  }
];

const Activities: React.FC = () => {
  const [activities] = useState<Activity[]>(mockActivities);
  const [searchTerm, setSearchTerm] = useState('');
  const [caseFilter, setCaseFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'case_created':
        return <FileText style={{ height: '20px', width: '20px', color: 'var(--color-primary)' }} />;
      case 'document_uploaded':
        return <FileText style={{ height: '20px', width: '20px', color: 'var(--color-success)' }} />;
      case 'task_assigned':
        return <User style={{ height: '20px', width: '20px', color: 'var(--color-warning)' }} />;
      case 'task_completed':
        return <CheckCircle style={{ height: '20px', width: '20px', color: 'var(--color-success)' }} />;
      case 'hearing_scheduled':
        return <Calendar style={{ height: '20px', width: '20px', color: 'var(--color-primary)' }} />;
      case 'comment_added':
        return <MessageSquare style={{ height: '20px', width: '20px', color: 'var(--color-info)' }} />;
      case 'client_meeting':
        return <User style={{ height: '20px', width: '20px', color: 'var(--color-purple-500)' }} />;
      default:
        return <AlertCircle style={{ height: '20px', width: '20px', color: 'var(--color-gray-500)' }} />;
    }
  };

  const getActivityTypeText = (type: string) => {
    switch (type) {
      case 'case_created': return 'إنشاء قضية';
      case 'document_uploaded': return 'رفع وثائق';
      case 'task_assigned': return 'تكليف بمهمة';
      case 'task_completed': return 'إنجاز مهمة';
      case 'hearing_scheduled': return 'جدولة جلسة';
      case 'comment_added': return 'إضافة ملاحظة';
      case 'client_meeting': return 'اجتماع عميل';
      default: return type;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'case_created': return 'var(--color-primary)';
      case 'document_uploaded': return 'var(--color-success)';
      case 'task_assigned': return 'var(--color-warning)';
      case 'task_completed': return 'var(--color-success)';
      case 'hearing_scheduled': return 'var(--color-primary)';
      case 'comment_added': return 'var(--color-info)';
      case 'client_meeting': return 'var(--color-purple-500)';
      default: return 'var(--color-gray-500)';
    }
  };

  const getUserName = (userId: string) => {
    return mockUsers[userId]?.name || 'غير محدد';
  };

  const getCaseInfo = (caseId?: string) => {
    if (!caseId || !mockCases[caseId]) return null;
    return mockCases[caseId];
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'منذ أقل من ساعة';
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `منذ ${diffInDays} يوم`;
    
    return date.toLocaleDateString('ar-SA');
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getUserName(activity.performedBy).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCase = caseFilter === 'all' || activity.caseId === caseFilter;
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    const matchesUser = userFilter === 'all' || activity.performedBy === userFilter;
    
    return matchesSearch && matchesCase && matchesType && matchesUser;
  });

  const sortedActivities = filteredActivities.sort((a, b) => 
    b.performedAt.getTime() - a.performedAt.getTime()
  );

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
            سجل الإجراءات والأنشطة
          </h1>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: 0
          }}>
            متابعة جميع الإجراءات والأنشطة المتعلقة بالقضايا والمهام
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: 'pointer'
          }}
        >
          <Plus style={{ height: '18px', width: '18px' }} />
          إضافة إجراء جديد
        </motion.button>
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
              placeholder="البحث في الأنشطة..."
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

        {/* Case Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
            marginBottom: '6px'
          }}>
            القضية
          </label>
          <select
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
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
            <option value="all">جميع القضايا</option>
            {Object.entries(mockCases).map(([id, caseInfo]) => (
              <option key={id} value={id}>
                {caseInfo.title}
              </option>
            ))}
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
            نوع النشاط
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
            <option value="case_created">إنشاء قضية</option>
            <option value="document_uploaded">رفع وثائق</option>
            <option value="task_assigned">تكليف بمهمة</option>
            <option value="task_completed">إنجاز مهمة</option>
            <option value="hearing_scheduled">جدولة جلسة</option>
            <option value="comment_added">إضافة ملاحظة</option>
            <option value="client_meeting">اجتماع عميل</option>
          </select>
        </div>

        {/* User Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
            marginBottom: '6px'
          }}>
            المستخدم
          </label>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
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
            <option value="all">جميع المستخدمين</option>
            {Object.entries(mockUsers).map(([id, user]) => (
              <option key={id} value={id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activities Timeline */}
      <div style={{
        position: 'relative'
      }}>
        {/* Timeline Line */}
        <div style={{
          position: 'absolute',
          right: '30px',
          top: '0',
          bottom: '0',
          width: '2px',
          backgroundColor: 'var(--color-border)',
          zIndex: 1
        }} />

        {/* Activities */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {sortedActivities.map((activity, index) => {
            const caseInfo = getCaseInfo(activity.caseId);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '20px'
                }}
              >
                {/* Timeline Dot */}
                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'var(--color-surface)',
                  border: `3px solid ${getActivityColor(activity.type)}`,
                  borderRadius: '50%',
                  flexShrink: 0
                }}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Activity Card */}
                <motion.div
                  whileHover={{ y: -2 }}
                  style={{
                    flex: 1,
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        <h4 style={{
                          fontSize: 'var(--font-size-lg)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text)',
                          margin: 0
                        }}>
                          {activity.title}
                        </h4>
                        <span style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: getActivityColor(activity.type),
                          backgroundColor: `${getActivityColor(activity.type)}20`,
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {getActivityTypeText(activity.type)}
                        </span>
                      </div>
                      {activity.description && (
                        <p style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-secondary)',
                          margin: 0,
                          lineHeight: 1.5
                        }}>
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <button style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px'
                    }}>
                      <MoreHorizontal style={{ height: '18px', width: '18px' }} />
                    </button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    {/* Performed By */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <User style={{ height: '16px', width: '16px', color: 'var(--color-text-secondary)' }} />
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)'
                      }}>
                        بواسطة: 
                      </span>
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-primary)'
                      }}>
                        {getUserName(activity.performedBy)}
                      </span>
                    </div>

                    {/* Case Info */}
                    {caseInfo && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <FileText style={{ height: '16px', width: '16px', color: 'var(--color-text-secondary)' }} />
                        <span style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-secondary)'
                        }}>
                          القضية: 
                        </span>
                        <span style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text)'
                        }}>
                          {caseInfo.title}
                        </span>
                      </div>
                    )}

                    {/* Time */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Clock style={{ height: '16px', width: '16px', color: 'var(--color-text-secondary)' }} />
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)'
                      }}>
                        {formatTimeAgo(activity.performedAt)}
                      </span>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)'
                      }}>
                        ({activity.performedAt.toLocaleString('ar-SA')})
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginTop: '12px'
                    }}>
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <span
                          key={key}
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-secondary)',
                            backgroundColor: 'var(--color-background)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)'
                          }}
                        >
                          {key}: {Array.isArray(value) ? value.join(', ') : value}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {sortedActivities.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--color-text-secondary)'
        }}>
          <FileText style={{ 
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
            لا توجد أنشطة
          </h3>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            margin: 0
          }}>
            لم يتم العثور على أنشطة تطابق المعايير المحددة
          </p>
        </div>
      )}
    </div>
  );
};

export default Activities;
