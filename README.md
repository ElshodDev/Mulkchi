# 🏠 Mulkchi

> **Mulkchi** — Zamonaviy ko'chmas mulk ijarasi va sotish platformasi. Ushbu loyiha Bitiruv Malakaviy Ishi (BMI) doirasida ishlab chiqilgan bo'lib, foydalanuvchilarga uy topish, ijaraga olish va sotish jarayonlarini osonlashtiradi.

![Mulkchi Platform](https://img.shields.io/badge/Status-Active-success) ![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet) ![Angular 20](https://img.shields.io/badge/Angular-20-DD0031?logo=angular) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)

## 🌟 Imkoniyatlar (Features)

- **🔍 Smart Qidiruv & Filtrlash**: Geolokatsiya va xarita orqali mulklarni izlash.
- **🤖 AI Tavsiyalar va Narx Bashorati**: ML.NET orqali uylarning adekvat narxini hisoblash va tavsiyalar berish.
- **💬 Real-time Chat**: Uy egalari va mijozlar o'rtasida SignalR orqali jonli muloqot.
- **🔔 Bildirishnomalar**: Sayt ichida va Telegram bot orqali xabarnomalar.
- **💳 To'lov Tizimi**: Payme va Click orqali online to'lovlar, obunalar va e'lonlarni "Top" ga chiqarish (Boost).
- **📊 Bozor Analitikasi**: Hududlar bo'yicha narxlar o'zgarishi va bozor statistikasi.

## 🏗️ Arxitektura (Tech Stack)

### Backend (Clean Architecture)
- **Framework**: ASP.NET Core 9 (C#)
- **Database**: PostgreSQL (Entity Framework Core)
- **Caching & Real-time**: Redis, SignalR
- **Autentifikatsiya**: JWT Bearer, Telegram Auth
- **AI/ML**: Microsoft ML.NET
- **Boshqalar**: Serilog, OpenTelemetry, FluentValidation, SixLabors.ImageSharp

### Frontend
- **Framework**: Angular 20 (confirmed with Angular CLI 20.3.x / Angular core 20.3.x)
- **UI Kit**: Angular Material
- **Xarita**: Leaflet
- **Grafiklar**: Chart.js
- **Qo'shimcha**: PWA (Service Worker)

## 🚀 O'rnatish va Ishga Tushirish

## 🚀 O'rnatish va Ishga Tushirish

### 1-usul: Docker orqali (Faqat Backend va Ma'lumotlar bazasi)
Backend xizmatlari, PostgreSQL va Redis'ni osongina ishga tushirish uchun:
```bash
git clone https://github.com/ElshodDev/Mulkchi.git
cd Mulkchi

# Docker-compose orqali API, DB va Redisni ko'tarish
docker-compose up -d
```

### 2-usul: Dasturchilar uchun lokal o'rnatish

#### Backend (.NET API)
```bash
cd Mulkchi.Api
# Ma'lumotlar bazasiga ulanish va kerakli kalitlarni appsettings.json da to'g'irlang.
dotnet restore
dotnet ef database update # Migratsiyalarni o'tkazish
dotnet run
```

#### Frontend (Angular SSR)
```bash
cd Mulkchi.Frontend
npm install --legacy-peer-deps
# Loyihani ishga tushirish
npm run start
```

## 🤝 Hissa Qo'shish (Contributing)

Loyiha ochiq kodli emas va shaxsiy ta'lim/BMI maqsadi uchun mo'ljallangan. Agar xato topsangiz yoki taklifingiz bo'lsa, iltimos **Issue** oching.

## 📄 Litsenziya
Ushbu loyiha [MIT License](LICENSE) ostida himoyalangan.
