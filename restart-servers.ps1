# PowerShell script to restart both backend and frontend servers
# Usage: .\restart-servers.ps1

Write-Host "Stopping existing servers..." -ForegroundColor Yellow

# Kill processes on port 8000 (backend)
$backend = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($backend) {
    $backendPID = $backend.OwningProcess | Select-Object -Unique
    foreach ($processId in $backendPID) {
        Write-Host "Stopping backend process (PID: $processId)" -ForegroundColor Yellow
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

# Kill processes on port 5173 (frontend)
$frontend = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontend) {
    $frontendPID = $frontend.OwningProcess | Select-Object -Unique
    foreach ($processId in $frontendPID) {
        Write-Host "Stopping frontend process (PID: $processId)" -ForegroundColor Yellow
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2

Write-Host "Starting backend server on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python start_api.py --port 5000 --api-port 8000"

Start-Sleep -Seconds 3

Write-Host "Starting frontend server on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "Servers started!" -ForegroundColor Green
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in each terminal window to stop the servers" -ForegroundColor Yellow
