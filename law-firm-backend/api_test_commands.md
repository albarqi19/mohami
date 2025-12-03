# Law Firm API Testing Commands
## دليل اختبار شامل لجميع endpoints

> **ملاحظة**: تأكد من تشغيل Laravel server: `php artisan serve`
> Server URL: `http://127.0.0.1:8000`

---

## 🔐 Authentication Tests

### 1. تسجيل حساب جديد
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "أحمد المحامي",
    "email": "ahmed@lawfirm.com",
    "password": "password123",
    "password_confirmation": "password123",
    "role": "lawyer",
    "phone": "966501234567"
  }'
```

### 2. تسجيل الدخول
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "ahmed@lawfirm.com",
    "password": "password123"
  }'
```

**احفظ token من الاستجابة واستخدمه في البقية!**

### 3. معلومات المستخدم الحالي
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/auth/me" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. تحديث الملف الشخصي
```bash
curl -X PUT "http://127.0.0.1:8000/api/v1/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "أحمد المحامي المحدث",
    "email": "ahmed@lawfirm.com",
    "phone": "966507654321"
  }'
```

### 5. تغيير كلمة المرور
```bash
curl -X PUT "http://127.0.0.1:8000/api/v1/auth/password" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "current_password": "password123",
    "new_password": "newpassword123",
    "new_password_confirmation": "newpassword123"
  }'
```

### 6. تسجيل الخروج
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/auth/logout" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 👥 Users Management Tests

### 1. عرض جميع المستخدمين
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/users" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. البحث في المستخدمين
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/users?search=أحمد&role=lawyer" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. إنشاء مستخدم جديد
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/users" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "سارة المساعدة",
    "email": "sara@lawfirm.com",
    "password": "password123",
    "role": "assistant",
    "phone": "966501111111"
  }'
```

### 4. عرض مستخدم محدد
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/users/1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. تحديث مستخدم
```bash
curl -X PUT "http://127.0.0.1:8000/api/v1/users/1" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "سارة المساعدة المحدثة",
    "email": "sara@lawfirm.com",
    "role": "assistant",
    "phone": "966502222222",
    "is_active": true
  }'
```

---

## ⚖️ Cases Management Tests

### 1. عرض جميع القضايا
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/cases" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. إنشاء قضية جديدة
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/cases" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "قضية تجارية - شركة ABC ضد شركة XYZ",
    "description": "نزاع تجاري حول عقد توريد",
    "type": "commercial",
    "priority": "high",
    "client_id": "1",
    "primary_lawyer_id": "1",
    "start_date": "2025-09-21",
    "expected_end_date": "2025-12-21",
    "court_name": "المحكمة التجارية بالرياض",
    "court_reference": "تجاري/2025/123",
    "opposing_party": "شركة XYZ المحدودة"
  }'
```

### 3. البحث والتصفية في القضايا
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/cases?status=open&type=commercial&search=تجارية" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. عرض قضية محددة
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/cases/1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. تحديث قضية
```bash
curl -X PUT "http://127.0.0.1:8000/api/v1/cases/1" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "قضية تجارية محدثة - شركة ABC ضد شركة XYZ",
    "description": "نزاع تجاري حول عقد توريد - تم التحديث",
    "type": "commercial",
    "status": "in_progress",
    "priority": "urgent",
    "primary_lawyer_id": "1",
    "expected_end_date": "2025-11-21",
    "court_name": "المحكمة التجارية بالرياض",
    "court_reference": "تجاري/2025/123",
    "opposing_party": "شركة XYZ المحدودة"
  }'
```

### 6. إضافة محامي للقضية
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/cases/1/lawyers" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "lawyer_id": "2",
    "role": "secondary"
  }'
```

### 7. إحصائيات القضايا
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/cases/statistics" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📋 Tasks Management Tests

### 1. عرض جميع المهام
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/tasks" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. إنشاء مهمة جديدة
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "مراجعة وثائق القضية",
    "description": "مراجعة جميع الوثائق المرفقة مع القضية التجارية",
    "case_id": "1",
    "assigned_to": "1",
    "priority": "high",
    "due_date": "2025-09-25T10:00:00",
    "estimated_hours": "8.5",
    "tags": ["مراجعة", "وثائق", "عاجل"]
  }'
```

### 3. مهامي الشخصية
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/tasks/my-tasks" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. المهام المتأخرة
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/tasks/overdue" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. تحديث حالة المهمة
```bash
curl -X PATCH "http://127.0.0.1:8000/api/v1/tasks/1/status" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "status": "in_progress",
    "notes": "بدأت العمل على المهمة"
  }'
```

### 6. إعادة تعيين المهمة
```bash
curl -X PATCH "http://127.0.0.1:8000/api/v1/tasks/1/reassign" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "assigned_to": "2",
    "notes": "إعادة تعيين للمحامي الآخر"
  }'
```

