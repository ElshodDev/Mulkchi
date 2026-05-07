# Telegram Webhook Registration Script
# Avval ngrok ishga tushirish kerak: ngrok http 5000

$botToken = "8054550922:AAFmxuhA-4Ojv_RUm7hBtjbR860apqyfDfw"
$ngrokApiUrl = "http://localhost:4040/api/tunnels"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Telegram Bot Webhook Registration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "🔍 ngrok URL qidirilmoqda..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $ngrokApiUrl -Method Get -TimeoutSec 5
    $publicUrl = $response.tunnels | Select-Object -First 1 -ExpandProperty public_url

    if ($publicUrl) {
        $webhookUrl = "$publicUrl/api/auth/telegram/webhook"
        $telegramApiUrl = "https://api.telegram.org/bot$botToken/setWebhook?url=$webhookUrl"

        Write-Host "✅ ngrok URL topildi: $publicUrl" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔗 Webhook URL: $webhookUrl" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📤 Telegram API ga so'rov yuborilmoqda..." -ForegroundColor Cyan
        Write-Host ""

        # Register webhook
        $result = Invoke-RestMethod -Uri $telegramApiUrl -Method Get

        if ($result.ok -eq $true) {
            Write-Host "✅ Webhook muvaffaqiyatli ro'yxatdan o'tkazildi!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📋 Javob:" -ForegroundColor Cyan
            $result | ConvertTo-Json -Depth 3 | Write-Host
        }
        else {
            Write-Host "❌ Webhook ro'yxatdan o'tkazilmadi" -ForegroundColor Red
            Write-Host "Xatolik: $($result.description)" -ForegroundColor Red
        }

        Write-Host ""
        Write-Host "📊 Webhook ma'lumotlari:" -ForegroundColor Cyan
        $infoUrl = "https://api.telegram.org/bot$botToken/getWebhookInfo"
        $info = Invoke-RestMethod -Uri $infoUrl -Method Get
        $info.result | ConvertTo-Json -Depth 3 | Write-Host
    }
    else {
        Write-Host "❌ ngrok URL topilmadi" -ForegroundColor Red
        Write-Host "   Iltimos, avval ngrok ishga tushiring:" -ForegroundColor Yellow
        Write-Host "   ngrok http 5000" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "❌ Xatolik yuz berdi" -ForegroundColor Red
    Write-Host "   Iltimos, avval ngrok ishga tushiring:" -ForegroundColor Yellow
    Write-Host "   ngrok http 5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Tekshiring: http://localhost:4040/status" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
