import React, { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	Plus,
	Search,
	Filter,
	MoreHorizontal,
	Calendar,
	User,
	AlertCircle,
	Clock,
	FileText,
	Download
} from 'lucide-react';
import type { Case, CaseStatus, CaseType, Priority } from '../types';
import { CaseService } from '../services';
import { UserService, type User as UserType } from '../services/UserService';
import AddCaseModal from '../components/AddCaseModal';

type ToneMeta = {
	label: string;
	tone: string;
	soft: string;
	border: string;
};

const STATUS_META: Record<string, ToneMeta> = {
	active: { label: 'نشطة', tone: 'var(--color-success)', soft: 'var(--color-success-soft)', border: 'rgba(27, 153, 139, 0.34)' },
	pending: { label: 'قيد النظر', tone: 'var(--color-warning)', soft: 'var(--color-warning-soft)', border: 'rgba(244, 162, 89, 0.34)' },
	closed: { label: 'منتهية', tone: 'var(--color-text-secondary)', soft: 'var(--color-neutral-soft)', border: 'rgba(100, 113, 137, 0.3)' },
	appealed: { label: 'مستأنفة', tone: 'var(--color-primary)', soft: 'var(--color-primary-soft)', border: 'rgba(31, 78, 121, 0.28)' },
	settled: { label: 'مصالحة', tone: 'var(--color-accent)', soft: 'var(--color-accent-soft)', border: 'rgba(46, 168, 161, 0.32)' },
	dismissed: { label: 'مرفوضة', tone: 'var(--color-error)', soft: 'var(--color-error-soft)', border: 'rgba(209, 73, 91, 0.32)' }
};

