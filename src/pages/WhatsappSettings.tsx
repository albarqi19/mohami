import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';
import { 
  MessageSquare, 
  Settings, 
  Save, 
  RefreshCw, 
  Send, 
  Clock,
  Globe,
  Phone,
  Key,
  Bell,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Smartphone,
  QrCode,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface WhatsappSettings {
  id?: number;
  webhook_url?: string;
  access_token?: string;
  verify_token?: string;
  phone_number_id?: string;
  notifications_enabled: boolean;
  notification_settings: Record<string, any>;
  message_templates: Record<string, any>;
  daily_report_time: string;
  daily_report_enabled: boolean;
  working_hours: Record<string, any>;
}

interface WhatsappInstance {
  id: string;
  instance_name: string;
  phone_number?: string;
  status: 'disconnected' | 'connecting' | 'connected';
  qr_code?: string;
  token: string;
  department: string;
  created_at: string;
}

// API helper function
const api = {
  get: async (url: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8000/api${url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return { data: await response.json() };
  },
  put: async (url: string, data: any) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8000/api${url}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return { data: await response.json() };
  },
  post: async (url: string, data?: any) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:8000/api${url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });
    return { data: await response.json() };
  }
};

const WhatsappSettings: React.FC = () => {
  const [settings, setSettings] = useState<WhatsappSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [testMessage, setTestMessage] = useState({ phone: '', message: '' });
  const [sendingTest, setSendingTest] = useState(false);
  
  // WhatsApp Instances State
  const [instances, setInstances] = useState<WhatsappInstance[]>([]);
  const [showAddInstance, setShowAddInstance] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstanceDepartment, setNewInstanceDepartment] = useState('');
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // محاكاة بيانات الإعدادات للاختبار
      const mockSettings: WhatsappSettings = {
        notifications_enabled: true,
        daily_report_enabled: true,
        daily_report_time: '09:00',
        notification_settings: {
          case_created: { enabled: true, template: 'تم إنشاء قضية جديدة' },
          case_updated: { enabled: true, template: 'تم تحديث القضية' }
        },
        message_templates: {
          welcome: { title: 'رسالة الترحيب', content: 'أهلاً وسهلاً' }
        },
        working_hours: {
          sunday: { enabled: true, start: '09:00', end: '17:00' },
          monday: { enabled: true, start: '09:00', end: '17:00' }
        }
      };
      setSettings(mockSettings);
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await api.put('/v1/whatsapp/settings', settings);
      if (response.data.success) {
        setSettings(response.data.data);
        // إظهار رسالة نجاح
      }
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    setSaving(true);
    try {
      const response = await api.post('/v1/whatsapp/reset-defaults');
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('خطأ في إعادة التعيين:', error);
    } finally {
      setSaving(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.phone || !testMessage.message) return;

    setSendingTest(true);
    try {
      const response = await api.post('/v1/whatsapp/test-message', testMessage);
      if (response.data.success) {
        setTestMessage({ phone: '', message: '' });
        // إظهار رسالة نجاح
      }
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
    } finally {
      setSendingTest(false);
    }
  };

  const updateNotificationSetting = (key: string, field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      notification_settings: {
        ...settings.notification_settings,
        [key]: {
          ...settings.notification_settings[key],
          [field]: value
        }
      }
    });
  };

  const updateMessageTemplate = (key: string, field: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      message_templates: {
        ...settings.message_templates,
        [key]: {
          ...settings.message_templates[key],
          [field]: value
        }
      }
    });
  };

  const updateWorkingHour = (day: string, field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      working_hours: {
        ...settings.working_hours,
        [day]: {
          ...settings.working_hours[day],
          [field]: value
        }
      }
    });
  };

  // WhatsApp Instances Functions
  const loadInstances = async () => {
    try {
      // محاكاة تحميل instances من API
      const mockInstances: WhatsappInstance[] = [
        {
          id: '1',
          instance_name: 'main_office',
          phone_number: '+966501234567',
          status: 'connected',
          token: 'token123',
          department: 'الاستقبال',
          created_at: new Date().toISOString()
        },
        {
          id: '2', 
          instance_name: 'billing_dept',
          status: 'disconnected',
          token: 'token456',
          department: 'المحاسبة',
          created_at: new Date().toISOString()
        }
      ];
      setInstances(mockInstances);
    } catch (error) {
      console.error('خطأ في تحميل instances:', error);
    }
  };

  const createInstance = async () => {
    if (!newInstanceName.trim() || !newInstanceDepartment.trim()) return;

    try {
      console.log('🚀 إنشاء instance جديد مع Evolution API...');
      
      // استدعاء Evolution API الحقيقي
      const response = await fetch('http://localhost:8080/instance/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '429683C4C977415CAAFCCE10F7D57E11'
        },
        body: JSON.stringify({
          instanceName: newInstanceName,
          token: 'TOKEN_' + Date.now(),
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Evolution API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Evolution API Response:', result);
      
      // إنشاء instance جديد
      const newInstance: WhatsappInstance = {
        id: Date.now().toString(),
        instance_name: newInstanceName,
        status: 'connecting',
        token: result.token || 'TOKEN_' + Date.now(),
        department: newInstanceDepartment,
        created_at: new Date().toISOString()
      };

      setInstances(prev => [...prev, newInstance]);
      setNewInstanceName('');
      setNewInstanceDepartment('');
      setShowAddInstance(false);

      // انتظار قليل قبل جلب QR Code لإعطاء وقت للسيرفر
      console.log('⏳ انتظار 2 ثانية قبل جلب QR Code...');
      setTimeout(async () => {
        await getQRCode(newInstanceName);
      }, 2000);

      // مراقبة حالة الاتصال
      const checkStatus = setInterval(async () => {
        try {
          // جرب مسارات متعددة للحصول على حالة الاتصال
          const statusPaths = [
            `instance/connectionState/${newInstanceName}`,
            `instance/${newInstanceName}`,
            `instance/status/${newInstanceName}`,
            `instance/fetchInstances?instanceName=${newInstanceName}`
          ];

          for (const path of statusPaths) {
            try {
              const statusResponse = await fetch(`http://localhost:8080/${path}`, {
                headers: {
                  'apikey': '429683C4C977415CAAFCCE10F7D57E11'
                }
              });
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                console.log(`📱 حالة Instance من ${path}:`, statusData);
                
                // فحص حالات الاتصال المختلفة
                const isConnected = 
                  statusData.instance?.state === 'open' ||
                  statusData.connectionStatus === 'open' ||
                  statusData.status === 'open' ||
                  (statusData[0]?.connectionStatus === 'open') ||
                  (statusData.data && statusData.data[0]?.connectionStatus === 'open');

                const phoneNumber = 
                  statusData.instance?.key?.remoteJid ||
                  statusData.instance?.wuid ||
                  statusData.phoneNumber ||
                  statusData[0]?.phoneNumber ||
                  statusData.data?.[0]?.phoneNumber;

                if (isConnected) {
                  console.log('🎉 تم الاتصال بنجاح! الرقم:', phoneNumber);
                  
                  setInstances(prev => prev.map(instance => 
                    instance.instance_name === newInstanceName 
                      ? { 
                          ...instance, 
                          status: 'connected', 
                          phone_number: phoneNumber || '+966xxxxxxxxx'
                        }
                      : instance
                  ));
                  
                  // إغلاق Modal تلقائياً
                  setSelectedQRCode(null);
                  clearInterval(checkStatus);
                  
                  alert('🎉 تم ربط الواتساب بنجاح!');
                  return;
                }
              }
            } catch (pathError) {
              console.log(`❌ فشل مسار: ${path}`);
            }
          }
        } catch (error) {
          console.log('⚠️ خطأ في فحص الحالة:', error);
        }
      }, 3000);

      // إيقاف الفحص بعد 60 ثانية
      setTimeout(() => clearInterval(checkStatus), 60000);

    } catch (error) {
      console.error('❌ خطأ في Evolution API:', error);
      alert(`خطأ في الاتصال مع Evolution API: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    const instance = instances.find(inst => inst.id === instanceId);
    if (!instance) return;

    try {
      console.log('🗑️ حذف instance من Evolution API:', instance.instance_name);
      
      const response = await fetch(`http://localhost:8080/instance/delete/${instance.instance_name}`, {
        method: 'DELETE',
        headers: {
          'apikey': '429683C4C977415CAAFCCE10F7D57E11'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Delete Response:', result);
      
      // حذف من القائمة
      setInstances(prev => prev.filter(instance => instance.id !== instanceId));

    } catch (error) {
      console.error('❌ خطأ في حذف instance:', error);
      alert(`خطأ في حذف Instance: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  };

  const getQRCode = async (instanceName: string) => {
    try {
      console.log('📱 جلب QR Code من Evolution API للـ instance:', instanceName);
      
      // جربة عدة مسارات محتملة لـ QR Code
      const possiblePaths = [
        `instance/qrcode/${instanceName}`,
        `instance/${instanceName}/qrcode`,
        `qrcode/${instanceName}`,
        `instance/connect/${instanceName}`,
        `instance/${instanceName}`
      ];

      let result = null;

      for (const path of possiblePaths) {
        try {
          console.log(`🔍 جاري تجربة المسار: ${path}`);
          const response = await fetch(`http://localhost:8080/${path}`, {
            method: 'GET',
            headers: {
              'apikey': '429683C4C977415CAAFCCE10F7D57E11'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.qrcode || data.base64 || data.code) {
              result = data;
              console.log('✅ نجح المسار:', path, 'البيانات:', data);
              break;
            }
          }
        } catch (err) {
          console.log(`❌ فشل المسار: ${path}`);
        }
      }

      if (!result) {
        // إذا فشلت كل المسارات، جرب الحصول على معلومات Instance
        console.log('🔍 جاري جلب معلومات Instance...');
        const infoResponse = await fetch(`http://localhost:8080/instance/fetchInstances`, {
          headers: {
            'apikey': '429683C4C977415CAAFCCE10F7D57E11'
          }
        });
        
        if (infoResponse.ok) {
          const instances = await infoResponse.json();
          console.log('📋 قائمة Instances:', instances);
          
          // البحث عن Instance المحدد
          const targetInstance = instances.find((inst: any) => 
            inst.instanceName === instanceName || 
            inst.name === instanceName ||
            inst.instance === instanceName
          );
          
          if (targetInstance && (targetInstance.qrcode || targetInstance.qr)) {
            result = { qrcode: targetInstance.qrcode || targetInstance.qr };
            console.log('✅ تم العثور على QR في قائمة Instances');
          }
        }
        
        throw new Error('لم يتم العثور على QR Code في أي من المسارات المحتملة');
      }

      console.log('✅ QR Code Response:', result);

      // معالجة QR Code حسب نوع البيانات المرجعة
      const qrData = result.qrcode || result.base64 || result.code || result.qr;
      
      if (qrData) {
        console.log('🎯 QR Data نوع:', typeof qrData, 'المحتوى:', qrData);
        
        if (typeof qrData === 'string') {
          if (qrData.startsWith('data:image')) {
            // صورة base64 جاهزة
            setSelectedQRCode(qrData);
          } else if (qrData.startsWith('http')) {
            // رابط للصورة
            setSelectedQRCode(qrData);
          } else {
            // نص QR - سنحاول تحويله لـ QR Code باستخدام خدمة خارجية
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
            setSelectedQRCode(qrImageUrl);
            console.log('📱 QR Code Text تم تحويله:', qrData);
          }
        } else if (qrData && typeof qrData === 'object') {
          // إذا كان QR Code في كائن
          const nestedQr = qrData.code || qrData.qrcode || qrData.base64;
          if (nestedQr) {
            setSelectedQRCode(nestedQr);
          }
        }
      } else {
        console.log('📋 استجابة كاملة:', result);
        throw new Error('لم يتم العثور على QR Code في الاستجابة');
      }

    } catch (error) {
      console.error('❌ خطأ في جلب QR Code:', error);
      alert(`خطأ في الحصول على QR Code: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  };

  // تجربة الاتصال مع Evolution API
  const testEvolutionAPI = async () => {
    try {
      console.log('🧪 اختبار الاتصال مع Evolution API...');
      const response = await fetch('http://localhost:8080/', {
        headers: {
          'apikey': '429683C4C977415CAAFCCE10F7D57E11'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Evolution API متاح:', result);
        alert('✅ Evolution API يعمل بشكل صحيح!');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Evolution API غير متاح:', error);
      alert('❌ Evolution API غير متاح. تأكد من تشغيله على localhost:8080');
    }
  };

  // تحميل instances عند تحميل الصفحة
  useEffect(() => {
    if (activeTab === 'instances') {
      loadInstances();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">فشل في تحميل الإعدادات</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'الإعدادات العامة', icon: Settings },
    { id: 'instances', name: 'أرقام الواتساب', icon: Smartphone },
    { id: 'notifications', name: 'التنبيهات', icon: Bell },
    { id: 'templates', name: 'قوالب الرسائل', icon: FileText },
    { id: 'schedule', name: 'جدولة العمل', icon: Clock },
    { id: 'test', name: 'اختبار الإرسال', icon: Send }
  ];

  return (
    <div className="page-layout">
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text)',
            margin: 0,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <MessageSquare style={{ height: '32px', width: '32px', color: 'var(--color-success)' }} />
            إعدادات الواتساب
          </h1>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: 0
          }}>
            إدارة إعدادات التنبيهات والرسائل عبر الواتساب
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetToDefaults}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--color-gray-100)',
              color: 'var(--color-text-secondary)',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            <RefreshCw style={{ height: '16px', width: '16px' }} />
            إعادة التعيين
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveSettings}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 24px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            {saving ? (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            ) : (
              <Save style={{ height: '16px', width: '16px' }} />
            )}
            حفظ الإعدادات
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 4px',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                fontWeight: 'var(--font-weight-medium)',
                fontSize: 'var(--font-size-sm)',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <tab.icon style={{ height: '16px', width: '16px' }} />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        backgroundColor: 'var(--color-card)',
        borderRadius: 'var(--border-radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '24px'
      }}>
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">الإعدادات العامة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="h-4 w-4 inline ml-1" />
                  رابط الـ Webhook
                </label>
                <input
                  type="url"
                  value={settings.webhook_url || ''}
                  onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/webhook"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline ml-1" />
                  معرف رقم الهاتف
                </label>
                <input
                  type="text"
                  value={settings.phone_number_id || ''}
                  onChange={(e) => setSettings({ ...settings, phone_number_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone Number ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Key className="h-4 w-4 inline ml-1" />
                  رمز الوصول
                </label>
                <input
                  type="password"
                  value={settings.access_token || ''}
                  onChange={(e) => setSettings({ ...settings, access_token: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Access Token"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Key className="h-4 w-4 inline ml-1" />
                  رمز التحقق
                </label>
                <input
                  type="text"
                  value={settings.verify_token || ''}
                  onChange={(e) => setSettings({ ...settings, verify_token: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Verify Token"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.notifications_enabled}
                  onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">تفعيل التنبيهات</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.daily_report_enabled}
                  onChange={(e) => setSettings({ ...settings, daily_report_enabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">تفعيل التقرير اليومي</span>
              </label>

              {settings.daily_report_enabled && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">في تمام الساعة:</span>
                  <input
                    type="time"
                    value={settings.daily_report_time}
                    onChange={(e) => setSettings({ ...settings, daily_report_time: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'instances' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text)',
                margin: 0
              }}>
                إدارة أرقام الواتساب
              </h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={testEvolutionAPI}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-warning)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius)',
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer'
                  }}
                >
                  🧪 اختبار API
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddInstance(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-success)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius)',
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer'
                  }}
                >
                  <Plus style={{ height: '16px', width: '16px' }} />
                  إضافة رقم جديد
                </motion.button>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              {instances.map((instance) => (
                <motion.div
                  key={instance.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '24px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)',
                    backgroundColor: 'var(--color-card)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h4 style={{
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-text)',
                        margin: 0,
                        marginBottom: '4px'
                      }}>
                        {instance.instance_name}
                      </h4>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)',
                        margin: 0
                      }}>
                        {instance.department}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {instance.status === 'connected' && (
                        <CheckCircle style={{ height: '20px', width: '20px', color: 'var(--color-success)' }} />
                      )}
                      {instance.status === 'connecting' && (
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid transparent',
                          borderTop: '2px solid var(--color-warning)',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                      )}
                      {instance.status === 'disconnected' && (
                        <XCircle style={{ height: '20px', width: '20px', color: 'var(--color-danger)' }} />
                      )}
                      <button
                        onClick={() => deleteInstance(instance.id)}
                        style={{
                          padding: '4px',
                          color: 'var(--color-danger)',
                          background: 'none',
                          border: 'none',
                          borderRadius: 'var(--border-radius-sm)',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 style={{ height: '16px', width: '16px' }} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--font-size-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>الحالة:</span>
                      <span style={{
                        fontWeight: 'var(--font-weight-medium)',
                        color: instance.status === 'connected' ? 'var(--color-success)' :
                               instance.status === 'connecting' ? 'var(--color-warning)' :
                               'var(--color-danger)'
                      }}>
                        {instance.status === 'connected' ? 'متصل' :
                         instance.status === 'connecting' ? 'جاري الاتصال' :
                         'غير متصل'}
                      </span>
                    </div>
                    
                    {instance.phone_number && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>الرقم:</span>
                        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{instance.phone_number}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {instance.status === 'disconnected' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => getQRCode(instance.instance_name)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--border-radius)',
                            fontSize: 'var(--font-size-sm)',
                            cursor: 'pointer'
                          }}
                        >
                          <QrCode style={{ height: '16px', width: '16px' }} />
                          عرض رمز QR
                        </motion.button>
                      )}
                      
                      {instance.status === 'connecting' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={async () => {
                            // فحص الحالة يدوياً
                            try {
                              const response = await fetch(`http://localhost:8080/instance/fetchInstances`, {
                                headers: { 'apikey': '429683C4C977415CAAFCCE10F7D57E11' }
                              });
                              const instances = await response.json();
                              console.log('🔄 تحديث الحالة:', instances);
                              
                              const current = instances.find((inst: any) => inst.instanceName === instance.instance_name);
                              if (current?.connectionStatus === 'open') {
                                setInstances(prev => prev.map(inst => 
                                  inst.id === instance.id 
                                    ? { ...inst, status: 'connected', phone_number: current.phoneNumber || '+966xxxxxxxxx' }
                                    : inst
                                ));
                                alert('🎉 تم الاتصال!');
                              }
                            } catch (error) {
                              console.error('خطأ في التحديث:', error);
                            }
                          }}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            backgroundColor: 'var(--color-warning)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--border-radius)',
                            fontSize: 'var(--font-size-sm)',
                            cursor: 'pointer'
                          }}
                        >
                          🔄 تحديث الحالة
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>




          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">إعدادات التنبيهات</h3>
            
            <div className="space-y-4">
              {Object.entries(settings.notification_settings).map(([key, setting]: [string, any]) => (
                <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{getNotificationTitle(key)}</h4>
                    <p className="text-sm text-gray-600">{getNotificationDescription(key)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={setting.enabled}
                        onChange={(e) => updateNotificationSetting(key, 'enabled', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">مفعل</span>
                    </label>
                    {setting.enabled && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">تأخير:</span>
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={setting.delay_minutes}
                          onChange={(e) => updateNotificationSetting(key, 'delay_minutes', parseInt(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <span className="text-sm text-gray-600">دقيقة</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">قوالب الرسائل</h3>
            
            <div className="space-y-6">
              {Object.entries(settings.message_templates).map(([key, template]: [string, any]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{template.title}</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{key}</span>
                  </div>
                  <textarea
                    value={template.template}
                    onChange={(e) => updateMessageTemplate(key, 'template', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اكتب قالب الرسالة هنا..."
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    يمكنك استخدام المتغيرات مثل: {'{client_name}'}, {'{case_number}'}, {'{case_title}'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">ساعات العمل</h3>
            
            <div className="space-y-4">
              {Object.entries(settings.working_hours).map(([day, hours]: [string, any]) => (
                <div key={day} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hours.enabled}
                        onChange={(e) => updateWorkingHour(day, 'enabled', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium">{getDayName(day)}</span>
                    </label>
                  </div>
                  {hours.enabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">من:</span>
                      <input
                        type="time"
                        value={hours.start}
                        onChange={(e) => updateWorkingHour(day, 'start', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-sm text-gray-600">إلى:</span>
                      <input
                        type="time"
                        value={hours.end}
                        onChange={(e) => updateWorkingHour(day, 'end', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">اختبار إرسال الرسائل</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">تنبيه</span>
              </div>
              <p className="text-yellow-700 text-sm">
                تأكد من إدخال إعدادات الواتساب الصحيحة قبل إرسال رسائل الاختبار
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف (مع رمز البلد)
                </label>
                <input
                  type="tel"
                  value={testMessage.phone}
                  onChange={(e) => setTestMessage({ ...testMessage, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="966501234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نص الرسالة
                </label>
                <textarea
                  value={testMessage.message}
                  onChange={(e) => setTestMessage({ ...testMessage, message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اكتب رسالة الاختبار هنا..."
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={sendTestMessage}
              disabled={sendingTest || !testMessage.phone || !testMessage.message}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {sendingTest ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              إرسال رسالة اختبار
            </motion.button>
          </div>
        )}
      </div>

      {/* Modal إضافة instance جديد */}
      <Modal
        isOpen={showAddInstance}
        onClose={() => setShowAddInstance(false)}
        title="إضافة رقم واتساب جديد"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text)',
              marginBottom: '4px'
            }}>
              اسم المثيل
            </label>
            <input
              type="text"
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value)}
              placeholder="مثال: reception_whatsapp"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--border-radius)',
                fontSize: 'var(--font-size-sm)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text)',
              marginBottom: '4px'
            }}>
              القسم
            </label>
            <select
              value={newInstanceDepartment}
              onChange={(e) => setNewInstanceDepartment(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--border-radius)',
                fontSize: 'var(--font-size-sm)',
                outline: 'none'
              }}
            >
              <option value="">اختر القسم</option>
              <option value="الاستقبال">الاستقبال</option>
              <option value="المحاسبة">المحاسبة</option>
              <option value="القانونية">الشؤون القانونية</option>
              <option value="الإدارة">الإدارة</option>
              <option value="المتابعة">المتابعة</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={() => setShowAddInstance(false)}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: 'var(--color-gray-100)',
                color: 'var(--color-text-secondary)',
                border: 'none',
                borderRadius: 'var(--border-radius)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer'
              }}
            >
              إلغاء
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={createInstance}
              disabled={!newInstanceName.trim() || !newInstanceDepartment.trim()}
              style={{
                flex: 1,
                padding: '8px 16px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
                opacity: (!newInstanceName.trim() || !newInstanceDepartment.trim()) ? 0.5 : 1
              }}
            >
              إنشاء
            </motion.button>
          </div>
        </div>
      </Modal>

      {/* Modal عرض QR Code */}
      <Modal
        isOpen={!!selectedQRCode}
        onClose={() => setSelectedQRCode(null)}
        title="امسح رمز QR للربط"
        size="sm"
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--color-gray-100)',
              borderRadius: 'var(--border-radius)'
            }}>
              <img 
                src={selectedQRCode || ''} 
                alt="QR Code" 
                style={{
                  width: '192px',
                  height: '192px',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>

          <div style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: '16px'
          }}>
            <p>1. افتح واتساب على هاتفك</p>
            <p>2. اذهب إلى الإعدادات {'>'} الأجهزة المرتبطة</p>
            <p>3. اضغط "ربط جهاز" وامسح الكود</p>
          </div>

          <button
            onClick={() => setSelectedQRCode(null)}
            style={{
              width: '100%',
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer'
            }}
          >
            إغلاق
          </button>
        </div>
      </Modal>
    </div>
  );
};

// Helper functions
const getNotificationTitle = (key: string): string => {
  const titles: Record<string, string> = {
    case_created: 'إشعار قضية جديدة',
    case_updated: 'تحديث القضية',
    hearing_reminder: 'تذكير بجلسة محكمة',
    document_request: 'طلب وثائق',
    payment_reminder: 'تذكير بالدفع',
    lawyer_assigned: 'تعيين محامي',
    new_document_uploaded: 'رفع وثيقة جديدة'
  };
  return titles[key] || key;
};

const getNotificationDescription = (key: string): string => {
  const descriptions: Record<string, string> = {
    case_created: 'إشعار العميل عند إنشاء قضية جديدة',
    case_updated: 'إشعار العميل عند تحديث حالة القضية',
    hearing_reminder: 'تذكير العميل بمواعيد الجلسات',
    document_request: 'طلب وثائق من العميل',
    payment_reminder: 'تذكير العميل بالمستحقات المالية',
    lawyer_assigned: 'إشعار العميل عند تعيين محامي للقضية',
    new_document_uploaded: 'إشعار المحامي عند رفع وثيقة جديدة'
  };
  return descriptions[key] || 'وصف غير متوفر';
};

const getDayName = (day: string): string => {
  const days: Record<string, string> = {
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت'
  };
  return days[day] || day;
};

export default WhatsappSettings;
