
import numpy as np
import pytest

from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

from src.dataProcessing import (
    loadData,
    cleanData,
    prepareFeatures,
    splitData,
    transformData,
)

from src.modelTraining import trainModel, evaluateModel


@pytest.fixture(scope="module")
def modelData():
    dataFrame = loadData()
    cleanedData = cleanData(dataFrame)

    features, target = prepareFeatures(cleanedData)

    xTrain, xTest, yTrain, yTest = splitData(
        features, target
    )

    xTrainTransformed, xTestTransformed, _ = transformData(
        xTrain, xTest
    )

    return (
        xTrainTransformed,
        xTestTransformed,
        yTrain,
        yTest,
    )


@pytest.fixture(scope="module")
def trainedModel(modelData):
    xTrain, _, yTrain, _ = modelData
    return trainModel(xTrain, yTrain)


def testTrainModel(trainedModel):
    assert isinstance(trainedModel, LogisticRegression)
    assert hasattr(trainedModel, "coef_")
    assert hasattr(trainedModel, "classes_")


def testModelPredictions(trainedModel, modelData):
    _, xTest, _, yTest = modelData

    predictions = trainedModel.predict(xTest)

    assert len(predictions) == len(yTest)
    assert set(np.unique(predictions)).issubset({0, 1})


def testModelProbabilities(trainedModel, modelData):
    _, xTest, _, _ = modelData

    probabilities = trainedModel.predict_proba(xTest)

    assert probabilities.shape == (len(xTest), 2)
    assert np.all(probabilities >= 0)
    assert np.all(probabilities <= 1)
    assert np.allclose(probabilities.sum(axis=1), 1)


def testModelAccuracy(trainedModel, modelData):
    _, xTest, _, yTest = modelData

    predictions = trainedModel.predict(xTest)
    accuracy = accuracy_score(yTest, predictions)

    assert 0 <= accuracy <= 1
    assert accuracy > 0.75


def testEvaluateModel(trainedModel, modelData, capsys):
    _, xTest, _, yTest = modelData

    evaluateModel(trainedModel, xTest, yTest)

    capturedOutput = capsys.readouterr().out

    assert "Accuracy:" in capturedOutput
    assert "ROC-AUC:" in capturedOutput
    assert "Average Precision:" in capturedOutput
    assert "Matriz de confusión:" in capturedOutput
    assert "Reporte de clasificación:" in capturedOutput
