# Law Firm API Test Suite - PowerShell Script
# اختبار شامل لنظام إدارة شركة المحاماة
# تشغيل: .\test_api_windows.ps1

param(
    [string]$BaseUrl = "http://127.0.0.1:8000/api/v1",
    [switch]$FullTest = $false,
    [switch]$QuickTest = $true
)

# إعداد الألوان والمتغيرات
$script:TestResults = @()
$script:SuccessCount = 0
$script:TotalTests = 0
$script:Token = $null
$script:Headers = @{}

# دالة لطباعة الرسائل الملونة
function Write-TestMessage {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    
    switch ($Type) {
        "Success" { Write-Host "✅ $Message" -ForegroundColor Green }
        "Error" { Write-Host "❌ $Message" -ForegroundColor Red }
        "Warning" { Write-Host "⚠️ $Message" -ForegroundColor Yellow }
        "Info" { Write-Host "ℹ️ $Message" -ForegroundColor Cyan }
        "Header" { Write-Host "`n🔥 $Message" -ForegroundColor Magenta }
        default { Write-Host $Message }
    }
}

# دالة لتنفيذ الاختبارات
function Invoke-APITest {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = @{},
        [hashtable]$Headers = $script:Headers,
        [int]$ExpectedStatus = 200
    )
    
    $script:TotalTests++
    Write-TestMessage "اختبار: $TestName" "Info"
    
    try {
        $Uri = "$BaseUrl$Endpoint"
        $RequestParams = @{
            Uri = $Uri
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body.Count -gt 0) {
            $RequestParams.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $Response = Invoke-RestMethod @RequestParams
        
        if ($Response) {
            $script:SuccessCount++
            Write-TestMessage "$TestName - نجح!" "Success"
            
            $script:TestResults += [PSCustomObject]@{
                Test = $TestName
                Status = "نجح"
                Response = $Response
                Endpoint = $Endpoint
            }
            
            return $Response
        }
    }
    catch {
        Write-TestMessage "$TestName - فشل: $($_.Exception.Message)" "Error"
        
        $script:TestResults += [PSCustomObject]@{
            Test = $TestName
            Status = "فشل"
            Error = $_.Exception.Message
            Endpoint = $Endpoint
        }
        
        return $null
    }
}

# بدء الاختبارات
function Start-Testing {
    Write-TestMessage "🚀 بدء اختبار Law Firm API System" "Header"
    Write-TestMessage "Base URL: $BaseUrl"
    Write-TestMessage "تاريخ الاختبار: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    
    # التحقق من وجود الخادم
    Write-TestMessage "`n📡 فحص اتصال الخادم..." "Header"
    try {
        $HealthCheck = Invoke-RestMethod -Uri "$BaseUrl/../health" -Method GET -TimeoutSec 5
        Write-TestMessage "الخادم يعمل بشكل طبيعي" "Success"
    }
    catch {
        Write-TestMessage "لا يمكن الوصول للخادم. تأكد من تشغيل: php artisan serve" "Error"
        return
    }
    
    # 1. اختبار التسجيل
    Write-TestMessage "`n🔐 اختبارات المصادقة (Authentication)" "Header"
    
    $RegisterData = @{
        name = "أحمد المحامي - اختبار"
        email = "test_$(Get-Random)@lawfirm.com"
        password = "password123"
        password_confirmation = "password123"
        role = "lawyer"
        phone = "966501234567"
    }
    
    $RegisterResponse = Invoke-APITest -TestName "تسجيل حساب جديد" -Method "POST" -Endpoint "/auth/register" -Body $RegisterData -ExpectedStatus 201
    
    if ($RegisterResponse) {
        $script:UserEmail = $RegisterData.email
        
        # 2. اختبار تسجيل الدخول
        $LoginData = @{
            email = $script:UserEmail
            password = "password123"
        }
        
        $LoginResponse = Invoke-APITest -TestName "تسجيل الدخول" -Method "POST" -Endpoint "/auth/login" -Body $LoginData
        
        if ($LoginResponse -and $LoginResponse.data.token) {
            $script:Token = $LoginResponse.data.token
            $script:Headers = @{
                "Authorization" = "Bearer $($script:Token)"
                "Content-Type" = "application/json"
                "Accept" = "application/json"
            }
            
            Write-TestMessage "تم الحصول على Token: $($script:Token.Substring(0,20))..." "Success"
            
            # 3. اختبار معلومات المستخدم
            $UserInfoResponse = Invoke-APITest -TestName "جلب معلومات المستخدم" -Method "GET" -Endpoint "/auth/me"
            
            if ($UserInfoResponse) {
                Write-TestMessage "مرحباً، $($UserInfoResponse.data.name)" "Success"
            }
            
            # 4. اختبار تحديث الملف الشخصي
            $ProfileData = @{
                name = "أحمد المحامي المحدث"
                phone = "966507654321"
                department = "القسم القانوني"
            }
            
            Invoke-APITest -TestName "تحديث الملف الشخصي" -Method "PUT" -Endpoint "/auth/profile" -Body $ProfileData
            
            # اختبارات أخرى إذا كان الوضع الكامل مفعل
            if ($FullTest) {
                Test-UsersManagement
                Test-CasesManagement  
                Test-TasksManagement
                Test-DocumentsManagement
                Test-CommentsManagement
            }
            
            # اختبار سريع للوحدات الأساسية
            if ($QuickTest) {
                Test-BasicModules
            }
            
            # 5. اختبار تسجيل الخروج
            Write-TestMessage "`n🚪 اختبار تسجيل الخروج" "Header"
            Invoke-APITest -TestName "تسجيل الخروج" -Method "POST" -Endpoint "/auth/logout"
        }
    }
    
    # عرض النتائج النهائية
    Show-TestResults
}

