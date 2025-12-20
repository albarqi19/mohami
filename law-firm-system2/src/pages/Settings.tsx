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
  CreditCard,
  Receipt,
  Building2,
  Calendar,
  Check,
  X,
  Download,
  AlertCircle,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import NotificationSettings from '../components/NotificationSettings';
import { apiClient } from '../utils/api';
import { subscriptionService } from '../services/subscriptionService';
import type { SubscriptionData, Invoice } from '../services/subscriptionService';
import { tenantService } from '../services/tenantService';
import type { TenantData, TenantUpdateData } from '../services/tenantService';
import { useAuth } from '../contexts/AuthContext';
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
    { id: 'subscription', label: 'الاشتراك', icon: CreditCard, roles: ['admin'] },
    { id: 'invoices', label: 'الفواتير', icon: Receipt, roles: ['admin'] },
    { id: 'company', label: 'إعدادات الشركة', icon: Building2, roles: ['admin'] },
    { id: 'profile', label: 'الملف الشخصي', icon: User, roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { id: 'appearance', label: 'المظهر', icon: Palette, roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { id: 'privacy', label: 'الخصوصية والأمان', icon: Shield, roles: ['admin', 'lawyer', 'legal_assistant'] },
    { id: 'language', label: 'اللغة والمنطقة', icon: Globe, roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { id: 'system', label: 'النظام', icon: Database, roles: ['admin'] },
  ];

  // Get user from AuthContext
  const { user } = useAuth();
  const userRole = user?.role || 'admin';
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

  // Subscription State
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  // Invoices State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Company/Tenant State
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(false);
  const [savingTenant, setSavingTenant] = useState(false);
  const [tenantMessage, setTenantMessage] = useState('');
  const [tenantForm, setTenantForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    license_number: ''
  });

  // Load subscription when tab is active
  useEffect(() => {
    if (activeTab === 'subscription' && !subscriptionData) {
      loadSubscription();
    }
  }, [activeTab]);

  // Load invoices when tab is active
  useEffect(() => {
    if (activeTab === 'invoices' && invoices.length === 0) {
      loadInvoices();
    }
  }, [activeTab]);

  // Load tenant when company tab is active
  useEffect(() => {
    if (activeTab === 'company' && !tenantData) {
      loadTenant();
    }
  }, [activeTab]);

  const loadSubscription = async () => {
    try {
      setLoadingSubscription(true);
      const response = await subscriptionService.getCurrentSubscription();
      if (response.success) {
        setSubscriptionData(response.data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const response = await subscriptionService.getInvoices();
      if (response.success && response.data) {
        setInvoices(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const loadTenant = async () => {
    try {
      setLoadingTenant(true);
      const response: any = await tenantService.getTenant();
      if (response.success && response.data?.tenant) {
        const tenant = response.data.tenant;
        setTenantData(tenant);
        setTenantForm({
          name: tenant.name || '',
          email: tenant.email || '',
          phone: tenant.phone || '',
          address: tenant.address || '',
          license_number: tenant.license_number || ''
        });
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
    } finally {
      setLoadingTenant(false);
    }
  };

  const handleChangePlan = async (newPlan: 'monthly' | 'yearly') => {
    try {
      setChangingPlan(true);
      const response = await subscriptionService.subscribe(newPlan);
      if (response.success) {
        await loadSubscription();
        alert('تم تغيير الخطة بنجاح');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      alert('حدث خطأ أثناء تغيير الخطة');
    } finally {
      setChangingPlan(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('هل أنت متأكد من إلغاء الاشتراك؟')) return;

    try {
      setCancellingSubscription(true);
      const response = await subscriptionService.cancel();
      if (response.success) {
        await loadSubscription();
        alert('تم إلغاء الاشتراك. سيبقى نشطاً حتى نهاية المدة المدفوعة.');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('حدث خطأ أثناء إلغاء الاشتراك');
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleSaveTenant = async () => {
    try {
      setSavingTenant(true);
      setTenantMessage('');
      const response = await tenantService.updateTenant(tenantForm);
      if (response.success) {
        setTenantMessage('تم حفظ بيانات الشركة بنجاح');
        setTenantData(response.data);
        setTimeout(() => setTenantMessage(''), 3000);
      }
    } catch (error) {
      setTenantMessage('حدث خطأ أثناء حفظ البيانات');
      console.error('Error saving tenant:', error);
    } finally {
      setSavingTenant(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      active: { label: 'نشط', className: 'status-badge--success' },
      trial: { label: 'تجريبي', className: 'status-badge--warning' },
      pending: { label: 'في انتظار الدفع', className: 'status-badge--warning' },
      expired: { label: 'منتهي', className: 'status-badge--danger' },
      cancelled: { label: 'ملغي', className: 'status-badge--danger' },
      paid: { label: 'مدفوع', className: 'status-badge--success' },
      failed: { label: 'فشل', className: 'status-badge--danger' },
    };
    const config = statusConfig[status] || { label: status, className: '' };
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
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
                  <span>جاري تحميل بيانات الاشتراك...</span>
                </div>
              ) : subscriptionData ? (
                <>
                  {/* Current Plan Card */}
                  <div className="subscription-card">
                    <div className="subscription-card__header">
                      <div className="subscription-card__plan">
                        <CreditCard size={20} />
                        <div>
                          <h3>
                            {subscriptionData.subscription?.plan === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'}
                          </h3>
                          <p>
                            {subscriptionData.subscription?.plan === 'yearly'
                              ? '2,990 ر.س / سنة'
                              : '299 ر.س / شهر'}
                          </p>
                        </div>
                      </div>
                      <div className="subscription-card__status">
                        {getStatusBadge(subscriptionData.is_trial ? 'trial' : (subscriptionData.subscription?.status || 'expired'))}
                      </div>
                    </div>

                    {/* Trial Info */}
                    {subscriptionData.is_trial && subscriptionData.trial_days_remaining !== null && (
                      <div className="subscription-trial-alert">
                        <AlertCircle size={16} />
                        <span>
                          متبقي {Math.floor(subscriptionData.trial_days_remaining)} يوم على انتهاء الفترة التجريبية
                        </span>
                      </div>
                    )}

                    {/* Renewal Info */}
                    {subscriptionData.subscription?.renews_at && (
                      <div className="subscription-info-row">
                        <Calendar size={16} />
                        <span>التجديد القادم: {formatDate(subscriptionData.subscription.renews_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Plan Change Options */}
                  <div className="subscription-actions">
                    <h4>تغيير نوع الاشتراك</h4>
                    <div className="plan-toggle-buttons">
                      <button
                        className={`plan-toggle-btn ${subscriptionData.subscription?.plan === 'monthly' ? 'plan-toggle-btn--active' : ''}`}
                        onClick={() => handleChangePlan('monthly')}
                        disabled={changingPlan || subscriptionData.subscription?.plan === 'monthly'}
                      >
                        <div className="plan-toggle-btn__content">
                          <span className="plan-toggle-btn__title">شهري</span>
                          <span className="plan-toggle-btn__price">299 ر.س/شهر</span>
                        </div>
                        {subscriptionData.subscription?.plan === 'monthly' && <Check size={16} />}
                      </button>
                      <button
                        className={`plan-toggle-btn ${subscriptionData.subscription?.plan === 'yearly' ? 'plan-toggle-btn--active' : ''}`}
                        onClick={() => handleChangePlan('yearly')}
                        disabled={changingPlan || subscriptionData.subscription?.plan === 'yearly'}
                      >
                        <div className="plan-toggle-btn__content">
                          <span className="plan-toggle-btn__title">سنوي</span>
                          <span className="plan-toggle-btn__price">2,990 ر.س/سنة</span>
                          <span className="plan-toggle-btn__badge">وفر 20%</span>
                        </div>
                        {subscriptionData.subscription?.plan === 'yearly' && <Check size={16} />}
                      </button>
                    </div>
                    {changingPlan && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                        <Loader2 className="animate-spin" size={16} />
                        <span>جاري تغيير الخطة...</span>
                      </div>
                    )}
                  </div>

                  {/* Cancel Subscription */}
                  {subscriptionData.subscription?.status === 'active' && (
                    <div className="subscription-danger-zone">
                      <h4>إلغاء الاشتراك</h4>
                      <p>عند إلغاء الاشتراك، سيبقى حسابك نشطاً حتى نهاية الفترة المدفوعة.</p>
                      <button
                        className="settings-btn settings-btn--danger"
                        onClick={handleCancelSubscription}
                        disabled={cancellingSubscription}
                      >
                        {cancellingSubscription ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            جاري الإلغاء...
                          </>
                        ) : (
                          <>
                            <X size={16} />
                            إلغاء الاشتراك
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="subscription-empty">
                  <AlertCircle size={24} />
                  <p>لا يوجد اشتراك نشط</p>
                  <button
                    className="settings-btn settings-btn--primary"
                    onClick={() => handleChangePlan('monthly')}
                  >
                    اشترك الآن
                  </button>
                </div>
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
                  <span>جاري تحميل الفواتير...</span>
                </div>
              ) : invoices.length > 0 ? (
                <div className="invoices-table-wrapper">
                  <table className="invoices-table">
                    <thead>
                      <tr>
                        <th>رقم الفاتورة</th>
                        <th>التاريخ</th>
                        <th>المبلغ</th>
                        <th>الحالة</th>
                        <th>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td>{invoice.invoice_number}</td>
                          <td>{formatDate(invoice.created_at)}</td>
                          <td>{formatCurrency(invoice.total_amount)}</td>
                          <td>{getStatusBadge(invoice.status)}</td>
                          <td>
                            <button className="settings-btn settings-btn--small">
                              <Download size={14} />
                              تحميل
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="invoices-empty">
                  <Receipt size={32} />
                  <p>لا توجد فواتير حتى الآن</p>
                </div>
              )}
            </div>
          </div>
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
              {loadingTenant ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px' }}>
                  <Loader2 className="animate-spin" size={20} />
                  <span>جاري تحميل بيانات الشركة...</span>
                </div>
              ) : (
                <>
                  <div className="settings-form-grid">
                    <div className="settings-field">
                      <label className="settings-field__label">
                        <Building2 size={14} />
                        اسم الشركة / المكتب
                      </label>
                      <input
                        type="text"
                        className="settings-field__input"
                        value={tenantForm.name}
                        onChange={(e) => setTenantForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="مكتب المحاماة"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field__label">
                        <Mail size={14} />
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        className="settings-field__input"
                        value={tenantForm.email}
                        onChange={(e) => setTenantForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="info@lawfirm.com"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field__label">
                        <Phone size={14} />
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        className="settings-field__input"
                        value={tenantForm.phone}
                        onChange={(e) => setTenantForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+966 50 123 4567"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-field__label">
                        <Shield size={14} />
                        رقم الترخيص
                      </label>
                      <input
                        type="text"
                        className="settings-field__input"
                        value={tenantForm.license_number}
                        onChange={(e) => setTenantForm(prev => ({ ...prev, license_number: e.target.value }))}
                        placeholder="رقم ترخيص وزارة العدل"
                      />
                    </div>

                    <div className="settings-field settings-field--full">
                      <label className="settings-field__label">
                        <MapPin size={14} />
                        العنوان
                      </label>
                      <input
                        type="text"
                        className="settings-field__input"
                        value={tenantForm.address}
                        onChange={(e) => setTenantForm(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="الرياض، حي العليا، شارع الملك فهد"
                      />
                    </div>
                  </div>

                  <div className="settings-btn-group" style={{ marginTop: '20px' }}>
                    <button
                      className="settings-btn settings-btn--primary"
                      onClick={handleSaveTenant}
                      disabled={savingTenant}
                    >
                      {savingTenant ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          جاري الحفظ...
                        </>
                      ) : (
                        'حفظ التغييرات'
                      )}
                    </button>
                    {tenantMessage && (
                      <span style={{
                        color: tenantMessage.includes('خطأ') ? '#ef4444' : '#22c55e',
                        marginRight: '12px'
                      }}>
                        {tenantMessage}
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
                    defaultValue={user?.name || ''}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-field__label">رقم الهوية</label>
                  <input
                    type="text"
                    className="settings-field__input"
                    defaultValue={user?.nationalId || ''}
                    readOnly
                    style={{ backgroundColor: 'var(--quiet-gray-100)', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-field__label">رقم الهاتف</label>
                  <input
                    type="tel"
                    className="settings-field__input"
                    defaultValue={user?.phone || ''}
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

      default:
        return <div>التبويب غير موجود</div>;
    }
  };

  // Help content for each tab
  const helpContent: Record<string, { title: string; description: string; tips: string[]; links?: { label: string; href: string }[] }> = {
    notifications: {
      title: 'إعدادات الإشعارات',
      description: 'تحكم في كيفية استلام التنبيهات والإشعارات من النظام. يمكنك تخصيص نوع الإشعارات التي تريد استقبالها.',
      tips: [
        'فعّل إشعارات الجلسات لتذكيرك بمواعيد الجلسات القادمة',
        'يمكنك إيقاف الإشعارات مؤقتاً في أوقات محددة'
      ]
    },
    najiz: {
      title: 'ربط ناجز',
      description: 'إعدادات الربط التلقائي مع بوابة ناجز. عند تفعيل الربط التلقائي، سيتم ربط المحامين بالقضايا المستوردة تلقائيًا.',
      tips: [
        'تأكد من إدخال رقم هوية المحامي بشكل صحيح في ملفه الشخصي',
        'الربط يتم بناءً على رقم الهوية المطابق'
      ]
    },
    subscription: {
      title: 'إدارة الاشتراك',
      description: 'راجع خطتك الحالية وقم بترقية أو تغيير نوع اشتراكك. الانتقال للخطة السنوية يوفر لك 20%.',
      tips: [
        'الاشتراك السنوي أوفر من الشهري',
        'يمكنك إلغاء الاشتراك في أي وقت'
      ]
    },
    invoices: {
      title: 'سجل الفواتير',
      description: 'جميع فواتيرك السابقة وإيصالات الدفع متاحة هنا. يمكنك تحميل أي فاتورة بصيغة PDF.',
      tips: [
        'احتفظ بنسخة من الفواتير للمحاسبة',
        'الفواتير تُصدر تلقائياً عند كل عملية دفع'
      ]
    },
    company: {
      title: 'بيانات الشركة',
      description: 'معلومات شركتك ستظهر في التقارير والوثائق الرسمية. تأكد من دقة البيانات المدخلة.',
      tips: [
        'أضف رقم الترخيص لإظهاره في الوثائق',
        'البريد الإلكتروني يُستخدم للإشعارات الرسمية'
      ]
    },
    profile: {
      title: 'الملف الشخصي',
      description: 'معلوماتك الشخصية وبيانات الاتصال. يمكنك تحديث اسمك ورقم هاتفك.',
      tips: [
        'رقم الهوية لا يمكن تغييره',
        'تأكد من صحة رقم الهاتف للإشعارات'
      ]
    },
    appearance: {
      title: 'المظهر والثيم',
      description: 'خصص مظهر النظام حسب تفضيلاتك. اختر بين الوضع الفاتح أو الداكن أو التلقائي.',
      tips: [
        'الوضع الداكن أريح للعين في الإضاءة المنخفضة',
        'يمكنك تغيير حجم الخط لتسهيل القراءة'
      ]
    },
    privacy: {
      title: 'الخصوصية والأمان',
      description: 'إعدادات حماية حسابك. ننصح بتفعيل المصادقة الثنائية لحماية إضافية.',
      tips: [
        'غيّر كلمة المرور بشكل دوري',
        'فعّل المصادقة الثنائية لأمان أعلى'
      ]
    },
    language: {
      title: 'اللغة والمنطقة',
      description: 'إعدادات اللغة والتنسيق الزمني. اختر التقويم المناسب (هجري/ميلادي).',
      tips: [
        'التقويم الهجري متوفر للتواريخ',
        'المنطقة الزمنية تؤثر على مواعيد الجلسات'
      ]
    },
    system: {
      title: 'إعدادات النظام',
      description: 'إعدادات متقدمة للنظام تشمل النسخ الاحتياطي وتصدير البيانات.',
      tips: [
        'النسخ الاحتياطي التلقائي يحمي بياناتك',
        'يمكنك تصدير البيانات بصيغة Excel أو PDF'
      ]
    }
  };

  const currentHelp = helpContent[activeTab] || helpContent.notifications;

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
            {/* About This Section */}
            <div className="settings-help-panel__section">
              <div className="settings-help-panel__section-title">
                💡 {currentHelp.title}
              </div>
              <p className="settings-help-panel__section-text">
                {currentHelp.description}
              </p>
            </div>

            {/* Tips */}
            {currentHelp.tips.map((tip, index) => (
              <div key={index} className="settings-help-panel__tip">
                <span className="settings-help-panel__tip-icon">💡</span>
                <span className="settings-help-panel__tip-text">{tip}</span>
              </div>
            ))}

            {/* Quick Links */}
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
