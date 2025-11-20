import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  FileText, 
  Download, 
  Eye, 
  MessageSquare,
  Send,
  File,
  Image,
  FileVideo,
  Archive,
  User,
  Calendar,
  Tag,
  Loader2,
  AlertCircle,
  Brain,
  Trash2
} from 'lucide-react';
import Modal from './Modal';
import DocumentPreviewModal from './DocumentPreviewModal';
import SmartUploadModal from './SmartUploadModal';
import LegalMemoModal from './LegalMemoModal';
import AnalysisProgress from './AnalysisProgress';

import { DocumentService } from '../services/documentService';
import { LegalMemoService, type LegalMemo, type AnalysisStep } from '../services/legalMemoService';
import type { Document as DocumentType } from '../types';

// Add CSS for spinner animation
const spinnerStyle = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Inject the CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinnerStyle;
  document.head.appendChild(style);
}

interface CaseDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  caseTitle: string;
}

interface DocumentComment {
  id: string;
  content: string;
  is_internal: boolean;
  author?: {
    id: string;
    name: string;
    role?: string;
  } | null;
  created_at: string;
}

const CaseDocumentsModal: React.FC<CaseDocumentsModalProps> = ({
  isOpen,
  onClose,
  caseId,
  caseTitle
}) => {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [memos, setMemos] = useState<LegalMemo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [showSmartUpload, setShowSmartUpload] = useState(false);
  const [showCreateMemo, setShowCreateMemo] = useState(false);
  const [editingMemo, setEditingMemo] = useState<LegalMemo | null>(null);
  

  
  const [previewDocument, setPreviewDocument] = useState<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedAt: Date;
  } | null>(null);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  // متغيرات واجهة الخطوات للتحليل الذكي
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);
  const [showAnalysisProgress, setShowAnalysisProgress] = useState(false);

  // Load documents and memos when modal opens
  useEffect(() => {
    console.log('CaseDocumentsModal useEffect triggered:', { isOpen, caseId }); // للتشخيص
    if (isOpen && caseId) {
      loadDocuments();
      loadMemos();
    }
  }, [isOpen, caseId]);

  // Load comments when document is selected
  useEffect(() => {
    if (selectedDocument) {
      loadComments(selectedDocument.id);
    }
  }, [selectedDocument]);

  const loadDocuments = async () => {
    try {
      console.log('Loading documents for case:', caseId); // للتشخيص
      setLoading(true);
      setError(null);
      const result = await DocumentService.getCaseDocuments(caseId);
      console.log('Documents loaded:', result); // للتشخيص
      setDocuments(result || []);
    } catch (err) {
      console.error('Error loading case documents:', err); // هذا موجود بالفعل
      setError(err instanceof Error ? err.message : 'خطأ في تحميل الوثائق');
    } finally {
      setLoading(false);
    }
  };

  const loadMemos = async () => {
    try {
      console.log('Loading memos for case:', caseId);
      const result = await LegalMemoService.getCaseMemos(caseId);
      console.log('Memos loaded:', result);
      setMemos(result || []);
    } catch (err) {
      console.error('Error loading case memos:', err);
      // لا نعرض خطأ للمذكرات لأنها ميزة جديدة
    }
  };

  const loadComments = async (documentId: string) => {
    try {
      setLoadingComments(true);
      const result = await DocumentService.getDocumentComments(documentId);
      setComments(result || []);
    } catch (err) {
      console.error('Error loading comments:', err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedDocument) return;

    try {
      setAddingComment(true);
      await DocumentService.addDocumentComment(selectedDocument.id, newComment.trim());
      setNewComment('');
      // Reload comments
      await loadComments(selectedDocument.id);
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setAddingComment(false);
    }
  };

  const handleEditMemo = (memo: LegalMemo) => {
    setEditingMemo(memo);
    setShowCreateMemo(true);
  };

  const handleDeleteDocument = async (documentId: string, fileName: string) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف الوثيقة "${fileName}"؟\nلا يمكن التراجع عن هذا الإجراء.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await DocumentService.deleteDocument(documentId);
      // إعادة تحميل الوثائق
      await loadDocuments();
      // إذا كانت الوثيقة المحذوفة محددة حالياً، قم بإلغاء تحديدها
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error('خطأ في حذف الوثيقة:', error);
      alert('حدث خطأ أثناء حذف الوثيقة. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemo = async (memoId: string, memoTitle: string) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف المذكرة "${memoTitle}"؟\nلا يمكن التراجع عن هذا الإجراء.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await LegalMemoService.deleteMemo(memoId);
      // إعادة تحميل المذكرات
      await loadMemos();
    } catch (error) {
      console.error('خطأ في حذف المذكرة:', error);
      alert('حدث خطأ أثناء حذف المذكرة. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartAnalysisMemo = async (memoId: string, memoTitle: string) => {
    const confirmed = window.confirm(`هل تريد إجراء تحليل ذكي للمذكرة "${memoTitle}"؟\nقد يستغرق هذا بعض الوقت.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      setShowAnalysisProgress(true);
      setAnalysisSteps([]);

      // دالة لتحديث الخطوات
      const updateProgress = (step: AnalysisStep) => {
        setAnalysisSteps(prev => {
          const existingIndex = prev.findIndex(s => s.id === step.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = step;
            return updated;
          } else {
            return [...prev, step];
          }
        });
      };

      const response = await LegalMemoService.analyzeSmartly(parseInt(memoId), true, updateProgress); // إجبار إعادة التحليل
      console.log('استجابة التحليل الذكي من الخارج:', response);
      console.log('response.success:', response?.success);
      console.log('response.data:', response?.data);
      console.log('response.analysis_result:', response?.analysis_result);
      
      // التحقق من وجود analysis_result مباشرة في response أو في response.data
      const analysis = response?.analysis_result || response?.data?.analysis_result;
      
      if (response && analysis) {
        // دالة لتنسيق النص من JSON
        const formatAnalysisText = (text: string): string => {
          if (!text) return '';
          
          let processedText = text;
          
          // إذا كان النص يبدأ بـ { فهو JSON
          if (text.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(text);
              if (parsed.content) {
                processedText = parsed.content;
              }
            } catch (e) {
              // إذا فشل التحليل، نعرض النص كما هو
              console.warn('Failed to parse JSON:', e);
            }
          }
          
          return processedText
            // تحويل النص العريض
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1e293b; font-weight: 600;">$1</strong>')
            // تحويل النقاط
            .replace(/^\* (.+)$/gm, '<div style="margin: 8px 0; padding-right: 16px; position: relative;"><span style="position: absolute; right: 0; color: #218092;">•</span>$1</div>')
            // تحويل العناوين
            .replace(/^## (.+)$/gm, '<h4 style="color: #1e293b; font-weight: 600; margin: 16px 0 8px 0; font-size: 16px;">$1</h4>')
            .replace(/^# (.+)$/gm, '<h3 style="color: #1e293b; font-weight: 700; margin: 20px 0 12px 0; font-size: 18px;">$1</h3>')
            // تحويل الفقرات
            .replace(/\n\n/g, '</p><p style="margin: 12px 0; line-height: 1.7;">')
            .replace(/\n/g, '<br>')
            // إضافة تاج البداية والنهاية للفقرة
            .replace(/^/, '<p style="margin: 12px 0; line-height: 1.7;">')
            .replace(/$/, '</p>');
        };

        // عرض النتائج في منطقة الرسائل بتنسيق جميل
        let analysisDisplay = `
          <div style="direction: rtl; font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; max-height: 70vh; overflow-y: auto;">
            <div style="background: #218092; color: white; padding: 24px; border-radius: 12px 12px 0 0; margin-bottom: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.15); position: sticky; top: 0; z-index: 10;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 28px;">🎯</span>
                <h2 style="margin: 0; font-size: 24px; font-weight: bold;">نتائج التحليل الذكي</h2>
              </div>
              <p style="margin: 12px 0 0 0; opacity: 0.95; font-size: 16px;">المذكرة: ${memoTitle} | درجة الجودة: ${analysis.quality_score}/100</p>
            </div>
            
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              
              ${analysis.document_analysis ? `
              <div style="padding: 24px; border-bottom: 1px solid #f1f5f9; background: #f8fafc;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                  <span style="font-size: 22px;">📄</span>
                  <h3 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 600;">تحليل الوثائق المرفقة</h3>
                </div>
                <div style="color: #475569; margin: 0; background: white; padding: 20px; border-radius: 10px; border-right: 5px solid #3b82f6; line-height: 1.8; font-size: 15px;">${formatAnalysisText(analysis.document_analysis || '')}</div>
              </div>
              ` : ''}
              
              ${analysis.memo_analysis ? `
              <div style="padding: 24px; border-bottom: 1px solid #f1f5f9; background: #f0f9ff;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                  <span style="font-size: 22px;">⚖️</span>
                  <h3 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 600;">التحليل القانوني للمذكرة</h3>
                </div>
                <div style="color: #475569; margin: 0; background: white; padding: 20px; border-radius: 10px; border-right: 5px solid #2563eb; line-height: 1.8; font-size: 15px; max-height: none;">${formatAnalysisText(analysis.memo_analysis || '')}</div>
              </div>
              ` : ''}
              
              ${analysis.improvement_suggestions?.length ? `
              <div style="padding: 24px; border-bottom: 1px solid #f1f5f9; background: #f0fdf4;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                  <span style="font-size: 22px;">💡</span>
                  <h3 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 600;">اقتراحات التحسين</h3>
                </div>
                <div style="background: white; padding: 20px; border-radius: 10px; border-right: 5px solid #16a34a;">
                  ${analysis.improvement_suggestions.map((suggestion: string) => 
                    `<div style="margin-bottom: 12px; color: #475569; line-height: 1.6;">• ${suggestion}</div>`
                  ).join('')}
                </div>
              </div>
              ` : ''}
              
              ${analysis.legal_compliance_issues?.length ? `
              <div style="padding: 24px; background: #fff7ed;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                  <span style="font-size: 22px;">⚠️</span>
                  <h3 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 600;">نقاط الامتثال القانوني</h3>
                </div>
                <div style="background: white; padding: 20px; border-radius: 10px; border-right: 5px solid #ea580c;">
                  ${analysis.legal_compliance_issues.map((issue: string) => 
                    `<div style="margin-bottom: 12px; color: #475569; line-height: 1.6;">• ${issue}</div>`
                  ).join('')}
                </div>
              </div>
              ` : ''}
              
              <div style="padding: 15px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                <small style="color: #64748b;">✨ تم إجراء التحليل بواسطة Gemini AI</small>
                <br><button onclick="this.parentElement.parentElement.parentElement.parentElement.style.display='none'" style="margin-top: 10px; padding: 8px 16px; background: #218092; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s ease;" onmouseover="this.style.background='#1a6b79'" onmouseout="this.style.background='#218092'">إغلاق التحليل</button>
              </div>
            </div>
          </div>
        `;
        
        setError(analysisDisplay);
        
        // إعادة تحميل المذكرات لإظهار التحديثات
        await loadMemos();
      } else {
        setError('حدث خطأ أثناء التحليل الذكي: ' + (response?.message || 'خطأ غير معروف'));
        
        // إضافة خطوة الخطأ
        updateProgress({
          id: 'analysis_error',
          title: 'خطأ في التحليل',
          status: 'error',
          message: response?.message || 'خطأ غير معروف'
        });
      }

      // إنتظار قليل قبل إخفاء واجهة الخطوات
      setTimeout(() => {
        setShowAnalysisProgress(false);
      }, 2000);

    } catch (error) {
      console.error('خطأ في التحليل الذكي:', error);
      
      // إضافة خطوة الخطأ
      setAnalysisSteps(prev => [...prev, {
        id: 'fatal_error',
        title: 'خطأ في الاتصال',
        status: 'error',
        message: 'فشل في الاتصال بالخادم',
        error: (error as Error).message
      }]);

      // إخفاء واجهة الخطوات بعد فترة
      setTimeout(() => {
        setShowAnalysisProgress(false);
      }, 3000);

      alert('حدث خطأ أثناء التحليل الذكي. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (doc: DocumentType) => {
    const previewDoc = {
      id: doc.id,
      name: doc.file_name || doc.fileName || 'ملف غير معروف',
      size: doc.file_size || doc.fileSize || 0,
      type: doc.mime_type || doc.mimeType || 'application/octet-stream',
      url: `http://127.0.0.1:8000/api/v1/documents/${doc.id}/preview`,
      uploadedAt: doc.uploaded_at ? new Date(doc.uploaded_at) : (doc.uploadedAt || new Date())
    };
    setPreviewDocument(previewDoc);
  };

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const blob = await DocumentService.downloadDocument(docId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
    }
  };

  const getFileIcon = (doc: DocumentType) => {
    const mimeType = doc.mime_type || doc.mimeType || '';
    if (mimeType.includes('pdf')) {
      return <FileText size={20} style={{ color: '#dc2626' }} />;
    } else if (mimeType.includes('image')) {
      return <Image size={20} style={{ color: '#16a34a' }} />;
    } else if (mimeType.includes('video')) {
      return <FileVideo size={20} style={{ color: '#2563eb' }} />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
      return <Archive size={20} style={{ color: '#d97706' }} />;
    } else {
      return <File size={20} style={{ color: '#6b7280' }} />;
    }
  };

  const formatFileSize = (doc: DocumentType) => {
    const bytes = doc.file_size || doc.fileSize || 0;
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  return (
    <>
      {console.log('CaseDocumentsModal render:', { isOpen, caseId, caseTitle })} {/* للتشخيص */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" title="وثائق القضية">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '80vh',
          maxHeight: '600px'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            borderBottom: '1px solid var(--color-border)'
          }}>
            <div>
              <h2 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text)',
                margin: 0
              }}>
                وثائق القضية
              </h2>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                margin: '4px 0 0 0'
              }}>
                {caseTitle}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
              {/* Smart Upload Button */}
              <button
                onClick={() => setShowSmartUpload(true)}
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
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                }}
              >
                <Brain size={16} />
                رفع الوثيقة الذكي
              </button>

              {/* Create Legal Memo Button */}
              <button
                onClick={() => {
                  setEditingMemo(null); // تأكد من مسح أي مذكرة محددة للتعديل
                  setShowCreateMemo(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-success)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#15803d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-success)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                إنشاء مذكرة
              </button>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
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
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden'
          }}>
            {/* Documents List */}
            <div style={{
              flex: selectedDocument ? '0 0 60%' : 1,
              borderRight: selectedDocument ? '1px solid var(--color-border)' : 'none',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {loading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <Loader2 size={32} style={{ 
                    color: 'var(--color-primary)',
                    animation: 'spin 1s linear infinite' 
                  }} />
                  <p style={{ color: 'var(--color-text-secondary)' }}>جارٍ تحميل الوثائق...</p>
                </div>
              ) : error ? (
                <div style={{
                  display: 'flex',
                  alignItems: error.includes('<div') ? 'stretch' : 'center',
                  justifyContent: 'center',
                  flex: 1,
                  flexDirection: 'column',
                  gap: error.includes('<div') ? '0' : '16px',
                  padding: error.includes('<div') ? '0' : '20px',
                  maxHeight: error.includes('<div') ? '80vh' : 'auto',
                  overflowY: error.includes('<div') ? 'auto' : 'visible'
                }}>
                  {!error.includes('<div') && <AlertCircle size={32} style={{ color: 'var(--color-error)' }} />}
                  {error.includes('<div') ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: error }} 
                      style={{
                        width: '100%',
                        maxHeight: 'inherit',
                        overflowY: 'auto'
                      }}
                    />
                  ) : (
                    <p style={{ color: 'var(--color-error)' }}>{error}</p>
                  )}
                </div>
              ) : documents.length === 0 && memos.length === 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <FileText size={48} style={{ color: 'var(--color-text-tertiary)' }} />
                  <p style={{ color: 'var(--color-text-secondary)' }}>لا توجد وثائق أو مذكرات لهذه القضية</p>
                </div>
              ) : (
                <div style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '20px'
                }}>
                  <div style={{
                    display: 'grid',
                    gap: '12px'
                  }}>
                    {/* المذكرات القانونية */}
                    {memos.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{
                          fontSize: 'var(--font-size-lg)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text)',
                          marginBottom: '16px',
                          paddingBottom: '8px',
                          borderBottom: '2px solid var(--color-primary)'
                        }}>
                          📋 المذكرات القانونية ({memos.length})
                        </div>
                        
                        {memos.map((memo) => (
                          <motion.div
                            key={`memo-${memo.id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                              padding: '16px',
                              border: '1px solid var(--color-success)',
                              borderRadius: '8px',
                              backgroundColor: 'var(--color-success)10',
                              marginBottom: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--color-success)';
                              e.currentTarget.style.backgroundColor = 'var(--color-success)20';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--color-success)';
                              e.currentTarget.style.backgroundColor = 'var(--color-success)10';
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              marginBottom: '12px'
                            }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="14,2 14,8 20,8" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="16" y1="13" x2="8" y2="13" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="16" y1="17" x2="8" y2="17" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              
                              <div style={{ flex: 1 }}>
                                <h3 style={{
                                  margin: '0 0 4px 0',
                                  fontSize: 'var(--font-size-md)',
                                  fontWeight: 'var(--font-weight-semibold)',
                                  color: 'var(--color-text)'
                                }}>
                                  {memo.title}
                                </h3>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                  <span>نوع: {(LegalMemoService.getMemoCategories() as any)[memo.category]?.types?.[memo.memo_type] || memo.memo_type}</span>
                                  <span>الحالة: {(LegalMemoService.getStatusOptions() as any)[memo.status] || memo.status}</span>
                                  <span>تاريخ الإنشاء: {new Date(memo.created_at).toLocaleDateString('ar')}</span>
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditMemo(memo);
                                  }}
                                  style={{
                                    padding: '6px',
                                    border: '1px solid var(--color-success)',
                                    borderRadius: '4px',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--color-success)'
                                  }}
                                  title="تحرير المذكرة"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSmartAnalysisMemo(memo.id, memo.title);
                                  }}
                                  style={{
                                    padding: '6px',
                                    border: '1px solid var(--color-primary)',
                                    borderRadius: '4px',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--color-primary)'
                                  }}
                                  title="تحليل ذكي"
                                >
                                  <Brain size={16} />
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMemo(memo.id, memo.title);
                                  }}
                                  style={{
                                    padding: '6px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '4px',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-secondary)',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-error)';
                                    e.currentTarget.style.color = 'white';
                                    e.currentTarget.style.borderColor = 'var(--color-error)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                  }}
                                  title="حذف المذكرة"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            
                            {memo.content && (
                              <div style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-text-secondary)',
                                lineHeight: '1.5',
                                maxHeight: '60px',
                                overflow: 'hidden',
                                marginTop: '8px'
                              }}>
                                {memo.content.substring(0, 150)}{memo.content.length > 150 ? '...' : ''}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {/* الوثائق العادية */}
                    {documents.length > 0 && (
                      <div>
                        <div style={{
                          fontSize: 'var(--font-size-lg)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text)',
                          marginBottom: '16px',
                          paddingBottom: '8px',
                          borderBottom: '2px solid var(--color-primary)'
                        }}>
                          📄 الوثائق ({documents.length})
                        </div>
                      </div>
                    )}
                    
                    {documents.map((doc) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          padding: '16px',
                          border: `1px solid ${selectedDocument?.id === doc.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: '8px',
                          backgroundColor: selectedDocument?.id === doc.id ? 'var(--color-primary)10' : 'var(--color-background)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => setSelectedDocument(doc)}
                        onMouseEnter={(e) => {
                          if (selectedDocument?.id !== doc.id) {
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedDocument?.id !== doc.id) {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                          }
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '12px'
                        }}>
                          {getFileIcon(doc)}
                          <div style={{ flex: 1 }}>
                            <h4 style={{
                              fontSize: 'var(--font-size-md)',
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--color-text)',
                              margin: '0 0 4px 0'
                            }}>
                              {doc.title}
                            </h4>
                            <p style={{
                              fontSize: 'var(--font-size-sm)',
                              color: 'var(--color-text-secondary)',
                              margin: 0
                            }}>
                              {doc.file_name || doc.fileName} • {formatFileSize(doc)}
                            </p>
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '8px'
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreview(doc);
                              }}
                              style={{
                                background: 'none',
                                border: '1px solid var(--color-border)',
                                padding: '6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-secondary)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--color-text-secondary)';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                              }}
                              title="معاينة"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(doc.id, doc.file_name || doc.fileName || 'document');
                              }}
                              style={{
                                background: 'none',
                                border: '1px solid var(--color-border)',
                                padding: '6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-secondary)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-success)';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.borderColor = 'var(--color-success)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--color-text-secondary)';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                              }}
                              title="تحميل"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(doc.id, doc.file_name || doc.fileName || 'الوثيقة');
                              }}
                              style={{
                                background: 'none',
                                border: '1px solid var(--color-border)',
                                padding: '6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-text-secondary)',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-error)';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.borderColor = 'var(--color-error)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--color-text-secondary)';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                              }}
                              title="حذف الوثيقة"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {doc.description && (
                          <p style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-secondary)',
                            margin: '0 0 8px 0'
                          }}>
                            {doc.description}
                          </p>
                        )}

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-tertiary)'
                        }}>
                          {doc.uploader?.name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={12} />
                              <span>{doc.uploader.name}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            <span>{formatDate((doc.uploaded_at || doc.uploadedAt || new Date()).toString())}</span>
                          </div>
                          {doc.category && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Tag size={12} />
                              <span>{doc.category}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments Panel */}
            {selectedDocument && (
              <div style={{
                flex: '0 0 40%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-surface)'
              }}>
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  <h3 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text)',
                    margin: '0 0 8px 0'
                  }}>
                    التعليقات
                  </h3>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    margin: 0
                  }}>
                    {selectedDocument.title}
                  </p>
                </div>

                <div style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '20px'
                }}>
                  {loadingComments ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px'
                    }}>
                      <Loader2 size={20} style={{ 
                        color: 'var(--color-primary)',
                        animation: 'spin 1s linear infinite' 
                      }} />
                      <span style={{ color: 'var(--color-text-secondary)' }}>جارٍ تحميل التعليقات...</span>
                    </div>
                  ) : comments.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                      padding: '20px'
                    }}>
                      لا توجد تعليقات على هذه الوثيقة
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          style={{
                            padding: '12px',
                            backgroundColor: 'var(--color-background)',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px'
                          }}>
                            <User size={14} style={{ color: 'var(--color-primary)' }} />
                            <span style={{
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--color-text)'
                            }}>
                              {comment.author?.name || 'مستخدم غير معروف'}
                            </span>
                            <span style={{
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--color-text-tertiary)'
                            }}>
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text)',
                            margin: 0
                          }}>
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Comment */}
                <div style={{
                  padding: '20px',
                  borderTop: '1px solid var(--color-border)'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="اكتب تعليقاً..."
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        fontSize: 'var(--font-size-sm)',
                        minHeight: '60px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                      disabled={addingComment}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addingComment}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: newComment.trim() && !addingComment ? 'var(--color-primary)' : 'var(--color-gray-300)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: newComment.trim() && !addingComment ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {addingComment ? (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewDocument !== null}
        onClose={() => setPreviewDocument(null)}
        document={previewDocument}
      />
      
      {/* Smart Upload Modal */}
      <SmartUploadModal
        isOpen={showSmartUpload}
        onClose={() => setShowSmartUpload(false)}
        caseId={caseId}
        caseTitle={caseTitle}
        onDocumentAdded={() => {
          loadDocuments();
          setShowSmartUpload(false);
        }}
      />

      {/* Legal Memo Modal */}
      <LegalMemoModal
        isOpen={showCreateMemo}
        onClose={() => {
          setShowCreateMemo(false);
          setEditingMemo(null); // مسح المذكرة المحددة للتعديل
        }}
        caseId={caseId}
        caseTitle={caseTitle}
        editingMemo={editingMemo}
        onMemoCreated={(memo) => {
          console.log('تم إنشاء/تحديث مذكرة:', memo);
          setShowCreateMemo(false);
          setEditingMemo(null);
          loadMemos(); // إعادة تحميل المذكرات
        }}
      />

      {/* Analysis Progress Modal */}
      <AnalysisProgress
        steps={analysisSteps}
        isVisible={showAnalysisProgress}
      />

    </>
  );
};

export default CaseDocumentsModal;
