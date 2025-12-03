# دليل إعداد Cloudflare Tunnel لموقع brqq.site

## 📋 المتطلبات
- ✅ Cloudflare Tunnel مثبت
- ✅ Token متوفر
- ✅ صلاحيات المسؤول (Administrator)

## 🚀 خطوات الإعداد

### الخطوة 1: تثبيت خدمة Cloudflare (بصلاحيات المسؤول)

1. اضغط `Win + X` واختر **"Windows PowerShell (Admin)"**
2. انتقل للمجلد:
   ```powershell
   cd "C:\Users\ALBAR\Downloads\محامي"
   ```
3. نفذ أمر التثبيت:
   ```powershell
   cloudflared.exe service install eyJhIjoiYWJmNjc0NDI0MDA2YTk2ZWM5YTc5MzczOWZhYTU3M2EiLCJ0IjoiZmUxNjhiZDgtMGQ1ZS00NDg1LTliNmUtOTRiZWQ4NjBlZjM1IiwicyI6IllXRXpNV0V3TkdFdFkyRXlZUzAwTldObUxUZzRaRFl0TUdOa1kyRmxPRGxrWm1ZMyJ9
   ```

### الخطوة 2: تكوين DNS في Cloudflare

1. افتح [Cloudflare Dashboard](https://dash.cloudflare.com)
2. اختر النطاق **brqq.site**
3. اذهب إلى **DNS** > **Records**

#### ⚠️ مهم: تعديل السجلات الموجودة (وليس إضافة سجلات جديدة)

إذا وجدت رسالة "An A, AAAA, or CNAME record with that host already exists"، اتبع الخطوات التالية:

**أ. احذف السجلات القديمة:**
- ابحث عن السجلات الموجودة لـ `@`, `www`, `api`, `db`
- اضغط على **Edit** (تعديل) أو **Delete** (حذف) لكل سجل
- احذف جميع السجلات من نوع A أو AAAA أو CNAME لهذه الأسماء

**ب. أضف السجلات الجديدة:**

| النوع | الاسم | الهدف | Proxy Status |
|------|------|-------|--------------|
| CNAME | @ | fe168bd8-0d5e-4485-9b6e-94bed860ef35.cfargotunnel.com | Proxied (🧡) |
| CNAME | www | fe168bd8-0d5e-4485-9b6e-94bed860ef35.cfargotunnel.com | Proxied (🧡) |
| CNAME | api | fe168bd8-0d5e-4485-9b6e-94bed860ef35.cfargotunnel.com | Proxied (🧡) |
| CNAME | db | fe168bd8-0d5e-4485-9b6e-94bed860ef35.cfargotunnel.com | Proxied (🧡) |

**ملاحظات:**
- تأكد من تفعيل **Proxy Status** (الأيقونة البرتقالية 🧡)
- إذا كان السجل `@` موجوداً كـ A record يشير إلى IP، قم بحذفه أولاً
- CNAME للجذر `@` قد يتطلب تعطيل DNSSEC مؤقتاً في بعض الحالات

### الخطوة 3: تشغيل الخدمات المطلوبة

#### أ. تشغيل Backend (Laravel API):
```bash
cd law-firm-backend
php artisan serve --host=0.0.0.0 --port=8000
```

#### ب. تشغيل Frontend (React):
```bash
cd law-firm-system
npm run dev
```

#### ج. تشغيل phpMyAdmin (اختياري):
- إذا كان لديك XAMPP أو WAMP، تأكد من تشغيل phpMyAdmin على المنفذ 8080
- أو قم بتثبيت phpMyAdmin standalone

### الخطوة 4: تشغيل Cloudflare Tunnel

**الطريقة الأولى - باستخدام الملف الدفعي:**
```bash
start-tunnel.bat
```

**الطريقة الثانية - يدوياً:**
```bash
cloudflared.exe tunnel --config cloudflare-tunnel-config.yml run
```

**الطريقة الثالثة - كخدمة Windows:**
```powershell
# بعد التثبيت كخدمة
sc start cloudflared
```

## 🌐 الروابط المتاحة

بعد تشغيل كل شيء، ستكون الخدمات متاحة على:

- 🏠 **الموقع الرئيسي (Frontend)**: https://brqq.site
- 🔄 **البديل**: https://www.brqq.site
- 🔌 **API Backend**: https://api.brqq.site
- 🗄️ **قاعدة البيانات (phpMyAdmin)**: https://db.brqq.site

## 🔧 الإعدادات المطلوبة في الكود

### تحديث API URL في Frontend:

في ملف `law-firm-system/src/utils/api.ts`:
```typescript
const API_BASE_URL = 'https://api.brqq.site';
```

### تحديث CORS في Backend:

في ملف `law-firm-backend/config/cors.php`:
```php
'allowed_origins' => [
    'https://brqq.site',
    'https://www.brqq.site',
],
```

### تحديث APP_URL في Backend:

في ملف `law-firm-backend/.env`:
```env
APP_URL=https://api.brqq.site
FRONTEND_URL=https://brqq.site
SESSION_DOMAIN=.brqq.site
```

## 🐛 استكشاف الأخطاء

### مشكلة: "Access is denied"
**الحل:** قم بتشغيل PowerShell كمسؤول

### مشكلة: الخدمة لا تعمل
**الحل:** تحقق من تشغيل جميع الخدمات:
```bash
# تحقق من Backend
curl http://localhost:8000/api/health

# تحقق من Frontend
curl http://localhost:5173

# تحقق من phpMyAdmin
curl http://localhost:8080
```

### مشكلة: 502 Bad Gateway
**الحل:** تأكد من أن الخدمات المحلية تعمل على المنافذ الصحيحة

### مشكلة: SSL/TLS Errors
**الحل:** تأكد من أن Proxy Status في Cloudflare DNS مفعّل (🧡)

## 📊 مراقبة الـ Tunnel

لعرض حالة الـ Tunnel:
```bash
cloudflared.exe tunnel info fe168bd8-0d5e-4485-9b6e-94bed860ef35
```

لعرض السجلات:
```bash
cloudflared.exe tunnel logs fe168bd8-0d5e-4485-9b6e-94bed860ef35
```

## 🔒 الأمان

- ✅ جميع الاتصالات مشفرة عبر HTTPS
- ✅ لا حاجة لفتح منافذ في الجدار الناري
- ✅ الاتصال من الداخل للخارج فقط
- 🔐 للوصول إلى phpMyAdmin، يُنصح بإضافة Cloudflare Access للحماية

## 📝 ملاحظات مهمة

1. تأكد من تشغيل جميع الخدمات قبل بدء Tunnel
2. استخدم `start-tunnel.bat` لسهولة التشغيل
3. يمكنك تشغيل الـ Tunnel كخدمة Windows لتشغيله تلقائياً عند بدء التشغيل
4. احتفظ بنسخة احتياطية من ملف التكوين

## 🆘 الدعم

إذا واجهت أي مشاكل:
1. تحقق من السجلات (logs)
2. تأكد من صحة DNS records
3. تحقق من تشغيل الخدمات المحلية
4. راجع [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
