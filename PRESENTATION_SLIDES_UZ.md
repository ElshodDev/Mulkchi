# Mulkchi loyihasi himoya slaydlari (12 ta)

## 1-slayd. Kirish: Loyiha nomi va yo'nalishi
- **Loyiha:** Mulkchi – premium ko‘chmas mulk va ijaralar platformasi  
- **Muammo:** bozor ishonchsiz, jarayonlar noqulay, narxlar noaniq  
- **Maqsadli auditoriya:** ijarachi, xaridor, uy egasi, admin  
- **Natija:** xavfsiz, tezkor, zamonaviy yagona platforma

**Nutq skripti:**  
“Mulkchi loyihasi ko‘chmas mulk bozoridagi eng katta muammolarni bitta platformada hal qilish uchun yaratildi: ishonchsizlik, noqulay UX va narx belgilashdagi tartibsizlik.”

---

## 2-slayd. Muammo va maqsad
- Soxta e’lonlar va firibgarliklar foydalanuvchi ishonchini pasaytiradi  
- Aloqa va bron jarayoni tarqoq, vaqt yo‘qotiladi  
- Narxlar subyektiv qo‘yiladi, bozor muvozanati buziladi  
- **Maqsad:** ishonchli verifikatsiya + AI narx + real-time muloqot

**Nutq skripti:**  
“Biz mavjud tizimlardagi uchta asosiy og‘riq nuqtasini oldik: ishonch, qulaylik va adolatli narx. Shu asosda Mulkchi arxitekturasini qurdik.”

---

## 3-slayd. Yechim arxitekturasi (umumiy)
- Frontend: **Angular 20** (SPA, tezkor va interaktiv UI)  
- Backend: **ASP.NET Core 9** (REST API, biznes mantiq)  
- Ma’lumotlar bazasi: **PostgreSQL**  
- Real-time qatlam: **SignalR** (jonli chat va bildirishnomalar)

**Vizual tavsiya:**  
Client → API → DB + SignalR Hub diagrammasi.

**Nutq skripti:**  
“Arxitektura modul va qatlamlarga bo‘lingan: frontend foydalanuvchi tajribasini boshqaradi, backend esa xavfsizlik va biznes qoidalarini ta’minlaydi.”

---

## 4-slayd. Arxitektura (modullar)
- Auth & OneID verifikatsiya moduli  
- Property listing (e’lon yaratish va boshqarish)  
- Search/Filter + xarita moduli  
- Booking/Chat + to‘lovga tayyor integratsiya qatlami  
- Admin monitoring va analitika

**Vizual tavsiya:**  
Modul diagrammasi (5 blok).

**Nutq skripti:**  
“Modul yondashuvi keyinchalik tizimni kengaytirishni osonlashtiradi: masalan, to‘lov provayderi yoki yangi AI xizmatini alohida qo‘sha olamiz.”

---

## 5-slayd. Asosiy funksiyalar (Foydalanuvchi tomoni)
- Smart qidiruv (matnli va ovozli izlash)  
- Interaktiv xarita orqali hudud bo‘yicha tanlash  
- Sevimlilar va taqqoslash (compare)  
- Jonli chat orqali uy egasi bilan tezkor aloqa  
- Bron qilish (hold) jarayoni

**Nutq skripti:**  
“Mijoz uchun asosiy qiymat — kerakli uyni tez topish, ishonchli egasi bilan platformadan chiqmasdan gaplashish va bron qilish.”

---

## 6-slayd. Asosiy funksiyalar (Uy egasi/Admin tomoni)
- Wizard form orqali bosqichma-bosqich e’lon berish  
- AI narx tavsiyasi (joylashuv, xona, holat bo‘yicha)  
- Dashboard: ko‘rishlar, so‘rovlar, bron statistikasi  
- Rasmlarni qulay yuklash (drag & drop)  
- Rolga asoslangan boshqaruv (Admin, Host, Guest)

**Nutq skripti:**  
“Uy egasi uchun jarayon murakkab emas: tizim AI bilan narxni tavsiya qiladi, dashboard esa e’lon samaradorligini ko‘rsatadi.”

