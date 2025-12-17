import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Grid,
    List,
    Filter,
    Clock,
    Star,
    Trash2,
    HardDrive,
    X,
    Share2,
    Copy
} from 'lucide-react';
import type { Document as DocumentType, Case } from '../types';
import DocumentUploadModal from '../components/DocumentUploadModal';
import LegalMemoModal from '../components/LegalMemoModal';
import { DocumentService } from '../services/documentService';
import { CaseService } from '../services/caseService';
import '../styles/documents-page.css';

const CACHE_KEY = 'documents_data';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const Documents: React.FC = () => {
    const [documents, setDocuments] = useState<DocumentType[]>(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return data.documents || [];
                }
            }
        } catch (e) { console.error('Cache error:', e); }
        return [];
    });
    const [loading, setLoading] = useState(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) return false;
            }
        } catch (e) { }
        return true;
    });
    const [cases, setCases] = useState<Case[]>(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return data.cases || [];
                }
            }
        } catch (e) { }
        return [];
    });

    // UI States
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

    // Selection & Split View
    const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);

    // Modals
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCreateMemo, setShowCreateMemo] = useState(false);

    useEffect(() => {
        // Only fetch if no cached data exists
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION && data.documents?.length > 0) {
                    // Cache is valid, already loaded in initial state
                    return;
                }
            } catch (e) { }
        }
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [docsRes, casesRes] = await Promise.all([
                DocumentService.getDocuments(),
                CaseService.getCases({ limit: 100 })
            ]);
            const docsData = docsRes.data || [];
            const casesData = casesRes.data || [];
            setDocuments(docsData);
            setCases(casesData);
            // Save to cache
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: { documents: docsData, cases: casesData },
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (mimeType: string) => {
        const type = mimeType?.toLowerCase() || '';
        if (type.includes('pdf')) return <FileText className="text-red-500" />;
        if (type.includes('word') || type.includes('document')) return <FileText className="text-blue-500" />;
        if (type.includes('image')) return <Image className="text-purple-500" />;
        if (type.includes('video')) return <FileVideo className="text-pink-500" />;
        if (type.includes('zip') || type.includes('compressed')) return <Archive className="text-yellow-500" />;
        return <File className="text-gray-400" />;
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Filter Logic
    const filteredDocuments = documents.filter(doc => {
        // Search
        const searchMatch = !searchTerm ||
            doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase());

        // Category
        let categoryMatch = true;
        if (activeCategory === 'recent') {
            categoryMatch = true; // Implement proper logic if available
        } else if (selectedCaseId) {
            categoryMatch = doc.relatedCaseId === selectedCaseId || doc.case_id === selectedCaseId;
        }

        return searchMatch && categoryMatch;
    });

    const handleDocumentClick = (doc: DocumentType) => {
        if (selectedDocument?.id === doc.id) {
            // Deselect if already selected ?? Maybe keep it open to avoid accidental closes
            // setSelectedDocument(null); 
        } else {
            setSelectedDocument(doc);
        }
    };

    const closePreview = () => {
        setSelectedDocument(null);
    };

    // Preview Pane Content
    const PreviewPane = ({ doc }: { doc: DocumentType }) => {
        const [blobUrl, setBlobUrl] = useState<string | null>(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
            const fetchPreview = async () => {
                setLoading(true);
                setError(null);
                // Clean up previous blob
                if (blobUrl) URL.revokeObjectURL(blobUrl);
                setBlobUrl(null);

                try {
                    const token = localStorage.getItem('authToken');
                    const response = await fetch(`http://127.0.0.1:8000/api/v1/documents/${doc.id}/preview`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!response.ok) throw new Error('Failed to load preview');

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    setBlobUrl(url);
                } catch (err) {
                    console.error(err);
                    setError('فشل تحميل المعاينة');
                } finally {
                    setLoading(false);
                }
            };

            fetchPreview();

            return () => {
                if (blobUrl) URL.revokeObjectURL(blobUrl);
            };
        }, [doc.id]);

        const isImage = doc.mimeType?.includes('image') || doc.mime_type?.includes('image');
        const isPdf = doc.mimeType?.includes('pdf') || doc.mime_type?.includes('pdf');

        return (
            <div className="docs-preview-pane">
                <div className="preview-header">
                    <div>
                        <div className="preview-title">{doc.title || doc.fileName}</div>
                        <div className="preview-meta">تم التعديل {new Date(doc.uploadedAt || doc.uploaded_at).toLocaleDateString('ar-SA')}</div>
                    </div>
                    <button className="preview-close-btn" onClick={closePreview}>
                        <X size={18} />
                    </button>
                </div>

                <div className="preview-body">
                    <div className="preview-content-area">
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                <span style={{ fontSize: 12 }}>جاري التحميل...</span>
                            </div>
                        ) : error ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-error)', fontSize: 13 }}>{error}</div>
                        ) : isImage && blobUrl ? (
                            <img src={blobUrl} alt="Preview" />
                        ) : isPdf && blobUrl ? (
                            <iframe src={blobUrl} title="PDF Preview" />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                                {getFileIcon(doc.mimeType || doc.mime_type)}
                                <span>لا توجد معاينة متاحة لهذا النوع</span>
                            </div>
                        )}
                    </div>



                    {doc.tags && doc.tags.length > 0 && (
                        <div className="preview-details-row">
                            <div className="preview-label">الوسوم</div>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {doc.tags.map(t => (
                                    <span key={t} style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{t}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="preview-actions">
                    <button className="preview-action-btn primary" onClick={() => console.log('Download')}>
                        <Download size={16} /> تنزيل
                    </button>
                    <button className="preview-action-btn">
                        <Share2 size={16} /> مشاركة
                    </button>
                    <button className="preview-action-btn">
                        <Copy size={16} /> نسخ
                    </button>
                    <button className="preview-action-btn" style={{ color: 'var(--color-error)' }}>
                        <Trash2 size={16} /> حذف
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="documents-page">
            {/* Header */}
            <div className="docs-header">
                <div className="docs-title-area">
                    <h1>
                        <HardDrive size={20} className="text-law-navy" />
                        الوثائق والملفات
                    </h1>
                    <p>إدارة مركزية لجميع مستندات القضايا والعملاء</p>
                </div>
                <div className="docs-actions">
                    <button
                        className="btn-secondary"
                        onClick={() => setShowCreateMemo(true)}
                    >
                        <FileText size={16} />
                        إنشاء مذكرة
                    </button>
                    <button
                        className="btn-upload"
                        onClick={() => setShowUploadModal(true)}
                    >
                        <Upload size={16} />
                        رفع ملفات
                    </button>
                </div>
            </div>

            <div className="docs-layout">
                {/* Sidebar */}
                <div className="docs-sidebar">
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">المكتبة</div>
                        <div
                            className={`sidebar-item ${activeCategory === 'all' && !selectedCaseId ? 'active' : ''}`}
                            onClick={() => { setActiveCategory('all'); setSelectedCaseId(null); }}
                        >
                            <Grid size={16} /> جميع الملفات
                        </div>
                        <div
                            className={`sidebar-item ${activeCategory === 'recent' ? 'active' : ''}`}
                            onClick={() => { setActiveCategory('recent'); setSelectedCaseId(null); }}
                        >
                            <Clock size={16} /> الأحدث
                        </div>
                        <div className="sidebar-item">
                            <Star size={16} /> المفضلة
                        </div>
                        <div className="sidebar-item">
                            <Trash2 size={16} /> المحذوفات
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-section-title">مجلدات القضايا</div>
                        {cases.slice(0, 10).map(c => (
                            <div
                                key={c.id}
                                className={`sidebar-item ${selectedCaseId === c.id ? 'active' : ''}`}
                                onClick={() => { setSelectedCaseId(c.id); setActiveCategory(''); }}
                            >
                                <Folder size={16} className="text-yellow-500" />
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {c.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area With Split View */}
                <div className={`docs-content-wrapper ${selectedDocument ? 'has-preview' : ''}`}>
                    {/* List/Grid Panel */}
                    <div className="docs-list-panel">
                        {/* Toolbar */}
                        <div className="docs-toolbar">
                            <div className="search-box">
                                <Search size={16} style={{ position: 'absolute', right: 12, top: 12, color: 'var(--color-text-secondary)' }} />
                                <input
                                    className="search-input"
                                    placeholder="بحث عن ملف..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn-secondary" style={{ padding: '8px' }}>
                                    <Filter size={16} /> تصفية
                                </button>
                                <div className="view-toggles">
                                    <button
                                        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <Grid size={16} />
                                    </button>
                                    <button
                                        className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Grid View */}
                        {viewMode === 'grid' && (
                            <div className="docs-grid">
                                {filteredDocuments.map(doc => (
                                    <motion.div
                                        key={doc.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={`doc-card ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                                        onClick={() => handleDocumentClick(doc)}
                                    >
                                        <div className="doc-preview">
                                            {getFileIcon(doc.mimeType || doc.mime_type)}
                                        </div>
                                        <div className="doc-info">
                                            <div className="doc-name" title={doc.title}>{doc.title || doc.fileName}</div>
                                            <div className="doc-meta">
                                                {formatSize(doc.fileSize || doc.file_size)} • {new Date(doc.uploadedAt || doc.uploaded_at).toLocaleDateString('ar-SA')}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* List View */}
                        {viewMode === 'list' && (
                            <div className="docs-list">
                                <div className="doc-list-header">
                                    <div className="header-cell">#</div>
                                    <div className="header-cell">الاسم</div>
                                    <div className="header-cell">الحجم</div>
                                    <div className="header-cell">النوع</div>
                                    <div className="header-cell">التاريخ</div>
                                    <div className="header-cell"></div>
                                </div>
                                {filteredDocuments.map(doc => (
                                    <motion.div
                                        key={doc.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={`doc-row ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                                        onClick={() => handleDocumentClick(doc)}
                                    >
                                        <div className="doc-row-icon">
                                            {getFileIcon(doc.mimeType || doc.mime_type)}
                                        </div>
                                        <div className="doc-row-name">
                                            {doc.title || doc.fileName}
                                        </div>
                                        <div className="doc-row-meta">
                                            {formatSize(doc.fileSize || doc.file_size)}
                                        </div>
                                        <div className="doc-row-meta">
                                            {doc.mimeType?.split('/')[1] || 'Unknown'}
                                        </div>
                                        <div className="doc-row-meta">
                                            {new Date(doc.uploadedAt || doc.uploaded_at).toLocaleDateString('ar-SA')}
                                        </div>
                                        <div className="doc-row-icon">
                                            <button className="view-toggle-btn">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {!loading && filteredDocuments.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <Folder size={32} />
                                </div>
                                <h3>لا توجد ملفات</h3>
                                <p>لم يتم العثور على ملفات في هذا المجلد أو البحث</p>
                            </div>
                        )}
                    </div>

                    {/* Preview Only Rendered When Selected */}
                    {selectedDocument && <PreviewPane doc={selectedDocument} />}
                </div>
            </div>

            {/* Modals */}
            {showUploadModal && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onUploadSuccess={loadData}
                    cases={cases}
                />
            )}

            {showCreateMemo && (
                <LegalMemoModal
                    isOpen={showCreateMemo}
                    onClose={() => setShowCreateMemo(false)}
                />
            )}
        </div>
    );
};

export default Documents;
