import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  Activity as ActivityIcon,
  Briefcase,
  Layers,
  BarChart3,
  Inbox
} from 'lucide-react';
import type { Activity } from '../types';
import '../styles/activities-page.css';

// Mock data
const mockCases: { [key: string]: { title: string; fileNumber: string } } = {
  'case-1': { title: 'قضية عقارية', fileNumber: 'LAW-2025-001' },
  'case-2': { title: 'قضية عمالية', fileNumber: 'LAW-2025-002' },
  'case-3': { title: 'قضية تجارية', fileNumber: 'LAW-2025-003' },
};

const mockUsers: { [key: string]: { name: string; role: string } } = {
  'user-1': { name: 'أحمد محمد', role: 'محامي' },
  'user-2': { name: 'خالد أحمد', role: 'محامية' },
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
    performedAt: new Date(),
    metadata: { caseType: 'عقارية', priority: 'عالية' }
  },
  {
    id: '2',
    type: 'document_uploaded',
    title: 'رفع وثائق القضية',
    description: 'تم رفع العقد الأصلي وشهادة التسجيل العقاري',
    caseId: 'case-1',
    performedBy: 'user-1',
    performedAt: new Date(),
    metadata: { documentCount: 2 }
  },
  {
    id: '3',
    type: 'task_assigned',
    title: 'تكليف بمراجعة العقد',
    description: 'تم تكليف المحامي أحمد محمد بمراجعة العقد التجاري',
    caseId: 'case-1',
    taskId: 'task-1',
    performedBy: 'admin',
    performedAt: new Date(Date.now() - 86400000), // Yesterday
    metadata: { assignedTo: 'أحمد محمد' }
  },
  {
    id: '4',
    type: 'hearing_scheduled',
    title: 'جدولة جلسة محكمة',
    description: 'تم تحديد موعد الجلسة القادمة في المحكمة التجارية',
    caseId: 'case-3',
    performedBy: 'user-2',
    performedAt: new Date(Date.now() - 86400000), // Yesterday
    metadata: { court: 'المحكمة التجارية' }
  },
  {
    id: '5',
    type: 'comment_added',
    title: 'إضافة ملاحظة قانونية',
    description: 'تم إضافة ملاحظة حول استراتيجية الدفاع المقترحة',
    caseId: 'case-2',
    performedBy: 'user-2',
    performedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    metadata: { category: 'استراتيجية' }
  },
  {
    id: '6',
    type: 'task_completed',
    title: 'إنجاز مهمة',
    description: 'تم إنجاز مهمة إعداد مذكرة الدفاع بنجاح',
    caseId: 'case-2',
    taskId: 'task-2',
    performedBy: 'user-1',
    performedAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
    metadata: { completionTime: '3 أيام' }
  },
  {
    id: '7',
    type: 'client_meeting',
    title: 'اجتماع مع العميل',
    description: 'تم عقد اجتماع مع العميل لمناقشة تطورات القضية',
    caseId: 'case-1',
    performedBy: 'user-1',
    performedAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
    metadata: { duration: '45 دقيقة' }
  }
];

