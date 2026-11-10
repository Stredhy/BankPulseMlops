import pytest

from fastapi.testclient import TestClient

from api.main import app
from src.dataProcessing import loadData


client = TestClient(app)


@pytest.fixture
def validClientData():
    dataFrame = loadData()

    return dataFrame.drop(
        columns=["y", "duration"]
    ).iloc[0].to_dict()


def testGetStatus():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "running"
    assert response.json()["application"] == "BankPulse API"


def testValidPrediction(validClientData):
    response = client.post(
        "/predict",
        json=validClientData
    )

    assert response.status_code == 200

    result = response.json()

    assert result["prediction"] in [0, 1]
    assert 0 <= result["probability"] <= 1
    assert result["willSubscribe"] == bool(
        result["prediction"]
    )


def testMissingFields():
    response = client.post(
        "/predict",
        json={"age": 35}
    )

    assert response.status_code == 422


def testInvalidAge(validClientData):
    validClientData["age"] = -5

    response = client.post(
        "/predict",
        json=validClientData
    )

    assert response.status_code == 422


def testInvalidContact(validClientData):
    validClientData["contact"] = "invalidContact"

    response = client.post(
        "/predict",
        json=validClientData
    )

    assert response.status_code == 422


def testUnexpectedField(validClientData):
    validClientData["unexpectedField"] = "invalid"

    response = client.post(
        "/predict",
        json=validClientData
    )

    assert response.status_code == 422