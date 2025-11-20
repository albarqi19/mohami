import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  MoreHorizontal, 
  Calendar,
  User,
  FileText,
  Download,
  Eye,
  Upload,
  Folder,
  File,
  Image,
  FileVideo,
  Archive,
  AlertCircle
} from 'lucide-react';
import type { Document as DocumentType, Case } from '../types';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import DocumentUploadModal from '../components/DocumentUploadModal';
import LegalMemoModal from '../components/LegalMemoModal';
import { DocumentService } from '../services/documentService';
import { CaseService } from '../services/caseService';

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [caseFilter, setCaseFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateMemo, setShowCreateMemo] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedAt: Date;
  } | null>(null);

  // Load documents and cases when component mounts
  useEffect(() => {
    loadDocuments();
    loadCases();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await DocumentService.getDocuments();
      setDocuments(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل الوثائق');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCases = async () => {
    try {
      const result = await CaseService.getCases({ limit: 1000 });
      setCases(result.data || []);
    } catch (err) {
      console.error('Error loading cases:', err);
    }
  };

  const getFileIcon = (doc: DocumentType) => {
    const mimeType = doc.mime_type || doc.mimeType || '';
    if (mimeType.includes('pdf')) {
      return <FileText style={{ height: '20px', width: '20px', color: 'var(--color-error)' }} />;
    } else if (mimeType.includes('image')) {
      return <Image style={{ height: '20px', width: '20px', color: 'var(--color-success)' }} />;
    } else if (mimeType.includes('video')) {
      return <FileVideo style={{ height: '20px', width: '20px', color: 'var(--color-primary)' }} />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
      return <Archive style={{ height: '20px', width: '20px', color: 'var(--color-warning)' }} />;
    } else {
      return <File style={{ height: '20px', width: '20px', color: 'var(--color-gray-500)' }} />;
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

  const getUploadDate = (document: DocumentType) => {
    const dateStr = document.uploaded_at;
    if (!dateStr) return 'غير محدد';
    
    try {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
      
      return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(dateObj);
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  const getUserName = (document: DocumentType) => {
    // Try to get user name from document's nested relationship first
    if (document.uploader?.name) {
      return document.uploader.name;
    }
    return 'غير محدد';
  };

  const getCaseInfo = (caseId?: string) => {
    if (!caseId) return null;
    const caseData = cases.find(c => c.id === caseId);
    if (caseData) {
      return {
        title: caseData.title,
        fileNumber: caseData.file_number
      };
    }
    return null;
  };

  const getFileTypeFromMime = (doc: DocumentType) => {
    const mimeType = doc.mime_type || doc.mimeType || '';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word')) return 'Word';
    if (mimeType.includes('excel')) return 'Excel';
    if (mimeType.includes('powerpoint')) return 'PowerPoint';
    if (mimeType.includes('image')) return 'صورة';
    if (mimeType.includes('video')) return 'فيديو';
    if (mimeType.includes('zip')) return 'مضغوط';
    return 'ملف';
  };

  const handleFilesUploaded = async () => {
    // Reload documents after successful upload
    await loadDocuments();
    setShowUploadModal(false);
  };

  const handlePreviewDocument = (doc: DocumentType) => {
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

  const handleDownload = async (docId: string) => {
    try {
      const blob = await DocumentService.downloadDocument(docId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documents.find(d => d.id === docId)?.file_name || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل الوثيقة');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const searchFields = [
      doc.title || '',
      doc.file_name || doc.fileName || '',
      ...(doc.tags || [])
    ];
    
    const matchesSearch = searchTerm === '' || 
      searchFields.some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCase = caseFilter === 'all' || 
      doc.case_id === caseFilter || 
      doc.relatedCaseId === caseFilter;
      
    const docMimeType = doc.mime_type || doc.mimeType || '';
    const matchesType = typeFilter === 'all' || docMimeType.includes(typeFilter);
    
    return matchesSearch && matchesCase && matchesType;
  });

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
            إدارة الوثائق
          </h1>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: 0
          }}>
            تنظيم وإدارة جميع الوثائق والملفات المتعلقة بالقضايا والمهام
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUploadModal(true)}
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
            <Upload style={{ height: '18px', width: '18px' }} />
            رفع وثيقة جديدة
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateMemo(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: 'var(--color-success)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            إنشاء مذكرة قانونية
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
              placeholder="البحث في الوثائق..."
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
            {cases.map((caseItem) => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.title} ({caseItem.file_number})
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
            نوع الملف
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
            <option value="pdf">PDF</option>
            <option value="word">Word</option>
            <option value="image">صور</option>
            <option value="zip">ملفات مضغوطة</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
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
              {/* Shimmer Effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shimmer 1.5s infinite'
              }} />
              
              {/* Document Icon Skeleton */}
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'var(--color-border)',
                borderRadius: '8px',
                marginBottom: '12px'
              }} />
              
              {/* Title Skeleton */}
              <div style={{
                height: '20px',
                backgroundColor: 'var(--color-border)',
                borderRadius: '4px',
                marginBottom: '8px',
                width: '80%'
              }} />
              
              {/* Description Skeleton */}
              <div style={{
                height: '16px',
                backgroundColor: 'var(--color-border)',
                borderRadius: '4px',
                marginBottom: '16px',
                width: '60%'
              }} />
              
              {/* Footer Info Skeleton */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  height: '14px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '4px',
                  width: '40%'
                }} />
                <div style={{
                  height: '20px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '10px',
                  width: '50px'
                }} />
              </div>
            </motion.div>
          ))}
        </div>
      ) : error ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '20px'
        }}>
          <AlertCircle style={{ 
            height: '48px', 
            width: '48px',
            color: 'var(--color-error)',
            marginBottom: '16px'
          }} />
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-error)',
            margin: '0 0 8px 0'
          }}>
            خطأ في تحميل الوثائق
          </h3>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            margin: '0 0 16px 0'
          }}>
            {error}
          </p>
          <button
            onClick={loadDocuments}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '20px'
        }}>
          {filteredDocuments.map((document) => {
          const caseInfo = getCaseInfo(document.relatedCaseId);
          
          return (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {document.isConfidential && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-error)',
                  backgroundColor: `var(--color-error)20`,
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  سري
                </div>
              )}
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'var(--color-background)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)'
                }}>
                  {getFileIcon(document)}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text)',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    {document.title}
                  </h4>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    marginBottom: '8px'
                  }}>
                    {document.fileName}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-primary)',
                      backgroundColor: `var(--color-primary)20`,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {getFileTypeFromMime(document)}
                    </span>
                    <span style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {formatFileSize(document)}
                    </span>
                  </div>
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
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '16px'
              }}>
                {/* Uploaded By */}
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
                    رفع بواسطة: 
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-primary)'
                  }}>
                    {getUserName(document)}
                  </span>
                </div>

                {/* Case Info */}
                {caseInfo && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Folder style={{ height: '16px', width: '16px', color: 'var(--color-text-secondary)' }} />
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

                {/* Upload Date */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Calendar style={{ height: '16px', width: '16px', color: 'var(--color-text-secondary)' }} />
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    تاريخ الرفع: 
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text)'
                  }}>
                    {getUploadDate(document)}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {document.tags && document.tags.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '16px'
                }}>
                  {document.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                        backgroundColor: 'var(--color-background)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePreviewDocument(document)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-primary)',
                      backgroundColor: `var(--color-primary)10`,
                      border: '1px solid var(--color-primary)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Eye style={{ height: '14px', width: '14px' }} />
                    عرض
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload(document.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-success)',
                      backgroundColor: `var(--color-success)10`,
                      border: '1px solid var(--color-success)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Download style={{ height: '14px', width: '14px' }} />
                    تحميل
                  </motion.button>
                </div>
                
                <span style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)'
                }}>
                  v{document.version}
                </span>
              </div>
            </motion.div>
          );
          })}
          
          {filteredDocuments.length === 0 && (
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
                لا توجد وثائق
              </h3>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                margin: 0
              }}>
                لم يتم العثور على وثائق تطابق المعايير المحددة
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleFilesUploaded}
        cases={cases}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewDocument !== null}
        onClose={() => setPreviewDocument(null)}
        document={previewDocument}
      />

      {/* Legal Memo Modal */}
      <LegalMemoModal
        isOpen={showCreateMemo}
        onClose={() => setShowCreateMemo(false)}
        onMemoCreated={(memo) => {
          console.log('تم إنشاء مذكرة جديدة:', memo);
          setShowCreateMemo(false);
          // يمكن إعادة تحميل الوثائق أو إضافة المذكرة للقائمة هنا لاحقاً
        }}
      />
    </div>
  );
};

export default Documents;
