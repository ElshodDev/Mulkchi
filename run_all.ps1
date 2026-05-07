# Mulkchi - Barcha xizmatlarni ishga tushirish
$logFile = "c:\Bitiruv malakaviy ishi\Mulkchi\ngrok_setup_log.txt"

function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $message" | Out-File -FilePath $logFile -Append -Encoding UTF8
    Write-Host $message
}

Write-Log "========================================"
Write-Log "  Mulkchi xizmatlarini ishga tushirish"
Write-Log "========================================"

# 1. ngrok ni tekshirish va ishga tushirish
Write-Log "🔍 ngrok tekshirilmoqda..."
$ngrokProcess = Get-Process ngrok -ErrorAction SilentlyContinue

if ($ngrokProcess) {
    Write-Log "✅ ngrok allaqachon ishlayapti (PID: $($ngrokProcess.Id))"
} else {
    Write-Log "🚀 ngrok ishga tushirilmoqda..."
    Start-Process ngrok -ArgumentList "http", "5000" -WindowStyle Hidden
    Start-Sleep -Seconds 3
    Write-Log "✅ ngrok ishga tushdi"
}

# 2. ngrok URL ni olish
Write-Log "🔍 ngrok URL qidirilmoqda..."
try {
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -TimeoutSec 10
    $publicUrl = $tunnels.tunnels | Select-Object -First 1 -ExpandProperty public_url

    if ($publicUrl) {
        Write-Log "✅ ngrok URL: $publicUrl"
        $webhookUrl = "$publicUrl/api/auth/telegram/webhook"
        Write-Log "🔗 Webhook URL: $webhookUrl"

        # 3. Webhook ro'yxatdan o'tkazish
        Write-Log "📤 Webhook ro'yxatdan o'tkazilmoqda..."
        $botToken = "8054550922:AAFmxuhA-4Ojv_RUm7hBtjbR860apqyfDfw"
        $telegramApiUrl = "https://api.telegram.org/bot$botToken/setWebhook?url=$webhookUrl"

        try {
            $result = Invoke-RestMethod -Uri $telegramApiUrl -Method Get -TimeoutSec 30
            if ($result.ok -eq $true) {
                Write-Log "✅ Webhook MUVAFFAQIYATLI o'rnatildi!"
                Write-Log "📋 Result: $($result | ConvertTo-Json -Compress)"

                # Ma'lumotlarni saqlash
                "NGROK_URL=$publicUrl" | Out-File -FilePath "c:\Bitiruv malakaviy ishi\Mulkchi\.env.ngrok" -Encoding UTF8
                "WEBHOOK_URL=$webhookUrl" | Out-File -FilePath "c:\Bitiruv malakaviy ishi\Mulkchi\.env.ngrok" -Append -Encoding UTF8
            } else {
                Write-Log "❌ Webhook xatolik: $($result.description)"
            }
        }
        catch {
            Write-Log "❌ Telegram API xatolik: $_"
        }
    } else {
        Write-Log "❌ ngrok URL topilmadi"
    }
}
catch {
    Write-Log "❌ ngrok API xatolik: $_"
}

# 4. Frontend server ni tekshirish
Write-Log "🔍 Frontend server tekshirilmoqda..."
$ngServeProcess = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*ng serve*" }

if ($ngServeProcess) {
    Write-Log "✅ Frontend server allaqachon ishlayapti (PID: $($ngServeProcess.Id))"
} else {
    Write-Log "🚀 Frontend server ishga tushirilmoqda..."
    $frontendPath = "c:\Bitiruv malakaviy ishi\Mulkchi\Mulkchi.Frontend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npx ng serve --port 4200 --open=false" -WindowStyle Normal
    Write-Log "✅ Frontend server ishga tushdi (port 4200)"
}

Write-Log "========================================"
Write-Log "  Barcha xizmatlar ishga tushdi!"
Write-Log "========================================"
Write-Log "🌐 Frontend: http://localhost:4200"
Write-Log "🔗 ngrok: http://localhost:4040"
if ($publicUrl) {
    Write-Log "🌍 Public URL: $publicUrl"
}
