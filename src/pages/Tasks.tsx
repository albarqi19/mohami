import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Calendar,
  User,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
  Circle,
  BookOpen,
  Users,
  Phone,
  Gavel,
  Loader2,
  Edit,
  Copy,
  Archive,
  Trash2
} from 'lucide-react';
import type { Task, TaskStatus, Priority } from '../types';
import { TaskService, type TaskFilters } from '../services/taskService';
import { TaskCommentService } from '../services/taskCommentService';
import { CaseService } from '../services/caseService';
import { UserService } from '../services/UserService';
import AddTaskModal from '../components/AddTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import ContentSearch from '../components/ContentSearch';
import TaskNotificationManager from '../components/TaskNotificationManager';
import TaskNotifications from '../components/TaskNotifications';

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cases, setCases] = useState<{ [key: string]: { title: string; fileNumber: string } }>({});
  const [users, setUsers] = useState<{ [key: string]: { name: string; avatar?: string | null } }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [taskComments, setTaskComments] = useState<{ [key: string]: any[] }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [assignedFilter, setAssignedFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'overdue'>('all');

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    loadTasks();
    loadCases();
    loadUsers();
  }, []);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const filters: TaskFilters = {};
      
      if (statusFilter !== 'all' && statusFilter) {
        filters.status = statusFilter;
      }
      if (priorityFilter !== 'all' && priorityFilter) {
        filters.priority = priorityFilter;
      }
      if (typeFilter !== 'all' && typeFilter) {
        filters.type = typeFilter;
      }
      if (assignedFilter !== 'all' && assignedFilter) {
        filters.assigned_to = assignedFilter;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const tasksData = await TaskService.getTasks(filters);
      setTasks(tasksData.data);
      setError(null);
    } catch (error) {
      console.error('خطأ في جلب المهام:', error);
      setError('فشل في جلب المهام');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCases = async () => {
    try {
      const casesData = await CaseService.getCases();
      const casesMap: { [key: string]: { title: string; fileNumber: string } } = {};
      casesData.data.forEach(caseItem => {
        casesMap[caseItem.id] = {
          title: caseItem.title,
          fileNumber: caseItem.file_number
        };
      });
      setCases(casesMap);
    } catch (error) {
      console.error('خطأ في جلب القضايا:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await UserService.getLawyers();
      const usersMap: { [key: string]: { name: string; avatar?: string | null } } = {};
      usersData.forEach(user => {
        usersMap[user.id] = {
          name: user.name
        };
      });
      setUsers(usersMap);
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
    }
  };

  // إعادة تحميل المهام عند تغيير الفلاتر
  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter, typeFilter, assignedFilter, searchTerm]);

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await TaskService.updateTaskStatus(taskId, newStatus);
      loadTasks(); // إعادة تحميل المهام بعد التحديث
    } catch (error) {
      console.error('خطأ في تحديث حالة المهمة:', error);
    }
  };

  // دالة حذف المهمة
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      try {
        await TaskService.deleteTask(taskId);
        loadTasks(); // إعادة تحميل المهام بعد الحذف
      } catch (error) {
        console.error('خطأ في حذف المهمة:', error);
      }
    }
  };

  // دالة تكرار المهمة
  const handleDuplicateTask = async (taskId: string) => {
    try {
      const originalTask = tasks.find(t => t.id === taskId);
      if (originalTask) {
        const duplicatedTask = {
          ...originalTask,
          title: `نسخة من ${originalTask.title}`,
          status: 'todo' as TaskStatus,
          id: undefined, // سيتم إنشاء ID جديد
          createdAt: undefined,
          updatedAt: undefined
        };
        await TaskService.createTask(duplicatedTask);
        loadTasks(); // إعادة تحميل المهام بعد التكرار
      }
    } catch (error) {
      console.error('خطأ في تكرار المهمة:', error);
    }
  };

  // دالة أرشفة المهمة
  const handleArchiveTask = async (taskId: string) => {
    try {
      await TaskService.archiveTask(taskId);
      loadTasks(); // إعادة تحميل المهام بعد الأرشفة
    } catch (error) {
      console.error('خطأ في أرشفة المهمة:', error);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'var(--color-success)';
      case 'in_progress': return 'var(--color-primary)';
      case 'review': return 'var(--color-warning)';
      case 'todo': return 'var(--color-gray-500)';
      case 'cancelled': return 'var(--color-error)';
      case 'overdue': return 'var(--color-error)';
      case 'archived': return 'var(--color-gray-400)';
      default: return 'var(--color-gray-500)';
    }
  };

  const getTaskIcon = (type?: string) => {
    switch (type) {
      case 'review': return FileText;
      case 'research': return BookOpen;
      case 'consultation': return Users;
      case 'court': return Gavel;
      case 'document': return FileText;
      case 'meeting': return Phone;
      default: return Circle;
    }
  };

  const getTaskTypeText = (type?: string) => {
    switch (type) {
      case 'review': return 'مراجعة';
      case 'research': return 'بحث قانوني';
      case 'consultation': return 'استشارة';
      case 'court': return 'جلسة محكمة';
      case 'document': return 'إعداد وثائق';
      case 'meeting': return 'اجتماع';
      default: return 'عام';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'مكتملة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'review': return 'قيد المراجعة';
      case 'todo': return 'لم تبدأ';
      case 'cancelled': return 'ملغية';
      case 'overdue': return 'متأخرة';
      case 'archived': return 'مؤرشفة';
      default: return status;
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle style={{ height: '16px', width: '16px' }} />;
      case 'in_progress': return <Clock style={{ height: '16px', width: '16px' }} />;
      case 'review': return <AlertTriangle style={{ height: '16px', width: '16px' }} />;
      case 'overdue': return <AlertTriangle style={{ height: '16px', width: '16px' }} />;
      case 'archived': return <Archive style={{ height: '16px', width: '16px' }} />;
      default: return <Circle style={{ height: '16px', width: '16px' }} />;
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'var(--color-error)';
      case 'medium': return 'var(--color-warning)';
      case 'low': return 'var(--color-success)';
      default: return 'var(--color-gray-500)';
    }
  };

  const getPriorityText = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return priority;
    }
  };

  const getLawyerName = (lawyerId: string) => {
    return users[lawyerId]?.name || 'غير محدد';
  };

  const getCaseInfo = (caseId?: string) => {
    if (!caseId || !cases[caseId]) return null;
    return cases[caseId];
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getLawyerName(task.assignedTo).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesAssignee = selectedAssignee === 'all' || task.assignedTo === selectedAssignee;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const isOverdue = (task: Task) => {
    return task.status !== 'completed' && task.dueDate && new Date() > task.dueDate;
  };

  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'var(--color-background)',
      minHeight: '100vh',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Task Notification Manager - مدير الإشعارات التلقائية */}
      <TaskNotificationManager tasks={filteredTasks} />
      
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
            إدارة المهام
          </h1>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: 0
          }}>
            متابعة وإدارة جميع المهام المكلف بها الفريق القانوني
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          {/* Task Notifications */}
          <TaskNotifications 
            tasks={tasks}
            onMarkAsRead={(id) => console.log('Mark as read:', id)}
            onDismiss={(id) => console.log('Dismiss:', id)}
          />
          
          {/* Add Task Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddModalOpen(true)}
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
          مهمة جديدة
        </motion.button>
        </div>
      </div>

      {/* Advanced Search */}
      <div style={{ marginBottom: '24px' }}>
        <ContentSearch
          placeholder="البحث في المهام والوصف والقضايا المرتبطة..."
          onResultSelect={(result) => {
            // التنقل إلى نتيجة البحث
            console.log('Selected result:', result);
          }}
          showFilters={true}
        />
      </div>

      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
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
              placeholder="البحث في المهام..."
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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as TaskStatus | 'all')}
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
            <option value="all">جميع الحالات</option>
            <option value="todo">لم تبدأ</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="review">قيد المراجعة</option>
            <option value="completed">مكتملة</option>
            <option value="overdue">متأخرة</option>
            <option value="cancelled">ملغية</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
            marginBottom: '6px'
          }}>
            الأولوية
          </label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as Priority | 'all')}
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
            <option value="all">جميع الأولويات</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
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
            نوع المهمة
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
            <option value="review">مراجعة</option>
            <option value="research">بحث قانوني</option>
            <option value="consultation">استشارة</option>
            <option value="court">جلسة محكمة</option>
            <option value="document">إعداد وثائق</option>
            <option value="meeting">اجتماع</option>
            <option value="other">أخرى</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
            marginBottom: '6px'
          }}>
            المحامي المسؤول
          </label>
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
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
            <option value="all">جميع المحامين</option>
            <option value="lawyer-1">أحمد محمد</option>
            <option value="lawyer-2">فاطمة أحمد</option>
            <option value="lawyer-3">محمد علي</option>
          </select>
        </div>

        {/* Reset Filters Button */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end'
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPriorityFilter('all');
              setTypeFilter('all');
              setAssignedFilter('all');
            }}
            style={{
              padding: '10px 16px',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              height: 'fit-content'
            }}
          >
            إعادة تعيين الفلاتر
          </motion.button>
        </div>
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {[...Array(8)].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shimmer 1.5s infinite'
              }} />
              
              <div style={{
                height: '20px',
                backgroundColor: 'var(--color-border)',
                borderRadius: '4px',
                marginBottom: '12px',
                width: '70%'
              }} />
              
              <div style={{
                height: '16px',
                backgroundColor: 'var(--color-border)',
                borderRadius: '4px',
                marginBottom: '8px',
                width: '50%'
              }} />
              
              <div style={{
                height: '14px',
                backgroundColor: 'var(--color-border)',
                borderRadius: '4px',
                marginBottom: '16px',
                width: '80%'
              }} />
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  height: '12px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '4px',
                  width: '40%'
                }} />
                <div style={{
                  height: '20px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '10px',
                  width: '60px'
                }} />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {filteredTasks.map((task) => {
          const caseInfo = getCaseInfo(task.caseId);
          const overdue = isOverdue(task);
          
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              onClick={() => navigate(`/tasks/${task.id}`)}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: `1px solid ${overdue ? 'var(--color-error)' : 'var(--color-border)'}`,
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {overdue && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  left: '0',
                  height: '3px',
                  backgroundColor: 'var(--color-error)'
                }} />
              )}
              
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div>
                  <h4 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text)',
                    margin: '0 0 8px 0',
                    lineHeight: 1.3
                  }}>
                    {task.title}
                  </h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: getStatusColor(task.status),
                      backgroundColor: `${getStatusColor(task.status)}20`,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {getStatusIcon(task.status)}
                      {getStatusText(task.status)}
                    </span>
                    <span style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: getPriorityColor(task.priority),
                      backgroundColor: `${getPriorityColor(task.priority)}20`,
                      padding: '3px 8px',
                      borderRadius: '12px'
                    }}>
                      {getPriorityText(task.priority)}
                    </span>
                    {task.type && (
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text-secondary)',
                        backgroundColor: 'var(--color-background)',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {React.createElement(getTaskIcon(task.type), { 
                          style: { height: '12px', width: '12px' } 
                        })}
                        {getTaskTypeText(task.type)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <button 
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === task.id ? null : task.id);
                    }}
                  >
                    <MoreHorizontal style={{ height: '18px', width: '18px' }} />
                  </button>
                  
                  {activeDropdown === task.id && (
                    <div 
                      style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        padding: '8px 0',
                        minWidth: '180px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                        zIndex: 9999
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          border: 'none',
                          background: 'none',
                          textAlign: 'right',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: 'flex-end'
                        }}
                        onClick={() => {
                          setEditingTask(task);
                          setIsEditModalOpen(true);
                          setActiveDropdown(null);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-background)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span>تعديل المهمة</span>
                        <Edit style={{ height: '16px', width: '16px' }} />
                      </button>
                      
                      <button
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          border: 'none',
                          background: 'none',
                          textAlign: 'right',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: 'flex-end'
                        }}
                        onClick={() => {
                          handleDuplicateTask(task.id);
                          setActiveDropdown(null);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-background)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span>تكرار المهمة</span>
                        <Copy style={{ height: '16px', width: '16px' }} />
                      </button>
                      
                      <button
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          border: 'none',
                          background: 'none',
                          textAlign: 'right',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: 'flex-end'
                        }}
                        onClick={() => {
                          handleArchiveTask(task.id);
                          setActiveDropdown(null);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-background)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span>أرشفة المهمة</span>
                        <Archive style={{ height: '16px', width: '16px' }} />
                      </button>
                      
                      <div style={{
                        height: '1px',
                        backgroundColor: 'var(--color-border)',
                        margin: '4px 0'
                      }} />
                      
                      <button
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          border: 'none',
                          background: 'none',
                          textAlign: 'right',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-error)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          justifyContent: 'flex-end'
                        }}
                        onClick={() => {
                          handleDeleteTask(task.id);
                          setActiveDropdown(null);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-background)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <span>حذف المهمة</span>
                        <Trash2 style={{ height: '16px', width: '16px' }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <p style={{
                fontSize: 'var(--font-size-sm)',
                color: task.description ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)',
                margin: '0 0 16px 0',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontStyle: task.description ? 'normal' : 'italic'
              }}>
                {task.description || 'لا يوجد وصف للمهمة'}
              </p>

              {/* Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px 16px',
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: 'var(--color-background)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <User style={{ height: '14px', width: '14px', color: 'var(--color-primary)' }} />
                  <div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '2px'
                    }}>المكلف</div>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text)'
                    }}>{getLawyerName(task.assignedTo)}</div>
                  </div>
                </div>

                {task.dueDate && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Calendar style={{ height: '14px', width: '14px', color: overdue ? 'var(--color-error)' : 'var(--color-warning)' }} />
                    <div>
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '2px'
                      }}>الموعد النهائي</div>
                      <div style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: overdue ? 'var(--color-error)' : 'var(--color-text)'
                      }}>
                        {new Date(task.dueDate).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>
                )}

                {caseInfo && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FileText style={{ height: '14px', width: '14px', color: 'var(--color-success)' }} />
                    <div>
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '2px'
                      }}>القضية</div>
                      <div style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>{caseInfo.title}</div>
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Clock style={{ height: '14px', width: '14px', color: 'var(--color-info)' }} />
                  <div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '2px'
                    }}>الساعات</div>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text)'
                    }}>
                      {task.actualHours || 0} / {task.estimatedHours || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid var(--color-border)'
              }}>
                <span style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)'
                }}>
                  {task.createdAt ? new Date(task.createdAt).toLocaleDateString('ar-SA') : ''}
                </span>
                
                <button
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: getStatusColor(task.status),
                    backgroundColor: `${getStatusColor(task.status)}15`,
                    border: `1px solid ${getStatusColor(task.status)}40`,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextStatus = task.status === 'todo' ? 'in_progress' : 
                                     task.status === 'in_progress' ? 'completed' : 'todo';
                    handleUpdateTaskStatus(task.id, nextStatus as TaskStatus);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${getStatusColor(task.status)}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${getStatusColor(task.status)}15`;
                  }}
                >
                  {getStatusIcon(task.status)}
                  تغيير الحالة
                </button>
              </div>
            </motion.div>
          );
          })}
          
          {filteredTasks.length === 0 && (
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
                لا توجد مهام
              </h3>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                margin: 0
              }}>
                لم يتم العثور على مهام تطابق المعايير المحددة
              </p>
            </div>
          )}
        </div>
      )}

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        caseId="1"
        onTaskAdded={() => {
          setIsAddModalOpen(false);
          loadTasks();
        }}
      />
      
      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onTaskUpdated={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
          loadTasks();
        }}
      />
    </div>
  );
};

export default Tasks;
