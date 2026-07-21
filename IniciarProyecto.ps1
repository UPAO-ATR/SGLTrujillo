$ErrorActionPreference = "Stop"
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'npm --prefix Servidor run desarrollo'
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'npm --prefix Cliente run desarrollo'
Write-Host "Servidor y cliente iniciados. Abre http://localhost:5173"
