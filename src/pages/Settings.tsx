import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield,
  Palette, 
  Globe, 
  Database,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';
import NotificationSettings from '../components/NotificationSettings';

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
    { id: 'profile', label: 'الملف الشخصي', icon: User, roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { id: 'appearance', label: 'المظهر', icon: Palette, roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { id: 'privacy', label: 'الخصوصية والأمان', icon: Shield, roles: ['admin', 'lawyer', 'legal_assistant'] },
    { id: 'language', label: 'اللغة والمنطقة', icon: Globe, roles: ['admin', 'lawyer', 'legal_assistant', 'client'] },
    { id: 'system', label: 'النظام', icon: Database, roles: ['admin'] },
  ];

  // Mock user role - في التطبيق الحقيقي سيأتي من AuthContext
  const userRole = 'admin';
  const visibleTabs = tabs.filter(tab => tab.roles.includes(userRole));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notifications':
        return <NotificationSettings />;
      
      case 'profile':
        return (
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: 'var(--font-size-lg)', 
                fontWeight: 'var(--font-weight-semibold)', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <User style={{ height: '20px', width: '20px' }} />
                الملف الشخصي
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    defaultValue="أحمد محمد السالم"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    defaultValue="ahmed@lawfirm.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    defaultValue="+966501234567"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    width: 'fit-content'
                  }}
                >
                  حفظ التغييرات
                </motion.button>
              </div>
            </div>
          </div>
        );
      
      case 'appearance':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ 
              fontSize: 'var(--font-size-lg)', 
              fontWeight: 'var(--font-weight-semibold)', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Palette style={{ height: '20px', width: '20px' }} />
              المظهر والثيم
            </h3>
            
            <div style={{ display: 'grid', gap: '24px' }}>
              <div>
                <h4 style={{ marginBottom: '12px', fontSize: 'var(--font-size-base)' }}>وضع الألوان</h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {[
                    { id: 'light', label: 'فاتح', icon: Sun },
                    { id: 'dark', label: 'داكن', icon: Moon },
                    { id: 'system', label: 'حسب النظام', icon: Monitor }
                  ].map((theme) => (
                    <label key={theme.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      padding: '12px 16px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-surface)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      <input
                        type="radio"
                        name="theme"
                        value={theme.id}
                        defaultChecked={theme.id === 'light'}
                      />
                      <theme.icon style={{ height: '18px', width: '18px' }} />
                      <span>{theme.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 style={{ marginBottom: '12px', fontSize: 'var(--font-size-base)' }}>حجم الخط</h4>
                <select style={{
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-surface)'
                }}>
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
          <div style={{ padding: '24px' }}>
            <h3 style={{ 
              fontSize: 'var(--font-size-lg)', 
              fontWeight: 'var(--font-weight-semibold)', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Shield style={{ height: '20px', width: '20px' }} />
              الخصوصية والأمان
            </h3>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{
                padding: '16px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}>
                <h4 style={{ 
                  marginBottom: '8px', 
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text)'
                }}>كلمة المرور</h4>
                <p style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: '1.5',
                  marginBottom: '12px'
                }}>
                  آخر تغيير: منذ 30 يوماً
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer'
                  }}
                >
                  تغيير كلمة المرور
                </motion.button>
              </div>
              
              <div style={{
                padding: '16px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}>
                <h4 style={{ 
                  marginBottom: '8px', 
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text)'
                }}>المصادقة الثنائية</h4>
                <p style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: '1.5',
                  marginBottom: '12px'
                }}>
                  حماية إضافية لحسابك
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: 'var(--font-size-sm)',
                    cursor: 'pointer'
                  }}
                >
                  تفعيل المصادقة الثنائية
                </motion.button>
              </div>
            </div>
          </div>
        );
      
      case 'language':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ 
              fontSize: 'var(--font-size-lg)', 
              fontWeight: 'var(--font-weight-semibold)', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Globe style={{ height: '20px', width: '20px' }} />
              اللغة والمنطقة
            </h3>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  اللغة
                </label>
                <select style={{
                  padding: '10px 14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: 'var(--font-size-sm)',
                  width: '200px',
                  cursor: 'pointer'
                }}>
                  <option value="ar" selected>العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  المنطقة الزمنية
                </label>
                <select style={{
                  padding: '10px 14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: 'var(--font-size-sm)',
                  width: '300px',
                  cursor: 'pointer'
                }}>
                  <option value="Asia/Riyadh" selected>توقيت السعودية (GMT+3)</option>
                  <option value="Asia/Dubai">توقيت الإمارات (GMT+4)</option>
                  <option value="Asia/Kuwait">توقيت الكويت (GMT+3)</option>
                </select>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  تنسيق التاريخ
                </label>
                <select style={{
                  padding: '10px 14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: 'var(--font-size-sm)',
                  width: '200px',
                  cursor: 'pointer'
                }}>
                  <option value="hijri">هجري</option>
                  <option value="gregorian" selected>ميلادي</option>
                  <option value="both">هجري وميلادي</option>
                </select>
              </div>
            </div>
          </div>
        );
      
      case 'system':
        return (
          <div style={{ padding: '24px' }}>
            <h3 style={{ 
              fontSize: 'var(--font-size-lg)', 
              fontWeight: 'var(--font-weight-semibold)', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Database style={{ height: '20px', width: '20px' }} />
              إعدادات النظام
            </h3>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{
                padding: '16px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}>
                <h4 style={{ 
                  marginBottom: '8px', 
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text)'
                }}>النسخ الاحتياطي</h4>
                <p style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: '1.5',
                  marginBottom: '12px'
                }}>
                  آخر نسخة احتياطية: اليوم 03:00 ص
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: 'var(--font-size-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    إنشاء نسخة احتياطية
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      fontSize: 'var(--font-size-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    جدولة النسخ الاحتياطي
                  </motion.button>
                </div>
              </div>
              
              <div style={{
                padding: '16px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}>
                <h4 style={{ 
                  marginBottom: '8px', 
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text)'
                }}>تصدير البيانات</h4>
                <p style={{ 
                  color: 'var(--color-text-secondary)', 
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: '1.5',
                  marginBottom: '12px'
                }}>
                  تصدير جميع البيانات بصيغة مختلفة
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-success)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: 'var(--font-size-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    تصدير Excel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-info)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: 'var(--font-size-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    تصدير PDF
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>التبويب غير موجود</div>;
    }
  };

  return (
    <div className="page-layout">
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: 'var(--font-size-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text)',
          margin: 0,
          marginBottom: '8px'
        }}>
          الإعدادات
        </h1>
        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-text-secondary)',
          margin: 0
        }}>
          إدارة تفضيلاتك وإعدادات النظام
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        {/* Sidebar Tabs */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '16px',
          height: 'fit-content'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'var(--color-text)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    textAlign: 'right',
                    width: '100%'
                  }}
                >
                  <Icon style={{ height: '18px', width: '18px' }} />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          minHeight: '500px'
        }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
