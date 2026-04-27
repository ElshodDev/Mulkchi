# Test connection string reading
$jsonPath = "c:\Bitiruv malakaviy ishi\Mulkchi\Mulkchi.Api\appsettings.json"
$devJsonPath = "c:\Bitiruv malakaviy ishi\Mulkchi\Mulkchi.Api\appsettings.Development.json"

Write-Host "=== appsettings.json ===" -ForegroundColor Cyan
if (Test-Path $jsonPath) {
    $content = Get-Content $jsonPath -Raw
    $json = $content | ConvertFrom-Json
    Write-Host "ConnectionString: $($json.ConnectionStrings.DefaultConnection)" -ForegroundColor Green
} else {
    Write-Host "File not found!" -ForegroundColor Red
}

Write-Host "`n=== appsettings.Development.json ===" -ForegroundColor Cyan
if (Test-Path $devJsonPath) {
    $content = Get-Content $devJsonPath -Raw
    $json = $content | ConvertFrom-Json
    if ($json.ConnectionStrings.DefaultConnection) {
        Write-Host "ConnectionString: $($json.ConnectionStrings.DefaultConnection)" -ForegroundColor Yellow
    } else {
        Write-Host "ConnectionString: (not set)" -ForegroundColor Green
    }
} else {
    Write-Host "File not found" -ForegroundColor Red
}

Write-Host "`n=== Environment Variable ===" -ForegroundColor Cyan
$envVar = $env:ConnectionStrings__DefaultConnection
if ($envVar) {
    Write-Host "ENV ConnectionStrings__DefaultConnection: $envVar" -ForegroundColor Red
} else {
    Write-Host "ENV ConnectionStrings__DefaultConnection: (not set)" -ForegroundColor Green
}
