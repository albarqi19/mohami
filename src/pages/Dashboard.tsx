import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckSquare,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ClientDashboard from './ClientDashboard';
import ContentSearch from '../components/ContentSearch';

type StatTone = 'primary' | 'success' | 'warning' | 'error';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  tone: StatTone;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

const statPalette: Record<StatTone, { accent: string; soft: string }> = {
  primary: {
    accent: 'var(--color-primary)',
    soft: 'rgba(31, 78, 121, 0.14)',
  },
  success: {
    accent: 'var(--color-success)',
    soft: 'rgba(27, 153, 139, 0.16)',
  },
  warning: {
    accent: 'var(--color-warning)',
    soft: 'rgba(244, 162, 89, 0.18)',
  },
  error: {
    accent: 'var(--color-error)',
    soft: 'rgba(209, 73, 91, 0.18)',
  },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  tone,
  change,
  changeType = 'increase',
}) => {
  const palette = statPalette[tone];
  const changeClass = `stat-card__change ${
    changeType === 'increase' ? 'stat-card__change--positive' : 'stat-card__change--negative'
  }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
      style={{
        // Using CSS variables to allow the design system to influence accents consistently.
        '--stat-accent': palette.accent,
        '--stat-accent-soft': palette.soft,
      } as React.CSSProperties}
    >
      <div className="stat-card__row">
        <div className="stat-card__details">
          <p className="stat-card__title">{title}</p>
          <p className="stat-card__value">{value}</p>
          {change && (
            <span className={changeClass}>
              {changeType === 'increase' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {change}
              <span>{' '}مقارنة بالشهر الماضي</span>
            </span>
          )}
        </div>
        <span className="stat-card__icon">
          <Icon size={22} />
        </span>
      </div>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'client') {
    return <ClientDashboard />;
  }

  const stats = [
    {
      title: 'إجمالي القضايا',
      value: 156,
      icon: FileText,
      tone: 'primary' as const,
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      title: 'المهام النشطة',
      value: 43,
      icon: CheckSquare,
      tone: 'success' as const,
      change: '+8%',
      changeType: 'increase' as const,
    },
    {
      title: 'المهام المتأخرة',
      value: 7,
      icon: AlertTriangle,
      tone: 'error' as const,
      change: '-3%',
      changeType: 'decrease' as const,
    },
    {
      title: 'الجلسات هذا الأسبوع',
      value: 12,
      icon: Calendar,
      tone: 'warning' as const,
      change: '+25%',
      changeType: 'increase' as const,
    },
  ];

  const recentCases = [
    {
      id: 1,
      title: 'قضية نزاع تجاري',
      client: 'شركة الخليج للتجارة',
      status: 'نشطة',
      priority: 'عالية',
      dueDate: '2025-09-20',
    },
    {
      id: 2,
      title: 'قضية عمالية',
      client: 'أحمد محمد علي',
      status: 'معلقة',
      priority: 'متوسطة',
      dueDate: '2025-09-22',
    },
    {
      id: 3,
      title: 'قضية عقارية',
      client: 'فاطمة أحمد',
      status: 'نشطة',
      priority: 'منخفضة',
      dueDate: '2025-09-25',
    },
  ];

  const upcomingTasks = [
    {
      id: 1,
      title: 'إعداد مذكرة دفاع',
      case: 'قضية نزاع تجاري',
      dueDate: '2025-09-18',
      priority: 'عالية',
    },
    {
      id: 2,
      title: 'مراجعة العقد',
      case: 'قضية عقارية',
      dueDate: '2025-09-19',
      priority: 'متوسطة',
    },
    {
      id: 3,
      title: 'تحضير للجلسة',
      case: 'قضية عمالية',
      dueDate: '2025-09-20',
      priority: 'عالية',
    },
  ];

  const dhikrCards = [
    {
      id: 'morning',
      title: 'أذكار الصباح',
      period: 'morning' as const,
      phrases: [
        'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ',
        'اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ',
        'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
      ],
    },
    {
      id: 'evening',
      title: 'أذكار المساء',
      period: 'evening' as const,
      phrases: [
        'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ',
        'اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ',
        'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ',
      ],
    },
  ];

  return (
    <div className="page-wrapper">
      <header className="page-header">
        <h1 className="page-title">لوحة التحكم</h1>
        <p className="page-subtitle">نظرة عامة على أنشطة الشركة والمهام الحالية</p>
        <ContentSearch
          className="page-search"
          placeholder="البحث في جميع القضايا والمهام والوثائق..."
          onResultSelect={(result) => {
            console.log('Selected result:', result);
          }}
        />
      </header>

      <section className="card-grid card-grid--cols-4 stats-grid" aria-label="إحصائيات سريعة">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="card-grid card-grid--balanced" aria-label="مستجدات العمل">
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="list-panel"
          aria-labelledby="recent-cases-heading"
        >
          <div className="list-panel__header">
            <h2 id="recent-cases-heading" className="list-panel__title">
              القضايا الحديثة
            </h2>
            <button type="button" className="list-panel__action">
              عرض الكل
            </button>
          </div>
          <div className="list-panel__body">
            {recentCases.map((case_) => (
              <div key={case_.id} className="list-tile">
                <div>
                  <h3 className="list-tile__title">{case_.title}</h3>
                  <p className="list-tile__subtitle">{case_.client}</p>
                </div>
                <div className="list-tile__meta">
                  <span className={`badge ${case_.status === 'نشطة' ? 'badge-success' : 'badge-warning'}`}>
                    {case_.status}
                  </span>
                  <span className="list-tile__meta-date">{case_.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="list-panel"
          aria-labelledby="upcoming-tasks-heading"
        >
          <div className="list-panel__header">
            <h2 id="upcoming-tasks-heading" className="list-panel__title">
              المهام القادمة
            </h2>
            <button type="button" className="list-panel__action">
              عرض الكل
            </button>
          </div>
          <div className="list-panel__body">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="list-tile">
                <div>
                  <h3 className="list-tile__title">{task.title}</h3>
                  <p className="list-tile__subtitle">{task.case}</p>
                </div>
                <div className="list-tile__meta">
                  <span
                    className={`badge ${
                      task.priority === 'عالية'
                        ? 'badge-error'
                        : task.priority === 'متوسطة'
                        ? 'badge-warning'
                        : 'badge-info'
                    }`}
                  >
                    {task.priority}
                  </span>
                  <span className="list-tile__meta-date">
                    <Clock size={14} />
                    {task.dueDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </section>
    </div>
  );
};

export default Dashboard;
