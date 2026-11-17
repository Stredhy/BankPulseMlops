import socket
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from prometheus_client import REGISTRY

from src.dataDrift import compareDataDrift
from src.dataProcessing import cleanData


projectRoot = Path(__file__).resolve().parent.parent


def getPrometheusMetrics():
    totalRequests = 0
    requestsByEndpoint = {}
    predictionsByClass = {"0": 0, "1": 0}
    durationSum = 0.0
    durationCount = 0.0

    for metric in REGISTRY.collect():
        if metric.name == "bankpulse_http_requests":
            for sample in metric.samples:
                if sample.name == "bankpulse_http_requests_total":
                    value = int(sample.value)
                    totalRequests += value
                    endpoint = sample.labels.get("endpoint", "unknown")
                    requestsByEndpoint[endpoint] = (
                        requestsByEndpoint.get(endpoint, 0) + value
                    )

        elif metric.name == "bankpulse_model_predictions":
            for sample in metric.samples:
                if sample.name == "bankpulse_model_predictions_total":
                    label = sample.labels.get("prediction")
                    if label in predictionsByClass:
                        predictionsByClass[label] += int(sample.value)

        elif metric.name == "bankpulse_http_request_duration_seconds":
            for sample in metric.samples:
                if sample.name == "bankpulse_http_request_duration_seconds_sum":
                    durationSum += float(sample.value)
                elif sample.name == "bankpulse_http_request_duration_seconds_count":
                    durationCount += float(sample.value)

    avgLatencyMs = (
        round((durationSum / durationCount) * 1000, 2)
        if durationCount > 0
        else None
    )

    return {
        "totalRequests": totalRequests,
        "requestsByEndpoint": requestsByEndpoint,
        "predictionsByClass": predictionsByClass,
        "totalPredictions": predictionsByClass["0"] + predictionsByClass["1"],
        "avgLatencyMs": avgLatencyMs,
    }


def getMlflowHistory():
    databasePath = projectRoot / "mlflow.db"
    if not databasePath.exists():
        return {
            "available": False,
            "reason": "Archivo mlflow.db no encontrado en el entorno actual.",
            "experimentName": "BankPulseModelTraining",
            "runs": [],
        }

    try:
        connection = sqlite3.connect(databasePath)
        connection.row_factory = sqlite3.Row
        cursor = connection.cursor()

        experimentRow = cursor.execute(
            "SELECT experiment_id, name FROM experiments WHERE name = ?",
            ("BankPulseModelTraining",),
        ).fetchone()

        if not experimentRow:
            connection.close()
            return {
                "available": True,
                "reason": "Experimento BankPulseModelTraining sin ejecuciones registradas.",
                "experimentName": "BankPulseModelTraining",
                "runs": [],
            }

        runRows = cursor.execute(
            """
            SELECT run_uuid, name, status, start_time, end_time
            FROM runs
            WHERE experiment_id = ? AND lifecycle_stage = 'active'
            ORDER BY start_time ASC
            """,
            (experimentRow["experiment_id"],),
        ).fetchall()

        runs = []
        for index, runRow in enumerate(runRows, start=1):
            metricRows = cursor.execute(
                "SELECT key, value FROM metrics WHERE run_uuid = ?",
                (runRow["run_uuid"],),
            ).fetchall()
            metricsMap = {row["key"]: round(float(row["value"]), 4) for row in metricRows}

            paramRows = cursor.execute(
                "SELECT key, value FROM params WHERE run_uuid = ?",
                (runRow["run_uuid"],),
            ).fetchall()
            paramsMap = {row["key"]: row["value"] for row in paramRows}

            startIso = (
                datetime.fromtimestamp(
                    runRow["start_time"] / 1000, tz=timezone.utc
                ).isoformat()
                if runRow["start_time"]
                else None
            )

            runs.append(
                {
                    "runIndex": index,
                    "runId": runRow["run_uuid"][:8],
                    "runName": runRow["name"] or f"Run #{index}",
                    "status": runRow["status"],
                    "startTime": startIso,
                    "metrics": metricsMap,
                    "params": paramsMap,
                }
            )

        connection.close()
        return {
            "available": True,
            "reason": None if runs else "Sin ejecuciones activas en MLflow.",
            "experimentName": experimentRow["name"],
            "runs": runs,
        }
    except Exception as error:
        return {
            "available": False,
            "reason": f"Error leyendo mlflow.db: {error}",
            "experimentName": "BankPulseModelTraining",
            "runs": [],
        }


def getDataAndDriftStatus():
    referencePath = projectRoot / "data" / "reference" / "trainingReference.csv"
    rawPath = projectRoot / "data" / "raw" / "data.csv"
    dvcFilePath = projectRoot / "data" / "raw" / "data.csv.dvc"

    if not referencePath.exists() or not rawPath.exists():
        return {
            "available": False,
            "reason": "Datasets de referencia o actuales no disponibles en este entorno.",
            "dvcTracked": dvcFilePath.exists(),
            "referenceRows": None,
            "currentRows": None,
            "drift": None,
        }

    try:
        referenceData = pd.read_csv(referencePath)
        currentData = cleanData(pd.read_csv(rawPath, sep=';'))
        driftSummary = compareDataDrift(
            currentData=currentData,
            referencePath=referencePath,
        )

        return {
            "available": True,
            "reason": None,
            "dvcTracked": dvcFilePath.exists(),
            "referenceRows": int(len(referenceData)),
            "currentRows": int(len(currentData)),
            "drift": driftSummary,
        }
    except Exception as error:
        return {
            "available": False,
            "reason": f"No se pudo calcular el drift: {error}",
            "dvcTracked": dvcFilePath.exists(),
            "referenceRows": None,
            "currentRows": None,
            "drift": None,
        }


def getAirflowStatus():
    connected = False
    for host in ("127.0.0.1", "host.docker.internal"):
        try:
            with socket.create_connection((host, 8080), timeout=0.25):
                connected = True
                break
        except OSError:
            continue

    logPath = projectRoot / "scripts" / "airflowAutoStartup.log"
    recentLogs = []
    if logPath.exists():
        lines = logPath.read_text(encoding="utf-8", errors="ignore").splitlines()
        recentLogs = lines[-5:]

    return {
        "connected": connected,
        "dagId": "bankPulsePipeline",
        "schedule": "0 20 1 * * (America/Mexico_City)",
        "recentLogs": recentLogs,
    }


def getModelArtifactInfo():
    modelPath = projectRoot / "models" / "model.joblib"
    preprocessorPath = projectRoot / "models" / "preprocessor.joblib"
    ciPath = projectRoot / ".github" / "workflows" / "ci.yml"

    modelUpdatedAt = (
        datetime.fromtimestamp(
            modelPath.stat().st_mtime, tz=timezone.utc
        ).isoformat()
        if modelPath.exists()
        else None
    )

    return {
        "modelReady": modelPath.exists() and preprocessorPath.exists(),
        "modelSizeKb": round(modelPath.stat().st_size / 1024, 1)
        if modelPath.exists()
        else None,
        "modelUpdatedAt": modelUpdatedAt,
        "ciWorkflowConfigured": ciPath.exists(),
    }


def getDashboardSummary():
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "api": {
            "connected": True,
            "version": "1.1.0",
            "metrics": getPrometheusMetrics(),
        },
        "mlflow": getMlflowHistory(),
        "dataMonitoring": getDataAndDriftStatus(),
        "airflow": getAirflowStatus(),
        "artifacts": getModelArtifactInfo(),
    }

