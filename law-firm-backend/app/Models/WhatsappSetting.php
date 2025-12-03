<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WhatsappSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'webhook_url',
        'access_token', 
        'verify_token',
        'phone_number_id',
        'notifications_enabled',
        'notification_settings',
        'message_templates',
        'daily_report_time',
        'daily_report_enabled',
        'working_hours'
    ];

    protected $casts = [
        'notifications_enabled' => 'boolean',
        'daily_report_enabled' => 'boolean',
        'notification_settings' => 'array',
        'message_templates' => 'array',
        'working_hours' => 'array',
        'daily_report_time' => 'datetime:H:i'
    ];

    /**
     * الحصول على قوالب الرسائل الافتراضية
     */
    public static function getDefaultTemplates()
    {
        return [
            'case_created' => [
                'title' => 'إشعار قضية جديدة',
                'template' => 'مرحباً {client_name}، تم إنشاء قضية جديدة برقم {case_number}. العنوان: {case_title}. سنقوم بمتابعتها معك خطوة بخطوة.'
            ],
            'case_updated' => [
                'title' => 'تحديث القضية',
                'template' => 'عزيزي {client_name}، تم تحديث قضيتك رقم {case_number}. الحالة الجديدة: {case_status}. {update_description}'
            ],
            'hearing_reminder' => [
                'title' => 'تذكير بجلسة محكمة',
                'template' => 'تذكير هام: لديك جلسة محكمة غداً في تمام الساعة {hearing_time} للقضية رقم {case_number}. الموقع: {court_location}'
            ],
            'document_request' => [
                'title' => 'طلب وثائق',
                'template' => 'مرحباً {client_name}، نحتاج منك تقديم الوثائق التالية للقضية رقم {case_number}: {required_documents}'
            ],
            'payment_reminder' => [
                'title' => 'تذكير بالدفع',
                'template' => 'عزيزي {client_name}، نذكرك بوجود مستحقات مالية للقضية رقم {case_number} بمبلغ {amount}. تاريخ الاستحقاق: {due_date}'
            ],
            'welcome_message' => [
                'title' => 'رسالة ترحيب',
                'template' => 'مرحباً {client_name}، أهلاً بك في مكتب المحاماة.\n\n🆔 رقم الهوية: {national_id}\n🔑 رقمك السري: {pin}\n\nيمكنك الدخول للنظام ومتابعة قضاياك عبر الموقع.'
            ],
            'daily_report' => [
                'title' => 'التقرير اليومي',
                'template' => 'التقرير اليومي - {date}:\n- قضايا جديدة: {new_cases}\n- جلسات اليوم: {hearings_today}\n- مهام معلقة: {pending_tasks}'
            ],
            // قوالب جديدة للمحامين
            'new_document_uploaded' => [
                'title' => 'وثيقة جديدة مرفوعة',
                'template' => 'مرحباً {lawyer_name}، تم رفع وثيقة جديدة "{document_title}" للقضية {case_number} - {case_title} من قبل العميل {client_name} في {upload_time} بتاريخ {upload_date}.'
            ],
            'lawyer_assigned' => [
                'title' => 'تعيين على قضية جديدة',
                'template' => 'مرحباً {lawyer_name}، تم تعيينك على قضية جديدة:\n📋 رقم القضية: {case_number}\n📝 العنوان: {case_title}\n👤 العميل: {client_name}\n📊 النوع: {case_type}\n⚡ الأولوية: {priority}\n📅 تاريخ الاستحقاق: {due_date}'
            ],
            'task_assigned' => [
                'title' => 'مهمة جديدة مُعينة',
                'template' => 'مرحباً {lawyer_name}، تم تعيين مهمة جديدة لك:\n📋 العنوان: {task_title}\n📝 الوصف: {task_description}\n📂 القضية: {case_number} - {case_title}\n⚡ الأولوية: {priority}\n📅 تاريخ الاستحقاق: {due_date}\n⏱️ الوقت المقدر: {estimated_hours} ساعة'
            ],
            'task_due_reminder' => [
                'title' => 'تذكير بمهمة قريبة الانتهاء',
                'template' => 'تنبيه عاجل {lawyer_name}! 🚨\nالمهمة "{task_title}" للقضية {case_number} تستحق خلال {hours_remaining} ساعة.\nالأولوية: {priority}\nيرجى إنجازها في أسرع وقت.'
            ],
            'task_overdue' => [
                'title' => 'مهمة متأخرة',
                'template' => 'تحذير! ⚠️ {lawyer_name}\nالمهمة "{task_title}" للقضية {case_number} متأخرة منذ {days_overdue} يوم.\nيرجى إنجازها فوراً أو التواصل مع الإدارة.'
            ],
            'hearing_reminder_lawyer' => [
                'title' => 'تذكير جلسة محكمة للمحامي',
                'template' => 'تذكير هام {lawyer_name}! ⚖️\nلديك جلسة محكمة {when} في تمام الساعة {hearing_time}\n📂 القضية: {case_number} - {case_title}\n🏛️ المحكمة: {court_location}\n👤 العميل: {client_name}'
            ],
            'client_message_received' => [
                'title' => 'رسالة جديدة من العميل',
                'template' => 'رسالة جديدة {lawyer_name}! 💬\nمن العميل: {client_name}\nالقضية: {case_number} - {case_title}\nالرسالة: "{message_content}"\nمرسلة في: {message_time}'
            ],
            'case_status_changed' => [
                'title' => 'تغيير حالة القضية',
                'template' => 'تحديث مهم {lawyer_name}! 📊\nتم تغيير حالة القضية {case_number} - {case_title}\nمن: {old_status} ➡️ إلى: {new_status}\nالعميل: {client_name}\nالوقت: {update_time}'
            ],
            'login_notification' => [
                'title' => 'إشعار تسجيل الدخول',
                'template' => 'مرحباً {user_name} 👋\n\nتم تسجيل دخولك إلى نظام المحاماة بنجاح 💼\n\n📅 التاريخ: {login_date} - {day_name}\n⏰ الوقت: {login_time}\n\nنتمنى لك يوماً موفقاً! ⚖️✨'
            ]
        ];
    }

    /**
     * الحصول على إعدادات التنبيهات الافتراضية
     */
    public static function getDefaultNotificationSettings()
    {
        return [
            // تنبيهات العملاء
            'case_created' => ['enabled' => true, 'delay_minutes' => 0],
            'case_updated' => ['enabled' => true, 'delay_minutes' => 5],
            'hearing_reminder' => ['enabled' => true, 'delay_minutes' => 0],
            'document_request' => ['enabled' => true, 'delay_minutes' => 10],
            'payment_reminder' => ['enabled' => true, 'delay_minutes' => 0],
            
            // تنبيهات المحامين الجديدة
            'lawyer_assigned' => ['enabled' => true, 'delay_minutes' => 5],
            'new_document_uploaded' => ['enabled' => true, 'delay_minutes' => 0],
            'task_assigned' => ['enabled' => true, 'delay_minutes' => 2],
            'task_due_reminder' => ['enabled' => true, 'delay_minutes' => 0],
            'task_overdue' => ['enabled' => true, 'delay_minutes' => 0],
            'hearing_reminder_lawyer' => ['enabled' => true, 'delay_minutes' => 0],
            'client_message_received' => ['enabled' => true, 'delay_minutes' => 5],
            'case_status_changed' => ['enabled' => true, 'delay_minutes' => 3],
            'login_notification' => ['enabled' => true, 'delay_minutes' => 0],
            
            // تنبيهات أخرى
            'daily_report' => ['enabled' => true, 'delay_minutes' => 0]
        ];
    }

    /**
     * الحصول على ساعات العمل الافتراضية
     */
    public static function getDefaultWorkingHours()
    {
        return [
            'sunday' => ['enabled' => true, 'start' => '08:00', 'end' => '17:00'],
            'monday' => ['enabled' => true, 'start' => '08:00', 'end' => '17:00'],
            'tuesday' => ['enabled' => true, 'start' => '08:00', 'end' => '17:00'],
            'wednesday' => ['enabled' => true, 'start' => '08:00', 'end' => '17:00'],
            'thursday' => ['enabled' => true, 'start' => '08:00', 'end' => '17:00'],
            'friday' => ['enabled' => false, 'start' => '08:00', 'end' => '17:00'],
            'saturday' => ['enabled' => false, 'start' => '08:00', 'end' => '17:00']
        ];
    }

    /**
     * التحقق من وجود إعدادات واحدة فقط
     */
    public static function current()
    {
        $settings = self::first();
        
        if (!$settings) {
            $settings = self::create([
                'notifications_enabled' => true,
                'notification_settings' => self::getDefaultNotificationSettings(),
                'message_templates' => self::getDefaultTemplates(),
                'daily_report_time' => '09:00',
                'daily_report_enabled' => true,
                'working_hours' => self::getDefaultWorkingHours()
            ]);
        }
        
        return $settings;
    }
}
