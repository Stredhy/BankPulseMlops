from src.dataProcessing import (
    loadData,
    cleanData,
    prepareFeatures,
    splitData,
    transformData,
)
from src.modelTraining import trainModel
from src.modelPersistence import saveModel


def prepareCiModel():
    dataFrame = loadData()
    cleanedData = cleanData(dataFrame)
    features, target = prepareFeatures(cleanedData)

    xTrain, xTest, yTrain, yTest = splitData(features, target)

    xTrainTransformed, _, preprocessor = transformData(
        xTrain, xTest
    )

    model = trainModel(xTrainTransformed, yTrain)
    saveModel(model, preprocessor)

    print("Modelo preparado correctamente para CI.")


if __name__ == "__main__":
    prepareCiModel()
