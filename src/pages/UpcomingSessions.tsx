import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	Calendar,
	Clock,
	MapPin,
	FileText,
	User,
	ChevronLeft,
	AlertCircle,
	Filter,
	RefreshCw
} from 'lucide-react';
import { apiClient } from '../utils/api';

interface Session {
	id: number;
	case_id: number;
	session_type: string | null;
	session_number: string | null;
	session_date: string | null;
	session_time: string | null;
	status: string;
	najiz_status: string | null;
	court: string | null;
	department: string | null;
	method: string | null;
	location: string | null;
	degree: string | null;
	result: string | null;
	case?: {
		id: number;
		title: string;
		file_number: string;
		case_type_arabic: string | null;
		client_name: string | null;
		court: string | null;
		najiz_status: string | null;
	};
}

const UpcomingSessions: React.FC = () => {
	const navigate = useNavigate();
	const [sessions, setSessions] = useState<Session[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filter, setFilter] = useState<'all' | 'upcoming' | 'today' | 'week'>('upcoming');

	const fetchSessions = async () => {
		try {
			setLoading(true);
			setError(null);
			const response = await apiClient.get<{ success: boolean; data: Session[] }>('/sessions/upcoming');
			const data = response.data || [];
			setSessions(Array.isArray(data) ? data : []);
		} catch (err) {
			console.error('Error fetching sessions:', err);
			setError('خطأ في جلب الجلسات');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSessions();
	}, []);

	// تصفية الجلسات
	const filteredSessions = sessions.filter(session => {
		if (!session.session_date) return filter === 'all';
		
		const sessionDate = new Date(session.session_date);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const endOfWeek = new Date(today);
		endOfWeek.setDate(today.getDate() + 7);

		switch (filter) {
			case 'today':
				return sessionDate.toDateString() === today.toDateString();
			case 'week':
				return sessionDate >= today && sessionDate <= endOfWeek;
			case 'upcoming':
				return sessionDate >= today;
			default:
				return true;
		}
	});

	// ترتيب الجلسات حسب التاريخ (الأقرب أولاً)
	const sortedSessions = [...filteredSessions].sort((a, b) => {
		const dateA = a.session_date ? new Date(a.session_date).getTime() : Infinity;
		const dateB = b.session_date ? new Date(b.session_date).getTime() : Infinity;
		return dateA - dateB;
	});

	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return 'غير محدد';
		const date = new Date(dateStr);
		return date.toLocaleDateString('ar-SA', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	const formatTime = (timeStr: string | null) => {
		if (!timeStr) return '';
		return timeStr;
	};

	const getStatusColor = (status: string | null) => {
		if (!status) return '#6b7280';
		const s = status.toLowerCase();
		if (s.includes('جديدة') || s.includes('scheduled')) return '#34d399';
		if (s.includes('منعقدة') || s.includes('completed')) return '#94a3b8';
		if (s.includes('مؤجلة') || s.includes('postponed')) return '#fb923c';
		if (s.includes('ملغية') || s.includes('cancelled')) return '#f87171';
		return '#fbbf24';
	};

	const getDaysUntil = (dateStr: string | null) => {
		if (!dateStr) return null;
		const sessionDate = new Date(dateStr);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		sessionDate.setHours(0, 0, 0, 0);
		const diff = Math.ceil((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		
		if (diff === 0) return 'اليوم';
		if (diff === 1) return 'غداً';
		if (diff < 0) return `منذ ${Math.abs(diff)} يوم`;
		if (diff <= 7) return `بعد ${diff} أيام`;
		if (diff <= 30) return `بعد ${Math.ceil(diff / 7)} أسابيع`;
		return `بعد ${Math.ceil(diff / 30)} شهر`;
	};

	const getUrgencyColor = (dateStr: string | null) => {
		if (!dateStr) return 'transparent';
		const sessionDate = new Date(dateStr);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const diff = Math.ceil((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		
		if (diff <= 0) return '#f87171'; // اليوم أو فات
		if (diff <= 2) return '#fb923c'; // خلال يومين
		if (diff <= 7) return '#fbbf24'; // خلال أسبوع
		return '#34d399'; // أكثر من أسبوع
	};

	return (
		<div className="page-wrapper">
			{/* Header */}
			<header className="page-header" style={{ marginBottom: '24px' }}>
				<div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
						<button
							onClick={() => navigate('/cases')}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
								padding: '4px 8px',
								backgroundColor: 'transparent',
								border: 'none',
								color: 'var(--color-text-secondary)',
								cursor: 'pointer',
								fontSize: 'var(--font-size-sm)'
							}}
						>
							<ChevronLeft size={16} />
							القضايا
						</button>
					</div>
					<h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<Calendar size={28} />
						الجلسات القادمة
					</h1>
					<p className="page-subtitle">متابعة جميع الجلسات المجدولة والقادمة</p>
				</div>
				<div style={{ display: 'flex', gap: '8px' }}>
					<button
						onClick={fetchSessions}
						disabled={loading}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							padding: '8px 16px',
							backgroundColor: 'var(--color-surface)',
							border: '1px solid var(--color-border)',
							borderRadius: '8px',
							color: 'var(--color-text)',
							cursor: 'pointer'
						}}
					>
						<RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
						تحديث
					</button>
				</div>
			</header>

			{/* Filters */}
			<div style={{
				display: 'flex',
				gap: '8px',
				marginBottom: '24px',
				flexWrap: 'wrap'
			}}>
				{[
					{ key: 'upcoming', label: 'القادمة', icon: Calendar },
					{ key: 'today', label: 'اليوم', icon: Clock },
					{ key: 'week', label: 'هذا الأسبوع', icon: Calendar },
					{ key: 'all', label: 'الكل', icon: Filter }
				].map(({ key, label, icon: Icon }) => (
					<button
						key={key}
						onClick={() => setFilter(key as any)}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							padding: '8px 16px',
							backgroundColor: filter === key ? 'var(--color-primary)' : 'var(--color-surface)',
							border: `1px solid ${filter === key ? 'var(--color-primary)' : 'var(--color-border)'}`,
							borderRadius: '8px',
							color: filter === key ? 'white' : 'var(--color-text)',
							cursor: 'pointer',
							fontSize: 'var(--font-size-sm)',
							fontWeight: filter === key ? '600' : '400',
							transition: 'all 0.2s'
						}}
					>
						<Icon size={16} />
						{label}
					</button>
				))}
			</div>

			{/* Stats */}
			<div style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
				gap: '16px',
				marginBottom: '24px'
			}}>
				<div style={{
					padding: '16px',
					backgroundColor: 'var(--color-surface)',
					borderRadius: '12px',
					border: '1px solid var(--color-border)',
					textAlign: 'center'
				}}>
					<div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
						{sortedSessions.length}
					</div>
					<div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
						إجمالي الجلسات
					</div>
				</div>
				<div style={{
					padding: '16px',
					backgroundColor: 'var(--color-surface)',
					borderRadius: '12px',
					border: '1px solid var(--color-border)',
					textAlign: 'center'
				}}>
					<div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>
						{sortedSessions.filter(s => {
							if (!s.session_date) return false;
							const d = new Date(s.session_date);
							const today = new Date();
							return d.toDateString() === today.toDateString();
						}).length}
					</div>
					<div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
						جلسات اليوم
					</div>
				</div>
				<div style={{
					padding: '16px',
					backgroundColor: 'var(--color-surface)',
					borderRadius: '12px',
					border: '1px solid var(--color-border)',
					textAlign: 'center'
				}}>
					<div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fb923c' }}>
						{sortedSessions.filter(s => {
							if (!s.session_date) return false;
							const d = new Date(s.session_date);
							const today = new Date();
							const weekEnd = new Date(today);
							weekEnd.setDate(today.getDate() + 7);
							return d >= today && d <= weekEnd;
						}).length}
					</div>
					<div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
						هذا الأسبوع
					</div>
				</div>
			</div>

			{/* Content */}
			{loading && (
				<div style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					padding: '48px',
					color: 'var(--color-text-secondary)'
				}}>
					<RefreshCw size={24} className="animate-spin" style={{ marginLeft: '8px' }} />
					جاري التحميل...
				</div>
			)}

			{!loading && error && (
				<div style={{
					padding: '32px',
					textAlign: 'center',
					backgroundColor: 'var(--color-error-soft)',
					borderRadius: '12px',
					color: 'var(--color-error)'
				}}>
					<AlertCircle size={48} style={{ marginBottom: '16px' }} />
					<h3>{error}</h3>
					<button
						onClick={fetchSessions}
						style={{
							marginTop: '16px',
							padding: '8px 24px',
							backgroundColor: 'var(--color-primary)',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							cursor: 'pointer'
						}}
					>
						إعادة المحاولة
					</button>
				</div>
			)}

			{!loading && !error && sortedSessions.length === 0 && (
				<div style={{
					padding: '48px',
					textAlign: 'center',
					backgroundColor: 'var(--color-surface)',
					borderRadius: '12px',
					border: '1px solid var(--color-border)'
				}}>
					<Calendar size={48} style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }} />
					<h3 style={{ color: 'var(--color-text)', marginBottom: '8px' }}>لا توجد جلسات</h3>
					<p style={{ color: 'var(--color-text-secondary)' }}>
						{filter === 'today' ? 'لا توجد جلسات اليوم' :
						 filter === 'week' ? 'لا توجد جلسات هذا الأسبوع' :
						 'لا توجد جلسات قادمة'}
					</p>
				</div>
			)}

			{!loading && !error && sortedSessions.length > 0 && (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
					{sortedSessions.map((session) => (
						<motion.div
							key={session.id}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							whileHover={{ scale: 1.01 }}
							onClick={() => session.case_id && navigate(`/cases/${session.case_id}`)}
							style={{
								padding: '20px',
								backgroundColor: 'var(--color-surface)',
								borderRadius: '12px',
								border: '1px solid var(--color-border)',
								borderRight: `4px solid ${getUrgencyColor(session.session_date)}`,
								cursor: 'pointer',
								transition: 'all 0.2s'
							}}
						>
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								marginBottom: '16px',
								flexWrap: 'wrap',
								gap: '12px'
							}}>
								<div>
									<h3 style={{
										fontSize: 'var(--font-size-lg)',
										fontWeight: '600',
										color: 'var(--color-text)',
										marginBottom: '4px'
									}}>
										{session.case?.title || `قضية رقم ${session.case_id}`}
									</h3>
									<div style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										color: 'var(--color-text-secondary)',
										fontSize: 'var(--font-size-sm)'
									}}>
										<FileText size={14} />
										{session.case?.file_number || 'غير محدد'}
										{session.case?.case_type_arabic && (
											<span style={{
												padding: '2px 8px',
												backgroundColor: 'var(--color-primary-soft)',
												color: 'var(--color-primary)',
												borderRadius: '4px',
												fontSize: 'var(--font-size-xs)'
											}}>
												{session.case.case_type_arabic}
											</span>
										)}
									</div>
								</div>
								<div style={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-end',
									gap: '4px'
								}}>
									<span style={{
										padding: '4px 12px',
										backgroundColor: `${getStatusColor(session.najiz_status || session.status)}20`,
										color: getStatusColor(session.najiz_status || session.status),
										borderRadius: '6px',
										fontSize: 'var(--font-size-xs)',
										fontWeight: '500'
									}}>
										{session.najiz_status || session.status || 'مجدولة'}
									</span>
									<span style={{
										padding: '4px 12px',
										backgroundColor: `${getUrgencyColor(session.session_date)}20`,
										color: getUrgencyColor(session.session_date),
										borderRadius: '6px',
										fontSize: 'var(--font-size-xs)',
										fontWeight: '600'
									}}>
										{getDaysUntil(session.session_date)}
									</span>
								</div>
							</div>

							<div style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
								gap: '12px'
							}}>
								<div style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									color: 'var(--color-text-secondary)',
									fontSize: 'var(--font-size-sm)'
								}}>
									<Calendar size={16} style={{ color: 'var(--color-primary)' }} />
									<span>{formatDate(session.session_date)}</span>
								</div>

								{session.session_time && (
									<div style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										color: 'var(--color-text-secondary)',
										fontSize: 'var(--font-size-sm)'
									}}>
										<Clock size={16} style={{ color: 'var(--color-warning)' }} />
										<span>{formatTime(session.session_time)}</span>
									</div>
								)}

								{(session.court || session.case?.court) && (
									<div style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										color: 'var(--color-text-secondary)',
										fontSize: 'var(--font-size-sm)'
									}}>
										<MapPin size={16} style={{ color: 'var(--color-accent)' }} />
										<span>{session.court || session.case?.court}</span>
									</div>
								)}

								{session.case?.client_name && (
									<div style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										color: 'var(--color-text-secondary)',
										fontSize: 'var(--font-size-sm)'
									}}>
										<User size={16} style={{ color: 'var(--color-success)' }} />
										<span>{session.case.client_name}</span>
									</div>
								)}

								{session.session_type && (
									<div style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										color: 'var(--color-text-secondary)',
										fontSize: 'var(--font-size-sm)'
									}}>
										<FileText size={16} style={{ color: 'var(--color-info)' }} />
										<span>نوع الجلسة: {session.session_type}</span>
									</div>
								)}

								{session.location && (
									<div style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										color: 'var(--color-text-secondary)',
										fontSize: 'var(--font-size-sm)'
									}}>
										<MapPin size={16} style={{ color: 'var(--color-error)' }} />
										<span>القاعة: {session.location}</span>
									</div>
								)}
							</div>

							{session.result && (
								<div style={{
									marginTop: '12px',
									padding: '8px 12px',
									backgroundColor: 'var(--color-background)',
									borderRadius: '6px',
									fontSize: 'var(--font-size-sm)',
									color: 'var(--color-text-secondary)'
								}}>
									<strong>النتيجة:</strong> {session.result}
								</div>
							)}
						</motion.div>
					))}
				</div>
			)}
		</div>
	);
};

export default UpcomingSessions;