# اختبار إدارة المستخدمين
function Test-UsersManagement {
    Write-TestMessage "`n👥 اختبارات إدارة المستخدمين" "Header"
    
    # عرض المستخدمين
    $UsersResponse = Invoke-APITest -TestName "عرض المستخدمين" -Method "GET" -Endpoint "/users"
    
    if ($UsersResponse) {
        Write-TestMessage "عدد المستخدمين: $($UsersResponse.data.data.Count)" "Info"
    }
    
    # إنشاء مستخدم جديد
    $NewUserData = @{
        name = "سارة المساعدة - اختبار"
        email = "assistant_$(Get-Random)@lawfirm.com"
        password = "password123"
        role = "assistant"
        phone = "966501111111"
    }
    
    $NewUserResponse = Invoke-APITest -TestName "إنشاء مستخدم جديد" -Method "POST" -Endpoint "/users" -Body $NewUserData -ExpectedStatus 201
    
    # البحث في المستخدمين
    Invoke-APITest -TestName "البحث في المستخدمين" -Method "GET" -Endpoint "/users?search=سارة&role=assistant"
}

# اختبار إدارة القضايا
function Test-CasesManagement {
    Write-TestMessage "`n⚖️ اختبارات إدارة القضايا" "Header"
    
    # عرض القضايا
    $CasesResponse = Invoke-APITest -TestName "عرض القضايا" -Method "GET" -Endpoint "/cases"
    
    # إنشاء قضية جديدة
    $CaseData = @{
        title = "قضية تجارية - اختبار $(Get-Random)"
        description = "نزاع تجاري حول عقد توريد - اختبار تلقائي"
        type = "commercial"
        priority = "high"
        client_id = "1"
        primary_lawyer_id = "1"
        start_date = "2025-09-21"
        expected_end_date = "2025-12-21"
        court_name = "المحكمة التجارية بالرياض"
        court_reference = "تجاري/2025/$(Get-Random)"
        opposing_party = "الطرف المقابل - اختبار"
    }
    
    $NewCaseResponse = Invoke-APITest -TestName "إنشاء قضية جديدة" -Method "POST" -Endpoint "/cases" -Body $CaseData -ExpectedStatus 201
    
    if ($NewCaseResponse) {
        $script:TestCaseId = $NewCaseResponse.data.id
        Write-TestMessage "تم إنشاء القضية برقم: $($NewCaseResponse.data.case_number)" "Success"
    }
    
    # إحصائيات القضايا
    Invoke-APITest -TestName "إحصائيات القضايا" -Method "GET" -Endpoint "/cases/statistics"
    
    # البحث في القضايا
    Invoke-APITest -TestName "البحث في القضايا" -Method "GET" -Endpoint "/cases?status=open&type=commercial"
}

