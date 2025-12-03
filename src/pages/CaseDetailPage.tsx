import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Edit, 
  FileText, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  MapPin,
  DollarSign,
  AlertCircle,
  Plus,
  CheckSquare,
  Upload,
  Users,
  Clock,
  Building,
  Video,
  ExternalLink
} from 'lucide-react';
import Timeline from '../components/Timeline';
import EditCaseModal from '../components/EditCaseModal';
import AddTaskModal from '../components/AddTaskModal';
import CaseDocumentsModal from '../components/CaseDocumentsModal';
import CaseTasksModal from '../components/CaseTasksModal';
import { CaseAppointmentsModal } from '../components/CaseAppointmentsModal';
import QuickActionsModal from '../components/QuickActionsModal';
import type { TimelineEvent } from '../components/Timeline';
import { CaseService } from '../services/caseService';
import { ActivityService } from '../services/activityService';
import { DocumentService } from '../services/documentService';
import type { Case } from '../types';

const CaseDetailPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);

  useEffect(() => {
    fetchCaseAndActivities();
  }, [caseId]);

  const handleUpdateCase = async (updatedData: Partial<Case>) => {
    if (!caseId) return;
    
    try {
      const updatedCase = await CaseService.updateCase(caseId, updatedData);
      setCaseData(updatedCase);
    } catch (error: any) {
      throw new Error(error.message || 'فشل في تحديث القضية');
    }
  };

  const handleTaskAdded = async () => {
    // Refresh the page data to show the new task
    await fetchCaseAndActivities();
  };

  const fetchCaseAndActivities = async () => {
    if (!caseId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch case data, activities, and documents count in parallel
      const [caseData, activities, documents] = await Promise.all([
        CaseService.getCase(caseId),
        ActivityService.getCaseActivities(caseId) as Promise<any[]>,
        DocumentService.getCaseDocuments(caseId)
      ]);
      
      setCaseData(caseData);
      setDocumentsCount(documents ? documents.length : 0);
      
      // Convert activities to timeline events
      const timelineEventsData: TimelineEvent[] = activities.map(activity => ({
        id: activity.id.toString(),
        type: activity.type as TimelineEvent['type'],
        title: activity.title,
        description: activity.description || '',
        date: new Date(activity.date),
        user: activity.user,
        metadata: activity.metadata
      }));
      
      setTimelineEvents(timelineEventsData);
    } catch (err: any) {
      setError(err.message || 'فشل في جلب تفاصيل القضية');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل القضية...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'القضية غير موجودة'}</p>
          <Link
            to="/cases"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            العودة إلى قائمة القضايا
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    // حالات ناجز العربية
    if (statusLower.includes('منتهية') || statusLower.includes('مغلقة')) return '#94a3b8';
    if (statusLower.includes('جديدة')) return '#34d399';
    if (statusLower.includes('نشطة') || statusLower.includes('قيد النظر')) return '#fbbf24';
    if (statusLower.includes('معلقة')) return '#fb923c';
    if (statusLower.includes('مستأنفة')) return '#818cf8';
    if (statusLower.includes('محكومة')) return '#a78bfa';
    // الحالات الإنجليزية
    switch (statusLower) {
      case 'active': return 'var(--color-success)';
      case 'pending': return 'var(--color-warning)';
      case 'closed': return 'var(--color-secondary)';
      default: return 'var(--color-info)';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'عالية': return 'var(--color-error)';
      case 'متوسطة': return 'var(--color-warning)';
      case 'منخفضة': return 'var(--color-success)';
      default: return 'var(--color-secondary)';
    }
  };

  return (
    <div className="page-layout">
      {/* Breadcrumb */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '24px',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)'
      }}>
        <Link 
          to="/cases" 
          style={{ 
            color: 'var(--color-primary)', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <ArrowRight size={16} />
          القضايا
        </Link>
        <span>/</span>
        <span>{caseData.file_number}</span>
      </div>

      {/* Case Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: 'clamp(16px, 4vw, 24px)',
          marginBottom: '24px'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <h1 style={{
                fontSize: 'clamp(20px, 4vw, 28px)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text)',
                margin: 0
              }}>
                {caseData.title}
              </h1>
              <span style={{
                padding: '4px 12px',
                backgroundColor: `${getStatusColor(caseData.najiz_status || caseData.status)}15`,
                color: getStatusColor(caseData.najiz_status || caseData.status),
                borderRadius: '6px',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                {caseData.najiz_status || caseData.status}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)'
            }}>
              <span><strong>رقم الملف:</strong> {caseData.file_number}</span>
              <span><strong>النوع:</strong> {caseData.case_type}</span>
              <span style={{
                padding: '2px 8px',
                backgroundColor: `${getPriorityColor(caseData.priority)}15`,
                color: getPriorityColor(caseData.priority),
                borderRadius: '4px',
                fontSize: 'var(--font-size-xs)'
              }}>
                أولوية {caseData.priority}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setShowEditModal(true)}
              style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer'
            }}>
              <Edit size={16} />
              تعديل
            </button>
            <button 
              onClick={() => setShowAddTaskModal(true)}
              style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer'
            }}>
              <Plus size={16} />
              إضافة مهمة
            </button>
          </div>
        </div>

        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 1.6,
          margin: 0
        }}>
          {caseData.description}
        </p>
      </motion.div>

      {/* Case Subject - موضوع الدعوى */}
      {(caseData.case_subject || caseData.plaintiff_requests || caseData.case_demands || caseData.case_proofs) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: 'clamp(16px, 4vw, 24px)',
            marginBottom: '24px'
          }}
        >
          <h2 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FileText size={20} style={{ color: 'var(--color-primary)' }} />
            موضوع الدعوى
          </h2>
          
          {caseData.case_subject && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ 
                fontSize: 'var(--font-size-sm)', 
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-secondary)',
                marginBottom: '8px'
              }}>
                تفاصيل الدعوى:
              </h3>
              <p style={{
                color: 'var(--color-text)',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                backgroundColor: 'var(--color-bg)',
                padding: '12px',
                borderRadius: '8px'
              }}>
                {caseData.case_subject}
              </p>
            </div>
          )}
          
          {(caseData.case_demands || caseData.plaintiff_requests) && (
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ 
                fontSize: 'var(--font-size-sm)', 
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-success)',
                marginBottom: '8px'
              }}>
                مطالب المدعي:
              </h3>
              <p style={{
                color: 'var(--color-text)',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                backgroundColor: 'rgba(34, 197, 94, 0.08)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                {caseData.case_demands || caseData.plaintiff_requests}
              </p>
            </div>
          )}
          
          {caseData.case_proofs && (
            <div>
              <h3 style={{ 
                fontSize: 'var(--font-size-sm)', 
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-warning)',
                marginBottom: '8px'
              }}>
                أدلة الدعوى:
              </h3>
              <p style={{
                color: 'var(--color-text)',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                {caseData.case_proofs}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Parties Section - أطراف الدعوى */}
      {caseData.parties && caseData.parties.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: 'clamp(16px, 4vw, 24px)',
            marginBottom: '24px'
          }}
        >
          <h2 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Users size={20} style={{ color: 'var(--color-primary)' }} />
            أطراف الدعوى
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {/* المدعين */}
            <div>
              <h3 style={{ 
                fontSize: 'var(--font-size-sm)', 
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-success)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <User size={16} />
                قائمة المدعين
              </h3>
              {caseData.parties.filter((p: any) => p.side === 'plaintiff').map((party: any, idx: number) => (
                <div key={idx} style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}>
                    {party.name}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {party.role}
                    {party.party_type && ` • ${party.party_type}`}
                    {party.national_id && ` • هوية: ${party.national_id}`}
                    {party.commercial_reg && ` • سجل: ${party.commercial_reg}`}
                    {party.nationality && ` • ${party.nationality}`}
                  </div>
                </div>
              ))}
            </div>
            
            {/* المدعى عليهم */}
            <div>
              <h3 style={{ 
                fontSize: 'var(--font-size-sm)', 
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-error)',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <User size={16} />
                قائمة المدعى عليهم
              </h3>
              {caseData.parties.filter((p: any) => p.side === 'defendant').map((party: any, idx: number) => (
                <div key={idx} style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}>
                    {party.name}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {party.role}
                    {party.party_type && ` • ${party.party_type}`}
                    {party.national_id && ` • هوية: ${party.national_id}`}
                    {party.commercial_reg && ` • سجل: ${party.commercial_reg}`}
                    {party.nationality && ` • ${party.nationality}`}
                  </div>
                </div>
              ))}
            </div>

            {/* المحامون والوكلاء */}
            {caseData.parties.filter((p: any) => p.side === 'lawyer').length > 0 && (
              <div>
                <h3 style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-primary)',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <User size={16} />
                  المحامون والوكلاء
                </h3>
                {caseData.parties.filter((p: any) => p.side === 'lawyer').map((party: any, idx: number) => (
                  <div key={idx} style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}>
                      {party.name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {party.role}
                      {party.represents && ` • يمثل: ${party.represents}`}
                      {party.national_id && ` • هوية: ${party.national_id}`}
                      {party.nationality && ` • ${party.nationality}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Sessions Section - جلسات القضية */}
      {caseData.sessions && caseData.sessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: 'clamp(16px, 4vw, 24px)',
            marginBottom: '24px'
          }}
        >
          <h2 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
            جلسات القضية ({caseData.sessions.length})
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {caseData.sessions.map((session: any, idx: number) => {
              const isUpcoming = session.status === 'جديدة' || session.status === 'scheduled';
              return (
                <div key={idx} style={{
                  backgroundColor: isUpcoming ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-bg)',
                  border: isUpcoming ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: '10px',
                  padding: '16px',
                  position: 'relative'
                }}>
                  {isUpcoming && (
                    <span style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '16px',
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}>
                      جلسة قادمة
                    </span>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <h4 style={{ 
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text)',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                        {session.session_type || 'جلسة'}
                      </h4>
                      
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '16px',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={14} />
                          {session.session_date || 'غير محدد'}
                        </span>
                        {session.session_time && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} />
                            {session.session_time}
                          </span>
                        )}
                        {session.method && (
                          <span style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            backgroundColor: session.method === 'عن بعد' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            {session.method === 'عن بعد' ? <Video size={14} /> : <Building size={14} />}
                            {session.method}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'left' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                        backgroundColor: isUpcoming ? 'var(--color-success)' : 'var(--color-text-secondary)',
                        color: 'white'
                      }}>
                        {session.status || 'غير محدد'}
                      </span>
                    </div>
                  </div>
                  
                  {(session.court || session.department) && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex',
                      gap: '16px',
                      flexWrap: 'wrap',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {session.court && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Building size={12} />
                          {session.court}
                        </span>
                      )}
                      {session.department && (
                        <span>• {session.department}</span>
                      )}
                      {session.degree && (
                        <span>• {session.degree}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Najiz Link */}
      {caseData.najiz_url && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: 'var(--color-success)',
              borderRadius: '50%',
              padding: '8px'
            }}>
              <ExternalLink size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text)' }}>
                مستوردة من ناجز
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                {caseData.najiz_synced_at ? `آخر مزامنة: ${new Date(caseData.najiz_synced_at).toLocaleString('ar-SA')}` : ''}
              </div>
            </div>
          </div>
          <a
            href={caseData.najiz_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--color-success)',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            <ExternalLink size={16} />
            فتح في ناجز
          </a>
        </motion.div>
      )}

      {/* Case Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Client Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px'
          }}
        >
          <h2 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <User size={20} style={{ color: 'var(--color-primary)' }} />
            معلومات العميل
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: 'var(--font-size-sm)' }}>{caseData.client_name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: 'var(--font-size-sm)' }}>{caseData.client_phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: 'var(--font-size-sm)' }}>{caseData.client_email}</span>
            </div>
          </div>
        </motion.div>

        {/* Case Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px'
          }}
        >
          <h2 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FileText size={20} style={{ color: 'var(--color-primary)' }} />
            تفاصيل القضية
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: 'var(--font-size-sm)' }}>{caseData.court}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: 'var(--font-size-sm)' }}>{caseData.contract_value ? `${caseData.contract_value} ريال` : 'غير محدد'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: 'var(--font-size-sm)' }}>
                الجلسة القادمة: {
                  caseData.next_hearing 
                    ? (caseData.next_hearing instanceof Date 
                        ? caseData.next_hearing.toLocaleDateString('ar-SA') 
                        : new Date(caseData.next_hearing).toLocaleDateString('ar-SA'))
                    : 'لم يتم تحديدها'
                }
              </span>
            </div>
          </div>
        </motion.div>

        {/* Opponent Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px'
          }}
        >
          <h2 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={20} style={{ color: 'var(--color-warning)' }} />
            الطرف المقابل
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: 'var(--font-size-sm)' }}>{caseData.opponent_name || 'غير محدد'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: 'var(--font-size-sm)' }}>غير متوفر في قاعدة البيانات</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}
      >
        {[
          { icon: FileText, label: 'الوثائق', count: documentsCount.toString(), color: 'var(--color-info)', onClick: () => setShowDocumentsModal(true) },
          { icon: CheckSquare, label: 'المهام', count: '8', color: 'var(--color-warning)', onClick: () => setShowTasksModal(true) },
          { icon: Calendar, label: 'المواعيد', count: '3', color: 'var(--color-success)', onClick: () => setShowAppointmentsModal(true) },
          { icon: Upload, label: 'الملفات', count: '24', color: 'var(--color-purple-500)' }
        ].map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.label}
              onClick={action.onClick}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Icon size={24} style={{ color: action.color, marginBottom: '8px' }} />
              <div style={{
                fontSize: '20px',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text)',
                marginBottom: '4px'
              }}>
                {action.count}
              </div>
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                {action.label}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            الجدول الزمني للقضية
          </h2>
          <button
            onClick={() => setShowQuickActionsModal(true)}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <Plus className="h-4 w-4" />
            إجراءات سريعة
          </button>
        </div>
        <Timeline events={timelineEvents} caseId={caseData.id} />
      </motion.div>

      {/* Edit Case Modal */}
      <EditCaseModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        caseData={caseData}
        onSave={handleUpdateCase}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onTaskAdded={handleTaskAdded}
        caseId={caseData.id}
        caseTitle={caseData.title}
        clientName={caseData.client_name}
      />

      {/* Case Documents Modal */}
      <CaseDocumentsModal
        isOpen={showDocumentsModal}
        onClose={() => setShowDocumentsModal(false)}
        caseId={caseData.id}
        caseTitle={caseData.title}
      />

      {/* Tasks Modal */}
      <CaseTasksModal
        isOpen={showTasksModal}
        onClose={() => setShowTasksModal(false)}
        caseId={caseData.id}
        caseTitle={caseData.title}
      />

      {/* Appointments Modal */}
      <CaseAppointmentsModal
        isOpen={showAppointmentsModal}
        onClose={() => setShowAppointmentsModal(false)}
        caseData={caseData}
      />

      {/* Quick Actions Modal */}
      <QuickActionsModal
        isOpen={showQuickActionsModal}
        onClose={() => setShowQuickActionsModal(false)}
        caseId={caseData.id}
        caseTitle={caseData.title}
      />
    </div>
  );
};

export default CaseDetailPage;
