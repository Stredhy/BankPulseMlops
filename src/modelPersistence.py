
from pathlib import Path
import joblib


def saveModel(model, preprocessor):
    projectRoot = Path(__file__).resolve().parent.parent
    modelsDirectory = projectRoot / "models"

    modelsDirectory.mkdir(parents=True, exist_ok=True)

    modelPath = modelsDirectory / "model.joblib"
    preprocessorPath = modelsDirectory / "preprocessor.joblib"

    joblib.dump(model, modelPath)
    joblib.dump(preprocessor, preprocessorPath)

    print("Modelo y preprocesador guardados correctamente.")

    return modelPath, preprocessorPath


def loadModel():
    projectRoot = Path(__file__).resolve().parent.parent
    modelsDirectory = projectRoot / "models"

    modelPath = modelsDirectory / "model.joblib"
    preprocessorPath = modelsDirectory / "preprocessor.joblib"

    if not modelPath.is_file() or not preprocessorPath.is_file():
        raise FileNotFoundError(
            "No se encontraron los archivos del modelo o preprocesador."
        )

    model = joblib.load(modelPath)
    preprocessor = joblib.load(preprocessorPath)

    print("Modelo y preprocesador cargados correctamente.")

    return model, preprocessor
