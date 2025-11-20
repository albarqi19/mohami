import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  User,
  FileText,
  Clock,
  MessageSquare,
  Edit,
  CheckCircle,
  Send,
  MoreHorizontal,
  Flag,
  Share2,
  Star,
  StarOff
} from 'lucide-react';
import { TaskService } from '../services/taskService';
import { TaskCommentService } from '../services/taskCommentService';
import type { Task, TaskComment } from '../types';
import EditTaskModal from '../components/EditTaskModal';
import TaskReassignModal from '../components/TaskReassignModal';

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const loadTask = async () => {
    try {
      setLoading(true);
      const taskData = await TaskService.getTask(taskId!);
      setTask(taskData);
      setError(null);
    } catch (error) {
      console.error('خطأ في جلب تفاصيل المهمة:', error);
      setError('فشل في جلب تفاصيل المهمة');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!taskId) return;
    
    try {
      setLoadingComments(true);
      const comments = await TaskCommentService.getTaskComments(taskId);
      setTaskComments(comments);
    } catch (error) {
      console.error('خطأ في جلب التعليقات:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // وظائف الإجراءات السريعة
  const handleCompleteTask = async () => {
    if (!task || !taskId) return;
    
    try {
      await TaskService.updateTaskStatus(taskId, 'completed');
      await loadTask(); // إعادة تحميل المهمة
      alert('تم تسليم المهمة بنجاح');
    } catch (error) {
      console.error('خطأ في تسليم المهمة:', error);
      alert('فشل في تسليم المهمة');
    }
  };

  const handleRequestExtension = () => {
    alert('ميزة طلب تمديد الوقت ستتوفر قريباً');
  };

  const handleAddFollower = () => {
    alert('ميزة إضافة متابع ستتوفر قريباً');
  };

  const handleShareTask = () => {
    if (navigator.share) {
      navigator.share({
        title: task?.title || 'مهمة',
        text: task?.description || 'تفاصيل المهمة',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط المهمة');
    }
  };

  const handleReportIssue = () => {
    alert('ميزة الإبلاغ عن مشكلة ستتوفر قريباً');
  };

  useEffect(() => {
    if (taskId) {
      loadTask();
      loadComments();
    }
  }, [taskId]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMoreMenu) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: 'var(--font-size-lg)',
        color: 'var(--color-text-secondary)'
      }}>
        جاري تحميل تفاصيل المهمة...
      </div>
    );
  }

  if (error || !task) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-error)'
        }}>
          {error || 'المهمة غير موجودة'}
        </div>
        <button
          onClick={() => navigate('/tasks')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          العودة للمهام
        </button>
      </div>
    );
  }

  // Mock additional data
  const taskDocuments = [
    { 
      id: 'doc1', 
      name: 'العقد الأصلي.pdf',
      size: '2.5 MB',
      uploadedAt: new Date('2025-09-15')
    },
    { 
      id: 'doc2', 
      name: 'التعديل الأول.docx',
      size: '890 KB',
      uploadedAt: new Date('2025-09-18')
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'var(--color-gray-500)';
      case 'in_progress': return 'var(--color-blue-500)';
      case 'review': return 'var(--color-purple-500)';
      case 'completed': return 'var(--color-green-500)';
      case 'cancelled': return 'var(--color-red-500)';
      default: return 'var(--color-gray-500)';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'todo': return 'معلقة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'review': return 'تحت المراجعة';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغية';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'var(--color-green-500)';
      case 'medium': return 'var(--color-yellow-500)';
      case 'high': return 'var(--color-orange-500)';
      case 'urgent': return 'var(--color-red-500)';
      default: return 'var(--color-gray-500)';
    }
  };

  const getPriorityDisplayName = (priority: string) => {
    switch (priority) {
      case 'low': return 'منخفضة';
      case 'medium': return 'متوسطة';
      case 'high': return 'عالية';
      case 'urgent': return 'عاجلة';
      default: return priority;
    }
  };

  const handleReassignTask = async (taskId: string, reassignData: any) => {
    try {
      // يمكن إضافة API call هنا لاحقاً
      console.log('إعادة تعيين المهمة:', taskId, reassignData);
      setShowReassignModal(false);
      loadTask(); // إعادة تحميل المهمة
    } catch (error) {
      console.error('خطأ في إعادة تعيين المهمة:', error);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim() && taskId) {
      try {
        setLoadingComments(true);
        await TaskCommentService.createTaskComment(taskId, {
          comment: newComment.trim()
        });
        setNewComment('');
        // إعادة تحميل التعليقات
        await loadComments();
      } catch (error) {
        console.error('خطأ في إضافة التعليق:', error);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const getDaysUntilDue = (dueDate: Date | string) => {
    const today = new Date();
    const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = task.dueDate ? getDaysUntilDue(task.dueDate) : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/tasks')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)'
          }}
        >
          <ArrowRight style={{ height: '16px', width: '16px' }} />
          العودة للمهام
        </motion.button>

        <div style={{ 
          height: '24px', 
          width: '1px', 
          backgroundColor: 'var(--color-border)' 
        }} />

        <h1 style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text)',
          margin: 0,
          flex: 1
        }}>
          تفاصيل المهمة
        </h1>

        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsStarred(!isStarred)}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: isStarred ? 'var(--color-yellow-500)' : 'var(--color-text-secondary)'
            }}
          >
            {isStarred ? 
              <Star style={{ height: '16px', width: '16px' }} fill="currentColor" /> :
              <StarOff style={{ height: '16px', width: '16px' }} />
            }
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEditModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            <Edit style={{ height: '16px', width: '16px' }} />
            تعديل
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              position: 'relative'
            }}
          >
            <MoreHorizontal style={{ height: '16px', width: '16px' }} />
            
            {/* Dropdown Menu */}
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '8px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  minWidth: '180px',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => {
                    setShowReassignModal(true);
                    setShowMoreMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'right',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  إعادة تعيين المهمة
                </button>
                <button
                  onClick={() => {
                    console.log('أرشفة المهمة');
                    setShowMoreMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'right',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  أرشفة المهمة
                </button>
                <button
                  onClick={() => {
                    console.log('حذف المهمة');
                    setShowMoreMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'right',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-red-500)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  حذف المهمة
                </button>
              </motion.div>
            )}
          </motion.button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '24px' 
      }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Task Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <h2 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {task.title}
              </h2>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  padding: '4px 12px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  backgroundColor: `${getStatusColor(task.status)}15`,
                  color: getStatusColor(task.status),
                  borderRadius: '20px'
                }}>
                  {getStatusDisplayName(task.status)}
                </span>

                <span style={{
                  padding: '4px 12px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  backgroundColor: `${getPriorityColor(task.priority)}15`,
                  color: getPriorityColor(task.priority),
                  borderRadius: '20px'
                }}>
                  {getPriorityDisplayName(task.priority)}
                </span>
              </div>
            </div>

            <p style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.6',
              margin: 0,
              marginBottom: '20px'
            }}>
              {task.description}
            </p>

            {/* Task Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginTop: '20px',
              padding: '16px',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px'
            }}>
              <div>
                <span style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  تاريخ الإنشاء
                </span>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text)',
                  margin: '4px 0 0 0'
                }}>
                  {task.createdAt ? new Date(task.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                </p>
              </div>

              <div>
                <span style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  تاريخ الاستحقاق
                </span>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  color: daysUntilDue < 0 ? 'var(--color-red-500)' : 
                         daysUntilDue <= 3 ? 'var(--color-yellow-500)' : 'var(--color-text)',
                  margin: '4px 0 0 0',
                  fontWeight: daysUntilDue <= 3 ? 'var(--font-weight-medium)' : 'normal'
                }}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ar-SA') : 'غير محدد'}
                  {daysUntilDue < 0 && ' (متأخر)'}
                  {daysUntilDue === 0 && ' (اليوم)'}
                  {daysUntilDue > 0 && daysUntilDue <= 7 && ` (خلال ${daysUntilDue} أيام)`}
                </p>
              </div>

              <div>
                <span style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  الساعات المقدرة
                </span>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text)',
                  margin: '4px 0 0 0'
                }}>
                  {task.estimatedHours} ساعة
                </p>
              </div>

              <div>
                <span style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  الساعات الفعلية
                </span>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text)',
                  margin: '4px 0 0 0'
                }}>
                  {task.actualHours || 0} ساعة
                  {task.estimatedHours && task.actualHours && (
                    <span style={{
                      fontSize: 'var(--font-size-xs)',
                      color: task.actualHours > task.estimatedHours ? 'var(--color-red-500)' : 'var(--color-green-500)',
                      marginRight: '8px'
                    }}>
                      ({Math.round((task.actualHours / task.estimatedHours) * 100)}%)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Documents Section */}
          {task.documents && task.documents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '24px'
              }}
            >
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
                margin: 0,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FileText style={{ height: '20px', width: '20px' }} />
                الوثائق المرفقة ({taskDocuments.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {taskDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      backgroundColor: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText style={{ 
                        height: '16px', 
                        width: '16px', 
                        color: 'var(--color-text-secondary)' 
                      }} />
                      <div>
                        <p style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--color-text)',
                          margin: 0
                        }}>
                          {doc.name}
                        </p>
                        <p style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-secondary)',
                          margin: 0
                        }}>
                          {doc.size} • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        عرض
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        تحميل
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              margin: 0,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MessageSquare style={{ height: '20px', width: '20px' }} />
              التعليقات ({taskComments.length})
              {loadingComments && (
                <span style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginRight: '8px'
                }}>
                  جاري التحميل...
                </span>
              )}
            </h3>

            {/* Add Comment */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px'
            }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="إضافة تعليق جديد..."
                style={{
                  flex: 1,
                  minHeight: '80px',
                  padding: '12px',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  resize: 'vertical'
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                style={{
                  padding: '12px',
                  backgroundColor: newComment.trim() ? 'var(--color-primary)' : 'var(--color-border)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                  color: 'white'
                }}
              >
                <Send style={{ height: '16px', width: '16px' }} />
              </motion.button>
            </div>

            {/* Comments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {taskComments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text)'
                      }}>
                        {comment.user?.name || 'مستخدم غير معروف'}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'} {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString('ar-SA') : ''}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {comment.comment}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Case Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            <h3 style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              margin: 0,
              marginBottom: '16px'
            }}>
              القضية المرتبطة
            </h3>
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px'
            }}>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text)',
                margin: 0,
                marginBottom: '4px'
              }}>
                قضية الشركة الخليجية التجارية
              </p>
              <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                margin: 0,
                marginBottom: '4px'
              }}>
                رقم الملف: LAW-2025-001
              </p>
              <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                margin: 0
              }}>
                العميل: الشركة الخليجية للتجارة
              </p>
            </div>
          </motion.div>

          {/* Assigned User */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            <h3 style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              margin: 0,
              marginBottom: '16px'
            }}>
              المسؤول عن المهمة
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--color-primary)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User style={{ height: '20px', width: '20px', color: 'white' }} />
              </div>
              <div>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text)',
                  margin: 0
                }}>
                  أحمد محمد
                </p>
                <p style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  margin: 0
                }}>
                  محامي أول
                </p>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            <h3 style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              margin: 0,
              marginBottom: '16px'
            }}>
              إجراءات سريعة
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: CheckCircle, label: 'تسليم المهمة', color: 'var(--color-green-500)', onClick: handleCompleteTask },
                { icon: Clock, label: 'طلب تمديد الوقت', color: 'var(--color-yellow-500)', onClick: handleRequestExtension },
                { icon: User, label: 'إضافة متابع', color: 'var(--color-blue-500)', onClick: handleAddFollower },
                { icon: Share2, label: 'مشاركة المهمة', color: 'var(--color-purple-500)', onClick: handleShareTask },
                { icon: Flag, label: 'الإبلاغ عن مشكلة', color: 'var(--color-red-500)', onClick: handleReportIssue }
              ].map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.onClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                    textAlign: 'right',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${action.color}10`;
                    e.currentTarget.style.borderColor = action.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                >
                  <action.icon style={{ height: '16px', width: '16px', color: action.color }} />
                  {action.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        task={task}
        onTaskUpdated={() => {
          loadTask(); // إعادة تحميل المهمة بعد التعديل
          setShowEditModal(false);
        }}
      />

      {/* Reassign Task Modal */}
      <TaskReassignModal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        task={task}
        onReassign={handleReassignTask}
      />
    </div>
  );
};

export default TaskDetail;
