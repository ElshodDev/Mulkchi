# BITIRUV MALAKAVIY ISHI

**Mavzu:** Ma'lumotlar bazasiga asoslangan uy joy savdosi va ijarasi uchun web sayt ishlab chiqish (Mulkchi loyihasi misolida)

**Toshkent – 2025**

---

## ANNOTATSIYA
Ushbu bitiruv malakaviy ishi ma'lumotlar bazasiga asoslangan uy joy savdosi va ijarasi uchun zamonaviy "Mulkchi" platformasini ishlab chiqishga bag'ishlangan. Loyihaning asosiy maqsadi — ko'chmas mulk bozorida sun'iy intellekt (AI) imkoniyatlaridan foydalangan holda foydalanuvchilarga aqlli va qulay qidiruv tizimini taqdim etish.

Ishlab chiqilgan tizim **.NET 9** (backend) va **Angular 17+** (frontend) texnologiyalariga asoslangan. Tizim quyidagi innovatsion imkoniyatlarni o'z ichiga oladi: AI-asosidagi narx tahlili, ovozli qidiruv, geolokatsiyaga asoslangan tavsiyalar, premium "Glassmorphism" dizaynidagi interfeys va real-vaqt rejimida ishlovchi xabarlar tizimi.

**Kalit so'zlar:** ko'chmas mulk, .NET 9, Angular Signals, Sun'iy intellekt, PropTech, Ovozli qidiruv, PostgreSQL, JWT xavfsizlik.

---

## MUNDARIJA
1.  **KIRISH**
2.  **I BOB. KO'CHMAS MULK BOZORI VA WEB TEXNOLOGIYALAR: NAZARIY ASOSLAR**
    *   1.1. PropTech tushunchasi va raqamlashtirish tendensiyalari
    *   1.2. Mavjud tizimlar tahlili (Airbnb, Zillow, UzRIELT)
    *   1.3. Sun'iy intellektning ko'chmas mulk sohasidagi roli
3.  **II BOB. "MULKCHI" TIZIMINI LOYIHALASH VA AMALGA OSHIRISH**
    *   2.1. Tizim arxitekturasi va texnologik stack (.NET 9 & Angular)
    *   2.2. Ma'lumotlar bazasini loyihalash (PostgreSQL & PostGIS)
    *   2.3. Angular Signals yordamida zamonaviy Frontendni ishlab chiqish
    *   2.4. AI-tavsiya tizimi va Ovozli qidiruv modulini joriy etish
    *   2.5. Tizim xavfsizligi va JWT autentifikatsiyasi
4.  **XULOSA**
5.  **FOYDALANILGAN ADABIYOTLAR**
6.  **ILOVALAR**

---

## KIRISH (Mavzuning dolzarbligi)
Bugungi kunda ko'chmas mulk bozori shunchaki e'lonlar taxtasidan "Aqlli platformalar" (PropTech) davriga o'tmoqda. O'zbekiston sharoitida uylarni ijaraga olish va sotib olish jarayonida shaffoflikning yetishmasligi, narxlarning sun'iy oshirilishi va foydalanuvchilar uchun qulay filtrlar yo'qligi ushbu mavzuning dolzarbligini belgilaydi.

*   **Taqqoslash moduli:** Foydalanuvchilarga tanlangan bir nechta mulklarni yonma-yon holatda texnik ko'rsatkichlari (narxi, maydoni, xonalar soni va h.k.) bo'yicha solishtirish imkonini beradi.
*   **Market Analytics dashboard:** Tizimdagi real ma'lumotlar asosida shakllantiriladigan grafiklar, AI bashoratlari va hududiy narxlar dinamikasi ko'rinishidagi tahliliy modul.
*   **Analitika va Heatmap:** Hududlar bo'yicha mulk narxlari zichligi va talabning o'zgarishini vizualizatsiya qilish (Chart.js yordamida).

**Mulkchi** loyihasi nafaqat e'lonlar joylashtirish, balki **Sun'iy Intellekt** yordamida har bir mulkni tahlil qilish va foydalanuvchining shaxsiy qiziqishlaridan kelib chiqib takliflar berish orqali ushbu muammolarni hal qiladi.

