
import numpy as np

from src.dataProcessing import (
    loadData,
    cleanData,
    prepareFeatures,
    splitData,
    transformData,
)


def testLoadData():
    dataFrame = loadData()

    assert dataFrame.shape == (41188, 21)
    assert "y" in dataFrame.columns


def testCleanData():
    dataFrame = loadData()
    cleanedData = cleanData(dataFrame)

    assert len(cleanedData) == len(dataFrame)
    assert "wasPreviouslyContacted" in cleanedData.columns
    assert (cleanedData["pdays"] == 999).sum() == 0
    assert (dataFrame["pdays"] == 999).sum() == 39673


def testPrepareFeatures():
    dataFrame = cleanData(loadData())
    features, target = prepareFeatures(dataFrame)

    assert "y" not in features.columns
    assert "duration" not in features.columns
    assert features.shape == (41188, 20)
    assert set(target.unique()) == {0, 1}


def testSplitData():
    features, target = prepareFeatures(cleanData(loadData()))
    xTrain, xTest, yTrain, yTest = splitData(features, target)

    assert len(xTrain) == 32950
    assert len(xTest) == 8238
    assert len(yTrain) == len(xTrain)
    assert len(yTest) == len(xTest)
    assert set(xTrain.index).isdisjoint(set(xTest.index))


def testTransformData():
    features, target = prepareFeatures(cleanData(loadData()))
    xTrain, xTest, _, _ = splitData(features, target)

    trainData, testData, preprocessor = transformData(xTrain, xTest)

    assert trainData.shape[0] == 32950
    assert testData.shape[0] == 8238
    assert trainData.shape[1] == testData.shape[1]
    assert np.issubdtype(trainData.dtype, np.number)
    assert not np.isnan(trainData).any()
    assert not np.isnan(testData).any()
    assert preprocessor is not None
