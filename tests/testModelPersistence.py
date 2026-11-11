import numpy as np
import pytest

from sklearn.linear_model import LogisticRegression
from sklearn.compose import ColumnTransformer

import src.modelPersistence as modelPersistence

from src.dataProcessing import (
    loadData,
    cleanData,
    prepareFeatures,
    splitData,
    transformData,
)
from src.modelTraining import trainModel


@pytest.fixture(scope="module")
def persistenceData():
    dataFrame = loadData()
    cleanedData = cleanData(dataFrame)

    features, target = prepareFeatures(cleanedData)

    xTrain, xTest, yTrain, _ = splitData(
        features, target
    )

    xTrainTransformed, _, preprocessor = transformData(
        xTrain, xTest
    )

    model = trainModel(xTrainTransformed, yTrain)

    return model, preprocessor, xTest


@pytest.fixture
def isolatedModels(tmp_path, monkeypatch):
    originalPath = modelPersistence.Path

    def temporaryPath(*args, **kwargs):
        path = originalPath(*args, **kwargs)

        if path.name == "models":
            return tmp_path

        return path

    monkeypatch.setattr(
        modelPersistence,
        "Path",
        temporaryPath
    )


def testSaveModel(persistenceData, isolatedModels):
    model, preprocessor, _ = persistenceData

    modelPath, preprocessorPath = modelPersistence.saveModel(
        model, preprocessor
    )

    assert modelPath.is_file()
    assert preprocessorPath.is_file()


def testLoadModel(persistenceData, isolatedModels):
    model, preprocessor, _ = persistenceData

    modelPersistence.saveModel(model, preprocessor)

    loadedModel, loadedPreprocessor = modelPersistence.loadModel()

    assert isinstance(loadedModel, LogisticRegression)
    assert isinstance(loadedPreprocessor, ColumnTransformer)


def testPersistedPredictions(persistenceData, isolatedModels):
    model, preprocessor, xTest = persistenceData

    originalPredictions = model.predict(
        preprocessor.transform(xTest)
    )

    modelPersistence.saveModel(model, preprocessor)
    loadedModel, loadedPreprocessor = modelPersistence.loadModel()

    loadedPredictions = loadedModel.predict(
        loadedPreprocessor.transform(xTest)
    )

    assert np.array_equal(
        originalPredictions,
        loadedPredictions
    )


def testPersistedProbabilities(persistenceData, isolatedModels):
    model, preprocessor, xTest = persistenceData

    originalProbabilities = model.predict_proba(
        preprocessor.transform(xTest)
    )

    modelPersistence.saveModel(model, preprocessor)
    loadedModel, loadedPreprocessor = modelPersistence.loadModel()

    loadedProbabilities = loadedModel.predict_proba(
        loadedPreprocessor.transform(xTest)
    )

    np.testing.assert_allclose(
        originalProbabilities,
        loadedProbabilities
    )
