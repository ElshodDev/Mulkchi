# Check ngrok and register webhook
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ngrok & Webhook Tekshiruv" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    Write-Host "🔍 ngrok URL qidirilmoqda..." -ForegroundColor Yellow
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -TimeoutSec 10
    $publicUrl = $tunnels.tunnels | Select-Object -First 1 -ExpandProperty public_url

    if ($publicUrl) {
        $webhookUrl = "$publicUrl/api/auth/telegram/webhook"
        Write-Host "✅ ngrok URL: $publicUrl" -ForegroundColor Green
        Write-Host "🔗 Webhook URL: $webhookUrl" -ForegroundColor Yellow

        Write-Host "📤 Webhook ro'yxatdan o'tkazilmoqda..." -ForegroundColor Cyan
        $result = Invoke-RestMethod -Uri "https://api.telegram.org/bot8054550922:AAFmxuhA-4Ojv_RUm7hBtjbR860apqyfDfw/setWebhook?url=$webhookUrl" -Method Get

        if ($result.ok -eq $true) {
            Write-Host "✅ Webhook MUVAFFAQIYATLI o'rnatildi!" -ForegroundColor Green
            $result | ConvertTo-Json -Depth 3 | Write-Host

            # Save URLs to file
            "ngrok_url=$publicUrl" | Out-File -FilePath "c:\Bitiruv malakaviy ishi\Mulkchi\ngrok_info.txt" -Encoding UTF8
            "webhook_url=$webhookUrl" | Out-File -FilePath "c:\Bitiruv malakaviy ishi\Mulkchi\ngrok_info.txt" -Encoding UTF8 -Append
            "status=success" | Out-File -FilePath "c:\Bitiruv malakaviy ishi\Mulkchi\ngrok_info.txt" -Encoding UTF8 -Append
        } else {
            Write-Host "❌ Webhook xatolik: $($result.description)" -ForegroundColor Red
            "status=error" | Out-File -FilePath "c:\Bitiruv malakaviy ishi\Mulkchi\ngrok_info.txt" -Encoding UTF8
        }
    } else {
        Write-Host "❌ ngrok URL topilmadi" -ForegroundColor Red
        "status=no_url" | Out-File -FilePath "c:\Bitiruv malakaviy ishi\Mulkchi\ngrok_info.txt" -Encoding UTF8
    }
}
catch {
    Write-Host "❌ Xatolik: $_" -ForegroundColor Red
    "status=exception" | Out-File -FilePath "c:\Bitiruv malakaviy ishi\Mulkchi\ngrok_info.txt" -Encoding UTF8
}

Write-Host "========================================" -ForegroundColor Cyan
