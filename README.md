# 🏠 Mulkchi – Premium Ko'chmas Mulk va Ijaralar Platformasi

> **Bitiruv Malakaviy Ishi (BMI) Taqdimoti uchun Maxsus Qo'llanma**
> Ushbu loyiha zamonaviy dasturlash arxitekturasi (Clean Architecture) va sun'iy intellekt (AI) texnologiyalaridan foydalangan holda, O'zbekiston ko'chmas mulk bozoridagi asosiy muammolarga innovatsion yechim taklif etish maqsadida ishlab chiqilgan.

![Mulkchi Platform](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge) ![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&style=for-the-badge) ![Angular 20](https://img.shields.io/badge/Angular-20-DD0031?logo=angular&style=for-the-badge) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&style=for-the-badge)

---

## 🛑 1. Dolzarb Muammo (Problem)

Bugungi kunda ko'chmas mulk va ijaralar sohasida bir nechta jiddiy muammolar mavjud:
1. **Ishonchsizlik va Firibgarlik:** Aksariyat saytlarda "fake" (soxta) e'lonlar va rieltorlar ko'payib ketgan. Haqiqiy uy egasini topish juda qiyin.
2. **Narxlarning Asossizligi:** Uy egalari o'z mulklari uchun qanday narx belgilashni bilmaydi. Natijada narxlar sun'iy ravishda oshib ketadi yoki oylab xaridor topilmaydi.
3. **Eski UX/UI va Noqulaylik:** Ko'pgina platformalar juda eski dizaynga ega. Foydalanuvchiga uyni qidirish, rasmlarni ko'rish va uy egasi bilan bog'lanish qiyin va zerikarli.
4. **Muloqotning Qiyinligi:** Mijoz uy egasiga qo'ng'iroq qilishi, raqami o'chirilgan bo'lishi yoki Telegram orqali alohida yozishiga to'g'ri keladi.

---

## 💡 2. Bizning Yechim: Nima uchun Mulkchi? (Solution)

**Mulkchi** platformasi yuqoridagi muammolarga zamonaviy dasturlash yechimlarini taqdim etadi:

- ✅ **Davlat tizimi bilan integratsiya (OneID):** Uy egalari e'lon joylashdan oldin **OneID** (Yagona Identifikatsiya Tizimi) orqali o'z pasport ma'lumotlari bilan shaxsni tasdiqlashlari shart. Bu 100% firibgarlikning oldini oladi va faqat ishonchli, yashil rangli **"Tasdiqlangan"** nishoniga ega Uy egalarini ajratib beradi.
- 🤖 **AI Narx Baholash (Machine Learning):** Uyni e'longa qo'yish jarayonida (Wizard form) sun'iy intellekt uyning joylashuvi, xonalar soni va ta'miriga qarab bozorga mos eng optimal narxni tavsiya qiladi. Narx barqarorligini ta'minlaydi.
- 🎨 **Premium Glassmorphism UX/UI:** Airbnb darajasidagi, o'ta zamonaviy dizayn va "Micro-animations". Platformadan foydalanish shunchaki qulay emas, balki estetik zavq beradi.
- 💬 **Real-vaqt Muloqot (SignalR):** Foydalanuvchilar platformadan chiqmasdan turib uy egalari bilan "Jonli Chat" (Real-time) orqali gaplashishi va joyni bron qilishi mumkin.

---

## 🎯 3. Asosiy Imkoniyatlar (Key Features)

### Mehmonlar (Mijozlar) uchun:
- 🎤 **Smart Qidiruv va Ovozli Izlash:** "Toshkent markazidan 2 xonali uy" deb gapirib yoki yozib tezkor qidirish imkoniyati.
- 🗺️ **Interaktiv Xarita (Leaflet & CartoDB):** Uylarni to'g'ridan-to'g'ri interaktiv xaritada joylashuviga qarab qidirish.
- ❤️ **Sevimlilar va Taqposlash:** Yoqqan uylarni saqlab qo'yish yoki bir-biri bilan xususiyatlarini avtomatik taqqoslash.
- 📅 **Tezkor Bron (Hold & Pay):** Yoqqan uyni band qilib qo'yish (Hold) va to'lovni xavfsiz amalga oshirish integratsiyasi.

### Uy Egalari (Hostlar) uchun:
- 📊 **Statistika Paneli (Dashboard):** Daromadlar, ko'rilishlar soni, va bronlar holatini ko'rsatib turuvchi interaktiv Chart.js grafiklari.
- 📸 **Aqlli E'lon Joylash (Wizard):** Qadam-baqadam ishlaydigan qulay forma (Basic Info -> Location -> Details -> Photos -> AI Price). Rasmlarni *Drag & Drop* usulida yuklash.

---

## 🏗️ 4. Arxitektura va Texnologik Stek (Tech Stack)

Loyiha arxitekturasi dunyo tan olgan **Clean Architecture (Toza Arxitektura)** tamoyillari asosida, "Dependency Injection" va "SOLID" qoidalariga qat'iy amal qilgan holda yozilgan.

### ⚙️ Backend (API)
- **Framework:** ASP.NET Core 9 (C#)
- **Architecture:** Clean Architecture (Domain, Application, Infrastructure, Presentation qatlamlariga ajratilgan).
- **Database:** PostgreSQL (Entity Framework Core bilan optimallashgan so'rovlar).
- **Caching & Real-time:** MemoryCache/Redis, SignalR (WebSockets).
- **Xavfsizlik:** JWT Bearer (Token-based Authentication), Role-based Authorization (Admin, Host, Guest).

### 💻 Frontend (SPA)
- **Framework:** Angular 20 (Eng so'nggi va barqaror).
- **State Management:** Angular Signals (Modern va tezkor state management).
- **Dizayn tizimi:** Angular Material + Custom SCSS (Glassmorphism va CSS Animations).

---

## 🚀 5. Ishga Tushirish Qo'llanmasi

Loyihani kompyuteringizda ishga tushirish uchun quyidagi buyruqlarni bajaring:

### Backend (.NET API)
```bash
cd Mulkchi.Api
# Ma'lumotlar bazasi migratsiyalarini yangilash
dotnet ef database update 
# Backendni ishga tushirish (http://localhost:5000)
dotnet run
```

### Frontend (Angular)
```bash
cd Mulkchi.Frontend
# Kutubxonalarni o'rnatish
npm install
# Frontendni ishga tushirish (http://localhost:4200)
npm run start
```

---

## 🤝 Xulosa (Komissiya uchun murojaat)
Ushbu loyiha nafaqat texnik jihatdan eng zamonaviy kod yozish madaniyati (Clean Code) standartlariga mos keladi, balki jamiyatdagi mavjud ishonchsizlik va qulaylik bilan bog'liq ijtimoiy muammolarga amaliy va biznesga yo'naltirilgan aniq yechim bo'lib xizmat qiladi. Muvaffaqiyatli himoya tilayman!
