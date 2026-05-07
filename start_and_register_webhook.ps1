# Combined ngrok start and webhook registration script

$botToken = "8054550922:AAFmxuhA-4Ojv_RUm7hBtjbR860apqyfDfw"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ngrok + Telegram Webhook Auto Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is already running
$ngrokProcess = Get-Process ngrok -ErrorAction SilentlyContinue
if ($ngrokProcess) {
    Write-Host "⚠️  ngrok allaqachon ishlayapti" -ForegroundColor Yellow
    Write-Host "   Yangi jarayon boshlanmaydi" -ForegroundColor Yellow
}
else {
    Write-Host "🚀 ngrok ishga tushirilmoqda..." -ForegroundColor Green
    Write-Host "   Port: 5000" -ForegroundColor Gray
    Write-Host ""

    # Start ngrok in background
    Start-Process ngrok -ArgumentList "http", "5000" -WindowStyle Hidden

    # Wait for ngrok to start
    Write-Host "⏳ ngrok ishga tushishini kutish (5 soniya)..." -ForegroundColor Yellow
    for ($i = 5; $i -gt 0; $i--) {
        Write-Host "   $i soniya qoldi..." -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
}

Write-Host ""
Write-Host "🔍 ngrok URL tekshirilmoqda..." -ForegroundColor Yellow

# Try to get ngrok URL
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -TimeoutSec 10
    $publicUrl = $response.tunnels | Select-Object -First 1 -ExpandProperty public_url

    if ($publicUrl) {
        $webhookUrl = "$publicUrl/api/auth/telegram/webhook"
        $telegramApiUrl = "https://api.telegram.org/bot$botToken/setWebhook?url=$webhookUrl"

        Write-Host "✅ ngrok URL: $publicUrl" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔗 Webhook URL: $webhookUrl" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📤 Webhook ro'yxatdan o'tkazilmoqda..." -ForegroundColor Cyan

        # Register webhook
        $result = Invoke-RestMethod -Uri $telegramApiUrl -Method Get

        if ($result.ok -eq $true) {
            Write-Host ""
            Write-Host "✅✅✅ WEBHOOK MUVAFFAQIYATLI O'RNATILDI! ✅✅✅" -ForegroundColor Green -BackgroundColor Black
            Write-Host ""
            Write-Host "📋 Xulosa:" -ForegroundColor Cyan
            Write-Host "   - ngrok URL: $publicUrl" -ForegroundColor White
            Write-Host "   - Webhook: $webhookUrl" -ForegroundColor White
            Write-Host "   - Bot: @MulkchiUz_bot" -ForegroundColor White
            Write-Host ""
            Write-Host "🌐 Webhook ma'lumotlari:" -ForegroundColor Cyan
            $infoUrl = "https://api.telegram.org/bot$botToken/getWebhookInfo"
            $info = Invoke-RestMethod -Uri $infoUrl -Method Get
            $info.result | ConvertTo-Json -Depth 3 | Write-Host

            Write-Host ""
            Write-Host "🎯 Keyingi qadamlar:" -ForegroundColor Cyan
            Write-Host "   1. Backend ishga tushiring: dotnet run --urls http://localhost:5000" -ForegroundColor White
            Write-Host "   2. Frontend ishga tushiring: npx ng serve --port 4200" -ForegroundColor White
            Write-Host "   3. Brauzerda oching: http://localhost:4200/auth/login" -ForegroundColor White
            Write-Host "   4. Telegram login tugmasini bosing" -ForegroundColor White
        }
        else {
            Write-Host ""
            Write-Host "❌ Webhook ro'yxatdan o'tkazilmadi" -ForegroundColor Red
            Write-Host "   Xatolik: $($result.description)" -ForegroundColor Red
        }
    }
    else {
        Write-Host ""
        Write-Host "❌ ngrok URL topilmadi" -ForegroundColor Red
        Write-Host "   Iltimos, qo'lda tekshiring: http://localhost:4040/status" -ForegroundColor Yellow
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Xatolik: $_" -ForegroundColor Red
    Write-Host "   Iltimos, quyidagilarni tekshiring:" -ForegroundColor Yellow
    Write-Host "   1. ngrok ishga tushganini: Get-Process ngrok" -ForegroundColor White
    Write-Host "   2. ngrok web interfeysi: http://localhost:4040" -ForegroundColor White
    Write-Host "   3. Internet ulanishini" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Script tugadi" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
