from fastapi.testclient import TestClient

from api.main import app
from api.monitoring import (
    httpRequestsTotal,
    modelPredictionsTotal,
)
from api.schemas import ClientData
from api.modelService import predictClient


client = TestClient(app)


def getCounterValue(counter, **labels):
    return counter.labels(**labels)._value.get()


def testMetricsEndpoint():
    response = client.get("/metrics")

    assert response.status_code == 200
    assert "bankpulse_http_requests_total" in response.text
    assert "bankpulse_http_request_duration_seconds" in response.text
    assert "bankpulse_model_predictions_total" in response.text


def testHttpRequestsCounter():
    labels = {
        "method": "GET",
        "endpoint": "/",
        "statusCode": "200"
    }

    previousValue = getCounterValue(httpRequestsTotal, **labels)

    response = client.get("/")

    currentValue = getCounterValue(httpRequestsTotal, **labels)

    assert response.status_code == 200
    assert currentValue == previousValue + 1


def testModelPredictionsCounter(monkeypatch):
    from api import modelService

    class FakeModel:
        def predict(self, features):
            return [1]

        def predict_proba(self, features):
            import numpy as np
            return np.array([[0.2, 0.8]])

    class FakePreprocessor:
        feature_names_in_ = ["age", "wasPreviouslyContacted"]

        def transform(self, features):
            return features

    monkeypatch.setattr(modelService, "model", FakeModel())
    monkeypatch.setattr(
        modelService,
        "preprocessor",
        FakePreprocessor()
    )

    clientData = ClientData.model_validate({
        "age": 35,
        "job": "admin.",
        "marital": "married",
        "education": "university.degree",
        "default": "no",
        "housing": "yes",
        "loan": "no",
        "contact": "cellular",
        "month": "may",
        "day_of_week": "mon",
        "campaign": 1,
        "pdays": 999,
        "previous": 0,
        "poutcome": "nonexistent",
        "emp.var.rate": 1.1,
        "cons.price.idx": 93.994,
        "cons.conf.idx": -36.4,
        "euribor3m": 4.857,
        "nr.employed": 5191.0
    })

    previousValue = getCounterValue(
        modelPredictionsTotal,
        prediction="1"
    )

    result = predictClient(clientData)

    currentValue = getCounterValue(
        modelPredictionsTotal,
        prediction="1"
    )

    assert result["prediction"] == 1
    assert currentValue == previousValue + 1


def testUnmatchedRouteCounter():
    labels = {
        "method": "GET",
        "endpoint": "unmatched",
        "statusCode": "404"
    }

    previousValue = getCounterValue(httpRequestsTotal, **labels)

    response = client.get("/rutaInexistente")

    currentValue = getCounterValue(httpRequestsTotal, **labels)

    assert response.status_code == 404
    assert currentValue == previousValue + 1