### 7. إحصائيات المهام
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/tasks/statistics" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📄 Documents Management Tests

### 1. عرض جميع الوثائق
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/documents" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. رفع وثيقة جديدة
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/documents" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=عقد التوريد الأساسي" \
  -F "category=contract" \
  -F "case_id=1" \
  -F "is_confidential=true" \
  -F "tags[]=عقد" \
  -F "tags[]=توريد" \
  -F "file=@/path/to/your/document.pdf"
```

### 3. البحث في الوثائق
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/documents/search?query=عقد&category=contract&case_id=1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. تحميل وثيقة
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/documents/1/download" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  --output "downloaded_document.pdf"
```

### 5. معاينة وثيقة
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/documents/1/preview" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. إحصائيات الوثائق
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/documents/statistics" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 💬 Comments Tests

### 1. عرض التعليقات
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/comments?case_id=1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. إضافة تعليق على قضية
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/comments" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "تم مراجعة الوثائق الأولية، ونحتاج لمزيد من التوضيحات من العميل",
    "case_id": "1"
  }'
```

### 3. إضافة تعليق على مهمة
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/comments" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "اكتملت 50% من المهمة، متوقع الانتهاء غداً",
    "task_id": "1"
  }'
```

### 4. تحديث تعليق
```bash
curl -X PUT "http://127.0.0.1:8000/api/v1/comments/1" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "تم مراجعة الوثائق الأولية بالكامل، جاهز للخطوة التالية"
  }'
```

---

## 📊 Activities Tests

### 1. عرض الأنشطة
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/activities" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. أنشطة قضية معينة
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/activities?case_id=1" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. إضافة نشاط جديد
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/activities" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "action": "case_updated",
    "description": "تم تحديث معلومات القضية",
    "case_id": "1",
    "metadata": {
      "old_status": "open",
      "new_status": "in_progress"
    }
  }'
```

---

## 🔔 Notifications Tests

### 1. عرض الإشعارات
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/notifications" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. الإشعارات غير المقروءة فقط
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/notifications?unread_only=true" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. عدد الإشعارات غير المقروءة
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/notifications/unread-count" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. تمييز إشعار كمقروء
```bash
curl -X PATCH "http://127.0.0.1:8000/api/v1/notifications/1/mark-read" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. تمييز جميع الإشعارات كمقروءة
```bash
curl -X PATCH "http://127.0.0.1:8000/api/v1/notifications/mark-all-read" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🧪 Quick Test Script

### PowerShell Script للاختبار السريع
```powershell
# اختبار سريع للنظام
$baseUrl = "http://127.0.0.1:8000"

# 1. تسجيل حساب
$registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/register" -Method POST -ContentType "application/json" -Body '{
  "name": "اختبار المحامي",
  "email": "test@lawfirm.com", 
  "password": "password123",
  "password_confirmation": "password123",
  "role": "lawyer"
}'

# 2. تسجيل دخول والحصول على token
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{
  "email": "test@lawfirm.com",
  "password": "password123"
}'

$token = $loginResponse.data.token
$headers = @{ 
  "Authorization" = "Bearer $token"
  "Accept" = "application/json"
}

# 3. اختبار معلومات المستخدم
$userInfo = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/me" -Method GET -Headers $headers

Write-Output "✅ تم تسجيل الدخول بنجاح: $($userInfo.data.name)"

# 4. اختبار إحصائيات القضايا
$caseStats = Invoke-RestMethod -Uri "$baseUrl/api/v1/cases/statistics" -Method GET -Headers $headers

Write-Output "✅ إحصائيات القضايا: $($caseStats.data | ConvertTo-Json)"

# 5. اختبار إحصائيات المهام
$taskStats = Invoke-RestMethod -Uri "$baseUrl/api/v1/tasks/statistics" -Method GET -Headers $headers

Write-Output "✅ إحصائيات المهام: $($taskStats.data | ConvertTo-Json)"
```

---

## 📝 Notes

1. **استبدل `YOUR_TOKEN_HERE`** بالـ token الحقيقي من response تسجيل الدخول
2. **تأكد من تشغيل Laravel server** قبل الاختبار
3. **للملفات**: استبدل `/path/to/your/document.pdf` بمسار ملف حقيقي
4. **جميع التواريخ** بصيغة ISO 8601
5. **استخدم Postman** أو **Thunder Client** في VS Code للاختبار المرئي

## 🚀 Status Codes
- `200` - نجح الطلب
- `201` - تم الإنشاء بنجاح  
- `422` - خطأ في البيانات المرسلة
- `404` - المورد غير موجود
- `401` - غير مصرح (تحقق من token)
- `403` - ممنوع (لا توجد صلاحية)

**API Version**: v1  
**Base URL**: `http://127.0.0.1:8000/api/v1`