---

## 7-slayd. Afzalliklar
- **Tezlik:** qidiruv va muloqot bir platformada  
- **Qulaylik:** zamonaviy UX/UI, aniq foydalanuvchi oqimi  
- **Aniqlik:** AI narx tavsiyasi orqali bozorbop baho  
- **Xavfsizlik:** OneID + JWT + role-based authorization  
- **Masshtablilik:** Clean Architecture sababli oson kengayadi

**Nutq skripti:**  
“Mulkchi’ning afzalligi faqat dizaynda emas — texnik asoslar ham kuchli: xavfsizlik, tezlik va kengayishga tayyor arxitektura.”

---

## 8-slayd. Mavjud loyihalar bilan taqqoslash (1)
| Mezon | An’anaviy platformalar | Mulkchi |
|---|---|---|
| Foydalanuvchi verifikatsiyasi | Cheklangan | OneID asosida |
| Narx belgilash | Subyektiv | AI tavsiyasi |
| Muloqot | Tashqi messenjerlar | Platforma ichida real-time |
| UX/UI | O‘rtacha | Premium, zamonaviy |

**Nutq skripti:**  
“Bu jadvalda ko‘rinib turibdiki, biz muammoning ildiziga urdik: ishonch va samaradorlik.”

---

## 9-slayd. Mavjud loyihalardan farqi (2) — Innovatsiyalar
- OneID bilan haqiqiy shaxsga bog‘langan e’lonlar  
- AI narxlash orqali adolatli bozor qiymatiga yaqinlashuv  
- SignalR chat bilan darhol aloqa va tez qaror qabul qilish  
- Clean Architecture asosida professional ishlab chiqish standarti  
- Frontend’da zamonaviy Angular Signals va yuqori interaktivlik

**Nutq skripti:**  
“Bizning yangiligimiz alohida funksiyada emas, balki ularning birlashgan ekotizimida: verifikatsiya + AI + real-time.”

---

## 10-slayd. Demo / natija
- Scenario: foydalanuvchi qidiruv qiladi → e’lonni ko‘radi → chat ochadi → bron qiladi  
- Host tomoni: e’lon yaratadi → AI narx oladi → statistikani kuzatadi  
- Oldin: tarqoq, qo‘lda, sekin  
- Hozir: markazlashgan, tez, kuzatuvli

**Vizual tavsiya:**  
3–4 ta screenshot + bitta oddiy workflow chizmasi.

**Nutq skripti:**  
“Demo’da ikki yo‘nalishni ko‘rsatamiz: mijoz yo‘li va host yo‘li. Har ikki tomonda ham vaqt tejalishi va qulaylik oshishi aniq ko‘rinadi.”

---

## 11-slayd. O‘lchanadigan natijalar (taqdimot uchun KPI)
- Soxta e’lon xavfini verifikatsiya orqali keskin kamaytirish  
- Muloqot vaqtini real-time chat bilan qisqartirish  
- Narx qo‘yishdagi noaniqlikni AI tavsiyasi bilan kamaytirish  
- Konversiyani UX yaxshilanishi orqali oshirish

**Eslatma:**  
Bu yerga o‘zingizdagi real test/analitika raqamlarini kiriting (%, daqiqa, son).

**Nutq skripti:**  
“Komissiya uchun eng muhim nuqta — o‘lchanadigan natija. Shu slaydda real metrikaning biznes qiymatini ko‘rsatamiz.”

---

## 12-slayd. Xulosa va keyingi rejalar
- Mulkchi dolzarb muammolarga amaliy yechim berdi  
- Texnik asos: zamonaviy va himoyaga tayyor arxitektura  
- Biznes asos: ishonch, tezlik va qulaylikka yo‘naltirilgan  
- Keyingi bosqich: to‘lov integratsiyasi, AI modelni kengaytirish, mobil ilova

**Nutq skripti:**  
“Xulosa qilib aytganda, Mulkchi — bu oddiy e’lonlar sayti emas, balki ishonchli va aqlli raqamli ekotizim. Keyingi bosqichda uni mahsulot darajasiga olib chiqamiz.”

