import pandas as pd
from scipy.stats import ks_2samp


def detectDataDrift(referenceData, currentData, significanceLevel=0.05):
    if not 0 < significanceLevel < 1:
        raise ValueError("significanceLevel debe estar entre 0 y 1.")

    if referenceData.empty or currentData.empty:
        raise ValueError("Los conjuntos de datos no pueden estar vacios.")

    numericalColumns = referenceData.select_dtypes(
        include=["number"]
    ).columns.intersection(currentData.columns)

    results = {}

    for column in numericalColumns:
        referenceValues = pd.to_numeric(
            referenceData[column], errors="coerce"
        ).dropna()

        currentValues = pd.to_numeric(
            currentData[column], errors="coerce"
        ).dropna()

        if referenceValues.empty or currentValues.empty:
            continue

        statistic, pValue = ks_2samp(
            referenceValues,
            currentValues
        )

        results[column] = {
            "statistic": float(statistic),
            "pValue": float(pValue),
            "driftDetected": bool(pValue < significanceLevel)
        }

    return results


def compareDataDrift(currentData, referencePath=None, significanceLevel=0.05):
    from pathlib import Path

    if referencePath is None:
        referencePath = (
            Path(__file__).resolve().parent.parent
            / "data"
            / "reference"
            / "trainingReference.csv"
        )

    referenceData = pd.read_csv(referencePath)

    results = detectDataDrift(
        referenceData,
        currentData,
        significanceLevel=significanceLevel
    )

    driftCount = sum(
        result["driftDetected"]
        for result in results.values()
    )

    return {
        "totalFeatures": len(results),
        "driftedFeatures": driftCount,
        "driftDetected": driftCount > 0,
        "features": results
    }