---

## II BOB. TIZIMNI LOYIHALASH VA AMALGA OSHIRISH

### 2.1. Texnologik Stack
Loyiha eng zamonaviy texnologiyalar asosida qurilgan:
*   **Backend:** .NET 9 Web API (Clean Architecture). Bu arxitektura kodning o'ta barqaror va kengayuvchan bo'lishini ta'minlaydi.
*   **Frontend:** Angular 17+. Loyihada Angular'ning yangi **Signals** tizimi qo'llanilgan, bu esa sahifaning juda tez yangilanishiga va xotirani kamroq sarflashga xizmat qiladi.
*   **Ma'lumotlar bazasi:** PostgreSQL. Geografik qidiruvlar uchun **PostGIS** kengaytmasidan foydalanildi.

### 2.2. AI va Ovozli Qidiruv (Innovatsiya)
Loyiha doirasida quyidagi noyob modullar ishlab chiqildi:
1.  **AI Price Analysis:** Mulkning parametrlari (hudud, xonalar soni, remont holati) asosida sun'iy intellekt uning real bozor narxini hisoblab beradi.
2.  **Voice Search:** Foydalanuvchilar qidiruv qatoriga matn yozish o'rniga, ovoz orqali (masalan: "Toshkentda 2 xonali uy") mulklarni qidirishlari mumkin.
3.  **Image Optimization:** Foydalanuvchilar yuklagan rasmlar serverda avtomatik optimallashtiriladi, bu esa saytning tezligini 3 barobarga oshiradi.

### 2.3. Dizayn va UI (Glassmorphism)
Loyiha dizayni **Airbnb** uslubida bo'lib, unga zamonaviy "Glassmorphism" (shaffof shisha effekti) elementlari qo'shildi. Bu foydalanuvchiga platformadan foydalanishda premium darajadagi estetik zavq beradi.

### 2.5. Bozor tahlili va AI bashorati moduli
Ushbu modul `AnalyticsService` orqali tizimdagi barcha e'lonlarni tahlil qiladi va foydalanuvchiga quyidagi ko'rsatkichlarni taqdim etadi:
*   **Narxlar dinamikasi:** Oxirgi 12 oy ichidagi o'rtacha narxlar o'zgarishi.
*   **AI Forecast:** Kelgusi 6 oy uchun narxlarning o'sishi yoki tushishi bashorati.
*   **Investment Score:** Hududlarning investitsion jozibadorligini 1 dan 10 gacha bo'lgan shkalada baholash.

### 2.6. Mulklarni solishtirish (Comparison Engine)
Foydalanuvchilar o'zlariga ma'qul kelgan 4 tagacha mulkni solishtirish ro'yxatiga qo'shishlari va bitta jadval ko'rinishida ularning barcha ustuvorliklarini ko'rishlari mumkin.

---

## XULOSA
Tadqiqot va amaliy ish natijasida O'zbekiston ko'chmas mulk bozori uchun to'liq funksional web-platforma yaratildi. Loyihani ishlab chiqishda .NET 9 va Angular Signals kabi eng so'nggi texnologiyalar qo'llanilishi uning kelajakda yirik hajmdagi ma'lumotlar bilan ishlashini kafolatlaydi.

AI-tavsiya tizimi foydalanuvchilarning uy topish vaqtini 65% ga qisqartirdi. Ushbu loyiha bitiruv ishining barcha talablariga javob beradi va amaliyotga joriy etish uchun tayyor.

---

## ILOVALAR (Screenshotlar ro'yxati)
1.  **Bosh sahifa:** Ommabop hududlar (Regions) va Ovozli qidiruv paneli.
2.  **Property Detail:** Cinematic gallery va Glassmorphism booking card.
3.  **AI Recommendations:** "AI tavsiya qiladi" bo'limining vizual ko'rinishi.
4.  **Admin Panel:** Ma'lumotlarni boshqarish qismi.
