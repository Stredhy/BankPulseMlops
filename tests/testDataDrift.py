import numpy as np
import pandas as pd
import pytest

from src.dataDrift import detectDataDrift


def testIdenticalDistributions():
    referenceData = pd.DataFrame({
        "age": np.arange(20, 120)
    })

    currentData = referenceData.copy()

    results = detectDataDrift(referenceData, currentData)

    assert results["age"]["driftDetected"] is False
    assert results["age"]["statistic"] == 0.0
    assert results["age"]["pValue"] == 1.0


def testDifferentDistributions():
    referenceData = pd.DataFrame({
        "age": np.arange(20, 120)
    })

    currentData = pd.DataFrame({
        "age": np.arange(120, 220)
    })

    results = detectDataDrift(referenceData, currentData)

    assert results["age"]["driftDetected"] is True
    assert results["age"]["statistic"] == 1.0
    assert results["age"]["pValue"] < 0.05


def testInvalidSignificanceLevel():
    referenceData = pd.DataFrame({
        "age": [20, 30, 40]
    })

    currentData = pd.DataFrame({
        "age": [25, 35, 45]
    })

    with pytest.raises(ValueError):
        detectDataDrift(
            referenceData,
            currentData,
            significanceLevel=1.5
        )


def testCompareDataDriftWithoutChanges(tmp_path):
    from src.dataDrift import compareDataDrift

    referenceData = pd.DataFrame({
        "age": np.arange(20, 120),
        "campaign": np.arange(1, 101)
    })

    referencePath = tmp_path / "trainingReference.csv"
    referenceData.to_csv(referencePath, index=False)

    results = compareDataDrift(
        referenceData.copy(),
        referencePath=referencePath
    )

    assert results["totalFeatures"] == 2
    assert results["driftedFeatures"] == 0
    assert results["driftDetected"] is False


def testCompareDataDriftWithChanges(tmp_path):
    from src.dataDrift import compareDataDrift

    referenceData = pd.DataFrame({
        "age": np.arange(20, 120),
        "campaign": np.arange(1, 101)
    })

    currentData = referenceData.copy()
    currentData["age"] = currentData["age"] + 100

    referencePath = tmp_path / "trainingReference.csv"
    referenceData.to_csv(referencePath, index=False)

    results = compareDataDrift(
        currentData,
        referencePath=referencePath
    )

    assert results["totalFeatures"] == 2
    assert results["driftedFeatures"] == 1
    assert results["driftDetected"] is True
    assert results["features"]["age"]["driftDetected"] is True
    assert results["features"]["campaign"]["driftDetected"] is False
