import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckSquare,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Target,
  AlertTriangle,
  Award,
  Building,
  Timer,
  UserCheck
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  subtitle?: string;
  trend?: number[];
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  change,
  changeType,
  subtitle,
  trend
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        padding: '24px',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100px',
        height: '100px',
        background: `linear-gradient(135deg, ${color}10, ${color}05)`,
        borderRadius: '50%',
        transform: 'translate(30px, -30px)'
      }} />
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: `${color}15`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon style={{ height: '24px', width: '24px', color }} />
            </div>
            <div>
              <h3 style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-secondary)',
                margin: 0,
                lineHeight: 1.4
              }}>
                {title}
              </h3>
            </div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <span style={{
              fontSize: '36px',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text)',
              lineHeight: 1
            }}>
              {value}
            </span>
          </div>

          {subtitle && (
            <p style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              margin: 0,
              marginBottom: '8px'
            }}>
              {subtitle}
            </p>
          )}
          
          {change && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px'
            }}>
              <TrendingUp
                style={{
                  height: '16px',
                  width: '16px',
                  color: changeType === 'increase' ? 'var(--color-success)' : 'var(--color-error)',
                  transform: changeType === 'decrease' ? 'rotate(180deg)' : 'none'
                }}
              />
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: changeType === 'increase' ? 'var(--color-success)' : 'var(--color-error)'
              }}>
                {change}
              </span>
              <span style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)'
              }}>
                من الشهر الماضي
              </span>
            </div>
          )}
        </div>

        {/* Mini Trend Chart */}
        {trend && (
          <div style={{
            width: '60px',
            height: '30px',
            display: 'flex',
            alignItems: 'end',
            gap: '2px'
          }}>
            {trend.map((value, index) => (
              <div
                key={index}
                style={{
                  width: '8px',
                  height: `${(value / Math.max(...trend)) * 100}%`,
                  backgroundColor: `${color}60`,
                  borderRadius: '2px',
                  minHeight: '4px'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Statistics: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'month' | 'year' | 'detailed'>('month');

  const getStatsForPeriod = () => {
    const baseStats = {
      month: {
        totalCases: { value: 156, change: '+12.5%' },
        activeCases: { value: 89, change: '+8.3%' },
        completedTasks: { value: 234, change: '+2.1%' },
        expectedRevenue: { value: '2.4M', change: '+15.7%' },
        activeClients: { value: 67, change: '+5.2%' },
        upcomingAppointments: { value: 12, change: '+3%' }
      },
      year: {
        totalCases: { value: 1456, change: '+18.2%' },
        activeCases: { value: 234, change: '+12.1%' },
        completedTasks: { value: 2840, change: '+25.3%' },
        expectedRevenue: { value: '28.9M', change: '+22.4%' },
        activeClients: { value: 189, change: '+15.8%' },
        upcomingAppointments: { value: 45, change: '+8%' }
      },
      detailed: {
        totalCases: { value: 156, change: '+12.5%' },
        activeCases: { value: 89, change: '+8.3%' },
        completedTasks: { value: 234, change: '+2.1%' },
        expectedRevenue: { value: '2.4M', change: '+15.7%' },
        activeClients: { value: 67, change: '+5.2%' },
        upcomingAppointments: { value: 12, change: '+3%' }
      }
    };
    return baseStats[timeFilter];
  };

  const stats = getStatsForPeriod();

  const primaryStats = [
    {
      title: 'إجمالي القضايا',
      value: stats.totalCases.value,
      icon: FileText,
      color: 'var(--color-primary)',
      change: stats.totalCases.change,
      changeType: 'increase' as const,
      subtitle: 'القضايا النشطة والمكتملة',
      trend: [45, 52, 48, 61, 55, 67, 74, 82, 89, 95, 102, 108]
    },
    {
      title: 'القضايا النشطة',
      value: stats.activeCases.value,
      icon: Activity,
      color: 'var(--color-blue-500)',
      change: stats.activeCases.change,
      changeType: 'increase' as const,
      subtitle: 'القضايا قيد المتابعة',
      trend: [23, 28, 25, 31, 29, 35, 38, 42, 45, 48, 52, 55]
    },
    {
      title: 'المهام المكتملة',
      value: stats.completedTasks.value,
      icon: CheckSquare,
      color: 'var(--color-success)',
      change: stats.completedTasks.change,
      changeType: 'increase' as const,
      subtitle: 'المهام المنجزة هذا الشهر',
      trend: [180, 195, 188, 210, 205, 220, 225, 230, 234, 240, 245, 250]
    },
    {
      title: 'الإيرادات المتوقعة',
      value: stats.expectedRevenue.value,
      icon: DollarSign,
      color: 'var(--color-green-500)',
      change: stats.expectedRevenue.change,
      changeType: 'increase' as const,
      subtitle: 'القيمة المالية للقضايا',
      trend: [1.8, 2.0, 1.9, 2.2, 2.1, 2.3, 2.2, 2.4, 2.3, 2.5, 2.4, 2.6]
    },
    {
      title: 'العملاء النشطين',
      value: stats.activeClients.value,
      icon: Users,
      color: 'var(--color-purple-500)',
      change: stats.activeClients.change,
      changeType: 'increase' as const,
      subtitle: 'عدد العملاء الحاليين',
      trend: [58, 61, 59, 64, 62, 66, 65, 67, 66, 68, 67, 69]
    },
    {
      title: 'المواعيد القريبة',
      value: stats.upcomingAppointments.value,
      icon: Calendar,
      color: 'var(--color-orange-500)',
      change: stats.upcomingAppointments.change,
      changeType: 'increase' as const,
      subtitle: 'مواعيد خلال 7 أيام',
      trend: [8, 10, 9, 12, 11, 13, 12, 14, 13, 15, 14, 16]
    }
  ];

  const additionalStats = [
    {
      title: 'معدل الإنجاز',
      value: '94.2%',
      icon: Target,
      color: 'var(--color-indigo-500)',
      change: '+2.8%',
      changeType: 'increase' as const,
      subtitle: 'نسبة إنجاز المهام في الوقت المحدد'
    },
    {
      title: 'الجلسات المجدولة',
      value: 28,
      icon: Building,
      color: 'var(--color-red-500)',
      change: '+12%',
      changeType: 'increase' as const,
      subtitle: 'جلسات المحكمة هذا الشهر'
    },
    {
      title: 'متوسط وقت الاستجابة',
      value: '2.4 ساعة',
      icon: Timer,
      color: 'var(--color-yellow-500)',
      change: '-15%',
      changeType: 'decrease' as const,
      subtitle: 'متوسط الرد على استفسارات العملاء'
    },
    {
      title: 'العملاء الجدد',
      value: 18,
      icon: UserCheck,
      color: 'var(--color-teal-500)',
      change: '+22%',
      changeType: 'increase' as const,
      subtitle: 'عملاء جدد هذا الشهر'
    },
    {
      title: 'القضايا المؤجلة',
      value: 5,
      icon: AlertTriangle,
      color: 'var(--color-amber-500)',
      change: '-40%',
      changeType: 'decrease' as const,
      subtitle: 'قضايا تحتاج متابعة عاجلة'
    },
    {
      title: 'نسبة النجاح',
      value: '87.5%',
      icon: Award,
      color: 'var(--color-emerald-500)',
      change: '+3.2%',
      changeType: 'increase' as const,
      subtitle: 'نسبة كسب القضايا المكتملة'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '32px' }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text)',
              margin: 0,
              marginBottom: '8px'
            }}>
              <BarChart3 style={{ 
                display: 'inline', 
                marginLeft: '12px', 
                verticalAlign: 'middle',
                color: 'var(--color-primary)'
              }} />
              لوحة الإحصائيات
            </h1>
            <p style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-secondary)',
              margin: 0
            }}>
              تحليل شامل لأداء المكتب القانوني
            </p>
          </div>

          {/* Time Filter */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '4px'
          }}>
            {[
              { key: 'month', label: 'هذا الشهر' },
              { key: 'year', label: 'عام' },
              { key: 'detailed', label: 'تفصيلي' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeFilter(key as any)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: timeFilter === key ? 'var(--color-primary)' : 'transparent',
                  color: timeFilter === key ? 'white' : 'var(--color-text-secondary)'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Primary Statistics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}
      >
        {primaryStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Additional Statistics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ marginBottom: '32px' }}
      >
        <h2 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text)',
          margin: 0,
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <PieChart style={{ 
            height: '24px', 
            width: '24px', 
            color: 'var(--color-primary)' 
          }} />
          إحصائيات إضافية
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {additionalStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px'
        }}
      >
        <h3 style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text)',
          margin: 0,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <TrendingUp style={{ 
            height: '20px', 
            width: '20px', 
            color: 'var(--color-success)' 
          }} />
          نظرة عامة على الأداء
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {[
            {
              label: 'الأداء العام',
              value: 'ممتاز',
              color: 'var(--color-success)',
              description: 'المكتب يحقق أداءً متميزاً في جميع المؤشرات'
            },
            {
              label: 'توقعات الشهر القادم',
              value: '+18%',
              color: 'var(--color-primary)',
              description: 'نمو متوقع في عدد القضايا الجديدة'
            },
            {
              label: 'رضا العملاء',
              value: '4.8/5',
              color: 'var(--color-warning)',
              description: 'تقييم ممتاز من العملاء'
            },
            {
              label: 'الكفاءة التشغيلية',
              value: '92%',
              color: 'var(--color-blue-500)',
              description: 'معدل استغلال موارد المكتب'
            }
          ].map((insight, index) => (
            <div
              key={index}
              style={{
                padding: '16px',
                backgroundColor: `${insight.color}08`,
                border: `1px solid ${insight.color}20`,
                borderRadius: '12px'
              }}
            >
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: '4px'
              }}>
                {insight.label}
              </div>
              <div style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: insight.color,
                marginBottom: '8px'
              }}>
                {insight.value}
              </div>
              <div style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.4
              }}>
                {insight.description}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Case Types Distribution */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Case Types Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '24px'
          }}
        >
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text)',
            margin: 0,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <PieChart style={{ 
              height: '20px', 
              width: '20px', 
              color: 'var(--color-primary)' 
            }} />
            توزيع أنواع القضايا
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { name: 'تجارية', value: 35, color: 'var(--color-blue-500)', percentage: '35%' },
              { name: 'مدنية', value: 28, color: 'var(--color-green-500)', percentage: '28%' },
              { name: 'عمالية', value: 18, color: 'var(--color-yellow-500)', percentage: '18%' },
              { name: 'أسرية', value: 12, color: 'var(--color-purple-500)', percentage: '12%' },
              { name: 'أخرى', value: 7, color: 'var(--color-gray-500)', percentage: '7%' }
            ].map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: `${item.color}08`,
                  borderRadius: '8px',
                  border: `1px solid ${item.color}20`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: item.color,
                    borderRadius: '50%'
                  }} />
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text)'
                  }}>
                    {item.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: item.color
                  }}>
                    {item.value}
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    ({item.percentage})
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '24px'
          }}
        >
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text)',
            margin: 0,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Target style={{ 
              height: '20px', 
              width: '20px', 
              color: 'var(--color-success)' 
            }} />
            مؤشرات الأداء
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { 
                label: 'معدل النجاح', 
                value: '94%', 
                color: 'var(--color-green-500)',
                description: 'نسبة كسب القضايا'
              },
              { 
                label: 'متوسط مدة القضية', 
                value: '4.2 شهر', 
                color: 'var(--color-blue-500)',
                description: 'الوقت المتوسط لإنهاء القضية'
              },
              { 
                label: 'رضا العملاء', 
                value: '4.8/5', 
                color: 'var(--color-yellow-500)',
                description: 'تقييم العملاء للخدمة'
              },
              { 
                label: 'الكفاءة التشغيلية', 
                value: '87%', 
                color: 'var(--color-teal-500)',
                description: 'معدل استغلال الموارد'
              },
              { 
                label: 'معدل الاستجابة', 
                value: '2.4 ساعة', 
                color: 'var(--color-purple-500)',
                description: 'متوسط الرد على الاستفسارات'
              }
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px',
                  backgroundColor: `${metric.color}08`,
                  borderRadius: '12px',
                  border: `1px solid ${metric.color}20`
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-text)'
                  }}>
                    {metric.label}
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: metric.color
                  }}>
                    {metric.value}
                  </span>
                </div>
                <span style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)'
                }}>
                  {metric.description}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Statistics;
