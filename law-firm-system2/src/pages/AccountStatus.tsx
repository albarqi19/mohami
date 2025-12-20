import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    CreditCard,
    Download,
    Eye,
    FileX,
    Upload,
    Edit,
    Loader2
} from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import type { SubscriptionData } from '../services/subscriptionService';
import '../styles/settings-page.css';

const AccountStatus: React.FC = () => {
    const navigate = useNavigate();
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubscription();
    }, []);

    const loadSubscription = async () => {
        try {
            setLoading(true);
            const response = await subscriptionService.getCurrentSubscription();
            if (response.success) {
                setSubscriptionData(response.data);
                // If subscription is active, redirect to dashboard
                if (response.data.can_access_system) {
                    navigate('/dashboard');
                }
            }
        } catch (error) {
            console.error('Error loading subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="account-status-page">
                <div className="account-status-loading">
                    <Loader2 className="animate-spin" size={32} />
                    <span>جاري التحقق من حالة الحساب...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="account-status-page">
            <div className="account-status-container">
                {/* Warning Header */}
                <div className="account-status-header">
                    <div className="account-status-header__icon">
                        <AlertTriangle size={48} />
                    </div>
                    <h1>انتهى اشتراكك</h1>
                    <p>
                        انتهت صلاحية اشتراك <strong>{subscriptionData?.tenant?.name || 'حسابك'}</strong>
                        {subscriptionData?.subscription?.expires_at && (
                            <> في تاريخ {formatDate(subscriptionData.subscription.expires_at)}</>
                        )}
                    </p>
                </div>

                {/* What you can do */}
                <div className="account-status-card">
                    <h3>ما يمكنك فعله:</h3>
                    <ul className="account-status-list account-status-list--allowed">
                        <li>
                            <Eye size={16} />
                            <span>عرض بياناتك (للقراءة فقط)</span>
                        </li>
                        <li>
                            <Download size={16} />
                            <span>تصدير بياناتك</span>
                        </li>
                        <li>
                            <CreditCard size={16} />
                            <span>تجديد اشتراكك</span>
                        </li>
                    </ul>
                </div>

                {/* What you can't do */}
                <div className="account-status-card account-status-card--restricted">
                    <h3>ما لا يمكنك فعله:</h3>
                    <ul className="account-status-list account-status-list--restricted">
                        <li>
                            <FileX size={16} />
                            <span>إضافة قضايا جديدة</span>
                        </li>
                        <li>
                            <Edit size={16} />
                            <span>تعديل البيانات</span>
                        </li>
                        <li>
                            <Upload size={16} />
                            <span>رفع وثائق جديدة</span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="account-status-actions">
                    <button
                        className="account-status-btn account-status-btn--primary"
                        onClick={() => navigate('/settings')}
                    >
                        <CreditCard size={18} />
                        تجديد الاشتراك
                    </button>
                    <button className="account-status-btn account-status-btn--secondary">
                        <Download size={18} />
                        تصدير البيانات
                    </button>
                </div>

                {/* Support */}
                <div className="account-status-support">
                    لأي استفسارات: <a href="mailto:support@lawfirm.sa">support@lawfirm.sa</a>
                </div>
            </div>
        </div>
    );
};

export default AccountStatus;
