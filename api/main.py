from time import perf_counter

from fastapi import FastAPI, Request
from fastapi.responses import Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

from api.schemas import ClientData
from api.modelService import predictClient
from api.monitoring import (
    httpRequestsTotal,
    httpRequestDurationSeconds,
)


app = FastAPI(
    title="BankPulse API",
    description="API REST para predecir la contratación de depósitos bancarios.",
    version="1.0.0"
)


@app.middleware("http")
async def monitorRequests(request: Request, call_next):
    startTime = perf_counter()
    method = request.method

    try:
        response = await call_next(request)
        statusCode = response.status_code
    except Exception:
        statusCode = 500
        raise
    finally:
        duration = perf_counter() - startTime

        route = request.scope.get("route")
        endpoint = route.path if route else "unmatched"

        httpRequestsTotal.labels(
            method=method,
            endpoint=endpoint,
            statusCode=str(statusCode)
        ).inc()

        httpRequestDurationSeconds.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)

    return response


@app.get("/")
def getStatus():
    return {
        "application": "BankPulse API",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/metrics", include_in_schema=False)
def getMetrics():
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


@app.post("/predict")
def predict(clientData: ClientData):
    return predictClient(clientData)
