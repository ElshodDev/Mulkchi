# Backend server ishga tushirish
$apiPath = "c:\Bitiruv malakaviy ishi\Mulkchi\Mulkchi.Api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backend Server ishga tushirish" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Build
Write-Host "🔨 Backend build qilinmoqda..." -ForegroundColor Yellow
Set-Location $apiPath
dotnet build --verbosity quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build muvaffaqiyatli!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Server ishga tushirilmoqda..." -ForegroundColor Green
    Write-Host "   URL: http://localhost:5000" -ForegroundColor Gray
    Write-Host ""
    dotnet run --urls "http://localhost:5000" --verbosity quiet
} else {
    Write-Host "❌ Build xatolik!" -ForegroundColor Red
    dotnet build
}
