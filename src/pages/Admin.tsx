import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Users, Shield, Database, Activity, Bell, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PermissionManagement from '../components/PermissionManagement';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // محاكاة تحميل البيانات
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigateToStats = () => {
    navigate('/admin/statistics');
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
          لوحة الإدارة
        </h1>
        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-text-secondary)',
          margin: 0
        }}>
          إدارة النظام والمستخدمين والإعدادات العامة
        </p>
      </div>

      {/* Quick Stats */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {[...Array(4)].map((_, index) => (
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
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shimmer 1.5s infinite'
              }} />
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '10px'
                }} />
                <div style={{
                  height: '20px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '4px',
                  width: '60%'
                }} />
              </div>
              
              <div style={{
                height: '32px',
                backgroundColor: 'var(--color-border)',
                borderRadius: '4px',
                marginBottom: '8px',
                width: '40%'
              }} />
              
              <div style={{
                height: '16px',
                backgroundColor: 'var(--color-border)',
                borderRadius: '4px',
                width: '70%'
              }} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
        {[
          {
            icon: Users,
            title: 'إجمالي المستخدمين',
            value: '47',
            color: 'var(--color-blue-500)',
            subtitle: '12 نشط اليوم'
          },
          {
            icon: Shield,
            title: 'الأدوار النشطة',
            value: '6',
            color: 'var(--color-green-500)',
            subtitle: '24 صلاحية'
          },
          {
            icon: Database,
            title: 'حجم البيانات',
            value: '2.4 GB',
            color: 'var(--color-purple-500)',
            subtitle: 'آخر نسخة: اليوم'
          },
          {
            icon: Activity,
            title: 'النشاط اليومي',
            value: '156',
            color: 'var(--color-yellow-500)',
            subtitle: 'عملية اليوم'
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: `${stat.color}15`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <stat.icon style={{ height: '20px', width: '20px', color: stat.color }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-secondary)',
                  margin: 0
                }}>
                  {stat.title}
                </h3>
                <p style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text)',
                  margin: 0
                }}>
                  {stat.value}
                </p>
              </div>
            </div>
            <p style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              margin: 0
            }}>
              {stat.subtitle}
            </p>
          </motion.div>
        ))}
        </div>
      )}

      {/* Permission Management Section */}
      {loading ? (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'shimmer 1.5s infinite'
          }} />
          
          <div style={{
            height: '28px',
            backgroundColor: 'var(--color-border)',
            borderRadius: '4px',
            marginBottom: '20px',
            width: '200px'
          }} />
          
          <div style={{
            height: '200px',
            backgroundColor: 'var(--color-border)',
            borderRadius: '8px'
          }} />
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <PermissionManagement />
        </div>
      )}

      {/* System Settings */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {[...Array(3)].map((_, index) => (
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
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shimmer 1.5s infinite'
              }} />
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '12px'
                }} />
                <div>
                  <div style={{
                    height: '20px',
                    backgroundColor: 'var(--color-border)',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    width: '120px'
                  }} />
                  <div style={{
                    height: '16px',
                    backgroundColor: 'var(--color-border)',
                    borderRadius: '4px',
                    width: '200px'
                  }} />
                </div>
              </div>
              
              <div style={{
                height: '16px',
                backgroundColor: 'var(--color-border)',
                borderRadius: '4px',
                marginBottom: '8px'
              }} />
              <div style={{
                height: '16px',
                backgroundColor: 'var(--color-border)',
                borderRadius: '4px',
                width: '80%'
              }} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
        {/* General Settings */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--color-blue-100)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Settings style={{ height: '24px', width: '24px', color: 'var(--color-blue-500)' }} />
            </div>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              margin: 0
            }}>
              الإعدادات العامة
            </h3>
          </div>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: 0,
            marginBottom: '16px'
          }}>
            إدارة إعدادات النظام العامة، المظهر، واللغة
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            <li style={{ marginBottom: '4px' }}>• إعدادات المظهر</li>
            <li style={{ marginBottom: '4px' }}>• تكوين النوتيفيكيشن</li>
            <li style={{ marginBottom: '4px' }}>• إعدادات الأمان</li>
          </ul>
        </motion.div>

        {/* Backup & Restore */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--color-green-100)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Database style={{ height: '24px', width: '24px', color: 'var(--color-green-500)' }} />
            </div>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              margin: 0
            }}>
              النسخ الاحتياطي
            </h3>
          </div>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: 0,
            marginBottom: '16px'
          }}>
            إدارة النسخ الاحتياطية واستعادة البيانات
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            <li style={{ marginBottom: '4px' }}>• إنشاء نسخة احتياطية</li>
            <li style={{ marginBottom: '4px' }}>• جدولة النسخ التلقائية</li>
            <li style={{ marginBottom: '4px' }}>• استعادة البيانات</li>
          </ul>
        </motion.div>

        {/* Notifications */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--color-yellow-100)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bell style={{ height: '24px', width: '24px', color: 'var(--color-yellow-500)' }} />
            </div>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              margin: 0
            }}>
              إدارة الإشعارات
            </h3>
          </div>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: 0,
            marginBottom: '16px'
          }}>
            تكوين وإدارة إشعارات النظام والمستخدمين
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            <li style={{ marginBottom: '4px' }}>• إعدادات الإشعارات</li>
            <li style={{ marginBottom: '4px' }}>• قوالب الرسائل</li>
            <li style={{ marginBottom: '4px' }}>• سجل الإشعارات</li>
          </ul>
        </motion.div>

        {/* Statistics Dashboard */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={handleNavigateToStats}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--color-primary)15',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 style={{ height: '24px', width: '24px', color: 'var(--color-primary)' }} />
            </div>
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text)',
              margin: 0
            }}>
              لوحة الإحصائيات
            </h3>
          </div>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: 0,
            marginBottom: '16px'
          }}>
            تحليل شامل لأداء المكتب القانوني والإحصائيات التفصيلية
          </p>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)'
          }}>
            <li style={{ marginBottom: '4px' }}>• إحصائيات القضايا والمهام</li>
            <li style={{ marginBottom: '4px' }}>• تحليل الإيرادات والعملاء</li>
            <li style={{ marginBottom: '4px' }}>• مؤشرات الأداء والكفاءة</li>
          </ul>
        </motion.div>
        </div>
      )}
    </div>
  );
};

export default Admin;
