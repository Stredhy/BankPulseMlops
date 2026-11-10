from fastapi import FastAPI

from api.schemas import ClientData
from api.modelService import predictClient


app = FastAPI(
    title="BankPulse API",
    description="API REST para predecir la contratación de depósitos bancarios.",
    version="1.0.0"
)


@app.get("/")
def getStatus():
    return {
        "application": "BankPulse API",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/predict")
def predict(clientData: ClientData):
    return predictClient(clientData)