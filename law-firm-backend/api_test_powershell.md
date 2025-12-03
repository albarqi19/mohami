# Law Firm API Testing - PowerShell Commands
## دليل اختبار شامل باستخدام PowerShell على Windows

> **ملاحظة**: تأكد من تشغيل Laravel server: `php artisan serve`
> Server URL: `http://127.0.0.1:8000`

---

## 🔐 Authentication Tests

### 1. تسجيل حساب جديد
```powershell
$registerData = @{
    name = "أحمد المحامي"
    email = "ahmed@lawfirm.com"
    password = "password123"
    password_confirmation = "password123"
    role = "lawyer"
    phone = "966501234567"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerData
    
    Write-Host "✅ تم إنشاء الحساب بنجاح!" -ForegroundColor Green
    Write-Host "المستخدم: $($response.data.user.name)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ خطأ في إنشاء الحساب: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 2. تسجيل الدخول والحصول على Token
```powershell
$loginData = @{
    email = "ahmed@lawfirm.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData
    
    # حفظ Token للاستخدام في الطلبات القادمة
    $global:token = $loginResponse.data.token
    $global:headers = @{
        "Authorization" = "Bearer $global:token"
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    Write-Host "✅ تم تسجيل الدخول بنجاح!" -ForegroundColor Green
    Write-Host "Token: $($global:token.Substring(0,20))..." -ForegroundColor Yellow
} catch {
    Write-Host "❌ خطأ في تسجيل الدخول: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 3. معلومات المستخدم الحالي
```powershell
try {
    $userInfo = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/me" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ معلومات المستخدم:" -ForegroundColor Green
    Write-Host "الاسم: $($userInfo.data.name)" -ForegroundColor Yellow
    Write-Host "البريد: $($userInfo.data.email)" -ForegroundColor Yellow
    Write-Host "الدور: $($userInfo.data.role)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ خطأ في جلب معلومات المستخدم: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 4. تحديث الملف الشخصي
```powershell
$profileData = @{
    name = "أحمد المحامي المحدث"
    email = "ahmed@lawfirm.com"
    phone = "966507654321"
    department = "القسم القانوني"
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/profile" `
        -Method PUT `
        -Headers $global:headers `
        -Body $profileData
    
    Write-Host "✅ تم تحديث الملف الشخصي!" -ForegroundColor Green
    Write-Host "الاسم الجديد: $($updateResponse.data.name)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ خطأ في تحديث الملف الشخصي: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 👥 Users Management Tests

### 1. عرض جميع المستخدمين
```powershell
try {
    $users = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/users" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ عدد المستخدمين: $($users.data.data.Count)" -ForegroundColor Green
    foreach ($user in $users.data.data) {
        Write-Host "- $($user.name) ($($user.role))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ خطأ في جلب المستخدمين: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 2. إنشاء مستخدم جديد
```powershell
$newUserData = @{
    name = "سارة المساعدة"
    email = "sara@lawfirm.com"
    password = "password123"
    role = "assistant"
    phone = "966501111111"
} | ConvertTo-Json

try {
    $newUser = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/users" `
        -Method POST `
        -Headers $global:headers `
        -Body $newUserData
    
    Write-Host "✅ تم إنشاء المستخدم: $($newUser.data.name)" -ForegroundColor Green
    $global:newUserId = $newUser.data.id
} catch {
    Write-Host "❌ خطأ في إنشاء المستخدم: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 3. البحث في المستخدمين
```powershell
try {
    $searchResults = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/users?search=سارة&role=assistant" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ نتائج البحث: $($searchResults.data.data.Count) مستخدم" -ForegroundColor Green
} catch {
    Write-Host "❌ خطأ في البحث: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## ⚖️ Cases Management Tests

### 1. إنشاء قضية جديدة
```powershell
$caseData = @{
    title = "قضية تجارية - شركة ABC ضد شركة XYZ"
    description = "نزاع تجاري حول عقد توريد"
    type = "commercial"
    priority = "high"
    client_id = "1"
    primary_lawyer_id = "1"
    start_date = "2025-09-21"
    expected_end_date = "2025-12-21"
    court_name = "المحكمة التجارية بالرياض"
    court_reference = "تجاري/2025/123"
    opposing_party = "شركة XYZ المحدودة"
} | ConvertTo-Json

try {
    $newCase = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/cases" `
        -Method POST `
        -Headers $global:headers `
        -Body $caseData
    
    Write-Host "✅ تم إنشاء القضية!" -ForegroundColor Green
    Write-Host "رقم القضية: $($newCase.data.case_number)" -ForegroundColor Yellow
    Write-Host "العنوان: $($newCase.data.title)" -ForegroundColor Yellow
    $global:caseId = $newCase.data.id
} catch {
    Write-Host "❌ خطأ في إنشاء القضية: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 2. عرض جميع القضايا
```powershell
try {
    $cases = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/cases" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ عدد القضايا: $($cases.data.data.Count)" -ForegroundColor Green
    foreach ($case in $cases.data.data) {
        Write-Host "- $($case.case_number): $($case.title) [$($case.status)]" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ خطأ في جلب القضايا: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 3. البحث والتصفية في القضايا
```powershell
try {
    $filteredCases = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/cases?status=open&type=commercial&search=تجارية" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ القضايا المفلترة: $($filteredCases.data.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ خطأ في تصفية القضايا: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 4. إحصائيات القضايا
```powershell
try {
    $caseStats = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/cases/statistics" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ إحصائيات القضايا:" -ForegroundColor Green
    Write-Host "إجمالي القضايا: $($caseStats.data.total_cases)" -ForegroundColor Yellow
    Write-Host "القضايا المفتوحة: $($caseStats.data.open_cases)" -ForegroundColor Yellow
    Write-Host "القضايا العاجلة: $($caseStats.data.urgent_cases)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ خطأ في جلب إحصائيات القضايا: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 📋 Tasks Management Tests

### 1. إنشاء مهمة جديدة
```powershell
$taskData = @{
    title = "مراجعة وثائق القضية التجارية"
    description = "مراجعة شاملة لجميع الوثائق المرفقة"
    case_id = $global:caseId
    assigned_to = "1"
    priority = "high"
    due_date = "2025-09-25T10:00:00"
    estimated_hours = "8.5"
    tags = @("مراجعة", "وثائق", "عاجل")
} | ConvertTo-Json

try {
    $newTask = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/tasks" `
        -Method POST `
        -Headers $global:headers `
        -Body $taskData
    
    Write-Host "✅ تم إنشاء المهمة!" -ForegroundColor Green
    Write-Host "العنوان: $($newTask.data.title)" -ForegroundColor Yellow
    Write-Host "الأولوية: $($newTask.data.priority)" -ForegroundColor Yellow
    $global:taskId = $newTask.data.id
} catch {
    Write-Host "❌ خطأ في إنشاء المهمة: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 2. مهامي الشخصية
```powershell
try {
    $myTasks = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/tasks/my-tasks" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ مهامي الشخصية: $($myTasks.data.data.Count)" -ForegroundColor Green
    foreach ($task in $myTasks.data.data) {
        Write-Host "- $($task.title) [$($task.status)] - $($task.priority)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ خطأ في جلب المهام الشخصية: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 3. تحديث حالة المهمة
```powershell
$statusUpdate = @{
    status = "in_progress"
    notes = "بدأت العمل على المهمة"
} | ConvertTo-Json

try {
    $statusResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/tasks/$global:taskId/status" `
        -Method PATCH `
        -Headers $global:headers `
        -Body $statusUpdate
    
    Write-Host "✅ تم تحديث حالة المهمة إلى: $($statusResponse.data.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ خطأ في تحديث حالة المهمة: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 4. إحصائيات المهام
```powershell
try {
    $taskStats = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/tasks/statistics" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ إحصائيات المهام:" -ForegroundColor Green
    Write-Host "إجمالي المهام: $($taskStats.data.total_tasks)" -ForegroundColor Yellow
    Write-Host "المهام المكتملة: $($taskStats.data.completed_tasks)" -ForegroundColor Yellow
    Write-Host "المهام المتأخرة: $($taskStats.data.overdue_tasks)" -ForegroundColor Yellow
    Write-Host "معدل الإنجاز: $([math]::Round($taskStats.data.completion_rate, 2))%" -ForegroundColor Yellow
} catch {
    Write-Host "❌ خطأ في جلب إحصائيات المهام: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 💬 Comments Tests

### 1. إضافة تعليق على قضية
```powershell
$commentData = @{
    content = "تم مراجعة الوثائق الأولية، ونحتاج لمزيد من التوضيحات من العميل"
    case_id = $global:caseId
} | ConvertTo-Json

try {
    $newComment = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/comments" `
        -Method POST `
        -Headers $global:headers `
        -Body $commentData
    
    Write-Host "✅ تم إضافة التعليق!" -ForegroundColor Green
    Write-Host "التعليق: $($newComment.data.content)" -ForegroundColor Yellow
    $global:commentId = $newComment.data.id
} catch {
    Write-Host "❌ خطأ في إضافة التعليق: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 2. عرض تعليقات القضية
```powershell
try {
    $caseComments = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/comments?case_id=$global:caseId" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ تعليقات القضية: $($caseComments.data.data.Count)" -ForegroundColor Green
    foreach ($comment in $caseComments.data.data) {
        Write-Host "- $($comment.user.name): $($comment.content)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ خطأ في جلب التعليقات: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 📄 Documents Tests

### 1. عرض الوثائق
```powershell
try {
    $documents = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/documents" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ عدد الوثائق: $($documents.data.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ خطأ في جلب الوثائق: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 2. البحث في الوثائق
```powershell
try {
    $searchDocs = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/documents/search?query=عقد&category=contract" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ نتائج بحث الوثائق: $($searchDocs.data.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ خطأ في البحث في الوثائق: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 3. إحصائيات الوثائق
```powershell
try {
    $docStats = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/documents/statistics" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ إحصائيات الوثائق:" -ForegroundColor Green
    Write-Host "إجمالي الوثائق: $($docStats.data.total_documents)" -ForegroundColor Yellow
    Write-Host "الوثائق السرية: $($docStats.data.confidential_documents)" -ForegroundColor Yellow
    Write-Host "الحجم الإجمالي: $($docStats.data.total_size_mb) MB" -ForegroundColor Yellow
} catch {
    Write-Host "❌ خطأ في جلب إحصائيات الوثائق: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 📊 Activities & Notifications Tests

### 1. عرض الأنشطة
```powershell
try {
    $activities = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/activities" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ عدد الأنشطة: $($activities.data.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ خطأ في جلب الأنشطة: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 2. عرض الإشعارات
```powershell
try {
    $notifications = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/notifications" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ عدد الإشعارات: $($notifications.data.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ خطأ في جلب الإشعارات: $($_.Exception.Message)" -ForegroundColor Red
}
```

### 3. عدد الإشعارات غير المقروءة
```powershell
try {
    $unreadCount = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/notifications/unread-count" `
        -Method GET `
        -Headers $global:headers
    
    Write-Host "✅ الإشعارات غير المقروءة: $($unreadCount.data.count)" -ForegroundColor Green
} catch {
    Write-Host "❌ خطأ في جلب عدد الإشعارات: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 🚪 Logout Test

### تسجيل الخروج
```powershell
try {
    $logoutResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/logout" `
        -Method POST `
        -Headers $global:headers
    
    Write-Host "✅ تم تسجيل الخروج بنجاح!" -ForegroundColor Green
    Write-Host $logoutResponse.message -ForegroundColor Yellow
    
    # مسح المتغيرات
    Remove-Variable -Name token -Scope Global -ErrorAction SilentlyContinue
    Remove-Variable -Name headers -Scope Global -ErrorAction SilentlyContinue
} catch {
    Write-Host "❌ خطأ في تسجيل الخروج: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 🎯 اختبار سريع شامل

### تشغيل جميع الاختبارات دفعة واحدة
```powershell
# تشغيل جميع الأوامر السابقة في تسلسل
function Test-LawFirmAPI {
    Write-Host "🚀 بدء اختبار شامل لـ Law Firm API..." -ForegroundColor Magenta
    
    # تعداد النجاحات والفشل
    $script:successCount = 0
    $script:totalTests = 0
    
    # دالة مساعدة للاختبار
    function Run-Test {
        param($TestName, $TestCode)
        $script:totalTests++
        Write-Host "`n🔍 اختبار: $TestName" -ForegroundColor Cyan
        try {
            & $TestCode
            $script:successCount++
            Write-Host "✅ نجح الاختبار: $TestName" -ForegroundColor Green
        } catch {
            Write-Host "❌ فشل الاختبار: $TestName" -ForegroundColor Red
            Write-Host "السبب: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # تشغيل الاختبارات
    Run-Test "تسجيل الدخول" {
        # كود تسجيل الدخول هنا
    }
    
    # عرض النتائج النهائية
    Write-Host "`n📊 نتائج الاختبار:" -ForegroundColor Magenta
    Write-Host "النجاحات: $script:successCount / $script:totalTests" -ForegroundColor Green
    $successRate = [math]::Round(($script:successCount / $script:totalTests) * 100, 2)
    Write-Host "معدل النجاح: $successRate%" -ForegroundColor Yellow
    
    if ($successRate -eq 100) {
        Write-Host "🎉 تهانينا! جميع الاختبارات نجحت!" -ForegroundColor Green
    } elseif ($successRate -ge 80) {
        Write-Host "⚠️ معظم الاختبارات نجحت، راجع الأخطاء" -ForegroundColor Yellow
    } else {
        Write-Host "❌ هناك مشاكل في النظام، راجع الأخطاء" -ForegroundColor Red
    }
}

# تشغيل الاختبار الشامل
Test-LawFirmAPI
```

---

## 📝 ملاحظات مهمة

### متطلبات PowerShell
- **PowerShell 5.1+** (مثبت افتراضياً في Windows 10/11)
- **لا يحتاج curl** - يستخدم `Invoke-RestMethod`
- **يدعم JSON** بشكل كامل

### نصائح للاستخدام
1. **نسخ والصق**: يمكنك نسخ أي قطعة كود وتشغيلها مباشرة
2. **المتغيرات العامة**: يتم حفظ Token تلقائياً في `$global:token`
3. **الألوان**: خضراء للنجاح، أحمر للخطأ، أصفر للمعلومات
4. **التعامل مع الأخطاء**: كل أمر محاط بـ `try-catch`

### Status Codes المتوقعة
- **200** - نجح الطلب  
- **201** - تم الإنشاء بنجاح
- **422** - خطأ في البيانات المرسلة
- **401** - غير مصرح (تحقق من token)
- **404** - المورد غير موجود

**Happy Testing with PowerShell! 🚀**
