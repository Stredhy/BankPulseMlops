param(
    [switch]$SkipDockerShutdown
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $projectRoot "frontend"
$venvMlflow = Join-Path $projectRoot ".venv\Scripts\mlflow.exe"
$containerName = "bankpulseApi"
$imageName = "bankpulse-api:1.2.0"
$mlflowProcess = $null
$airflowStarted = $false

function Test-DockerReady {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        return $false
    }
    docker info *> $null
    return ($LASTEXITCODE -eq 0)
}

function Start-DockerIfNeeded {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker CLI no esta instalado o no se encuentra en el PATH."
    }

    if (-not (Test-DockerReady)) {
        $dockerDesktopPaths = @(
            (Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"),
            (Join-Path $env:LocalAppData "Docker\Docker Desktop.exe")
        )
        $dockerExe = $dockerDesktopPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

        if (-not $dockerExe) {
            throw "Docker no esta en ejecucion y no se encontro Docker Desktop. Inicia Docker manualmente e intenta de nuevo."
        }

        Write-Host "[BankPulse] 1/4 Iniciando Docker Desktop..." -ForegroundColor Magenta
        Start-Process $dockerExe
        $deadline = (Get-Date).AddMinutes(2)
        while (-not (Test-DockerReady)) {
            if ((Get-Date) -ge $deadline) {
                throw "Docker Desktop no estuvo listo a tiempo."
            }
            Start-Sleep -Seconds 3
        }
    }
    Write-Host "[BankPulse] 1/4 Docker listo." -ForegroundColor Green
}

function Start-BackendContainer {
    $imageExists = docker images -q $imageName
    if (-not $imageExists) {
        Write-Host "[BankPulse] Construyendo imagen $imageName por primera vez..." -ForegroundColor Yellow
        docker build -t $imageName $projectRoot
    }

    $existing = docker ps -a --filter "name=^/${containerName}$" --format "{{.Names}}"
    if ($existing -eq $containerName) {
        Write-Host "[BankPulse] 2/4 Encendiendo API FastAPI ($containerName en :8000)..." -ForegroundColor Magenta
        docker start $containerName | Out-Null
    }
    else {
        Write-Host "[BankPulse] 2/4 Creando API FastAPI ($containerName en :8000)..." -ForegroundColor Magenta
        $runArgs = @("run", "-d", "--name", $containerName, "-p", "8000:8000", "--add-host=host.docker.internal:host-gateway")

        $mlflowDb = Join-Path $projectRoot "mlflow.db"
        $dataDir = Join-Path $projectRoot "data"
        $scriptsDir = Join-Path $projectRoot "scripts"
        $githubDir = Join-Path $projectRoot ".github"

        if (Test-Path $mlflowDb) { $runArgs += @("-v", "${mlflowDb}:/app/mlflow.db") }
        if (Test-Path $dataDir) { $runArgs += @("-v", "${dataDir}:/app/data:ro") }
        if (Test-Path $scriptsDir) { $runArgs += @("-v", "${scriptsDir}:/app/scripts:ro") }
        if (Test-Path $githubDir) { $runArgs += @("-v", "${githubDir}:/app/.github:ro") }

        $runArgs += $imageName
        & docker @runArgs | Out-Null
    }
}

function Start-AirflowIfAvailable {
    $wslCmd = Get-Command wsl.exe -ErrorAction SilentlyContinue
    if (-not $wslCmd) {
        Write-Host "[BankPulse] 3/4 WSL no disponible; omitiendo Apache Airflow local." -ForegroundColor Yellow
        return
    }

    $checkCmd = 'export PATH="$HOME/airflowEnvironment/bin:$HOME/.local/bin:$PATH"; command -v airflow >/dev/null 2>&1'
    & $wslCmd.Source -- bash -lc $checkCmd *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[BankPulse] 3/4 Airflow no detectado en WSL; omitiendo inicio automatico." -ForegroundColor Yellow
        return
    }

    & $wslCmd.Source -- pgrep -f "[a]irflow standalone" *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[BankPulse] 3/4 Apache Airflow ya estaba activo en WSL (:8080)." -ForegroundColor Green
        return
    }

    Write-Host "[BankPulse] 3/4 Iniciando Apache Airflow en WSL (:8080)..." -ForegroundColor Magenta
    $startCmd = 'export PATH="$HOME/airflowEnvironment/bin:$HOME/.local/bin:$PATH"; export AIRFLOW_HOME="${AIRFLOW_HOME:-$HOME/airflowHome}"; mkdir -p "$AIRFLOW_HOME"; nohup airflow standalone > "$AIRFLOW_HOME/dashboardAirflow.log" 2>&1 & echo $! > "$AIRFLOW_HOME/dashboardAirflow.pid"'
    & $wslCmd.Source -- bash -lc $startCmd
    $script:airflowStarted = $true
}

