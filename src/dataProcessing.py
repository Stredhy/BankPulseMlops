
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

def loadData():
    projectRoot = Path(__file__).resolve().parent.parent
    dataPath = projectRoot / "data" / "raw" / "data.csv"

    dataFrame = pd.read_csv(dataPath, sep=";")

    print("Dataset cargado correctamente.")
    print(f"Registros: {dataFrame.shape[0]}")
    print(f"Columnas: {dataFrame.shape[1]}")

    return dataFrame


def exploreData(dataFrame):
    print("\n========== EXPLORACIÓN DEL DATASET ==========")

    print("\nPrimeros 5 registros:")
    print(dataFrame.head())

    print("\nTipos de datos:")
    print(dataFrame.dtypes.to_string())

    print("\nValores nulos por columna:")
    print(dataFrame.isnull().sum().to_string())

    print("\nRegistros duplicados:")
    print(dataFrame.duplicated().sum())

    print("\nDistribución de la variable objetivo:")
    print(dataFrame["y"].value_counts())


def cleanData(dataFrame):
    cleanedData = dataFrame.copy()

    # Identificar clientes sin contacto previo
    cleanedData["wasPreviouslyContacted"] = (
        cleanedData["pdays"] != 999
    ).astype(int)

    # Reemplazar el valor especial por un valor nulo
    cleanedData["pdays"] = cleanedData["pdays"].replace(999, float("nan"))

    print("\n========== LIMPIEZA DE DATOS ==========")
    print(f"Registros originales: {len(dataFrame)}")
    print(f"Registros procesados: {len(cleanedData)}")

    print("\nClientes con contacto previo registrado:")
    print(cleanedData["wasPreviouslyContacted"].value_counts())

    return cleanedData


def prepareFeatures(dataFrame):
    features = dataFrame.drop(
        columns=["y", "duration"]
    )

    target = dataFrame["y"].map({
        "no": 0,
        "yes": 1
    })

    print("\n========== PREPARACIÓN DE VARIABLES ==========")
    print(f"Variables de entrada: {features.shape[1]}")
    print(f"Registros: {features.shape[0]}")
    print(f"Valores objetivo sin convertir: {target.isna().sum()}")

    return features, target


def splitData(features, target):
    xTrain, xTest, yTrain, yTest = train_test_split(
        features,
        target,
        test_size=0.20,
        random_state=42,
        stratify=target
    )

    print("\n========== DIVISIÓN DEL DATASET ==========")
    print(f"Registros de entrenamiento: {len(xTrain)}")
    print(f"Registros de prueba: {len(xTest)}")

    print("\nDistribución de clases en entrenamiento:")
    print(yTrain.value_counts(normalize=True).round(4))

    print("\nDistribución de clases en prueba:")
    print(yTest.value_counts(normalize=True).round(4))

    return xTrain, xTest, yTrain, yTest


def transformData(xTrain, xTest):
    categoricalColumns = xTrain.select_dtypes(
        include=["object", "str", "category"]
    ).columns.tolist()

    numericalColumns = xTrain.select_dtypes(
        include=["number"]
    ).columns.tolist()

    numericalPipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median"))
    ])

    categoricalPipeline = Pipeline([
        ("encoder", OneHotEncoder(
            handle_unknown="ignore",
            sparse_output=False
        ))
    ])

    preprocessor = ColumnTransformer([
        ("numerical", numericalPipeline, numericalColumns),
        ("categorical", categoricalPipeline, categoricalColumns)
    ])

    # Aprender las transformaciones solo del entrenamiento
    xTrainTransformed = preprocessor.fit_transform(xTrain)

    # Aplicar las mismas transformaciones a prueba
    xTestTransformed = preprocessor.transform(xTest)

    print("\n========== TRANSFORMACIÓN DE DATOS ==========")
    print(f"Columnas categóricas: {len(categoricalColumns)}")
    print(f"Columnas numéricas: {len(numericalColumns)}")
    print(f"Entrenamiento transformado: {xTrainTransformed.shape}")
    print(f"Prueba transformada: {xTestTransformed.shape}")

    return xTrainTransformed, xTestTransformed, preprocessor



if __name__ == "__main__":
    dataFrame = loadData()
    exploreData(dataFrame)
    cleanedData = cleanData(dataFrame)
    features, target = prepareFeatures(cleanedData)
    xTrain, xTest, yTrain, yTest = splitData(features, target)
    xTrainTransformed, xTestTransformed, preprocessor = transformData(
        xTrain, xTest
    )