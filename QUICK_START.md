# 🚀 دليل البدء السريع - Cloudflare Tunnel

## ✅ الخطوات المطلوبة

### 1️⃣ تثبيت خدمة Cloudflare (مرة واحدة فقط)

**مهم: قم بتشغيل PowerShell كمسؤول (Administrator)**

```powershell
# اضغط Win + X واختر "Windows PowerShell (Admin)"
cd "C:\Users\ALBAR\Downloads\محامي"
cloudflared.exe service install eyJhIjoiYWJmNjc0NDI0MDA2YTk2ZWM5YTc5MzczOWZhYTU3M2EiLCJ0IjoiZmUxNjhiZDgtMGQ1ZS00NDg1LTliNmUtOTRiZWQ4NjBlZjM1IiwicyI6IllXRXpNV0V3TkdFdFkyRXlZUzAwTldObUxUZzRaRFl0TUdOa1kyRmxPRGxrWm1ZMyJ9
```

### 2️⃣ إعداد DNS في Cloudflare Dashboard

1. افتح https://dash.cloudflare.com
2. اختر النطاق **brqq.site**
3. اذهب إلى **DNS** > **Records**
4. أضف السجلات التالية:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | @ | fe168bd8-0d5e-4485-9b6e-94bed860ef35.cfargotunnel.com | 🧡 On |
| CNAME | www | fe168bd8-0d5e-4485-9b6e-94bed860ef35.cfargotunnel.com | 🧡 On |
| CNAME | api | fe168bd8-0d5e-4485-9b6e-94bed860ef35.cfargotunnel.com | 🧡 On |
| CNAME | db | fe168bd8-0d5e-4485-9b6e-94bed860ef35.cfargotunnel.com | 🧡 On |

### 3️⃣ تشغيل النظام

**الطريقة السهلة (موصى بها):**
```bash
# انقر مرتين على الملف
start-production.bat
```

**الطريقة اليدوية:**

في ثلاث نوافذ منفصلة:

```bash
# النافذة 1: Backend
cd law-firm-backend
php artisan serve --host=0.0.0.0 --port=8000

# النافذة 2: Frontend
cd law-firm-system
npm run build
npm run preview -- --port 5173

# النافذة 3: Tunnel
cloudflared.exe tunnel --config cloudflare-tunnel-config.yml run
```

## 🌐 الوصول للنظام

بعد التشغيل، يمكنك الوصول إلى:

- 🏠 **الموقع**: https://brqq.site
- 🔌 **API**: https://api.brqq.site
- 🗄️ **قاعدة البيانات**: https://db.brqq.site

## 🛑 إيقاف الخدمات

```bash
# انقر مرتين على الملف
stop-services.bat
```

## ⚠️ استكشاف الأخطاء

### "Access is denied" عند التثبيت
**الحل:** قم بتشغيل PowerShell كمسؤول (Administrator)

### "502 Bad Gateway"
**الحل:** تأكد من تشغيل Backend و Frontend محلياً

### لا يمكن الوصول للموقع
**الحل:** تحقق من إعدادات DNS في Cloudflare

## 📚 المزيد من المعلومات

راجع الملفات التالية:
- `CLOUDFLARE_TUNNEL_SETUP.md` - دليل كامل
- `API_CONFIGURATION.md` - إعدادات API
- `cloudflare-tunnel-config.yml` - ملف التكوين