function Start-MlflowUiIfAvailable {
    $mlflowCmd = $null
    if (Test-Path $venvMlflow) {
        $mlflowCmd = $venvMlflow
    }
    else {
        $globalMlflow = Get-Command mlflow -ErrorAction SilentlyContinue
        if ($globalMlflow) { $mlflowCmd = $globalMlflow.Source }
    }

    if (-not $mlflowCmd) {
        Write-Host "[BankPulse] 4/4 MLflow CLI no encontrado; omitiendo UI nativa (:5000)." -ForegroundColor Yellow
        return
    }

    Write-Host "[BankPulse] 4/4 Iniciando interfaz MLflow (:5000)..." -ForegroundColor Magenta
    $script:mlflowProcess = Start-Process -FilePath $mlflowCmd `
        -ArgumentList "ui", "--backend-store-uri", "sqlite:///mlflow.db", "--port", "5000" `
        -WorkingDirectory $projectRoot `
        -WindowStyle Hidden `
        -PassThru
}

try {
    Start-DockerIfNeeded
    Start-BackendContainer
    Start-AirflowIfAvailable
    Start-MlflowUiIfAvailable

    if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
        Write-Host "[BankPulse] Instalando dependencias del frontend (npm install)..." -ForegroundColor Yellow
        npm --prefix $frontendPath install
    }

    Write-Host "`n============================================================" -ForegroundColor DarkMagenta
    Write-Host "  BankPulse MLOps Activo" -ForegroundColor White
    Write-Host "  - Dashboard Web : http://localhost:5173/" -ForegroundColor Cyan
    Write-Host "  - FastAPI Docs  : http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "  - MLflow UI     : http://127.0.0.1:5000/" -ForegroundColor Cyan
    Write-Host "  - Airflow UI    : http://localhost:8080/" -ForegroundColor Cyan
    Write-Host "  Presiona Ctrl + C para apagar TODOS los servicios." -ForegroundColor Yellow
    Write-Host "============================================================`n" -ForegroundColor DarkMagenta

    Start-Process "http://localhost:5173/"

    Push-Location $frontendPath
    try {
        npm run dev
    }
    finally {
        Pop-Location
    }
}
finally {
    Write-Host "`n[BankPulse] Apagando todo el ecosistema..." -ForegroundColor Magenta

    if ($mlflowProcess -and -not $mlflowProcess.HasExited) {
        Stop-Process -Id $mlflowProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "[BankPulse] MLflow UI detenido." -ForegroundColor Green
    }

    if (Test-DockerReady) {
        docker stop $containerName *> $null
        Write-Host "[BankPulse] Contenedor $containerName detenido." -ForegroundColor Green
    }

    $wslCmd = Get-Command wsl.exe -ErrorAction SilentlyContinue
    if ($wslCmd) {
        if ($airflowStarted) {
            $stopCmd = 'export AIRFLOW_HOME="${AIRFLOW_HOME:-$HOME/airflowHome}"; if [ -f "$AIRFLOW_HOME/dashboardAirflow.pid" ]; then kill -TERM $(cat "$AIRFLOW_HOME/dashboardAirflow.pid") 2>/dev/null || true; rm -f "$AIRFLOW_HOME/dashboardAirflow.pid"; fi; pkill -f "airflow" 2>/dev/null || true'
            & $wslCmd.Source -- bash -lc $stopCmd *> $null
            Write-Host "[BankPulse] Airflow detenido en WSL." -ForegroundColor Green
        }

        if (-not $SkipDockerShutdown) {
            & $wslCmd.Source --shutdown *> $null
            Write-Host "[BankPulse] WSL apagado." -ForegroundColor Green
        }
    }

    if (-not $SkipDockerShutdown) {
        Get-Process -Name "Docker Desktop", "com.docker.backend", "com.docker.proxy", "vpnkit" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "[BankPulse] Docker Desktop cerrado por completo." -ForegroundColor Green
    }
}
