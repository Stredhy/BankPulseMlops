
from unittest.mock import MagicMock, patch
import numpy as np
from src.experimentTracking import trackExperiment


def testTrackExperimentLogsMetrics():
    model = MagicMock()
    model.predict.return_value = [0, 1, 0, 1]
    model.predict_proba.return_value = np.array([
        [0.9, 0.1],
        [0.2, 0.8],
        [0.7, 0.3],
        [0.1, 0.9],
    ])
    model.get_params.return_value = {
        "max_iter": 1000,
        "solver": "liblinear",
    }

    yTest = [0, 1, 0, 1]

    with (
        patch("src.experimentTracking.mlflow") as mockMlflow,
    ):
        mockMlflow.start_run.return_value.__enter__.return_value = MagicMock()

        metrics = trackExperiment(model, None, yTest)

        mockMlflow.log_metrics.assert_called_once_with(metrics)
        mockMlflow.log_params.assert_called_once_with(
            model.get_params.return_value
        )

        assert metrics["accuracy"] == 1.0
        assert metrics["rocAuc"] == 1.0
        assert metrics["averagePrecision"] == 1.0


def testTrackExperimentCreatesExperiment():
    model = MagicMock()
    model.predict.return_value = [0, 1]
    model.predict_proba.return_value = np.array([
        [0.8, 0.2],
        [0.1, 0.9],
    ])
    model.get_params.return_value = {"max_iter": 1000}

    with patch("src.experimentTracking.mlflow") as mockMlflow:
        trackExperiment(model, None, [0, 1])

        mockMlflow.set_experiment.assert_called_once_with(
            "BankPulseModelTraining"
        )
        mockMlflow.start_run.assert_called_once()