# اختبار إدارة المهام
function Test-TasksManagement {
    Write-TestMessage "`n📋 اختبارات إدارة المهام" "Header"
    
    # عرض المهام
    Invoke-APITest -TestName "عرض جميع المهام" -Method "GET" -Endpoint "/tasks"
    
    # مهامي الشخصية
    Invoke-APITest -TestName "مهامي الشخصية" -Method "GET" -Endpoint "/tasks/my-tasks"
    
    # إنشاء مهمة جديدة
    if ($script:TestCaseId) {
        $TaskData = @{
            title = "مراجعة وثائق - اختبار $(Get-Random)"
            description = "مراجعة شاملة للوثائق - اختبار تلقائي"
            case_id = $script:TestCaseId
            assigned_to = "1"
            priority = "high"
            due_date = "2025-09-25T10:00:00"
            estimated_hours = "8.5"
            tags = @("مراجعة", "وثائق", "اختبار")
        }
        
        $NewTaskResponse = Invoke-APITest -TestName "إنشاء مهمة جديدة" -Method "POST" -Endpoint "/tasks" -Body $TaskData -ExpectedStatus 201
        
        if ($NewTaskResponse) {
            $script:TestTaskId = $NewTaskResponse.data.id
            
            # تحديث حالة المهمة
            $StatusUpdate = @{
                status = "in_progress"
                notes = "بدأت العمل - اختبار تلقائي"
            }
            
            Invoke-APITest -TestName "تحديث حالة المهمة" -Method "PATCH" -Endpoint "/tasks/$($script:TestTaskId)/status" -Body $StatusUpdate
        }
    }
    
    # إحصائيات المهام
    Invoke-APITest -TestName "إحصائيات المهام" -Method "GET" -Endpoint "/tasks/statistics"
}

# اختبار إدارة الوثائق
function Test-DocumentsManagement {
    Write-TestMessage "`n📄 اختبارات إدارة الوثائق" "Header"
    
    # عرض الوثائق
    Invoke-APITest -TestName "عرض الوثائق" -Method "GET" -Endpoint "/documents"
    
    # البحث في الوثائق
    Invoke-APITest -TestName "البحث في الوثائق" -Method "GET" -Endpoint "/documents/search?query=عقد"
    
    # إحصائيات الوثائق
    Invoke-APITest -TestName "إحصائيات الوثائق" -Method "GET" -Endpoint "/documents/statistics"
}

# اختبار التعليقات
function Test-CommentsManagement {
    Write-TestMessage "`n💬 اختبارات التعليقات" "Header"
    
    if ($script:TestCaseId) {
        # إضافة تعليق
        $CommentData = @{
            content = "تعليق اختبار تلقائي - $(Get-Date -Format 'HH:mm:ss')"
            case_id = $script:TestCaseId
        }
        
        $NewCommentResponse = Invoke-APITest -TestName "إضافة تعليق" -Method "POST" -Endpoint "/comments" -Body $CommentData -ExpectedStatus 201
        
        # عرض تعليقات القضية
        Invoke-APITest -TestName "عرض تعليقات القضية" -Method "GET" -Endpoint "/comments?case_id=$($script:TestCaseId)"
    }
}

# اختبار سريع للوحدات الأساسية
function Test-BasicModules {
    Write-TestMessage "`n🎯 اختبار سريع للوحدات الأساسية" "Header"
    
    # المستخدمين
    Invoke-APITest -TestName "عرض المستخدمين (سريع)" -Method "GET" -Endpoint "/users?per_page=5"
    
    # القضايا
    Invoke-APITest -TestName "عرض القضايا (سريع)" -Method "GET" -Endpoint "/cases?per_page=5"
    
    # المهام
    Invoke-APITest -TestName "المهام الشخصية (سريع)" -Method "GET" -Endpoint "/tasks/my-tasks?per_page=5"
    
    # الوثائق
    Invoke-APITest -TestName "عرض الوثائق (سريع)" -Method "GET" -Endpoint "/documents?per_page=5"
    
    # الأنشطة
    Invoke-APITest -TestName "عرض الأنشطة (سريع)" -Method "GET" -Endpoint "/activities?per_page=5"
    
    # الإشعارات
    Invoke-APITest -TestName "عرض الإشعارات (سريع)" -Method "GET" -Endpoint "/notifications?per_page=5"
    
    # عدد الإشعارات غير المقروءة
    Invoke-APITest -TestName "الإشعارات غير المقروءة" -Method "GET" -Endpoint "/notifications/unread-count"
}

