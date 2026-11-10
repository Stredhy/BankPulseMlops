param([datetime]$testDate)

$ErrorActionPreference = "Stop"

$wslPath = "C:\Program Files\WSL\wsl.exe"
$distributionName = "Ubuntu"
$logPath = Join-Path $PSScriptRoot "airflowAutoStartup.log"
$dagId = "bankPulsePipeline"
$airflowStartedByScript = $false
$airflowProcess = $null
$airflowLinuxPid = $null
$runCompleted = $false
$executionFailed = $false
$maxWaitMinutes = 180

function Write-Log {
    param([string]$message)

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $message"
    Write-Host $logEntry
    Add-Content -Path $logPath -Value $logEntry
}

function Invoke-AirflowCommand {
    param([string]$command)

    $commandParts = $command.Split(" ", [StringSplitOptions]::RemoveEmptyEntries)
    $result = & $wslPath -d $distributionName -- env AIRFLOW_HOME=/home/mimoe/airflowHome /home/mimoe/airflowEnvironment/bin/airflow @commandParts 2>$null

    if ($LASTEXITCODE -ne 0) {
        throw "Error ejecutando Airflow: $result"
    }

    return $result
}

function Test-AirflowRunning {
    & $wslPath -d $distributionName -- pgrep -f "[a]irflow standalone" 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}

function Test-AirflowReady {
    try {
        $client = [System.Net.Sockets.TcpClient]::new()
        $result = $client.BeginConnect("127.0.0.1", 8080, $null, $null)
        $connected = $result.AsyncWaitHandle.WaitOne(2000)

        if ($connected) {
            $client.EndConnect($result)
        }

        $client.Close()
        return $connected
    }
    catch {
        return $false
    }
}

function Test-SchedulerHealthy {
    try {
        Invoke-AirflowCommand 'jobs check --job-type SchedulerJob' | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Start-Airflow {
    Write-Log "Iniciando Airflow..."

    & $wslPath -d $distributionName -- rm -f /home/mimoe/airflowHome/bankPulseStandalone.pid
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo limpiar el archivo PID anterior."
    }

    $bashCommand = 'echo $$ > /home/mimoe/airflowHome/bankPulseStandalone.pid; exec env PATH=/home/mimoe/airflowEnvironment/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin AIRFLOW_HOME=/home/mimoe/airflowHome /home/mimoe/airflowEnvironment/bin/airflow standalone'

    $script:airflowProcess = Start-Process `
        -FilePath $wslPath `
        -ArgumentList @("-d", $distributionName, "--", "bash", "-lc", "`"$bashCommand`"") `
        -WindowStyle Hidden `
        -PassThru
    $script:airflowStartedByScript = $true

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        $script:airflowLinuxPid = (& $wslPath -d $distributionName -- cat /home/mimoe/airflowHome/bankPulseStandalone.pid 2>$null | Select-Object -First 1)

        if ($script:airflowLinuxPid -match '^\d+$') {
            $processCommand = & $wslPath -d $distributionName -- ps -p $script:airflowLinuxPid -o args=

            if ($LASTEXITCODE -eq 0 -and $processCommand -match '/airflow standalone$') {
                break
            }
        }

        $script:airflowLinuxPid = $null

        Start-Sleep -Seconds 2
    }

    if (-not $script:airflowLinuxPid) {
        throw "No se pudo identificar el PID de Airflow despues de 60 segundos."
    }
    Write-Log "Airflow iniciado. PID Linux: $script:airflowLinuxPid"
}

function Get-MonthlyRun {
    $json = Invoke-AirflowCommand "dags list-runs $dagId --output json"
    $runs = @($json | ConvertFrom-Json -DateKind String)

    $targetDate = if ($null -ne $testDate -and $testDate -ne [datetime]::MinValue) { $testDate.Date } else { (Get-Date).Date }
    $mexicoTimeZone = [TimeZoneInfo]::FindSystemTimeZoneById("Central Standard Time (Mexico)")

    foreach ($run in $runs) {
        if ($run.run_id -notlike "scheduled__*") {
            continue
        }

        $runDate = [TimeZoneInfo]::ConvertTime(
            [DateTimeOffset]::Parse($run.run_after),
            $mexicoTimeZone
        )

        if ($runDate.Date -eq $targetDate -and $runDate.Hour -eq 20) {
            return $run
        }
    }

    return $null
}

try {
    Write-Log "Iniciando automatizacion mensual."

    $now = Get-Date

    if (-not $PSBoundParameters.ContainsKey("testDate") -and $now.Day -ne 1) {
        throw "La automatizacion solo debe ejecutarse el primer dia del mes."
    }

    if (Test-AirflowRunning) {
        throw "Airflow ya estaba iniciado. No se modificara la instancia existente."
    }

    Start-Airflow

    $deadline = (Get-Date).AddMinutes($maxWaitMinutes)

    while (-not (Test-AirflowReady) -or -not (Test-SchedulerHealthy)) {
        if ((Get-Date) -ge $deadline) {
            throw "Airflow no alcanzo un estado saludable."
        }

        Start-Sleep -Seconds 15
    }

    Write-Log "Airflow y scheduler disponibles."

    while ((Get-Date) -lt $deadline) {
        $run = Get-MonthlyRun

        if ($null -ne $run) {
            Write-Log "Estado del DAG: $($run.state)"

            if ($run.state -in @("success", "failed")) {
                Write-Log "Ejecucion mensual finalizada: $($run.state)"
                $runCompleted = $true

                if ($run.state -eq "failed") {
                    $executionFailed = $true
                    Write-Log "ERROR: El DAG mensual termino con estado failed."
                }

                break
            }
        }

        Start-Sleep -Seconds 30
    }

    if (-not $runCompleted) {
        throw "Tiempo maximo de espera alcanzado."
    }
}
catch {
    $executionFailed = $true
    Write-Log "ERROR: $($_.Exception.Message)"
}
finally {
    if ($airflowStartedByScript) {
        Write-Log "Solicitando apagado de Airflow..."

        if ($airflowLinuxPid) {
            if ($runCompleted) {
                $processCommand = & $wslPath -d $distributionName -- ps -p $airflowLinuxPid -o args=

                if ($LASTEXITCODE -eq 0 -and $processCommand -match '/airflow standalone$') {
                    & $wslPath -d $distributionName -- kill -TERM $airflowLinuxPid

                    if ($LASTEXITCODE -ne 0) {
                        throw "No se pudo solicitar el apagado de Airflow."
                    }

                    Write-Log "Se solicito el cierre del proceso principal de Airflow."
                }
                else {
                    Write-Log "No se detuvo ningun proceso: el PID ya no corresponde a Airflow."
                }

                & $wslPath -d $distributionName -- rm -f /home/mimoe/airflowHome/bankPulseStandalone.pid
            }
            else {
                Write-Log "Airflow permanece activo para evitar interrumpir una ejecucion pendiente."
            }
        }

        Write-Log "Automatizacion finalizada."
    }
}

if ($executionFailed) { exit 1 }



















