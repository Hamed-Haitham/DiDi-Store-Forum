# Didi Store Orders

تطبيق كامل لطلب مخبوزات Didi Store.

- واجهة عربية محسنة ومتجاوبة.
- الرقم الأساسي: `01008597069`.
- إرسال الطلب إلى واتساب: `201008597069`.
- خلفية تستقبل الطلبات عبر `/api/orders`.
- حفظ الطلبات في `data/orders.json`.

## التشغيل المحلي

```bash
npm start
```

ثم افتح: `http://localhost:3000`

## النشر على الإنترنت

ارفع هذا المجلد إلى منصة تدعم Node.js مثل Render أو Railway أو Vercel.

في Render: Start Command = `npm start`.

ملاحظة: التخزين في ملف JSON مناسب كبداية. عند زيادة الطلبات، الأفضل ربط قاعدة بيانات مثل Supabase أو MongoDB.
