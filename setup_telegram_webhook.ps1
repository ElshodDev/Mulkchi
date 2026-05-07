# Telegram Bot Webhook Setup Script
# Run this script after ngrok is started

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Telegram Bot Webhook Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is running
$ngrokApiUrl = "http://localhost:4040/api/tunnels"

try {
    $response = Invoke-RestMethod -Uri $ngrokApiUrl -Method Get -TimeoutSec 5
    $publicUrl = $response.tunnels | Select-Object -First 1 -ExpandProperty public_url

    if ($publicUrl) {
        $webhookUrl = "$publicUrl/api/auth/telegram/webhook"

        Write-Host "✅ ngrok URL topildi: $publicUrl" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔗 Webhook URL: $webhookUrl" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 Webhook ro'yxatdan o'tkazish uchun:" -ForegroundColor Cyan
        Write-Host "   Brauzerda oching:" -ForegroundColor White
        Write-Host "   https://api.telegram.org/bot8054550922:AAFmxuhA-4Ojv_RUm7hBtjbR860apqyfDfw/setWebhook?url=$webhookUrl" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🔐 Secret Token: mulkchi-secret-2024" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "📖 Qo'llanma:" -ForegroundColor Cyan
        Write-Host "   1. Yuqoridagi URL ni brauzerda oching" -ForegroundColor White
        Write-Host "   2. {\"ok\":true,\"result\":true,...} ko'rinishida javob kelishi kerak" -ForegroundColor White
        Write-Host "   3. Backend server ishlayotganini tekshiring (dotnet run)" -ForegroundColor White
        Write-Host "   4. Frontend da Telegram login tugmasini bosing" -ForegroundColor White
    }
    else {
        Write-Host "❌ ngrok URL topilmadi" -ForegroundColor Red
        Write-Host "   Iltimos, ngrok ishga tushirilganini tekshiring:" -ForegroundColor Yellow
        Write-Host "   ngrok http 5000" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "❌ ngrok ishga tushirilmagan yoki API mavjud emas" -ForegroundColor Red
    Write-Host "   Iltimos, avval ngrok ishga tushiring:" -ForegroundColor Yellow
    Write-Host "   ngrok http 5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Yoki PowerShellda yangi oynada ishga tushiring:" -ForegroundColor Yellow
    Write-Host "   Start-Process ngrok -ArgumentList 'http','5000'" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
