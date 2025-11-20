import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Search, 
  FileText, 
  Upload, 
  Save, 
  Brain, 
  AlertCircle,
  Check,
  Loader2
} from 'lucide-react';
import Modal from './Modal';
import TiptapEditor from './TiptapEditor';
import type { TiptapEditorRef } from './TiptapEditor';
import AnalysisProgress from './AnalysisProgress';
import { LegalMemoService, type AnalysisStep } from '../services/legalMemoService';


interface LegalMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  caseTitle?: string;
  onMemoCreated?: (memo: any) => void;
  editingMemo?: any; // المذكرة المراد تعديلها (اختياري)
}

// أنواع المذكرات مرتبة حسب الفئات
const MEMO_CATEGORIES = {
  opening: {
    name: 'مذكرات افتتاحية',
    types: {
      claim_petition: 'صحيفة دعوى',
      response_to_claim: 'مذكرة رد على صحيفة دعوى',
    }
  },
  pleading: {
    name: 'مذكرات المرافعة',
    types: {
      written_plea: 'مذكرة جوابية (مرافعة مكتوبة)',
      counter_plea: 'مذكرة تعقيبية',
      formal_objection: 'مذكرة بدفوع شكلية',
      substantive_objection: 'مذكرة بدفوع موضوعية',
    }
  },
  evidence: {
    name: 'مذكرات الإثبات والطلبات',
    types: {
      oath_request: 'مذكرة بطلب توجيه اليمين',
      witness_hearing: 'مذكرة بطلب سماع شهادة الشهود',
      expert_appointment: 'مذكرة بطلب ندب خبير أو محاسب',
      party_intervention: 'مذكرة بطلب إدخال خصم جديد',
      document_inspection: 'مذكرة بطلب الاطلاع على المستندات',
    }
  },
  appeal: {
    name: 'مذكرات الأحكام والطعن',
    types: {
      appeal_memo: 'مذكرة استئناف (لائحة اعتراضية)',
      reconsideration_request: 'مذكرة التماس إعادة النظر',
      cassation_appeal: 'مذكرة نقض (طعن أمام المحكمة العليا)',
    }
  },
  execution: {
    name: 'مذكرات التنفيذ',
    types: {
      execution_request: 'مذكرة بطلب تنفيذ حكم أو سند تنفيذي',
      execution_objection: 'مذكرة اعتراض على إجراءات التنفيذ',
      execution_suspension: 'مذكرة بطلب وقف التنفيذ',
      execution_dispute: 'مذكرة إشكال في التنفيذ (إشكال وقتي)',
    }
  },
  specialized: {
    name: 'مذكرات خاصة حسب نوع القضايا',
    types: {
      family_law_memo: 'مذكرة في دعاوى الأحوال الشخصية',
      endowment_memo: 'مذكرة في دعاوى الوقف والوصايا',
      criminal_law_memo: 'مذكرة في دعاوى الحدود والتعزيرات',
      commercial_memo: 'مذكرة في القضايا التجارية',
      labor_memo: 'مذكرة في القضايا العمالية',
      other: 'مذكرة أخرى',
    }
  }
};

