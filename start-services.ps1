# Mulkchi Development Services Starter
# Avtomatik ishga tushirish va monitoring

param(
    [switch]$Monitor = $false
)

$host.UI.RawUI.BackgroundColor = "Black"
$host.UI.RawUI.ForegroundColor = "White"

function Write-Header {
    param([string]$text)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $text -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Test-Service {
    param([string]$Url, [string]$Name)
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 3 -UseBasicParsing
        return $true
    } catch {
        return $false
    }
}

function Stop-ExistingServices {
    Write-Host "`n🛑 Avvalgi jarayonlar to'xtatilmoqda..." -ForegroundColor Yellow
    
    # Stop dotnet processes
    Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like "*Mulkchi*"} | Stop-Process -Force
    
    # Stop node processes  
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Start-Sleep -Seconds 3
    Write-Host "✅ To'xtatildi" -ForegroundColor Green
}

function Start-Backend {
    Write-Host "`n🚀 Backend ishga tushirilmoqda..." -ForegroundColor Green
    Set-Location "c:\Bitiruv malakaviy ishi\Mulkchi\Mulkchi.Api"
    
    $backendJob = Start-Job -ScriptBlock {
        Set-Location "c:\Bitiruv malakaviy ishi\Mulkchi\Mulkchi.Api"
        dotnet run --urls http://localhost:5000 --no-launch-profile 2>&1
    }
    
    # Wait for startup
    $maxAttempts = 30
    $attempt = 0
    $started = $false
    
    while ($attempt -lt $maxAttempts -and -not $started) {
        Start-Sleep -Seconds 2
        $attempt++
        
        # Check job output for "listening" message
        $output = Receive-Job -Job $backendJob 2>&1
        if ($output -match "listening on" -or $output -match "Now listening") {
            $started = $true
            Write-Host "✅ Backend ishga tushdi!" -ForegroundColor Green
        }
        
        # Show progress every 5 attempts
        if ($attempt % 5 -eq 0) {
            Write-Host "   ⏳ Kutish... ($attempt/$maxAttempts)" -ForegroundColor Gray
        }
    }
    
    if (-not $started) {
        Write-Host "❌ Backend ishga tushmadi!" -ForegroundColor Red
        $output = Receive-Job -Job $backendJob
        if ($output) {
            Write-Host "Xatoliklar:" -ForegroundColor Red
            $output | Select-Object -Last 20 | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
        }
    }
    
    return $backendJob
}

function Start-Frontend {
    Write-Host "`n🚀 Frontend ishga tushirilmoqda..." -ForegroundColor Green
    Set-Location "c:\Bitiruv malakaviy ishi\Mulkchi\Mulkchi.Frontend"
    
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location "c:\Bitiruv malakaviy ishi\Mulkchi\Mulkchi.Frontend"
        npx ng serve --port 4200 --host 0.0.0.0 2>&1
    }
    
    # Wait for startup
    $maxAttempts = 30
    $attempt = 0
    $started = $false
    
    while ($attempt -lt $maxAttempts -and -not $started) {
        Start-Sleep -Seconds 2
        $attempt++
        
        # Check job output
        $output = Receive-Job -Job $frontendJob 2>&1
        if ($output -match "Compiled successfully" -or $output -match "development server") {
            $started = $true
            Write-Host "✅ Frontend ishga tushdi!" -ForegroundColor Green
        }
        
        # Show progress every 5 attempts
        if ($attempt % 5 -eq 0) {
            Write-Host "   ⏳ Kutish... ($attempt/$maxAttempts)" -ForegroundColor Gray
        }
    }
    
    if (-not $started) {
        Write-Host "❌ Frontend ishga tushmadi!" -ForegroundColor Red
        $output = Receive-Job -Job $frontendJob
        if ($output) {
            Write-Host "Xatoliklar:" -ForegroundColor Red
            $output | Select-Object -Last 20 | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
        }
    }
    
    return $frontendJob
}

function Show-Status {
    Write-Header "SERVIS STATUSI"
    
    $backendRunning = Test-Service -Url "http://localhost:5000/swagger" -Name "Backend"
    $frontendRunning = Test-Service -Url "http://localhost:4200" -Name "Frontend"
    
    if ($backendRunning) {
        Write-Host "✅ Backend:  http://localhost:5000/swagger" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend:  o'chiq" -ForegroundColor Red
    }
    
    if ($frontendRunning) {
        Write-Host "✅ Frontend: http://localhost:4200" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend: o'chiq" -ForegroundColor Red
    }
    
    Write-Host "`n📝 Eslatma: Xatoliklar haqida avtomatik xabar qilaman" -ForegroundColor Yellow
}

function Monitor-Services {
    Write-Header "MONITORING BOSHLANDI"
    Write-Host "Har 5 soniyada tekshiraman..." -ForegroundColor Gray
    Write-Host "Ctrl+C bosib to'xtatishingiz mumkin`n" -ForegroundColor Gray
    
    $errorCount = 0
    $maxErrors = 3
    
    while ($true) {
        Start-Sleep -Seconds 5
        
        $backendRunning = Test-Service -Url "http://localhost:5000/health" -Name "Backend"
        $frontendRunning = Test-Service -Url "http://localhost:4200" -Name "Frontend"
        
        if (-not $backendRunning) {
            $errorCount++
            Write-Host "⚠️  Backend javob bermayapti! ($errorCount/$maxErrors)" -ForegroundColor Red
            
            if ($errorCount -ge $maxErrors) {
                Write-Host "❌ Backend to'xtagan! Qayta ishga tushirilmoqda..." -ForegroundColor Red
                Stop-ExistingServices
                $backendJob = Start-Backend
                $errorCount = 0
            }
        }
        elseif (-not $frontendRunning) {
            Write-Host "⚠️  Frontend javob bermayapti!" -ForegroundColor Yellow
        }
        else {
            if ($errorCount -gt 0) {
                Write-Host "✅ Servislar tiklandi" -ForegroundColor Green
                $errorCount = 0
            }
            
            Write-Host (Get-Date -Format "HH:mm:ss") "✅ Hammasi yaxshi" -ForegroundColor Green
        }
    }
}

# ========== MAIN ==========
Write-Header "MULKCHI DEVELOPMENT SERVER"

# Stop existing
Stop-ExistingServices

# Start services
$backendJob = Start-Backend
Start-Sleep -Seconds 3
$frontendJob = Start-Frontend

# Show initial status
Start-Sleep -Seconds 5
Show-Status

# Monitor if requested
if ($Monitor) {
    Monitor-Services
} else {
    Write-Host "`n💡 Monitoring uchun: .\start-services.ps1 -Monitor" -ForegroundColor Cyan
    Write-Host "   Yoki Ctrl+C bosib to'xtating`n" -ForegroundColor Gray
}
