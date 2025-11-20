import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download,
  Calendar,
  Filter,
  FileText,
  Users,
  Clock,
  DollarSign,
  Target,
  AlertCircle
} from 'lucide-react';

// Mock data for demonstration
const mockReportsData = {
  totalCases: 45,
  activeCases: 28,
  completedCases: 15,
  pendingCases: 2,
  totalTasks: 127,
  completedTasks: 89,
  overdueTasks: 8,
  totalRevenue: 850000,
  monthlyRevenue: 125000,
  totalClients: 32,
  activeClients: 24,
  averageResolutionTime: 45, // days
  successRate: 92, // percentage
  casesByType: [
    { type: 'عقارية', count: 15, percentage: 33 },
    { type: 'تجارية', count: 12, percentage: 27 },
    { type: 'عمالية', count: 8, percentage: 18 },
    { type: 'أسرية', count: 6, percentage: 13 },
    { type: 'جنائية', count: 4, percentage: 9 }
  ],
  monthlyStats: [
    { month: 'يناير', cases: 8, revenue: 95000 },
    { month: 'فبراير', cases: 6, revenue: 87000 },
    { month: 'مارس', cases: 10, revenue: 135000 },
    { month: 'أبريل', cases: 7, revenue: 78000 },
    { month: 'مايو', cases: 9, revenue: 115000 },
    { month: 'يونيو', cases: 5, revenue: 65000 },
    { month: 'يوليو', cases: 11, revenue: 145000 },
    { month: 'أغسطس', cases: 8, revenue: 98000 },
    { month: 'سبتمبر', cases: 6, revenue: 125000 }
  ],
  lawyerPerformance: [
    { name: 'أحمد محمد', cases: 12, completionRate: 95, revenue: 285000 },
    { name: 'فاطمة أحمد', cases: 10, completionRate: 88, revenue: 245000 },
    { name: 'محمد علي', cases: 8, completionRate: 92, revenue: 198000 }
  ]
};

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('last_month');
  const [reportType, setReportType] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, changeType, icon, color }) => (
    <motion.div
      whileHover={{ y: -2 }}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '0',
        right: '0',
        left: '0',
        height: '4px',
        backgroundColor: color
      }} />
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div>
          <h3 style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-secondary)',
            margin: '0 0 8px 0'
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text)',
            margin: 0
          }}>
            {value}
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          backgroundColor: `${color}20`,
          borderRadius: '12px',
          color: color
        }}>
          {icon}
        </div>
      </div>
      
      {change && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <TrendingUp style={{
            height: '16px',
            width: '16px',
            color: changeType === 'positive' ? 'var(--color-success)' :
                   changeType === 'negative' ? 'var(--color-error)' : 'var(--color-gray-500)'
          }} />
          <span style={{
            fontSize: 'var(--font-size-sm)',
            color: changeType === 'positive' ? 'var(--color-success)' :
                   changeType === 'negative' ? 'var(--color-error)' : 'var(--color-gray-500)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {change}
          </span>
        </div>
      )}
    </motion.div>
  );

  const ChartCard: React.FC<{
    title: string;
    children: React.ReactNode;
  }> = ({ title, children }) => (
    <div style={{
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '24px'
    }}>
      <h3 style={{
        fontSize: 'var(--font-size-lg)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text)',
        margin: '0 0 20px 0'
      }}>
        {title}
      </h3>
      {children}
    </div>
  );

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
            التقارير والإحصائيات
          </h1>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: 0
          }}>
            متابعة الأداء وتحليل البيانات لاتخاذ قرارات مدروسة
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
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
          <Download style={{ height: '18px', width: '18px' }} />
          تصدير التقرير
        </motion.button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
        padding: '20px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
            marginBottom: '6px'
          }}>
            الفترة الزمنية
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="last_week">الأسبوع الماضي</option>
            <option value="last_month">الشهر الماضي</option>
            <option value="last_quarter">الربع الأخير</option>
            <option value="last_year">السنة الماضية</option>
            <option value="custom">فترة مخصصة</option>
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text)',
            marginBottom: '6px'
          }}>
            نوع التقرير
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text)',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="overview">نظرة عامة</option>
            <option value="cases">تقرير القضايا</option>
            <option value="financial">التقرير المالي</option>
            <option value="performance">تقرير الأداء</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <StatCard
          title="إجمالي القضايا"
          value={mockReportsData.totalCases}
          change="+12% من الشهر الماضي"
          changeType="positive"
          icon={<FileText style={{ height: '24px', width: '24px' }} />}
          color="var(--color-primary)"
        />
        
        <StatCard
          title="القضايا النشطة"
          value={mockReportsData.activeCases}
          change="+8% من الشهر الماضي"
          changeType="positive"
          icon={<Target style={{ height: '24px', width: '24px' }} />}
          color="var(--color-success)"
        />
        
        <StatCard
          title="الإيرادات الشهرية"
          value={formatCurrency(mockReportsData.monthlyRevenue)}
          change="+15% من الشهر الماضي"
          changeType="positive"
          icon={<DollarSign style={{ height: '24px', width: '24px' }} />}
          color="var(--color-warning)"
        />
        
        <StatCard
          title="معدل النجاح"
          value={`${mockReportsData.successRate}%`}
          change="+3% من الشهر الماضي"
          changeType="positive"
          icon={<TrendingUp style={{ height: '24px', width: '24px' }} />}
          color="var(--color-info)"
        />
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Cases by Type */}
        <ChartCard title="توزيع القضايا حسب النوع">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {mockReportsData.casesByType.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                backgroundColor: 'var(--color-background)',
                borderRadius: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: `hsl(${index * 72}, 60%, 50%)`
                  }} />
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>
                    {item.type}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {item.count} قضية
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-surface)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Monthly Performance */}
        <ChartCard title="الأداء الشهري">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {mockReportsData.monthlyStats.slice(-6).map((month, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0'
              }}>
                <span style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text)',
                  fontWeight: 'var(--font-weight-medium)',
                  minWidth: '60px'
                }}>
                  {month.month}
                </span>
                <div style={{
                  flex: 1,
                  height: '8px',
                  backgroundColor: 'var(--color-background)',
                  borderRadius: '4px',
                  margin: '0 12px',
                  position: 'relative'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(month.cases / 15) * 100}%`,
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: '4px'
                  }} />
                </div>
                <span style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  minWidth: '80px',
                  textAlign: 'left'
                }}>
                  {month.cases} قضية
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Lawyer Performance */}
      <ChartCard title="أداء المحامين">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {mockReportsData.lawyerPerformance.map((lawyer, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -2 }}
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '20px'
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
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-bold)'
                }}>
                  {lawyer.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text)',
                    margin: 0,
                    marginBottom: '4px'
                  }}>
                    {lawyer.name}
                  </h4>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    margin: 0
                  }}>
                    محامي رئيسي
                  </p>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    عدد القضايا
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text)'
                  }}>
                    {lawyer.cases}
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    معدل الإنجاز
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-success)'
                  }}>
                    {lawyer.completionRate}%
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    الإيرادات
                  </span>
                  <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-primary)'
                  }}>
                    {formatCurrency(lawyer.revenue)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ChartCard>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginTop: '32px'
      }}>
        <StatCard
          title="متوسط وقت الحل"
          value={`${mockReportsData.averageResolutionTime} يوم`}
          change="-5 أيام من الشهر الماضي"
          changeType="positive"
          icon={<Clock style={{ height: '24px', width: '24px' }} />}
          color="var(--color-success)"
        />
        
        <StatCard
          title="المهام المتأخرة"
          value={mockReportsData.overdueTasks}
          change="-3 من الشهر الماضي"
          changeType="positive"
          icon={<AlertCircle style={{ height: '24px', width: '24px' }} />}
          color="var(--color-error)"
        />
        
        <StatCard
          title="العملاء النشطون"
          value={mockReportsData.activeClients}
          change="+4 من الشهر الماضي"
          changeType="positive"
          icon={<Users style={{ height: '24px', width: '24px' }} />}
          color="var(--color-info)"
        />
        
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(mockReportsData.totalRevenue)}
          change="+18% من العام الماضي"
          changeType="positive"
          icon={<DollarSign style={{ height: '24px', width: '24px' }} />}
          color="var(--color-warning)"
        />
      </div>
    </div>
  );
};

export default Reports;
