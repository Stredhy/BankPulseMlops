param(
    [switch]$IncludeAirflow
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $projectRoot "frontend"
$containerName = "bankpulseApiV12"
$imageName = "bankpulse-api:1.2.0"
$wslPath = "C:\Program Files\WSL\wsl.exe"
$distributionName = "Ubuntu"
$airflowStartedBySession = $false

function Test-DockerReady {
    docker info *> $null
    return ($LASTEXITCODE -eq 0)
}

function Start-DockerIfNeeded {
    if (-not (Test-DockerReady)) {
        Write-Host "[BankPulse] Iniciando Docker Desktop..." -ForegroundColor Magenta
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        $deadline = (Get-Date).AddMinutes(2)
        while (-not (Test-DockerReady)) {
            if ((Get-Date) -ge $deadline) {
                throw "Docker Desktop no estuvo listo a tiempo."
            }
            Start-Sleep -Seconds 3
        }
    }
    Write-Host "[BankPulse] Docker Desktop listo." -ForegroundColor Green
}

function Start-BackendContainer {
    $existing = docker ps -a --filter "name=^/${containerName}$" --format "{{.Names}}"
    if ($existing -eq $containerName) {
        Write-Host "[BankPulse] Encendiendo contenedor $containerName..." -ForegroundColor Magenta
        docker start $containerName | Out-Null
    }
    else {
        Write-Host "[BankPulse] Creando contenedor $containerName..." -ForegroundColor Magenta
        docker run -d --name $containerName -p 8000:8000 `
            --add-host=host.docker.internal:host-gateway `
            -v "${projectRoot}\mlflow.db:/app/mlflow.db" `
            -v "${projectRoot}\data:/app/data:ro" `
            -v "${projectRoot}\scripts:/app/scripts:ro" `
            -v "${projectRoot}\.github:/app/.github:ro" `
            $imageName | Out-Null
    }
}

function Start-AirflowSessionIfRequested {
    if (-not $IncludeAirflow) { return }

    & $wslPath -d $distributionName -- pgrep -f "[a]irflow standalone" *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[BankPulse] Airflow ya estaba activo en WSL." -ForegroundColor Yellow
        return
    }

    Write-Host "[BankPulse] Iniciando Airflow en WSL Ubuntu..." -ForegroundColor Magenta
    $bashCmd = "nohup env PATH=/home/mimoe/airflowEnvironment/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin AIRFLOW_HOME=/home/mimoe/airflowHome /home/mimoe/airflowEnvironment/bin/airflow standalone > /home/mimoe/airflowHome/dashboardAirflow.log 2>&1 & echo `$! > /home/mimoe/airflowHome/dashboardAirflow.pid"
    & $wslPath -d $distributionName -- bash -lc $bashCmd
    $script:airflowStartedBySession = $true
}

try {
    Start-DockerIfNeeded
    Start-BackendContainer
    Start-AirflowSessionIfRequested

    Write-Host "[BankPulse] Iniciando dashboard en http://localhost:5173/ (Ctrl+C para cerrar todo)..." -ForegroundColor Cyan
    Push-Location $frontendPath
    try {
        npm run dev
    }
    finally {
        Pop-Location
    }
}
finally {
    Write-Host "`n[BankPulse] Cerrando servicios de la sesión..." -ForegroundColor Magenta

    if (Test-DockerReady) {
        docker stop $containerName *> $null
        Write-Host "[BankPulse] Contenedor $containerName detenido." -ForegroundColor Green
    }

    if ($airflowStartedBySession) {
        & $wslPath -d $distributionName -- bash -lc 'if [ -f /home/mimoe/airflowHome/dashboardAirflow.pid ]; then kill -TERM $(cat /home/mimoe/airflowHome/dashboardAirflow.pid) 2>/dev/null || true; rm -f /home/mimoe/airflowHome/dashboardAirflow.pid; fi'
        Write-Host "[BankPulse] Airflow detenido en WSL." -ForegroundColor Green
    }
}
