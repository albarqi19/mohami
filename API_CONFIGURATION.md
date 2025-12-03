# تكوين API للإنتاج (Production)

## تعليمات تحديث API URL

### الخيار 1: استخدام متغيرات البيئة (موصى به)

1. أنشئ ملف `.env.production` في مجلد `law-firm-system`:

```env
VITE_API_BASE_URL=https://api.brqq.site/api/v1
```

2. عدّل ملف `src/utils/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
```

3. أعد بناء المشروع:
```bash
npm run build
```

### الخيار 2: تعديل مباشر (للاختبار السريع)

عدّل ملف `law-firm-system/src/utils/api.ts`:

```typescript
// للإنتاج
const API_BASE_URL = 'https://api.brqq.site/api/v1';

// للتطوير
// const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
```

## تحديث إعدادات Backend

### 1. ملف `.env`:

```env
APP_NAME="نظام إدارة المحاماة"
APP_ENV=production
APP_KEY=base64:your-app-key-here
APP_DEBUG=false
APP_URL=https://api.brqq.site

# Frontend URL
FRONTEND_URL=https://brqq.site

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=law_firm_db
DB_USERNAME=root
DB_PASSWORD=

# Session & CORS
SESSION_DOMAIN=.brqq.site
SANCTUM_STATEFUL_DOMAINS=brqq.site,www.brqq.site
```

### 2. ملف `config/cors.php`:

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://brqq.site',
        'https://www.brqq.site',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

## أوامر التشغيل

### Development (محلي):
```bash
# Frontend
cd law-firm-system
npm run dev

# Backend
cd law-firm-backend
php artisan serve
```

### Production (مع Cloudflare Tunnel):
```bash
# Frontend (Build)
cd law-firm-system
npm run build
npm run preview -- --port 5173

# Backend
cd law-firm-backend
php artisan serve --host=0.0.0.0 --port=8000

# Cloudflare Tunnel
cd ..
start-tunnel.bat
```