const LegalMemoModal: React.FC<LegalMemoModalProps> = ({
  isOpen,
  onClose,
  caseId,
  caseTitle,
  onMemoCreated,
  editingMemo
}) => {
  const [step, setStep] = useState<'select_type' | 'create_memo'>('select_type');
  
  // اختيار نوع المذكرة
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMemoType, setSelectedMemoType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // بيانات المذكرة
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // حالة التطبيق
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [savedMemoId, setSavedMemoId] = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // حالة التحليل الذكي والخطوات
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([]);
  const [showAnalysisProgress, setShowAnalysisProgress] = useState<boolean>(false);
  
  // مرجع لمحرر Tiptap
  const editorRef = useRef<TiptapEditorRef>(null);
  
  // تتبع التغييرات
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedContent, setLastSavedContent] = useState<{
    title: string;
    content: string;
    memo_type: string;
    category: string;
  } | null>(null);
  


  // تحميل الوثائق المتاحة عند فتح النافذة
  useEffect(() => {
    if (isOpen && caseId) {
      loadAvailableDocuments();
    }
  }, [isOpen, caseId]);

  // تنظيف عند إغلاق النافذة
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // تحميل بيانات المذكرة للتعديل
  useEffect(() => {
    if (isOpen && editingMemo) {
      loadMemoForEditing(editingMemo);
    }
  }, [isOpen, editingMemo]);

  // تتبع التغييرات في المحتوى
  useEffect(() => {
    if (lastSavedContent) {
      const currentContent = {
        title: title.trim(),
        content: content.trim(),
        memo_type: selectedMemoType,
        category: selectedCategory
      };

      const contentChanged = (
        currentContent.title !== lastSavedContent.title ||
        currentContent.content !== lastSavedContent.content ||
        currentContent.memo_type !== lastSavedContent.memo_type ||
        currentContent.category !== lastSavedContent.category
      );

      setHasUnsavedChanges(contentChanged);
    }
  }, [title, content, selectedMemoType, selectedCategory, lastSavedContent]);

  const loadAvailableDocuments = async () => {
    try {
      // TODO: استدعاء API لجلب الوثائق المتاحة للقضية
      // const response = await DocumentService.getCaseDocuments(caseId);
      // setAvailableDocuments(response.data);
      setAvailableDocuments([]); // مؤقتاً
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const resetForm = () => {
    setStep('select_type');
    setSelectedCategory('');
    setSelectedMemoType('');
    setSearchTerm('');
    setTitle('');
    setContent('');
    setSelectedDocuments([]);
    setUploadedFiles([]);
    setError(null);
    setLastSaved(null);
    setSavedMemoId(null);
    setAnalysisResult(null);
    setHasUnsavedChanges(false);
    setLastSavedContent(null);
  };

  const handleMemoTypeSelect = (category: string, memoType: string) => {
    setSelectedCategory(category);
    setSelectedMemoType(memoType);
    
    // تعيين عنوان افتراضي بناء على نوع المذكرة
    const typeInfo = MEMO_CATEGORIES[category as keyof typeof MEMO_CATEGORIES];
    const typeName = typeInfo.types[memoType as keyof typeof typeInfo.types];
    setTitle(`${typeName}${caseTitle ? ` - ${caseTitle}` : ''}`);
    
    setStep('create_memo');
  };

  const handleBackToSelection = () => {
    setStep('select_type');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('يرجى إدخال عنوان للمذكرة');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // الحصول على المحتوى والبيانات من محرر Tiptap
      const editorContent = editorRef.current?.getHTML() || content;
      const editorData = editorRef.current?.getJSON() || null;

      let memo;

      // إذا كان هناك ملفات جديدة لرفعها
      if (uploadedFiles.length > 0) {
        // التحقق من وجود البيانات المطلوبة
        if (!title.trim()) {
          setError('يرجى إدخال عنوان للمذكرة');
          return;
        }
        if (!selectedMemoType) {
          setError('يرجى اختيار نوع المذكرة');
          return;
        }
        if (!selectedCategory) {
          setError('يرجى اختيار فئة المذكرة');
          return;
        }

        // رفع الملفات أولاً
        const formData = new FormData();
        uploadedFiles.forEach(file => {
          formData.append('files[]', file);
        });
        formData.append('case_id', caseId || '');
        formData.append('title', title.trim());
        formData.append('content', editorContent);
        formData.append('memo_type', selectedMemoType);
        formData.append('category', selectedCategory);
        formData.append('document_ids', JSON.stringify(selectedDocuments));
        formData.append('formatting_data', JSON.stringify(editorData));

        // إضافة debugging
        console.log('FormData being sent:', {
          title: title.trim(),
          memo_type: selectedMemoType,
          category: selectedCategory,
          filesCount: uploadedFiles.length
        });

        // تشخيص FormData
        console.log('FormData entries:');
        for (const [key, value] of formData.entries()) {
          console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
        }

        if (savedMemoId && editingMemo) {
          // تحديث المذكرة مع الملفات
          memo = await LegalMemoService.updateMemoWithFiles(savedMemoId.toString(), formData);
        } else {
          // إنشاء مذكرة جديدة مع الملفات
          memo = await LegalMemoService.createMemoWithFiles(formData);
          setSavedMemoId(Number(memo.id));
        }
      } else {
        // بدون ملفات، استخدام الطريقة العادية
        const memoData = {
          title,
          content: editorContent,
          memo_type: selectedMemoType,
          category: selectedCategory,
          case_id: caseId || undefined,
          document_ids: selectedDocuments.length > 0 ? selectedDocuments : undefined,
          formatting_data: editorData
        };

        if (savedMemoId && editingMemo) {
          // تحديث المذكرة الموجودة
          memo = await LegalMemoService.updateMemo(savedMemoId.toString(), memoData);
        } else {
          // إنشاء مذكرة جديدة
          memo = await LegalMemoService.createMemo(memoData);
          setSavedMemoId(Number(memo.id));
        }
      }
      
      setLastSaved(new Date());
      
      // حفظ المحتوى الحالي كآخر محتوى محفوظ
      setLastSavedContent({
        title: title.trim(),
        content: editorContent.trim(),
        memo_type: selectedMemoType,
        category: selectedCategory
      });
      
      // إعادة تعيين حالة التغييرات
      setHasUnsavedChanges(false);
      
      if (onMemoCreated) {
        onMemoCreated(memo);
      }
      
      // لا نغلق النافذة بعد الحفظ، بل نبقيها مفتوحة للتحليل
    } catch (error: any) {
      setError(error.message || 'فشل في حفظ المذكرة');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartAnalysis = async () => {
    if (!savedMemoId) {
      setError('يجب حفظ المذكرة أولاً قبل إجراء التحليل');
      return;
    }

    setLoading(true);
    setError(null);
    setIsAnalyzing(true);
    setShowAnalysisProgress(true);
    setAnalysisSteps([]);

    // دالة لتحديث خطوات التحليل
    const updateAnalysisStep = (step: AnalysisStep) => {
      setAnalysisSteps(prevSteps => {
        const existingIndex = prevSteps.findIndex(s => s.id === step.id);
        if (existingIndex >= 0) {
          const newSteps = [...prevSteps];
          newSteps[existingIndex] = step;
          return newSteps;
        }
        return [...prevSteps, step];
      });
    };

    try {
      const result = await LegalMemoService.analyzeSmartly(
        savedMemoId, 
        false, // forceReanalysis
        updateAnalysisStep
      );
      console.log('نتيجة التحليل الكاملة:', result);
      console.log('result.success:', result?.success);
      console.log('result.data:', result?.data);
      console.log('result.analysis_result:', result?.analysis_result);
      setAnalysisResult(result);
      
      // التحقق من وجود analysis_result مباشرة في result أو في result.data
      const analysis = result?.analysis_result || result?.data?.analysis_result;
      
      if (result && analysis) {
          console.log('نتائج التحليل:', analysis);
          
          // عرض النتائج في منطقة الرسائل بتنسيق جميل
          let analysisDisplay = `
            <div style="direction: rtl; font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8;">
              <div style="background: #218092; color: white; padding: 24px; border-radius: 12px 12px 0 0; margin-bottom: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.15); position: sticky; top: 0; z-index: 10;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 28px;">🎯</span>
                  <h2 style="margin: 0; font-size: 24px; font-weight: bold;">نتائج التحليل الذكي</h2>
                </div>
                <p style="margin: 12px 0 0 0; opacity: 0.95; font-size: 16px;">درجة الجودة: ${analysis.quality_score}/100</p>
              </div>
              
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                
                ${analysis.document_analysis ? `
                <div style="padding: 24px; border-bottom: 1px solid #f1f5f9; background: #f8fafc;">
                  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <span style="font-size: 22px;">📄</span>
                    <h3 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 600;">تحليل الوثائق المرفقة</h3>
                  </div>
                  <div style="color: #475569; margin: 0; white-space: pre-wrap; background: white; padding: 20px; border-radius: 10px; border-right: 5px solid #3b82f6; line-height: 1.8; font-size: 15px;">${analysis.document_analysis}</div>
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
                </div>
              </div>
            </div>
          `;
          
          setAnalysisResult({ display: analysisDisplay, rawData: analysis });
      } else {
        console.log('لا توجد نتائج تحليل في الاستجابة:', result);
        setError('تم إجراء التحليل الذكي بنجاح! ✅\n\nتم حفظ نتائج التحليل في المذكرة.');
      }
    } catch (error: any) {
      console.error('خطأ في handleSmartAnalysis:', error);
      
      let errorMessage = 'فشل في إجراء التحليل الذكي';
      
      if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'خطأ في الاتصال بالخادم. تأكد من أن الخادم يعمل.';
      }
      
      setError(errorMessage);
      
      // إضافة خطوة الخطأ النهائية
      updateAnalysisStep({
        id: 'final_error',
        title: 'خطأ في التحليل',
        status: 'error',
        message: errorMessage
      });
      
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
      
      // إخفاء واجهة الخطوات بعد 3 ثوانٍ
      setTimeout(() => {
        setShowAnalysisProgress(false);
      }, 3000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // فلترة أنواع المذكرات حسب البحث
  const getFilteredMemoTypes = () => {
    if (!searchTerm.trim()) return MEMO_CATEGORIES;
    
    const filtered: typeof MEMO_CATEGORIES = {} as any;
    Object.entries(MEMO_CATEGORIES).forEach(([categoryKey, categoryData]) => {
      const filteredTypes: any = {};
      Object.entries(categoryData.types).forEach(([typeKey, typeName]) => {
        if (typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            categoryData.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          filteredTypes[typeKey] = typeName;
        }
      });
      
      if (Object.keys(filteredTypes).length > 0) {
        (filtered as any)[categoryKey] = {
          ...categoryData,
          types: filteredTypes
        };
      }
    });
    
    return filtered;
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

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
      .replace(/^\* (.+)$/gm, '<div style="margin: 8px 0; padding-right: 16px; position: relative;"><span style="position: absolute; right: 0; color: #3b82f6;">•</span>$1</div>')
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

  const loadMemoForEditing = (memo: any) => {
    // تحميل بيانات المذكرة للتعديل
    setSelectedCategory(memo.category);
    setSelectedMemoType(memo.memo_type);
    setTitle(memo.title);
    setContent(memo.content);
    setSavedMemoId(memo.id);
    setLastSaved(memo.updated_at ? new Date(memo.updated_at) : null);
    
    // تحميل المحتوى في محرر Tiptap
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.setContent(memo.content || '');
      }
    }, 100);
    
    // تعيين المحتوى المحفوظ الحالي
    setLastSavedContent({
      title: memo.title.trim(),
      content: memo.content.trim(),
      memo_type: memo.memo_type,
      category: memo.category
    });
    
    // إعادة تعيين حالة التغييرات
    setHasUnsavedChanges(false);
    
    // إذا كانت هناك نتائج تحليل سابقة
    if (memo.analysis_result) {
      setAnalysisResult(memo.analysis_result);
    }
    
    // الانتقال مباشرة لخطوة التعديل
    setStep('create_memo');
  };

  if (!isOpen) return null;

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={editingMemo ? "تعديل مذكرة قانونية" : "إنشاء مذكرة قانونية"} size="xl">
      <div style={{ minHeight: '600px' }}>
        {step === 'select_type' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ 
                color: 'var(--color-text-secondary)', 
                marginBottom: '20px',
                fontSize: 'var(--font-size-sm)'
              }}>
                اختر نوع المذكرة القانونية التي تريد إنشاءها
              </p>
              
              {/* شريط البحث */}
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <Search 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-secondary)' 
                  }} 
                />
                <input
                  type="text"
                  placeholder="بحث في أنواع المذكرات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 45px 12px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: 'var(--font-size-sm)',
                    outline: 'none',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>
            </div>

            {/* قائمة أنواع المذكرات */}
            <div style={{ 
              maxHeight: '500px', 
              overflowY: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-surface)'
            }}>
              {Object.entries(getFilteredMemoTypes()).map(([categoryKey, categoryData]) => (
                <div key={categoryKey} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-gray-50)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                    borderBottom: '1px solid var(--color-border)'
                  }}>
                    {(categoryData as any).name}
                  </div>
                  
                  <div style={{ padding: '8px' }}>
                    {Object.entries((categoryData as any).types).map(([typeKey, typeName]) => (
                      <button
                        key={typeKey}
                        onClick={() => handleMemoTypeSelect(categoryKey, typeKey)}
                        style={{
                          width: '100%',
                          textAlign: 'right',
                          padding: '12px 16px',
                          margin: '4px 0',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          color: 'var(--color-text)',
                          fontSize: 'var(--font-size-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                        {String(typeName)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'create_memo' && (
          <div>
            {/* Header with back button */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <button
                onClick={handleBackToSelection}
                style={{
                  padding: '8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  cursor: 'pointer'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 12H5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                  {(MEMO_CATEGORIES as any)[selectedCategory]?.types[selectedMemoType]}
                </h3>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  {MEMO_CATEGORIES[selectedCategory as keyof typeof MEMO_CATEGORIES]?.name}
                </p>
              </div>
            </div>

            {error && (
              <div style={{
                padding: error.includes('<div') ? '0' : '12px',
                backgroundColor: error.includes('<div') ? 'transparent' : 'var(--color-error-light)',
                border: error.includes('<div') ? 'none' : '1px solid var(--color-error)',
                borderRadius: '6px',
                color: error.includes('<div') ? 'inherit' : 'var(--color-error)',
                marginBottom: '20px',
                display: error.includes('<div') ? 'block' : 'flex',
                alignItems: error.includes('<div') ? 'normal' : 'center',
                gap: error.includes('<div') ? 'normal' : '8px'
              }}>
                {!error.includes('<div') && <AlertCircle size={16} />}
                {error.includes('<div') ? (
                  <div dangerouslySetInnerHTML={{ __html: error }} />
                ) : (
                  error
                )}
              </div>
            )}

            {/* عنوان المذكرة */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text)',
                marginBottom: '8px'
              }}>
                عنوان المذكرة *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="أدخل عنوان المذكرة"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: 'var(--font-size-sm)',
                  outline: 'none',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)'
                }}
              />
            </div>

            {/* الوثائق المرتبطة */}
            {availableDocuments.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text)',
                  marginBottom: '8px'
                }}>
                  الوثائق المرتبطة (اختياري)
                </label>
                <div style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--color-surface)'
                }}>
                  {availableDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderBottom: '1px solid var(--color-border)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleDocumentSelection(doc.id)}
                      />
                      <FileText size={16} style={{ color: 'var(--color-text-secondary)' }} />
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                        {doc.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* رفع وثائق جديدة */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text)',
                marginBottom: '8px'
              }}>
                رفع وثائق جديدة (اختياري)
              </label>
              <div style={{
                border: '2px dashed var(--color-border)',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'var(--color-surface)',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('memo-file-upload')?.click()}
              >
                <Upload size={24} style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  اضغط لاختيار الملفات أو اسحبها هنا
                </p>
                <input
                  id="memo-file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>
              {/* عرض الملفات المرفوعة */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: '4px',
                      marginBottom: '4px'
                    }}>
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeUploadedFile(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-error)',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* محرر النص (نسخة مبسطة حالياً - سيتم استبدالها بـ Tiptap لاحقاً) */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <label style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text)'
                }}>
                  محتوى المذكرة
                </label>
                
                {lastSaved && (
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: hasUnsavedChanges ? 'var(--color-warning)' : 'var(--color-success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {hasUnsavedChanges ? (
                      <>
                        <AlertCircle size={12} />
                        يوجد تغييرات غير محفوظة
                      </>
                    ) : (
                      <>
                        <Check size={12} />
                        تم الحفظ {lastSaved.toLocaleTimeString('ar')}
                      </>
                    )}
                  </span>
                )}
              </div>
              
              <div style={{ minHeight: '300px' }}>
                <TiptapEditor
                  ref={editorRef}
                  content={content}
                  onChange={(html) => setContent(html)}
                  placeholder="اكتب محتوى المذكرة هنا..."
                  className="legal-memo-editor"
                />
              </div>
            </div>

            {/* أزرار الحفظ والتحليل */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              paddingTop: '20px',
              borderTop: '1px solid var(--color-border)'
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 20px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                إلغاء
              </button>
              
              <button
                onClick={handleSave}
                disabled={loading || !title.trim() || (!hasUnsavedChanges && !!savedMemoId)}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: hasUnsavedChanges || !savedMemoId ? 'var(--color-success)' : 
                    loading ? 'var(--color-gray-400)' : 'var(--color-success)',
                  color: 'white',
                  cursor: (hasUnsavedChanges || !savedMemoId) && !loading ? 'pointer' : 
                    loading ? 'not-allowed' : 'default',
                  fontSize: 'var(--font-size-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    جاري الحفظ...
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <Save size={16} />
                    {editingMemo ? 'حفظ التغييرات' : 'حفظ المذكرة'}
                  </>
                ) : savedMemoId ? (
                  <>
                    <Check size={16} />
                    تم الحفظ بنجاح
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingMemo ? 'تحديث المذكرة' : 'حفظ المذكرة'}
                  </>
                )}
              </button>
              
              <button
                onClick={handleSmartAnalysis}
                disabled={!savedMemoId || loading}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: savedMemoId ? 'var(--color-primary)' : 'var(--color-gray-400)',
                  color: 'white',
                  cursor: (savedMemoId && !loading) ? 'pointer' : 'not-allowed',
                  fontSize: 'var(--font-size-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                title={!savedMemoId ? 'يجب حفظ المذكرة أولاً قبل إجراء التحليل' : ''}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Brain size={16} />}
                تحليل ذكي
              </button>
              
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '12px 20px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <X size={16} />
                {savedMemoId ? 'إغلاق' : 'إلغاء'}
              </button>
            </div>

            {/* عرض نتائج التحليل الذكي */}
            {analysisResult?.display && (
              <div style={{ 
                marginTop: '24px',
                maxHeight: '70vh',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                backgroundColor: 'white'
              }}>
                <div 
                  dangerouslySetInnerHTML={{ __html: analysisResult.display }}
                  style={{ 
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--color-primary) transparent'
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
    
    {/* واجهة خطوات التحليل الذكي */}
    <AnalysisProgress 
      steps={analysisSteps}
      isVisible={showAnalysisProgress}
    />

    </>
  );
};

export default LegalMemoModal;
