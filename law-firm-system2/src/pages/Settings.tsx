import React, { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Monitor,
  Moon,
  Sun,
  Settings as SettingsIcon,
  Cloud,
  Link,
  Loader2,
  AlertCircle,
  Building2,
  CreditCard,
  Receipt,
  Save,
  Download,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import NotificationSettings from '../components/NotificationSettings';
import { apiClient } from '../utils/api';
import '../styles/settings-page.css';

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('notifications');

  const tabs: SettingsTab[] = [
    { id: 'notifications', label: 'الإشعارات', icon: Bell, roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { id: 'najiz', label: 'إعدادات ناجز', icon: Cloud, roles: ['admin'] },
    { id: 'profile', label: 'الملف الشخصي', icon: User, roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { id: 'appearance', label: 'المظهر', icon: Palette, roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { id: 'privacy', label: 'الخصوصية والأمان', icon: Shield, roles: ['admin', 'lawyer', 'legal_assistant'] },
    { id: 'language', label: 'اللغة والمنطقة', icon: Globe, roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { id: 'system', label: 'النظام', icon: Database, roles: ['admin'] },
    { id: 'company', label: 'إعدادات الشركة', icon: Building2, roles: ['admin'] },
    { id: 'subscription', label: 'الاشتراك', icon: CreditCard, roles: ['admin'] },
    { id: 'invoices', label: 'الفواتير', icon: Receipt, roles: ['admin'] },
  ];

  // Mock user role - في التطبيق الحقيقي سيأتي من AuthContext
  const userRole = 'admin';
  const visibleTabs = tabs.filter(tab => tab.roles.includes(userRole));

  // Najiz Settings State
  const [najizSettings, setNajizSettings] = useState({
    auto_link_lawyers: true,
    send_whatsapp_on_import: false,
    default_case_priority: 'medium'
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  // Company Settings State
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    license_number: ''
  });
  const [savingCompany, setSavingCompany] = useState(false);

  // Subscription State
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Invoices State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Load Najiz settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoadingSettings(true);
        const response: any = await apiClient.get('/tenant/settings');
        if (response.success) {
          setNajizSettings(prev => ({ ...prev, ...response.data }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  // Save Najiz settings
  const saveNajizSettings = async () => {
    try {
      setSavingSettings(true);
      setSettingsMessage('');
      const response: any = await apiClient.patch('/tenant/settings', najizSettings);
      if (response.success) {
        setSettingsMessage('تم حفظ الإعدادات بنجاح');
        setTimeout(() => setSettingsMessage(''), 3000);
      }
    } catch (error) {
      setSettingsMessage('حدث خطأ أثناء حفظ الإعدادات');
      console.error('Error saving settings:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notifications':
        return <NotificationSettings />;

      case 'najiz':
        return (
          <div className="settings-section">
            <div className="settings-section__header">
              <div className="settings-section__icon">
                <Cloud size={14} />
              </div>
              <span className="settings-section__title">إعدادات ناجز</span>
            </div>
            <div className="settings-section__content">
              {loadingSettings ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px' }}>
                  <Loader2 className="animate-spin" size={20} />
                  <span>جاري تحميل الإعدادات...</span>
                </div>
              ) : (
                <>
                  <div className="settings-option-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Link size={20} />
                      <div>
                        <div className="settings-option-card__title">ربط المحامين تلقائياً بالقضايا</div>
                        <div className="settings-option-card__desc">
                          عند استيراد القضايا من ناجز، يتم ربط المحامين تلقائياً بالقضايا بناءً على رقم الهوية.
                          <br />
                          <strong>ملاحظة:</strong> يجب أن يكون المحامي مسجلاً في النظام مسبقاً برقم هويته.
                        </div>
                      </div>
                    </div>
                    <div className="settings-option-card__actions" style={{ marginTop: '12px' }}>
                      <label className="settings-toggle">
                        <input
                          type="checkbox"
                          checked={najizSettings.auto_link_lawyers}
                          onChange={(e) => setNajizSettings(prev => ({
                            ...prev,
                            auto_link_lawyers: e.target.checked
                          }))}
                        />
                        <span className="settings-toggle__slider"></span>
                        <span style={{ marginRight: '12px' }}>
                          {najizSettings.auto_link_lawyers ? 'مفعّل' : 'معطّل'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="settings-btn-group" style={{ marginTop: '20px' }}>
                    <button
                      className="settings-btn settings-btn--primary"
                      onClick={saveNajizSettings}
                      disabled={savingSettings}
                    >
                      {savingSettings ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          جاري الحفظ...
                        </>
                      ) : (
                        'حفظ الإعدادات'
                      )}
                    </button>
                    {settingsMessage && (
                      <span style={{
                        color: settingsMessage.includes('خطأ') ? '#ef4444' : '#22c55e',
                        marginRight: '12px'
                      }}>
                        {settingsMessage}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="settings-section">
            <div className="settings-section__header">
              <div className="settings-section__icon">
                <User size={14} />
              </div>
              <span className="settings-section__title">الملف الشخصي</span>
            </div>
            <div className="settings-section__content">
              <div className="settings-form-grid">
                <div className="settings-field">
                  <label className="settings-field__label">الاسم الكامل</label>
                  <input
                    type="text"
                    className="settings-field__input"
                    defaultValue="أحمد محمد السالم"
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-field__label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="settings-field__input"
                    defaultValue="ahmed@lawfirm.com"
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-field__label">رقم الهاتف</label>
                  <input
                    type="tel"
                    className="settings-field__input"
                    defaultValue="+966501234567"
                  />
                </div>
              </div>

              <div className="settings-btn-group">
                <button className="settings-btn settings-btn--primary">
                  حفظ التغييرات
                </button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="settings-section">
            <div className="settings-section__header">
              <div className="settings-section__icon">
                <Palette size={14} />
              </div>
              <span className="settings-section__title">المظهر والثيم</span>
            </div>
            <div className="settings-section__content">
              <div style={{ marginBottom: '20px' }}>
                <label className="settings-field__label" style={{ marginBottom: '10px', display: 'block' }}>وضع الألوان</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'light', label: 'فاتح', icon: Sun },
                    { id: 'dark', label: 'داكن', icon: Moon },
                    { id: 'system', label: 'حسب النظام', icon: Monitor }
                  ].map((theme) => (
                    <label key={theme.id} className="settings-radio-option">
                      <input
                        type="radio"
                        name="theme"
                        value={theme.id}
                        defaultChecked={theme.id === 'light'}
                      />
                      <theme.icon className="settings-radio-option__icon" />
                      <span className="settings-radio-option__text">{theme.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-field__label">حجم الخط</label>
                <select className="settings-field__select" style={{ width: '150px' }}>
                  <option value="small">صغير</option>
                  <option value="medium" selected>متوسط</option>
                  <option value="large">كبير</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <>
            <div className="settings-section">
              <div className="settings-section__header">
                <div className="settings-section__icon">
                  <Shield size={14} />
                </div>
                <span className="settings-section__title">كلمة المرور</span>
              </div>
              <div className="settings-section__content">
                <div className="settings-option-card">
                  <div className="settings-option-card__title">تغيير كلمة المرور</div>
                  <div className="settings-option-card__desc">آخر تغيير: منذ 30 يوماً</div>
                  <div className="settings-option-card__actions">
                    <button className="settings-btn">تغيير كلمة المرور</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section__header">
                <div className="settings-section__icon">
                  <Shield size={14} />
                </div>
                <span className="settings-section__title">المصادقة الثنائية</span>
              </div>
              <div className="settings-section__content">
                <div className="settings-option-card">
                  <div className="settings-option-card__title">حماية إضافية لحسابك</div>
                  <div className="settings-option-card__desc">أضف طبقة أمان إضافية باستخدام رمز التحقق</div>
                  <div className="settings-option-card__actions">
                    <button className="settings-btn settings-btn--primary">تفعيل المصادقة الثنائية</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'language':
        return (
          <div className="settings-section">
            <div className="settings-section__header">
              <div className="settings-section__icon">
                <Globe size={14} />
              </div>
              <span className="settings-section__title">اللغة والمنطقة</span>
            </div>
            <div className="settings-section__content">
              <div className="settings-form-grid">
                <div className="settings-field">
                  <label className="settings-field__label">اللغة</label>
                  <select className="settings-field__select">
                    <option value="ar" selected>العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="settings-field">
                  <label className="settings-field__label">المنطقة الزمنية</label>
                  <select className="settings-field__select">
                    <option value="Asia/Riyadh" selected>توقيت السعودية (GMT+3)</option>
                    <option value="Asia/Dubai">توقيت الإمارات (GMT+4)</option>
                    <option value="Asia/Kuwait">توقيت الكويت (GMT+3)</option>
                  </select>
                </div>

                <div className="settings-field">
                  <label className="settings-field__label">تنسيق التاريخ</label>
                  <select className="settings-field__select">
                    <option value="hijri">هجري</option>
                    <option value="gregorian" selected>ميلادي</option>
                    <option value="both">هجري وميلادي</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <>
            <div className="settings-section">
              <div className="settings-section__header">
                <div className="settings-section__icon">
                  <Database size={14} />
                </div>
                <span className="settings-section__title">النسخ الاحتياطي</span>
              </div>
              <div className="settings-section__content">
                <div className="settings-option-card">
                  <div className="settings-option-card__title">إدارة النسخ الاحتياطية</div>
                  <div className="settings-option-card__desc">آخر نسخة احتياطية: اليوم 03:00 ص</div>
                  <div className="settings-option-card__actions">
                    <button className="settings-btn settings-btn--primary">إنشاء نسخة احتياطية</button>
                    <button className="settings-btn">جدولة النسخ الاحتياطي</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section__header">
                <div className="settings-section__icon">
                  <Database size={14} />
                </div>
                <span className="settings-section__title">تصدير البيانات</span>
              </div>
              <div className="settings-section__content">
                <div className="settings-option-card">
                  <div className="settings-option-card__title">تصدير جميع البيانات</div>
                  <div className="settings-option-card__desc">تصدير البيانات بصيغ مختلفة</div>
                  <div className="settings-option-card__actions">
                    <button className="settings-btn settings-btn--success">تصدير Excel</button>
                    <button className="settings-btn settings-btn--info">تصدير PDF</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'company':
        return (
          <div className="settings-section">
            <div className="settings-section__header">
              <div className="settings-section__icon">
                <Building2 size={14} />
              </div>
              <span className="settings-section__title">معلومات الشركة</span>
            </div>
            <div className="settings-section__content">
              <div className="settings-form">
                <div className="settings-form__group">
                  <label className="settings-form__label">اسم الشركة</label>
                  <input
                    type="text"
                    className="settings-form__input"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مكتب المحاماة"
                  />
                </div>
                <div className="settings-form__group">
                  <label className="settings-form__label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="settings-form__input"
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="info@lawfirm.sa"
                  />
                </div>
                <div className="settings-form__group">
                  <label className="settings-form__label">رقم الهاتف</label>
                  <input
                    type="tel"
                    className="settings-form__input"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+966 50 000 0000"
                  />
                </div>
                <div className="settings-form__group">
                  <label className="settings-form__label">العنوان</label>
                  <input
                    type="text"
                    className="settings-form__input"
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="الرياض، المملكة العربية السعودية"
                  />
                </div>
                <div className="settings-form__group">
                  <label className="settings-form__label">رقم الترخيص</label>
                  <input
                    type="text"
                    className="settings-form__input"
                    value={companyInfo.license_number}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, license_number: e.target.value }))}
                    placeholder="1234567890"
                  />
                </div>
                <div className="settings-btn-group">
                  <button
                    className="settings-btn settings-btn--primary"
                    disabled={savingCompany}
                  >
                    {savingCompany ? (
                      <><Loader2 className="animate-spin" size={16} /> جاري الحفظ...</>
                    ) : (
                      <><Save size={16} /> حفظ التغييرات</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="settings-section">
            <div className="settings-section__header">
              <div className="settings-section__icon">
                <CreditCard size={14} />
              </div>
              <span className="settings-section__title">إدارة الاشتراك</span>
            </div>
            <div className="settings-section__content">
              {loadingSubscription ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px' }}>
                  <Loader2 className="animate-spin" size={20} />
                  <span>جاري التحميل...</span>
                </div>
              ) : (
                <>
                  <div className="settings-subscription-card">
                    <div className="settings-subscription-card__header">
                      <div className="settings-subscription-card__badge">
                        <CheckCircle size={16} />
                        نشط
                      </div>
                    </div>
                    <div className="settings-subscription-card__content">
                      <div className="settings-subscription-card__plan">الباقة الحالية</div>
                      <div className="settings-subscription-card__price">299 ر.س / شهرياً</div>
                      <div className="settings-subscription-card__info">
                        <Calendar size={14} />
                        التجديد القادم: 15 يناير 2025
                      </div>
                    </div>
                    <div className="settings-subscription-card__actions">
                      <button className="settings-btn settings-btn--primary">
                        الترقية للسنوي (2990 ر.س)
                      </button>
                      <button className="settings-btn settings-btn--danger">
                        إلغاء الاشتراك
                      </button>
                    </div>
                  </div>

                  <div className="settings-option-card" style={{ marginTop: '16px' }}>
                    <div className="settings-option-card__title">خيارات الدفع</div>
                    <div className="settings-option-card__desc">
                      <strong>شهري:</strong> 299 ر.س/شهر
                      <br />
                      <strong>سنوي:</strong> 2990 ر.س/سنة (وفر شهرين!)
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'invoices':
        return (
          <div className="settings-section">
            <div className="settings-section__header">
              <div className="settings-section__icon">
                <Receipt size={14} />
              </div>
              <span className="settings-section__title">سجل الفواتير</span>
            </div>
            <div className="settings-section__content">
              {loadingInvoices ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px' }}>
                  <Loader2 className="animate-spin" size={20} />
                  <span>جاري التحميل...</span>
                </div>
              ) : (
                <div className="settings-invoices-table">
                  <table className="settings-table">
                    <thead>
                      <tr>
                        <th>رقم الفاتورة</th>
                        <th>التاريخ</th>
                        <th>المبلغ</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>INV-2024-001</td>
                        <td>15/12/2024</td>
                        <td>299 ر.س</td>
                        <td><span className="settings-badge settings-badge--success">مدفوع</span></td>
                        <td>
                          <button className="settings-btn settings-btn--small">
                            <Download size={14} />
                            تحميل
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>INV-2024-002</td>
                        <td>15/11/2024</td>
                        <td>299 ر.س</td>
                        <td><span className="settings-badge settings-badge--success">مدفوع</span></td>
                        <td>
                          <button className="settings-btn settings-btn--small">
                            <Download size={14} />
                            تحميل
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  {invoices.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      لا توجد فواتير حالياً
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <div>التبويب غير موجود</div>;
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <div className="settings-header__title-area">
          <h1>
            <SettingsIcon size={18} />
            الإعدادات
          </h1>
          <p>إدارة تفضيلاتك وإعدادات النظام</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sidebar */}
        <div className="settings-sidebar">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-sidebar__tab ${activeTab === tab.id ? 'settings-sidebar__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="settings-content">
          {renderTabContent()}
        </div>

        {/* Help Panel */}
        <div className="settings-help-panel">
          <div className="settings-help-panel__header">
            <div className="settings-help-panel__icon">
              <AlertCircle size={16} />
            </div>
            <span className="settings-help-panel__title">المساعدة</span>
          </div>

          <div className="settings-help-panel__content">
            <div className="settings-help-panel__section">
              <div className="settings-help-panel__section-title">
                💡 {activeTab === 'notifications' && 'إعدادات الإشعارات'}
                {activeTab === 'najiz' && 'إعدادات ناجز'}
                {activeTab === 'profile' && 'الملف الشخصي'}
                {activeTab === 'appearance' && 'المظهر'}
                {activeTab === 'privacy' && 'الخصوصية والأمان'}
                {activeTab === 'language' && 'اللغة والمنطقة'}
                {activeTab === 'system' && 'إعدادات النظام'}
              </div>
              <p className="settings-help-panel__section-text">
                {activeTab === 'notifications' && 'تحكم في كيفية استلام التنبيهات والإشعارات من النظام.'}
                {activeTab === 'najiz' && 'إدارة اتصال ناجز وخيارات الاستيراد التلقائي.'}
                {activeTab === 'profile' && 'تحديث معلوماتك الشخصية وبيانات الاتصال.'}
                {activeTab === 'appearance' && 'تخصيص مظهر النظام والألوان.'}
                {activeTab === 'privacy' && 'إدارة إعدادات الأمان وكلمة المرور.'}
                {activeTab === 'language' && 'تغيير اللغة والمنطقة الزمنية.'}
                {activeTab === 'system' && 'إدارة النسخ الاحتياطي وتصدير البيانات.'}
              </p>
            </div>

            <div className="settings-help-panel__tip">
              <span className="settings-help-panel__tip-icon">💡</span>
              <span className="settings-help-panel__tip-text">
                {activeTab === 'notifications' && 'فعّل إشعارات الجلسات لتذكيرك بمواعيد الجلسات القادمة'}
                {activeTab === 'najiz' && 'تأكد من صحة بيانات اتصال ناجز قبل الاستيراد'}
                {activeTab === 'profile' && 'تأكد من تحديث رقم الهاتف لاستقبال الإشعارات'}
                {activeTab === 'appearance' && 'جرب الوضع الداكن لتقليل إجهاد العين'}
                {activeTab === 'privacy' && 'غيّر كلمة المرور بشكل دوري لحماية حسابك'}
                {activeTab === 'language' && 'اختر المنطقة الزمنية المناسبة لعرض مواعيد الجلسات بشكل صحيح'}
                {activeTab === 'system' && 'قم بعمل نسخ احتياطي دوري للحفاظ على بياناتك'}
              </span>
            </div>

            <div className="settings-help-panel__link">
              <Globe size={14} />
              فتح دليل المستخدم
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
