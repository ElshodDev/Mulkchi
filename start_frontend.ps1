# Frontend server ishga tushirish
$frontendPath = "c:\Bitiruv malakaviy ishi\Mulkchi\Mulkchi.Frontend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Frontend Server ishga tushirish" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $frontendPath

Write-Host "🔨 Frontend build qilinmoqda..." -ForegroundColor Yellow
Write-Host "   Bu bir necha soniya olishi mumkin..." -ForegroundColor Gray
Write-Host ""

npx ng serve --port 4200 --open=false