const Activities: React.FC = () => {
  const [activities] = useState<Activity[]>(mockActivities);
  const [searchTerm, setSearchTerm] = useState('');
  const [caseFilter, setCaseFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Icon + Color helper
  const getActivityStyle = (type: string) => {
    switch (type) {
      case 'case_created': return { icon: <FileText size={14} />, colorClass: 'navy' };
      case 'document_uploaded': return { icon: <FileText size={14} />, colorClass: 'green' };
      case 'task_assigned': return { icon: <User size={14} />, colorClass: 'orange' };
      case 'task_completed': return { icon: <CheckCircle size={14} />, colorClass: 'green' };
      case 'hearing_scheduled': return { icon: <Calendar size={14} />, colorClass: 'blue' };
      case 'comment_added': return { icon: <MessageSquare size={14} />, colorClass: 'navy' };
      case 'client_meeting': return { icon: <User size={14} />, colorClass: 'blue' };
      default: return { icon: <ActivityIcon size={14} />, colorClass: 'navy' };
    }
  };

  const getActivityTypeText = (type: string) => {
    switch (type) {
      case 'case_created': return 'قضية';
      case 'document_uploaded': return 'وثائق';
      case 'task_assigned': return 'مهمة';
      case 'task_completed': return 'إنجاز';
      case 'hearing_scheduled': return 'جلسة';
      case 'comment_added': return 'ملاحظة';
      case 'client_meeting': return 'اجتماع';
      default: return type;
    }
  };

  const getUserName = (userId: string) => mockUsers[userId]?.name || 'غير محدد';
  const getCaseInfo = (caseId?: string) => (caseId && mockCases[caseId] ? mockCases[caseId] : null);

  const formatTimeOnly = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCase = caseFilter === 'all' || activity.caseId === caseFilter;
      const matchesType = typeFilter === 'all' || activity.type === typeFilter;

      return matchesSearch && matchesCase && matchesType;
    }).sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
  }, [activities, searchTerm, caseFilter, typeFilter]);

  // Group by date category
  const groupedActivities = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = {
      today: [] as Activity[],
      yesterday: [] as Activity[],
      thisWeek: [] as Activity[]
    };

    filteredActivities.forEach(activity => {
      const activityDate = new Date(activity.performedAt);
      activityDate.setHours(0, 0, 0, 0);

      if (activityDate.getTime() === today.getTime()) {
        groups.today.push(activity);
      } else if (activityDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(activity);
      } else if (activityDate >= weekAgo) {
        groups.thisWeek.push(activity);
      }
    });

    return groups;
  }, [filteredActivities]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: filteredActivities.length,
      today: groupedActivities.today.length,
      tasksCompleted: filteredActivities.filter(a => a.type === 'task_completed').length,
      hearings: filteredActivities.filter(a => a.type === 'hearing_scheduled').length
    };
  }, [filteredActivities, groupedActivities]);

  // Render Activity Card
  const renderActivityCard = (activity: Activity, index: number) => {
    const { icon, colorClass } = getActivityStyle(activity.type);
    const caseInfo = getCaseInfo(activity.caseId);

    return (
      <motion.div
        className="activity-card"
        key={activity.id}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05 }}
      >
        <div className="activity-card__header">
          <div className={`activity-card__icon activity-card__icon--${colorClass}`}>
            {icon}
          </div>
          <div className="activity-card__title">{activity.title}</div>
          <div className="activity-card__time">{formatTimeOnly(activity.performedAt)}</div>
        </div>
        <div className="activity-card__desc">{activity.description}</div>
        <div className="activity-card__footer">
          <span className="activity-card__tag">
            <User size={10} />
            {getUserName(activity.performedBy)}
          </span>
          {caseInfo && (
            <span className="activity-card__tag">
              <FileText size={10} />
              {caseInfo.title}
            </span>
          )}
          <span className="activity-card__badge">
            {getActivityTypeText(activity.type)}
          </span>
        </div>
      </motion.div>
    );
  };

  // Render Column
  const renderColumn = (title: string, activities: Activity[], icon: React.ReactNode) => (
    <div className="activities-column">
      <div className="activities-column__header">
        <div className="activities-column__title">
          {icon}
          {title}
        </div>
        <span className="activities-column__count">{activities.length}</span>
      </div>
      <div className="activities-column__content">
        {activities.length > 0 ? (
          activities.map((activity, index) => renderActivityCard(activity, index))
        ) : (
          <div className="activities-column-empty">
            <Inbox size={24} className="activities-column-empty__icon" />
            <div className="activities-column-empty__text">لا توجد أنشطة</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="activities-page">
      {/* Header */}
      <div className="activities-header">
        <div className="activities-header__title-area">
          <h1>
            <ActivityIcon size={18} />
            سجل الإجراءات
          </h1>
          <p>متابعة جميع الأنشطة والإجراءات</p>
        </div>
        <div className="activities-header__actions">
          <div className="activities-search">
            <Search size={14} className="activities-search__icon" />
            <input
              className="activities-search__input"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="activities-filter">
            <select
              className="activities-filter__select"
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value)}
            >
              <option value="all">كل القضايا</option>
              {Object.entries(mockCases).map(([id, c]) => (
                <option key={id} value={id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="activities-filter">
            <select
              className="activities-filter__select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">كل الأنواع</option>
              <option value="case_created">قضايا</option>
              <option value="document_uploaded">وثائق</option>
              <option value="task_assigned">مهام</option>
              <option value="task_completed">إنجازات</option>
              <option value="hearing_scheduled">جلسات</option>
              <option value="comment_added">ملاحظات</option>
            </select>
          </div>
          <button className="activities-header__btn activities-header__btn--primary">
            <Plus size={16} />
            إضافة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="activities-content">
        {/* Stats */}
        <div className="activities-stats-grid">
          <motion.div className="activities-stat-card" whileHover={{ y: -2 }}>
            <div className="activities-stat-card__icon activities-stat-card__icon--navy">
              <Layers size={18} />
            </div>
            <div className="activities-stat-card__content">
              <div className="activities-stat-card__value">{stats.total}</div>
              <div className="activities-stat-card__label">إجمالي الأنشطة</div>
            </div>
          </motion.div>

          <motion.div className="activities-stat-card" whileHover={{ y: -2 }}>
            <div className="activities-stat-card__icon activities-stat-card__icon--green">
              <BarChart3 size={18} />
            </div>
            <div className="activities-stat-card__content">
              <div className="activities-stat-card__value">{stats.today}</div>
              <div className="activities-stat-card__label">أنشطة اليوم</div>
            </div>
          </motion.div>

          <motion.div className="activities-stat-card" whileHover={{ y: -2 }}>
            <div className="activities-stat-card__icon activities-stat-card__icon--blue">
              <CheckCircle size={18} />
            </div>
            <div className="activities-stat-card__content">
              <div className="activities-stat-card__value">{stats.tasksCompleted}</div>
              <div className="activities-stat-card__label">مهام مكتملة</div>
            </div>
          </motion.div>

          <motion.div className="activities-stat-card" whileHover={{ y: -2 }}>
            <div className="activities-stat-card__icon activities-stat-card__icon--orange">
              <Briefcase size={18} />
            </div>
            <div className="activities-stat-card__content">
              <div className="activities-stat-card__value">{stats.hearings}</div>
              <div className="activities-stat-card__label">جلسات</div>
            </div>
          </motion.div>
        </div>

        {/* Kanban Board */}
        <div className="activities-board">
          {renderColumn('اليوم', groupedActivities.today, <Clock size={14} />)}
          {renderColumn('أمس', groupedActivities.yesterday, <Calendar size={14} />)}
          {renderColumn('هذا الأسبوع', groupedActivities.thisWeek, <BarChart3 size={14} />)}
        </div>
      </div>
    </div>
  );
};

export default Activities;
