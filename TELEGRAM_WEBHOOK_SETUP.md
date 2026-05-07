# Telegram Bot Webhook Setup Qo'llanmasi

## 1. ngrok o'rnatish (agar yo'q bo'lsa)

### Variant A: winget orqali
```powershell
winget install ngrok.ngrok
```

### Variant B: Qo'shma qo'llanma
1. https://ngrok.com/download sahifasidan yuklab oling
2. ZIP faylni oching (masalan: `C:\ngrok`)
3. PATH ga qo'shing:
   ```powershell
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\ngrok", "User")
   ```

## 2. ngrok ishga tushirish

PowerShell da yangi oyna oching va quyidagini bajaring:

```powershell
cd "c:\Bitiruv malakaviy ishi\Mulkchi"
ngrok http 5000
```

ngrok ishga tushgach, terminalda shunday ko'rinadi:
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://xxxx-xx-xx.ngrok-free.app -> http://localhost:5000
```

**🔗 Sizga kerak URL:** `https://xxxx-xx-xx.ngrok-free.app`

## 3. Webhook ro'yxatdan o'tkazish

ngrok URL olingach, brauzerda oching:

```
https://api.telegram.org/bot8054550922:AAFmxuhA-4Ojv_RUm7hBtjbR860apqyfDfw/setWebhook?url=https://SIZNING_NGROK_URL/api/auth/telegram/webhook
```

**URL ni to'ldiring:**
- `SIZNING_NGROK_URL` → `https://xxxx-xx-xx.ngrok-free.app` (yoki o'zingizning ngrok URL ingiz)

**To'liq URL misol:**
```
https://api.telegram.org/bot8054550922:AAFmxuhA-4Ojv_RUm7hBtjbR860apqyfDfw/setWebhook?url=https://abcd-12-34-56-78.ngrok-free.app/api/auth/telegram/webhook
```

## 4. Webhook tekshirish

Brauzerda ochilganda quyidagi javob kelishi kerak:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

## 5. Webhook ma'lumotlarini olish

```
https://api.telegram.org/bot8054550922:AAFmxuhA-4Ojv_RUm7hBtjbR860apqyfDfw/getWebhookInfo
```

## 6. Test qilish

1. Backend server ishga tushiring:
   ```powershell
   cd "c:\Bitiruv malakaviy ishi\Mulkchi\Mulkchi.Api"
   dotnet run --urls http://localhost:5000
   ```

2. Frontend ishga tushiring:
   ```powershell
   cd "c:\Bitiruv malakaviy ishi\Mulkchi\Mulkchi.Frontend"
   npx ng serve --port 4200
   ```

3. Brauzerda oching: http://localhost:4200/auth/login

4. "Telegram orqali kirish" tugmasini bosing

5. Telegram bot da `/start` buyrug'ini yuboring

## 7. Xatoliklar va yechimlari

### ngrok "authentication failed"
```powershell
ngrok config add-authtoken SIZNING_TOKEN
```
Token: https://dashboard.ngrok.com/get-started/your-authtoken

### "Failed to complete tunnel"
- Boshqa ngrok jarayonlari ishlamayotganini tekshiring
- Port 5000 ochiq ekanini tekshiring

### Webhook "Unauthorized"
- Secret token to'g'ri ekanini tekshiring: `mulkchi-secret-2024`
- `appsettings.json` da `TelegramAuth:WebhookSecretToken` tekshiring

## 📋 Xulosa

| Qadam | Buyruq |
|-------|--------|
| 1 | `ngrok http 5000` |
| 2 | URL ni nusxalash: `https://xxxx-xx-xx.ngrok-free.app` |
| 3 | Webhook URL: `https://api.telegram.org/bot8054550922:AAFmxuhA-4Ojv_RUm7hBtjbR860apqyfDfw/setWebhook?url=NGROK_URL/api/auth/telegram/webhook` |
| 4 | Test: Frontend da Telegram login tugmasi |

---
**Yaratildi:** May 2024
**Mulkchi Dev Team**
