# 🎯 خطوات إضافة Public Hostnames - مهم جداً

## ⚠️ المشكلة الحالية:
الـ Tunnel يتصل بـ Cloudflare لكن لا توجد Public Hostnames مكونة بشكل صحيح.

## ✅ الحل (يجب تنفيذه الآن):

### 1️⃣ افتح Zero Trust Dashboard
https://one.dash.cloudflare.com/

### 2️⃣ اذهب إلى Networks > Tunnels

### 3️⃣ اضغط على Tunnel الخاص بك:
`fe168bd8-0d5e-4485-9b6e-94bed860ef35`

### 4️⃣ اضغط على تبويب "Public Hostname"

### 5️⃣ احذف جميع Public Hostnames القديمة (إن وجدت)

### 6️⃣ أضف Public Hostnames الجديدة واحدة تلو الأخرى:

#### أ. brqq.site (الرئيسي)
```
Subdomain: (اتركه فارغاً)
Domain: brqq.site
Path: (اتركه فارغاً)

Type: HTTP
URL: localhost:5173
```
✅ Save

#### ب. www
```
Subdomain: www
Domain: brqq.site
Path: (اتركه فارغاً)

Type: HTTP
URL: localhost:5173
```
✅ Save

#### ج. api
```
Subdomain: api
Domain: brqq.site
Path: (اتركه فارغاً)

Type: HTTP
URL: localhost:8000
```
✅ Save

#### د. db
```
Subdomain: db
Domain: brqq.site
Path: (اتركه فارغاً)

Type: HTTP
URL: localhost:8080
```
✅ Save

### 7️⃣ بعد إضافة جميع Hostnames، شغّل الـ Tunnel:

```powershell
cloudflared.exe tunnel run fe168bd8-0d5e-4485-9b6e-94bed860ef35
```

### 8️⃣ يجب أن ترى رسالة:
```
Connection X registered connIndex=0 location=... ip=...
```

هذا يعني أن الـ Tunnel اتصل بنجاح!

### 9️⃣ افتح المتصفح:
https://brqq.site

---

## 📝 ملاحظات مهمة:

1. ✅ Backend يجب أن يعمل على http://localhost:8000
2. ✅ Frontend يجب أن يعمل على http://localhost:5173
3. ✅ لا تستخدم ملف config.yml عند إضافة Hostnames من Dashboard
4. ✅ الـ Public Hostnames في Dashboard لها الأولوية

---

## 🐛 إذا ظهر خطأ "control stream encountered a failure":

هذا يعني أن Public Hostnames غير مضافة بشكل صحيح في Dashboard.
ارجع للخطوات أعلاه وتأكد من إضافتها بشكل صحيح.
