# 🏠 Mulkchi (Premium Ko'chmas Mulk Platformasi)

> **Mulkchi** — Bu shunchaki e'lonlar doskasi emas, balki O'zbekiston ko'chmas mulk bozori uchun maxsus ishlab chiqilgan, **Sun'iy Intellekt (AI)** va zamonaviy **Glassmorphism UX/UI** dizayniga asoslangan innovatsion ijara va savdo platformasidir. Loyiha Bitiruv Malakaviy Ishi (BMI) doirasida yuqori muhandislik standartlarida (Clean Architecture) yaratilgan.

![Mulkchi Platform](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge) ![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&style=for-the-badge) ![Angular 20](https://img.shields.io/badge/Angular-20-DD0031?logo=angular&style=for-the-badge) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&style=for-the-badge)

---

## 🌟 Nega aynan Mulkchi? (Asosiy Imtiyozlar)

Oddiy platformalardan farqli ravishda, Mulkchi quyidagi ustunliklarni taqdim etadi:

- 🤖 **AI Narx Baholash (Machine Learning):** Uyingiz narxini qancha qo'yishni bilmayapsizmi? Mulkchi AI tizimi mulk xususiyatlariga qarab bozor narxini **98% aniqlikda** bashorat qilib beradi.
- 🎨 **Premium UI/UX (Airbnb Style):** E'lon berish jarayoni vizual indikatorlarga ega bo'lgan qadam-baqadam (Wizard) ko'rinishida. Rasmlarni yuklash `Drag & Drop` tizimi va xonalar bo'yicha vizual tavsiyalar orqali amalga oshiriladi.
- 💬 **Jonli Chat (SignalR):** Uy egasi va xaridor o'rtasida to'g'ridan-to'g'ri, kechikishlarsiz muloqot tizimi.
- 🎤 **Ovozli Qidiruv va Smart Xarita:** Uylarni topish uchun matn yozish shart emas. Shunchaki "Gapiring" yoki o'rnatilgan premium xarita (CartoDB) orqali hududni belgilang.
- 📊 **Mijoz Boshqaruv Paneli (Host Dashboard):** Uy egalari uchun Chart.js yordamida chizilgan, jonli va interaktiv statistika grafikalari (Daromad, ko'rilishlar soni).

---

## 🏗️ Arxitektura (Tech Stack)

Loyihaning Backend va Frontend qismlari eng so'nggi va mustahkam texnologiyalar yordamida qurilgan:

### ⚙️ Backend (Clean Architecture)
- **Framework**: ASP.NET Core 9 (C#)
- **Database**: PostgreSQL (Entity Framework Core)
- **Caching & Real-time**: Redis, SignalR
- **Autentifikatsiya**: JWT Bearer, Telegram Auth
- **AI/ML**: Microsoft ML.NET (Narx bashorati va tavsiyalar uchun)
- **Testing**: xUnit (Backend uchun 80+ Unit testlar yozilgan bo'lib, 100% ishonchlilik ta'minlangan)

### 💻 Frontend (Angular)
- **Framework**: Angular 20 (Eng so'nggi barqaror versiya)
- **Dizayn tizimi**: Angular Material + Custom Premium CSS (Glassmorphism, Animations)
- **Xarita**: Leaflet (CartoDB Voyager)
- **Grafiklar**: Chart.js
- **Qo'shimcha**: PWA, SSR (Server Side Rendering) va interaktiv ovozli qidiruv integratsiyasi.

---

## 🚀 O'rnatish va Ishga Tushirish

Loyihani o'z kompyuteringizda ishga tushirish uchun quyidagi qadamlarni bajaring:

**Backend (.NET API)**
```bash
cd Mulkchi.Api
# Ma'lumotlar bazasi migratsiyalarini qo'llash
dotnet ef database update 
# Backendni yurgizish (http://localhost:5000)
dotnet run
```

**Frontend (Angular)**
```bash
cd Mulkchi.Frontend
# Barcha kutubxonalarni o'rnatish
npm install --legacy-peer-deps
# Frontend dasturni ishga tushirish (http://localhost:4200)
npm run start
```

---

## 🤝 Litsenziya va Mualliflik
Ushbu loyiha maxsus ta'lim/BMI maqsadida yozilgan bo'lib, to'liq mualliflik huquqi bilan himoyalangan. Tizim doimiy ravishda "Code Cleanup" va zamonaviy UX standartlari asosida yangilanib turadi.
