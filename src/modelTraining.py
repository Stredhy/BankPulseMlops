from src.experimentTracking import trackExperiment
from src.modelPersistence import saveModel
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, average_precision_score
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

from src.dataProcessing import (
    loadData,
    cleanData,
    prepareFeatures,
    splitData,
    transformData,
)


def trainModel(xTrain, yTrain):
    print("\n========== ENTRENAMIENTO DEL MODELO ==========")

    model = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        solver="liblinear",
        random_state=42,
    )

    model.fit(xTrain, yTrain)

    print("Modelo entrenado correctamente.")

    return model


def evaluateModel(model, xTest, yTest):
    print("\n========== EVALUACIÓN DEL MODELO ==========")

    predictions = model.predict(xTest)
    
    probabilities = model.predict_proba(xTest)[:, 1]

    rocAuc = roc_auc_score(yTest, probabilities)
    averagePrecision = average_precision_score(yTest, probabilities)

    print(f"ROC-AUC: {rocAuc:.4f}")

    print(f"Average Precision: {averagePrecision:.4f}")
    accuracy = accuracy_score(yTest, predictions)

    print(f"Accuracy: {accuracy:.4f}")

    print("\nMatriz de confusión:")
    print(confusion_matrix(yTest, predictions))

    print("\nReporte de clasificación:")
    print(classification_report(
        yTest,
        predictions,
        zero_division=0,
    ))


if __name__ == "__main__":
    dataFrame = loadData()
    cleanedData = cleanData(dataFrame)

    features, target = prepareFeatures(cleanedData)

    xTrain, xTest, yTrain, yTest = splitData(
        features,
        target,
    )

    xTrainTransformed, xTestTransformed, preprocessor = (
        transformData(xTrain, xTest)
    )

    model = trainModel(xTrainTransformed, yTrain)
    evaluateModel(model, xTestTransformed, yTest)

    trackExperiment(model, xTestTransformed, yTest)

    saveModel(model, preprocessor)
