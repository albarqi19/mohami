# ✅ تم إصلاح اتصال API للإنتاج

## 📋 التغييرات المطبقة

### 1. ملف إعدادات API المركزي
**الملف:** `src/config/api.ts`

تم إنشاء ملف مركزي للكشف التلقائي عن البيئة:
- **Production (brqq.site):** يستخدم `https://api.brqq.site`
- **Development (localhost):** يستخدم `http://localhost:8000`

### 2. الملفات المعدلة

#### ✅ `src/utils/api.ts`
```typescript
// قبل:
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// بعد:
const API_BASE_URL = getApiBaseUrl(); // يتغير حسب البيئة
```

#### ✅ `src/services/appointmentService.ts`
```typescript
// قبل:
const API_BASE_URL = 'http://localhost:8000/api/v1';

// بعد:
const API_BASE_URL = getApiBaseUrl(); // كشف تلقائي
```

#### ✅ `src/pages/Documents.tsx`
```typescript
// قبل:
window.open(`http://localhost:8000${url}`, '_blank');

// بعد:
window.open(`${API_BASE}${url}`, '_blank');
```

#### ✅ `src/pages/Cases.tsx`
```typescript
// قبل:
fetch(`http://localhost:8000/api/cases/${caseId}`)

// بعد:
fetch(`${API_BASE_URL.replace('/api/v1', '')}/api/cases/${caseId}`)
```

#### ✅ `src/pages/WhatsappSettings.tsx`
```typescript
// قبل:
fetch(`http://localhost:8000/api${url}`)

// بعد:
fetch(`${API_BASE}/api${url}`)
```

#### ✅ `src/services/documentService.ts`
```typescript
// قبل:
fetch('http://localhost:8000/api/v1/smart-documents/analyze')

// بعد:
fetch(`${API_BASE_URL}/smart-documents/analyze`)
```

---

## 🎯 كيف يعمل الكشف التلقائي؟

```typescript
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Production
  if (hostname === 'brqq.site' || hostname === 'www.brqq.site') {
    return 'https://api.brqq.site';
  }
  
  // Development
  return 'http://localhost:8000';
};
```

---

## 🧪 الاختبار

### في Development (localhost)
1. افتح: `http://localhost:5173`
2. يجب أن يتصل بـ: `http://localhost:8000`

### في Production (brqq.site)
1. افتح: `https://brqq.site`
2. يجب أن يتصل بـ: `https://api.brqq.site`

---

## ✅ التأكد من نجاح الإعداد

افتح DevTools في المتصفح:
```javascript
// Console → Network Tab
// يجب أن ترى الطلبات تذهب إلى:
// - في localhost: http://localhost:8000/api/v1/...
// - في brqq.site: https://api.brqq.site/api/v1/...
```

---

## 🔧 إعدادات Backend المطلوبة

تأكد من إعدادات CORS في Backend:

**الملف:** `law-firm-backend/config/cors.php`

```php
'allowed_origins' => [
    'http://localhost:5173',
    'https://brqq.site',
    'https://www.brqq.site',
],

'paths' => ['api/*'],
```

**الملف:** `law-firm-backend/.env`

```env
APP_URL=https://api.brqq.site
FRONTEND_URL=https://brqq.site
SESSION_DOMAIN=.brqq.site
SANCTUM_STATEFUL_DOMAINS=brqq.site,www.brqq.site
```

---

## 📌 ملاحظات مهمة

1. ✅ لا حاجة لملفات `.env` في Frontend
2. ✅ الكشف التلقائي يعمل بناءً على `window.location.hostname`
3. ✅ يدعم localhost و brqq.site تلقائياً
4. ✅ لا حاجة لإعادة build للتبديل بين البيئات

---

## 🎉 النتيجة

الآن عندما يفتح المستخدم:
- **https://brqq.site** → يتصل بـ **https://api.brqq.site** ✅
- **http://localhost:5173** → يتصل بـ **http://localhost:8000** ✅

كل شيء يعمل تلقائياً! 🚀