# عرض النتائج النهائية
function Show-TestResults {
    Write-TestMessage "`n📊 نتائج الاختبار النهائية" "Header"
    
    $SuccessRate = if ($script:TotalTests -gt 0) { 
        [math]::Round(($script:SuccessCount / $script:TotalTests) * 100, 2) 
    } else { 0 }
    
    Write-TestMessage "إجمالي الاختبارات: $($script:TotalTests)" "Info"
    Write-TestMessage "النجاحات: $($script:SuccessCount)" "Success"
    Write-TestMessage "الفشل: $($script:TotalTests - $script:SuccessCount)" "Error"
    Write-TestMessage "معدل النجاح: $SuccessRate%" "Warning"
    
    # تقييم النتائج
    if ($SuccessRate -eq 100) {
        Write-TestMessage "`n🎉 ممتاز! جميع الاختبارات نجحت بنسبة 100%!" "Success"
        Write-TestMessage "✨ النظام جاهز للاستخدام في الإنتاج" "Success"
    } 
    elseif ($SuccessRate -ge 90) {
        Write-TestMessage "`n🎯 ممتاز! معدل نجاح عالي جداً ($SuccessRate%)" "Success"
        Write-TestMessage "✅ النظام في حالة ممتازة مع بعض التحسينات البسيطة" "Warning"
    }
    elseif ($SuccessRate -ge 80) {
        Write-TestMessage "`n👍 جيد! معدل نجاح جيد ($SuccessRate%)" "Warning"
        Write-TestMessage "⚠️ راجع الاختبارات الفاشلة وأصلح المشاكل" "Warning"
    }
    elseif ($SuccessRate -ge 60) {
        Write-TestMessage "`n⚠️ مقبول ولكن يحتاج تحسين ($SuccessRate%)" "Warning"
        Write-TestMessage "🔧 هناك مشاكل تحتاج إصلاح في النظام" "Error"
    }
    else {
        Write-TestMessage "`n❌ النظام يحتاج مراجعة شاملة ($SuccessRate%)" "Error"
        Write-TestMessage "🚨 مشاكل كثيرة تحتاج حل فوري" "Error"
    }
    
    # عرض تفاصيل الاختبارات الفاشلة
    $FailedTests = $script:TestResults | Where-Object { $_.Status -eq "فشل" }
    if ($FailedTests) {
        Write-TestMessage "`n🔍 تفاصيل الاختبارات الفاشلة:" "Header"
        foreach ($test in $FailedTests) {
            Write-TestMessage "$($test.Test) - $($test.Error)" "Error"
        }
    }
    
    # نصائح للإصلاح
    if ($SuccessRate -lt 100) {
        Write-TestMessage "`n💡 نصائح لحل المشاكل:" "Header"
        Write-TestMessage "1. تأكد من تشغيل Laravel server: php artisan serve" "Info"
        Write-TestMessage "2. تأكد من إعداد قاعدة البيانات بشكل صحيح" "Info"
        Write-TestMessage "3. راجع ملف .env للإعدادات" "Info"
        Write-TestMessage "4. تأكد من تشغيل Migrations: php artisan migrate" "Info"
        Write-TestMessage "5. راجع Laravel logs في storage/logs/laravel.log" "Info"
    }
    
    Write-TestMessage "`n🏁 انتهى الاختبار في $(Get-Date -Format 'HH:mm:ss')" "Info"
}

# تشغيل الاختبارات
try {
    Start-Testing
}
catch {
    Write-TestMessage "خطأ في تنفيذ الاختبارات: $($_.Exception.Message)" "Error"
}

# نهاية السكريبت
Write-TestMessage "`n📋 تم حفظ نتائج الاختبار في متغير `$script:TestResults" "Info"
Write-TestMessage "يمكنك عرض النتائج باستخدام: `$script:TestResults | Format-Table" "Info"