// ألوان حالات ناجز الأصلية
const NAJIZ_STATUS_COLORS: Record<string, ToneMeta> = {
	'منتهية': { label: 'منتهية', tone: '#94a3b8', soft: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' },
	'مغلقة': { label: 'مغلقة', tone: '#94a3b8', soft: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' },
	'قيد النظر': { label: 'قيد النظر', tone: '#fbbf24', soft: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)' },
	'جديدة': { label: 'جديدة', tone: '#34d399', soft: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)' },
	'نشطة': { label: 'نشطة', tone: '#2dd4bf', soft: 'rgba(45, 212, 191, 0.15)', border: 'rgba(45, 212, 191, 0.4)' },
	'معلقة': { label: 'معلقة', tone: '#fb923c', soft: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)' },
	'مستأنفة': { label: 'مستأنفة', tone: '#818cf8', soft: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.4)' },
	'محكومة': { label: 'محكومة', tone: '#a78bfa', soft: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.4)' },
};

const PRIORITY_META: Record<Priority, ToneMeta> = {
	urgent: { label: 'عاجلة', tone: 'var(--color-error)', soft: 'var(--color-error-soft)', border: 'rgba(209, 73, 91, 0.32)' },
	high: { label: 'مرتفعة', tone: 'var(--color-warning)', soft: 'var(--color-warning-soft)', border: 'rgba(244, 162, 89, 0.34)' },
	medium: { label: 'متوسطة', tone: 'var(--color-primary)', soft: 'var(--color-primary-soft)', border: 'rgba(31, 78, 121, 0.28)' },
	low: { label: 'منخفضة', tone: 'var(--color-text-secondary)', soft: 'var(--color-neutral-soft)', border: 'rgba(100, 113, 137, 0.26)' }
};

const CASE_TYPE_META: Record<CaseType, ToneMeta> = {
	civil: { label: 'مدنية', tone: 'var(--color-primary)', soft: 'var(--color-primary-soft)', border: 'rgba(31, 78, 121, 0.28)' },
	criminal: { label: 'جنائية', tone: 'var(--color-error)', soft: 'var(--color-error-soft)', border: 'rgba(209, 73, 91, 0.32)' },
	commercial: { label: 'تجارية', tone: 'var(--color-accent)', soft: 'var(--color-accent-soft)', border: 'rgba(46, 168, 161, 0.32)' },
	family: { label: 'أسرية', tone: 'var(--color-warning)', soft: 'var(--color-warning-soft)', border: 'rgba(244, 162, 89, 0.34)' },
	labor: { label: 'عمالية', tone: 'var(--color-success)', soft: 'var(--color-success-soft)', border: 'rgba(27, 153, 139, 0.34)' },
	administrative: { label: 'إدارية', tone: 'var(--color-info)', soft: 'var(--color-info-soft)', border: 'rgba(59, 130, 246, 0.3)' },
	real_estate: { label: 'عقارية', tone: 'var(--color-primary)', soft: 'var(--color-primary-soft)', border: 'rgba(31, 78, 121, 0.28)' },
	intellectual_property: { label: 'ملكية فكرية', tone: 'var(--color-accent)', soft: 'var(--color-accent-soft)', border: 'rgba(46, 168, 161, 0.32)' },
	other: { label: 'أخرى', tone: 'var(--color-text-secondary)', soft: 'var(--color-neutral-soft)', border: 'rgba(100, 113, 137, 0.26)' }
};

// ألوان مخصصة لأنواع القضايا العربية من ناجز - متوافقة مع Dark Mode
const ARABIC_CASE_TYPE_COLORS: Record<string, ToneMeta> = {
	// 🟢 القضايا التجارية والمالية - أخضر تركواز فاتح
	'النقل': { label: 'النقل', tone: '#2dd4bf', soft: 'rgba(45, 212, 191, 0.15)', border: 'rgba(45, 212, 191, 0.4)' },
	'المقاولات': { label: 'المقاولات', tone: '#2dd4bf', soft: 'rgba(45, 212, 191, 0.15)', border: 'rgba(45, 212, 191, 0.4)' },
	'مقاولات إنشاء مباني': { label: 'مقاولات إنشاء مباني', tone: '#2dd4bf', soft: 'rgba(45, 212, 191, 0.15)', border: 'rgba(45, 212, 191, 0.4)' },
	'الشركات النظامية': { label: 'الشركات النظامية', tone: '#2dd4bf', soft: 'rgba(45, 212, 191, 0.15)', border: 'rgba(45, 212, 191, 0.4)' },
	'شركات المضاربة': { label: 'شركات المضاربة', tone: '#2dd4bf', soft: 'rgba(45, 212, 191, 0.15)', border: 'rgba(45, 212, 191, 0.4)' },
	'بيع وتوريد': { label: 'بيع وتوريد', tone: '#2dd4bf', soft: 'rgba(45, 212, 191, 0.15)', border: 'rgba(45, 212, 191, 0.4)' },
	'عقد البيع': { label: 'عقد البيع', tone: '#2dd4bf', soft: 'rgba(45, 212, 191, 0.15)', border: 'rgba(45, 212, 191, 0.4)' },
	
	// 🔵 قضايا الإيجار والعقارات - أزرق سماوي
	'إجارة': { label: 'إجارة', tone: '#38bdf8', soft: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
	'عقد إيجار عقار': { label: 'عقد إيجار عقار', tone: '#38bdf8', soft: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
	'عقد إيجار منقول': { label: 'عقد إيجار منقول', tone: '#38bdf8', soft: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
	'ملكية عقار': { label: 'ملكية عقار', tone: '#38bdf8', soft: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
	'إخلاء عقار': { label: 'إخلاء عقار', tone: '#38bdf8', soft: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
	'استرداد حيازة عقار': { label: 'استرداد حيازة عقار', tone: '#38bdf8', soft: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
	'منع التعرض للحيازة': { label: 'منع التعرض للحيازة', tone: '#38bdf8', soft: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
	'قسمة عقارات مشتركة': { label: 'قسمة عقارات مشتركة', tone: '#38bdf8', soft: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' },
	
	// 🟠 قضايا الأسرة والأحوال الشخصية - برتقالي دافئ
	'نفقة ماضية': { label: 'نفقة ماضية', tone: '#fb923c', soft: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)' },
	'نفقة مستمرة': { label: 'نفقة مستمرة', tone: '#fb923c', soft: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)' },
	'زيادة نفقة أو إنقاصها أو إلغائها': { label: 'زيادة نفقة أو إنقاصها', tone: '#fb923c', soft: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)' },
	'حضانة': { label: 'حضانة', tone: '#fb923c', soft: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)' },
	'زيارة أولاد أو غيرهم': { label: 'زيارة أولاد', tone: '#fb923c', soft: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)' },
	'فسخ عقد زواج': { label: 'فسخ عقد زواج', tone: '#fb923c', soft: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)' },
	'خلع': { label: 'خلع', tone: '#fb923c', soft: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)' },
	'مهر': { label: 'مهر', tone: '#fb923c', soft: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)' },
	
	// 🟣 قضايا الولاية والحجر - بنفسجي فاتح
	'حجر أو رفعه': { label: 'حجر أو رفعه', tone: '#a78bfa', soft: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.4)' },
	'إقامة ولاية على قاصر عقلاً': { label: 'ولاية على قاصر عقلاً', tone: '#a78bfa', soft: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.4)' },
	'إقامة ولاية على قاصر سناً': { label: 'ولاية على قاصر سناً', tone: '#a78bfa', soft: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.4)' },
	'إذن التصرف بأملاك القاصر أو المفقود أو الغائب': { label: 'إذن تصرف بأملاك قاصر', tone: '#a78bfa', soft: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.4)' },
	
	// 🟤 قضايا التركات والوصايا - ذهبي/عسلي
	'قسمة تركة عقارية': { label: 'قسمة تركة عقارية', tone: '#fbbf24', soft: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)' },
	'قسمة تركة مالية': { label: 'قسمة تركة مالية', tone: '#fbbf24', soft: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)' },
	'محاسبة في تركة': { label: 'محاسبة في تركة', tone: '#fbbf24', soft: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)' },
	'استحقاق في وقف أو وصية': { label: 'استحقاق في وقف', tone: '#fbbf24', soft: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)' },
	'محاسبة ناظر وقف أو وصية': { label: 'محاسبة ناظر وقف', tone: '#fbbf24', soft: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)' },
	'هبة أو رجوع عنها': { label: 'هبة أو رجوع', tone: '#fbbf24', soft: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)' },
	
	// 🌲 قضايا العمل - أخضر زمردي
	'مطالبات العامل': { label: 'مطالبات العامل', tone: '#34d399', soft: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)' },
	'إنهاء العلاقة العمالية من صاحب العمل': { label: 'إنهاء علاقة عمالية', tone: '#34d399', soft: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)' },
	'أجر': { label: 'أجر', tone: '#34d399', soft: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)' },
	'مكافأة': { label: 'مكافأة', tone: '#34d399', soft: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)' },
	'أجرة أعمال': { label: 'أجرة أعمال', tone: '#34d399', soft: 'rgba(52, 211, 153, 0.15)', border: 'rgba(52, 211, 153, 0.4)' },
	
	// 🔴 قضايا جنائية ومرور - أحمر وردي فاتح (مريح للعين)
	'حق عام ناشئ عن خطأ طبي': { label: 'حق عام - خطأ طبي', tone: '#f472b6', soft: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.4)' },
	'حق خاص ناشئ عن حادث مروري': { label: 'حق خاص - حادث مروري', tone: '#f472b6', soft: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.4)' },
	'حق عام ناشئ عن حادث مروري': { label: 'حق عام - حادث مروري', tone: '#f472b6', soft: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.4)' },
	'حق خاص ناشئ عن خطأ طبي': { label: 'حق خاص - خطأ طبي', tone: '#f472b6', soft: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.4)' },
	'مخالفة نظام المرور': { label: 'مخالفة مرور', tone: '#f472b6', soft: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.4)' },
	'مخالفة نظام مكافحة المخدرات والمؤثرات العقلية': { label: 'مخالفة مخدرات', tone: '#f472b6', soft: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.4)' },
	'مخالفة نظام مكافحة غسل الأموال': { label: 'مخالفة غسل أموال', tone: '#f472b6', soft: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.4)' },
	'مخالفة نظام مكافحة جرائم المعلوماتية': { label: 'جرائم معلوماتية', tone: '#f472b6', soft: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.4)' },
	'قذف': { label: 'قذف', tone: '#f472b6', soft: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.4)' },
	'مسكر': { label: 'مسكر', tone: '#f472b6', soft: 'rgba(244, 114, 182, 0.15)', border: 'rgba(244, 114, 182, 0.4)' },
	
	// 🩵 قضايا العقود والوكالة - أزرق نيلي
	'عقد الوكالة': { label: 'عقد الوكالة', tone: '#818cf8', soft: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.4)' },
	'أتعاب محامين أو وكلاء': { label: 'أتعاب محامين', tone: '#818cf8', soft: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.4)' },
	'أتعاب محاماة أو وكلاء': { label: 'أتعاب محاماة', tone: '#818cf8', soft: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.4)' },
	'أتعاب المحاماة أو الوكلاء': { label: 'أتعاب المحاماة', tone: '#818cf8', soft: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.4)' },
	'عقد القرض': { label: 'عقد القرض', tone: '#818cf8', soft: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.4)' },
	'عقد الإيداع': { label: 'عقد الإيداع', tone: '#818cf8', soft: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.4)' },
	'فسخ عقد أو بطلانه': { label: 'فسخ عقد', tone: '#818cf8', soft: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.4)' },
	
	// 🩷 قضايا التعويضات - وردي سالموني
	'التعويض عن مصاريف التقاضي': { label: 'تعويض مصاريف تقاضي', tone: '#fb7185', soft: 'rgba(251, 113, 133, 0.15)', border: 'rgba(251, 113, 133, 0.4)' },
	'التعويض عن أضرار التقاضي': { label: 'تعويض أضرار تقاضي', tone: '#fb7185', soft: 'rgba(251, 113, 133, 0.15)', border: 'rgba(251, 113, 133, 0.4)' },
	'التعويض عن السجن': { label: 'تعويض عن السجن', tone: '#fb7185', soft: 'rgba(251, 113, 133, 0.15)', border: 'rgba(251, 113, 133, 0.4)' },
	'المسؤولية الناشئة عن الفعل الضار': { label: 'مسؤولية فعل ضار', tone: '#fb7185', soft: 'rgba(251, 113, 133, 0.15)', border: 'rgba(251, 113, 133, 0.4)' },
	
	// ⬜ قضايا مدنية عامة - رمادي فاتح
	'دعوى حقوقية': { label: 'دعوى حقوقية', tone: '#94a3b8', soft: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' },
	'مطالبة بمستندات': { label: 'مطالبة بمستندات', tone: '#94a3b8', soft: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' },
	'رد العين': { label: 'رد العين', tone: '#94a3b8', soft: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' },
	'رد ما استوفي خطأ': { label: 'رد ما استوفي خطأ', tone: '#94a3b8', soft: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' },
	'معارضة على صك إنهائي': { label: 'معارضة على صك', tone: '#94a3b8', soft: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' },
	'المطالبة بالحق الخاص': { label: 'مطالبة بحق خاص', tone: '#94a3b8', soft: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' },
	'المعاينة لإثبات الحالة': { label: 'معاينة لإثبات الحالة', tone: '#94a3b8', soft: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' },
	'عدم توفر شرط شكلي للسند أو تزويره أو  إنكار التوقيع': { label: 'إنكار توقيع/تزوير', tone: '#94a3b8', soft: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' },
};

// دالة للحصول على لون نوع القضية العربي
const getArabicCaseTypeColor = (arabicType: string | null | undefined): ToneMeta => {
	if (!arabicType) {
		return CASE_TYPE_META.other;
	}
	return ARABIC_CASE_TYPE_COLORS[arabicType] ?? {
		label: arabicType,
		tone: '#6b7280',
		soft: 'rgba(107, 114, 128, 0.12)',
		border: 'rgba(107, 114, 128, 0.3)'
	};
};

const buildChipStyles = (meta: ToneMeta): CSSProperties => ({
	'--chip-color': meta.tone,
	'--chip-bg': meta.soft,
	'--chip-border': meta.border
}) as CSSProperties;

const getStatusMeta = (status: CaseStatus): ToneMeta => STATUS_META[status] ?? {
	label: status,
	tone: 'var(--color-text-secondary)',
	soft: 'var(--color-neutral-soft)',
	border: 'rgba(100, 113, 137, 0.26)'
};

// دالة للحصول على حالة ناجز الأصلية
const getNajizStatusMeta = (najizStatus: string | null | undefined, fallbackStatus: CaseStatus): ToneMeta => {
	if (najizStatus && NAJIZ_STATUS_COLORS[najizStatus]) {
		return NAJIZ_STATUS_COLORS[najizStatus];
	}
	// إذا كانت الحالة من ناجز موجودة لكن غير معروفة، نعرضها كما هي
	if (najizStatus) {
		return {
			label: najizStatus,
			tone: '#6b7280',
			soft: 'rgba(107, 114, 128, 0.15)',
			border: 'rgba(107, 114, 128, 0.4)'
		};
	}
	// fallback للحالة المحولة
	return getStatusMeta(fallbackStatus);
};

const getPriorityMeta = (priority: Priority): ToneMeta => PRIORITY_META[priority] ?? {
	label: priority,
	tone: 'var(--color-text-secondary)',
	soft: 'var(--color-neutral-soft)',
	border: 'rgba(100, 113, 137, 0.26)'
};

const getCaseTypeMeta = (type: CaseType): ToneMeta => CASE_TYPE_META[type] ?? CASE_TYPE_META.other;

const formatDate = (value?: Date | string | null): string | null => {
	if (!value) {
		return null;
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return date.toLocaleDateString('ar-SA', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
};

const formatShortDate = (value?: Date | string | null): string | null => {
	if (!value) {
		return null;
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return date.toLocaleDateString('ar-SA', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
};

const formatCurrency = (value?: number | string | null): string | null => {
	if (value === null || value === undefined) {
		return null;
	}
	const numeric = typeof value === 'string' ? Number(value) : value;
	if (Number.isNaN(numeric)) {
		return null;
	}
	return numeric.toLocaleString('ar-SA', {
		style: 'currency',
		currency: 'SAR',
		maximumFractionDigits: 0
	});
};

const CaseCardSkeleton: React.FC = () => (
	<div className="case-card case-card--skeleton">
		<span className="skeleton-inline skeleton-inline--xl" />
		<span className="skeleton-inline skeleton-inline--lg" />
		<span className="skeleton-inline" />
		<span className="skeleton-inline" />
		<span className="skeleton-inline skeleton-inline--sm" />
	</div>
);

const getLawyerNames = (lawyers: unknown): string => {
	if (!Array.isArray(lawyers) || lawyers.length === 0) {
		return 'غير محدد';
	}

	return lawyers
		.map((lawyer) => (typeof lawyer === 'object' && lawyer && 'name' in lawyer ? (lawyer as { name?: string }).name ?? 'غير محدد' : 'غير محدد'))
		.join(', ');
};

const mapCaseType = (frontendType: string): string => {
	const typeMapping: Record<string, CaseType> = {
		'مدني': 'civil',
		'جزائي': 'criminal',
		'تجاري': 'commercial',
		'عمالي': 'labor',
		'أسري': 'family',
		'إداري': 'administrative',
		civil: 'civil',
		criminal: 'criminal',
		commercial: 'commercial',
		labor: 'labor',
		family: 'family',
		administrative: 'administrative'
	};

	return typeMapping[frontendType] ?? 'civil';
};

const Cases: React.FC = () => {
	const navigate = useNavigate();
	const [cases, setCases] = useState<Case[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
	const [typeFilter, setTypeFilter] = useState<CaseType | 'all'>('all');
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [lawyers, setLawyers] = useState<UserType[]>([]);
	const [clients, setClients] = useState<UserType[]>([]);
	const [pagination, setPagination] = useState({
		currentPage: 1,
		totalPages: 1,
		total: 0
	});

	const fetchCases = async (page: number = 1) => {
		try {
			setLoading(true);
			setError(null);
			setPagination((prev) => ({ ...prev, currentPage: page }));

			const filters = {
				page,
				limit: 10,
				...(searchTerm && { search: searchTerm }),
				...(statusFilter !== 'all' && { status: statusFilter }),
				...(typeFilter !== 'all' && { case_type: typeFilter })
			};

			const response = await CaseService.getCases(filters);
			const data = Array.isArray(response.data) ? response.data : [];

			setCases(data);
			setPagination({
				currentPage: response.current_page ?? page,
				totalPages: response.last_page ?? 1,
				total: response.total ?? data.length
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : 'خطأ في جلب القضايا');
			console.error('Error fetching cases:', err);
		} finally {
			setLoading(false);
		}
	};

	const fetchUsersData = async () => {
		try {
			const [lawyersData, clientsData] = await Promise.all([
				UserService.getLawyers(),
				UserService.getClients()
			]);
			setLawyers(lawyersData);
			setClients(clientsData);
		} catch (err) {
			console.error('Error fetching users data:', err);
		}
	};

	useEffect(() => {
		fetchCases();
		fetchUsersData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			fetchCases(1);
		}, 400);

		return () => window.clearTimeout(timeoutId);
	}, [searchTerm, statusFilter, typeFilter]);

	const handleAddCase = async (caseData: any) => {
		try {
			setLoading(true);

			console.log('Sending case data to backend:', caseData);
			const newCase = await CaseService.createCase(caseData);
			await fetchCases(pagination.currentPage);
			setIsAddModalOpen(false);
			console.log('Case created successfully:', newCase);
		} catch (err: any) {
			setError(err instanceof Error ? err.message : 'خطأ في إضافة القضية');
			console.error('Error adding case:', err);
			if (err.response?.data?.errors) {
				console.error('Validation errors:', err.response.data.errors);
			}
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteCase = async (caseId: string) => {
		if (!window.confirm('هل أنت متأكد من حذف هذه القضية؟')) {
			return;
		}

		try {
			setLoading(true);
			await CaseService.deleteCase(caseId);
			await fetchCases(pagination.currentPage);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'خطأ في حذف القضية');
			console.error('Error deleting case:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleAddCaseWrapper = async (caseData: any) => {
		try {
			if (!caseData.clientId || !caseData.assignedLawyer) {
				setError('يجب اختيار العميل والمحامي المكلف');
				return;
			}

			const createCaseData = {
				title: caseData.description || caseData.caseNumber || 'قضية جديدة',
				description: caseData.description || caseData.notes || 'وصف القضية',
				type: mapCaseType(caseData.caseType),
				priority: caseData.priority || 'medium',
				client_id: parseInt(caseData.clientId, 10),
				primary_lawyer_id: parseInt(caseData.assignedLawyer, 10),
				start_date: caseData.filingDate || new Date().toISOString().split('T')[0],
				expected_end_date: caseData.hearingDate ? new Date(caseData.hearingDate).toISOString().split('T')[0] : null,
				court_name: caseData.court || null,
				court_reference: caseData.caseNumber || null,
				opposing_party: caseData.opponentName || null,
				case_value: caseData.contractValue ? parseFloat(caseData.contractValue) : null,
				status: 'active'
			};

			console.log('Original form data:', caseData);
			console.log('Converted API data:', createCaseData);

			await handleAddCase(createCaseData);
		} catch (err) {
			console.error('Error in handleAddCaseWrapper:', err);
		}
	};

	const handlePageChange = (page: number) => {
		if (page < 1 || page > pagination.totalPages) {
			return;
		}
		fetchCases(page);
	};

	const hasActiveFilters = useMemo(
		() => Boolean(searchTerm.trim()) || statusFilter !== 'all' || typeFilter !== 'all',
		[searchTerm, statusFilter, typeFilter]
	);

	const resetFilters = () => {
		setSearchTerm('');
		setStatusFilter('all');
		setTypeFilter('all');
	};

	const skeletonItems = useMemo(() => Array.from({ length: 6 }, (_, index) => index), []);
	const canGoPrev = pagination.currentPage > 1;
	const canGoNext = pagination.currentPage < pagination.totalPages;

	return (
		<div className="page-wrapper cases-page">
			<header className="cases-header page-header">
				<div className="cases-header__content">
					<h1 className="page-title">إدارة القضايا</h1>
					<p className="page-subtitle">منصة موحدة لمتابعة الدعاوى والمواعيد والمحامين في مكان واحد</p>
				</div>
				<div className="cases-header__actions">
					<button
						type="button"
						className="button button--ghost"
						onClick={() => {
							console.log('Exporting cases report');
						}}
					>
						<Download size={18} />
						تصدير التقارير
					</button>
					<motion.button
						type="button"
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className="button button--primary"
						onClick={() => setIsAddModalOpen(true)}
					>
						<Plus size={18} />
						إضافة قضية جديدة
					</motion.button>
				</div>
			</header>

			<section className="cases-toolbar">
				<div className="cases-toolbar__filters">
					<div className="form-field">
						<label className="form-label" htmlFor="cases-search">البحث</label>
						<div className="input-wrapper">
							<input
								type="text"
								id="cases-search"
								className="input input--with-icon"
								placeholder="ابحث باسم القضية أو رقم الملف"
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
							/>
							<span className="input-icon">
								<Search size={18} />
							</span>
						</div>
					</div>

					<div className="form-field">
						<label className="form-label" htmlFor="cases-status">الحالة</label>
						<select
							id="cases-status"
							className="select"
							value={statusFilter}
							onChange={(event) => setStatusFilter(event.target.value as CaseStatus | 'all')}
						>
							<option value="all">جميع الحالات</option>
							<option value="active">نشطة</option>
							<option value="pending">قيد النظر</option>
							<option value="closed">مغلقة</option>
							<option value="appealed">مستأنفة</option>
							<option value="settled">مصالحة</option>
							<option value="dismissed">مرفوضة</option>
						</select>
					</div>

					<div className="form-field">
						<label className="form-label" htmlFor="cases-type">نوع القضية</label>
						<select
							id="cases-type"
							className="select"
							value={typeFilter}
							onChange={(event) => setTypeFilter(event.target.value as CaseType | 'all')}
						>
							<option value="all">جميع الأنواع</option>
							<option value="civil">مدنية</option>
							<option value="criminal">جنائية</option>
							<option value="commercial">تجارية</option>
							<option value="family">أسرية</option>
							<option value="labor">عمالية</option>
							<option value="administrative">إدارية</option>
							<option value="real_estate">عقارية</option>
							<option value="intellectual_property">ملكية فكرية</option>
							<option value="other">أخرى</option>
						</select>
					</div>
				</div>

				<div className="cases-toolbar__meta">
					<div className="cases-toolbar__stats">
						<span>عدد السجلات: {pagination.total}</span>
						<span>الصفحة الحالية: {pagination.currentPage} من {pagination.totalPages}</span>
					</div>
					<button
						type="button"
						className="button button--ghost"
						onClick={resetFilters}
						disabled={!hasActiveFilters}
					>
						<Filter size={18} />
						إعادة تعيين الفلاتر
					</button>
				</div>
			</section>

			<section className="list-panel cases-panel">
				<div className="list-panel__header">
					<h2 className="list-panel__title">القضايا ({pagination.total})</h2>
					<button
						type="button"
						className="button button--ghost"
						onClick={() => fetchCases(pagination.currentPage)}
						disabled={loading}
					>
						<RefreshCta isLoading={loading} />
					</button>
				</div>
				<div className="list-panel__body">
					{loading && (
						<div className="cases-list cases-list--grid">
							{skeletonItems.map((item) => (
								<CaseCardSkeleton key={item} />
							))}
						</div>
					)}

					{!loading && error && (
						<div className="feedback-card feedback-card--error">
							<AlertCircle size={48} />
							<h3>حدث خطأ أثناء جلب البيانات</h3>
							<p className="feedback-card__description">{error}</p>
							<button type="button" className="button button--primary" onClick={() => fetchCases(pagination.currentPage)}>
								إعادة المحاولة
							</button>
						</div>
					)}

					{!loading && !error && cases.length === 0 && (
						<div className="empty-state">
							<FileText size={42} style={{ marginBottom: 12 }} />
							<h3>لا توجد قضايا مطابقة</h3>
							<p>جرّب تعديل معايير البحث أو إضافة قضية جديدة.</p>
						</div>
					)}

					{!loading && !error && cases.length > 0 && (
						<div className="cases-list cases-list--grid">
							{[...cases].sort((a, b) => {
								// ترتيب حسب تاريخ القضية (الأحدث أولاً)
								const dateA = (a as any).filing_date ? new Date((a as any).filing_date).getTime() : 0;
								const dateB = (b as any).filing_date ? new Date((b as any).filing_date).getTime() : 0;
								return dateB - dateA;
							}).map((caseItem) => {
								// استخدم حالة ناجز الأصلية إذا كانت موجودة
								const najizStatus = (caseItem as any).najiz_status;
								const statusMeta = getNajizStatusMeta(najizStatus, caseItem.status);
								const priorityMeta = getPriorityMeta(caseItem.priority);
								// استخدم نوع القضية العربي إذا كان موجوداً
								const arabicType = (caseItem as any).case_type_arabic;
								const caseTypeMeta = arabicType 
									? getArabicCaseTypeColor(arabicType)
									: getCaseTypeMeta(caseItem.case_type);
								const statusStyles = buildChipStyles(statusMeta);
								const priorityStyles = buildChipStyles(priorityMeta);
								const caseTypeStyles = buildChipStyles(caseTypeMeta);
								const nextHearing = formatShortDate(caseItem.next_hearing);
								const lastUpdate = formatShortDate(caseItem.updated_at) ?? formatDate(caseItem.updated_at);
								const contractValue = formatCurrency(caseItem.contract_value);
								const description = caseItem.description || 'لا يوجد وصف متوفر لهذه القضية حتى الآن.';
								// تاريخ القضية (الهجري أو الميلادي)
								const caseDate = (caseItem as any).case_date_hijri || formatShortDate((caseItem as any).filing_date);

								return (
									<motion.article
										key={caseItem.id}
										className="case-card"
										whileHover={{ translateY: -6 }}
										onClick={() => navigate(`/cases/${caseItem.id}`)}
									>
										<header className="case-card__header">
											<div className="case-card__title-group">
												<h3 className="case-card__title">{caseItem.title}</h3>
											</div>
											<div className="case-card__title-group">
												<span className="chip" style={statusStyles}>
													{statusMeta.label}
												</span>
												<button
													type="button"
													className="icon-button"
													onClick={(event) => {
														event.stopPropagation();
														handleDeleteCase(caseItem.id);
													}}
												>
													<MoreHorizontal size={18} />
												</button>
											</div>
										</header>

										<p className="case-card__description">{description}</p>

										<div className="case-card__meta">
											<div className="case-card__meta-item">
												<User size={18} />
												<span>العميل: {caseItem.client_name || 'غير محدد'}</span>
											</div>
											<div className="case-card__meta-item">
												<FileText size={18} />
												<span>رقم الملف: {caseItem.file_number || 'غير متوفر'}</span>
											</div>
											{caseDate && (
												<div className="case-card__meta-item">
													<Calendar size={18} />
													<span>تاريخ القضية: {caseDate}</span>
												</div>
											)}
											<div className="case-card__meta-item">
												<FileText size={18} />
												<span className="chip" style={caseTypeStyles}>
													{caseTypeMeta.label}
												</span>
											</div>
											<div className="case-card__meta-item">
												<User size={18} />
												<span>المحامون: {getLawyerNames(caseItem.lawyers)}</span>
											</div>
											{nextHearing && (
												<div className="case-card__meta-item">
													<Calendar size={18} />
													<span>الجلسة القادمة: {nextHearing}</span>
												</div>
											)}
											{caseItem.court && (
												<div className="case-card__meta-item">
													<AlertCircle size={18} />
													<span>المحكمة: {caseItem.court}</span>
												</div>
											)}
										</div>

										<footer className="case-card__footer">
											<div className="case-card__meta-item" style={{ margin: 0 }}>
												<Clock size={16} />
												<span>آخر تحديث: {lastUpdate || 'غير متوفر'}</span>
											</div>
											{contractValue && <span className="case-card__value">{contractValue}</span>}
										</footer>
									</motion.article>
								);
							})}
						</div>
					)}
				</div>

				<div className="cases-pagination">
					<div className="cases-pagination__summary">
						<span>إجمالي الصفحات: {pagination.totalPages}</span>
					</div>
					<div className="cases-pagination__controls">
						<button
							type="button"
							className="button button--outline"
							onClick={() => handlePageChange(pagination.currentPage - 1)}
							disabled={!canGoPrev || loading}
						>
							السابق
						</button>
						<span className="cases-pagination__summary">
							الصفحة {pagination.currentPage} من {pagination.totalPages}
						</span>
						<button
							type="button"
							className="button button--outline"
							onClick={() => handlePageChange(pagination.currentPage + 1)}
							disabled={!canGoNext || loading}
						>
							التالي
						</button>
					</div>
				</div>
			</section>

			<AddCaseModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSave={handleAddCaseWrapper}
				lawyers={lawyers}
				clients={clients}
			/>
		</div>
	);
};

type RefreshCtaProps = {
	isLoading: boolean;
};

const RefreshCta: React.FC<RefreshCtaProps> = ({ isLoading }) => (
	<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
		<Clock size={16} style={isLoading ? { animation: 'spin 0.9s linear infinite' } : undefined} />
		{isLoading ? 'جاري التحديث...' : 'تحديث القائمة'}
	</span>
);

export default Cases;
