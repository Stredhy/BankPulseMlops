
import numpy as np
import pytest

from sklearn.linear_model import LogisticRegression
from sklearn.compose import ColumnTransformer

from src.dataProcessing import (
    loadData,
    cleanData,
    prepareFeatures,
    splitData,
    transformData,
)

from src.modelTraining import trainModel
from src.modelPersistence import saveModel, loadModel


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


def testSaveModel(persistenceData):
    model, preprocessor, _ = persistenceData

    modelPath, preprocessorPath = saveModel(
        model, preprocessor
    )

    assert modelPath.is_file()
    assert preprocessorPath.is_file()


def testLoadModel(persistenceData):
    model, preprocessor, _ = persistenceData

    saveModel(model, preprocessor)

    loadedModel, loadedPreprocessor = loadModel()

    assert isinstance(loadedModel, LogisticRegression)
    assert isinstance(loadedPreprocessor, ColumnTransformer)


def testPersistedPredictions(persistenceData):
    model, preprocessor, xTest = persistenceData

    originalPredictions = model.predict(
        preprocessor.transform(xTest)
    )

    saveModel(model, preprocessor)
    loadedModel, loadedPreprocessor = loadModel()

    loadedPredictions = loadedModel.predict(
        loadedPreprocessor.transform(xTest)
    )

    assert np.array_equal(
        originalPredictions,
        loadedPredictions
    )


def testPersistedProbabilities(persistenceData):
    model, preprocessor, xTest = persistenceData

    originalProbabilities = model.predict_proba(
        preprocessor.transform(xTest)
    )

    saveModel(model, preprocessor)
    loadedModel, loadedPreprocessor = loadModel()

    loadedProbabilities = loadedModel.predict_proba(
        loadedPreprocessor.transform(xTest)
    )

    np.testing.assert_allclose(
        originalProbabilities,
        loadedProbabilities
    )
