# 🚀 دليل اختبار Law Firm API - التشغيل السريع

## 📋 المتطلبات
- Laravel Server يعمل على `http://127.0.0.1:8000`
- PowerShell أو Bash أو Postman

---

## ⚡ التشغيل السريع

### 1️⃣ تشغيل Laravel Server
```bash
cd "C:\Users\ALBAR\Downloads\محامي\law-firm-backend"
php artisan serve
```

### 2️⃣ اختبار تلقائي بـ PowerShell
```powershell
# تشغيل اختبار شامل
.\test_api.ps1

# اختبار مع إعدادات مخصصة
.\test_api.ps1 -BaseUrl "http://127.0.0.1:8000" -TestEmail "custom@test.com"
```

### 3️⃣ اختبار تلقائي بـ Bash (Linux/Mac)
```bash
# جعل الملف قابل للتنفيذ
chmod +x test_api.sh

# تشغيل الاختبار
./test_api.sh
```

### 4️⃣ اختبار يدوي سريع
```bash
# 1. تسجيل حساب
curl -X POST "http://127.0.0.1:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"اختبار","email":"test@test.com","password":"password123","password_confirmation":"password123","role":"lawyer"}'

# 2. تسجيل دخول والحصول على token
curl -X POST "http://127.0.0.1:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# 3. استخدام token (استبدل YOUR_TOKEN)
curl -X GET "http://127.0.0.1:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 استخدام Postman

### تحميل Collection
1. افتح Postman
2. اضغط Import
3. اختر `Law_Firm_API.postman_collection.json`
4. تم! جميع endpoints جاهزة

### الاستخدام
1. شغل `Register New User` أو `Login`
2. سيتم حفظ token تلقائياً
3. جرب باقي endpoints

---

## 📊 ملفات الاختبار

| الملف | الوصف | الاستخدام |
|-------|--------|------------|
| `api_test_commands.md` | دليل كامل لجميع commands | مرجع شامل |
| `test_api.ps1` | اختبار تلقائي PowerShell | تشغيل سريع |
| `test_api.sh` | اختبار تلقائي Bash | Linux/Mac |
| `Law_Firm_API.postman_collection.json` | Postman Collection | اختبار مرئي |

---

## ✅ نتائج متوقعة

### نجح الاختبار إذا:
- ✅ جميع endpoints ترجع status 200/201
- ✅ تسجيل الدخول يعطي token
- ✅ إنشاء قضايا ومهام يعمل
- ✅ الإحصائيات تظهر البيانات

### فشل إذا:
- ❌ Server لا يعمل (Connection refused)
- ❌ Database غير متصل
- ❌ Laravel errors (500)

---

## 🔧 حل المشاكل الشائعة

### Server لا يعمل
```bash
# تحقق من المنفذ
netstat -an | find "8000"

# أو شغل على منفذ آخر
php artisan serve --port=8001
```

### Database خطأ
```bash
# تحقق من الاتصال
php artisan migrate:status

# إعادة تشغيل migrations
php artisan migrate:refresh
```

### Token خطأ
```bash
# امسح cache
php artisan config:cache
php artisan route:cache
```

---

## 📈 تقرير الأداء

بعد تشغيل `test_api.ps1` ستحصل على:
- 📊 عدد الاختبارات الناجحة/الفاشلة
- 📄 تقرير JSON مفصل
- ⏱️ أوقات الاستجابة
- 📝 رسائل الأخطاء إن وجدت

---

## 🎯 Endpoints المطلوب اختبارها

### أساسي (مطلوب)
- [x] Authentication (Login/Register)
- [x] Cases CRUD
- [x] Tasks CRUD
- [x] Users Management

### إضافي (اختياري)
- [x] Documents Upload
- [x] Comments System
- [x] Activities Tracking
- [x] Notifications

---

## 📞 المساعدة

إذا واجهت مشاكل:
1. تأكد من تشغيل Laravel server
2. تحقق من database connection
3. راجع Laravel logs: `storage/logs/laravel.log`
4. تأكد من CORS settings

**Happy Testing! 🚀**
