import pandas as pd

from api.schemas import ClientData
from src.dataProcessing import cleanData
from src.modelPersistence import loadModel


model, preprocessor = loadModel()


def predictClient(clientData: ClientData):
    # Recuperar los nombres originales del dataset
    clientDictionary = clientData.model_dump(by_alias=True)

    # Convertir la solicitud en una fila de datos
    dataFrame = pd.DataFrame([clientDictionary])

    # Aplicar la misma limpieza utilizada en entrenamiento
    cleanedData = cleanData(dataFrame)

    # Respetar el orden de las características del modelo
    features = cleanedData[
        list(preprocessor.feature_names_in_)
    ]

    # Aplicar el preprocesador entrenado
    transformedFeatures = preprocessor.transform(features)

    # Generar clasificación y probabilidad de contratación
    prediction = int(model.predict(transformedFeatures)[0])
    probability = float(
        model.predict_proba(transformedFeatures)[0, 1]
    )

    return {
        "prediction": prediction,
        "probability": probability,
        "willSubscribe": bool(prediction)
    }