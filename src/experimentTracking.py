from pathlib import Path

import mlflow
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    roc_auc_score,
)


def trackExperiment(model, xTest, yTest):
    projectRoot = Path(__file__).resolve().parent.parent
    databasePath = projectRoot / "mlflow.db"
    mlflow.set_tracking_uri(f"sqlite:///{databasePath.as_posix()}")
    mlflow.set_experiment("BankPulseModelTraining")

    predictions = model.predict(xTest)
    probabilities = model.predict_proba(xTest)[:, 1]

    metrics = {
        "accuracy": accuracy_score(yTest, predictions),
        "rocAuc": roc_auc_score(yTest, probabilities),
        "averagePrecision": average_precision_score(
            yTest, probabilities
        ),
    }

    parameters = model.get_params()

    with mlflow.start_run():
        mlflow.log_params(parameters)
        mlflow.log_metrics(metrics)

    print("\nExperimento registrado correctamente en MLflow.")

    return metrics
