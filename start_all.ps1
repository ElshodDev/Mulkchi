# Mulkchi - Barcha xizmatlarni ishga tushirish (yangi oynalarda)
$basePath = "c:\Bitiruv malakaviy ishi\Mulkchi"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mulkchi - Barcha xizmatlar" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. ngrok ishga tushirish (yashirin rejimda)
Write-Host "🚀 ngrok ishga tushirilmoqda..." -ForegroundColor Green
$ngrokProcess = Get-Process ngrok -ErrorAction SilentlyContinue
if ($ngrokProcess) {
    Stop-Process -Name ngrok -Force
    Start-Sleep -Seconds 2
}
Start-Process ngrok -ArgumentList "http", "5000" -WindowStyle Normal

Start-Sleep -Seconds 3

# 2. Backend ishga tushirish (yangi oynada)
Write-Host "🚀 Backend ishga tushirilmoqda (port 5000)..." -ForegroundColor Green
$backendPath = "$basePath\Mulkchi.Api"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; dotnet run --urls 'http://localhost:5000' --verbosity quiet" -WindowStyle Normal

Start-Sleep -Seconds 5

# 3. Frontend ishga tushirish (yangi oynada)
Write-Host "🚀 Frontend ishga tushirilmoqda (port 4200)..." -ForegroundColor Green
$frontendPath = "$basePath\Mulkchi.Frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npx ng serve --port 4200 --open=false" -WindowStyle Normal

Start-Sleep -Seconds 3

# 4. Webhook ro'yxatdan o'tkazish
try {
    Write-Host ""
    Write-Host "📤 Webhook ro'yxatdan o'tkazilmoqda..." -ForegroundColor Yellow
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -TimeoutSec 10
    $publicUrl = $tunnels.tunnels | Select-Object -First 1 -ExpandProperty public_url
    
    if ($publicUrl) {
        $webhookUrl = "$publicUrl/api/auth/telegram/webhook"
        $botToken = "8054550922:AAFmxuhA-4Ojv_RUm7hBtjbR860apqyfDfw"
        $result = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/setWebhook?url=$webhookUrl" -Method Get
        
        if ($result.ok -eq $true) {
            Write-Host "✅ Webhook muvaffaqiyatli o'rnatildi!" -ForegroundColor Green
            Write-Host "   URL: $webhookUrl" -ForegroundColor Gray
            "NGROK_URL=$publicUrl`nWEBHOOK_URL=$webhookUrl" | Out-File -FilePath "$basePath\.env.ngrok" -Encoding UTF8
        } else {
            Write-Host "❌ Webhook xatolik: $($result.description)" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️ ngrok URL topilmadi. Keyinroq qo'lda ro'yxatdan o'tkazing." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠️ Webhook ro'yxatdan o'tkazilmadi: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Barcha xizmatlar ishga tushdi!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Xizmatlar:" -ForegroundColor White
Write-Host "   • ngrok:      http://localhost:4040" -ForegroundColor Gray
Write-Host "   • Backend:    http://localhost:5000" -ForegroundColor Gray
Write-Host "   • Frontend:   http://localhost:4200" -ForegroundColor Gray
Write-Host ""
if ($publicUrl) {
    Write-Host "🌍 Public URL: $publicUrl" -ForegroundColor Green
}
Write-Host ""
Write-Host "🌐 Brauzerda oching: http://localhost:4200/auth/login" -ForegroundColor Yellow
Write-Host ""
