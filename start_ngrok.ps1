# Start ngrok and save output
$ngrokProcess = Start-Process ngrok -ArgumentList "http", "5000", "--log=stdout" -RedirectStandardOutput "ngrok_output.txt" -PassThru

# Wait for ngrok to start
Start-Sleep -Seconds 5

# Get the tunnels
$tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get
$tunnels.tunnels | ForEach-Object { $_.public_url }
