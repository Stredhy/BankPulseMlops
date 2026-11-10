# BankPulse MLOps

**Sistema de Predicción de Contratación de Depósitos Bancarios mediante Machine Learning y MLOps**\


## Descripción

**BankPulse MLOps** es un proyecto académico enfocado en el desarrollo de un sistema de aprendizaje automático para predecir la probabilidad de que un cliente bancario contrate un depósito a plazo fijo.

El proyecto utiliza el conjunto de datos **Bank Marketing**, disponible en el UCI Machine Learning Repository, y tiene como propósito explorar la integración de herramientas y prácticas de **Machine Learning Operations (MLOps)**.

Su desarrollo se realizará de manera progresiva, comenzando con la organización de datos y el control de versiones, para posteriormente incorporar entrenamiento de modelos, seguimiento de experimentos, automatización, despliegue y monitoreo.

> **Estado actual:** El proyecto cuenta con preprocesamiento de datos, entrenamiento y evaluación de modelos, persistencia, versionado de datos mediante DVC y seguimiento de experimentos mediante MLflow. Las demás herramientas se incorporarán progresivamente.

## Objetivo general

Desarrollar un sistema de clasificación binaria que permita estimar la probabilidad de contratación de depósitos bancarios, aplicando herramientas de MLOps para gestionar de forma reproducible el ciclo de vida de los modelos de Machine Learning.

## Dataset

Se utilizará el conjunto de datos **Bank Marketing**, específicamente la versión `bank-additional-full.csv`, renombrada dentro del proyecto como `data.csv`.

| Característica        | Descripción                     |
| --------------------- | ------------------------------- |
| Fuente                | UCI Machine Learning Repository |
| Dataset               | Bank Marketing                  |
| Archivo               | `data.csv`                      |
| Registros             | 41,188                          |
| Variables predictoras | 20                              |
| Variable objetivo     | `y`                             |
| Tipo de problema      | Clasificación binaria           |
| Clases                | `yes` / `no`                    |

El conjunto contiene información relacionada con campañas de marketing de una institución bancaria portuguesa, incluyendo características de los clientes, historial de contactos e indicadores económicos.

**Fuente oficial:** [Bank Marketing — UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/222/bank+marketing)

## Tecnologías previstas

Durante el desarrollo del proyecto se contempla integrar las siguientes herramientas:

| Tecnología     | Propósito                                                       |
| -------------- | --------------------------------------------------------------- |
| Python         | Procesamiento de datos y desarrollo de modelos                  |
| Git y GitHub   | Control de versiones y colaboración                             |
| DVC            | Versionado de datos y pipelines                                 |
| MLflow         | Seguimiento de experimentos y gestión de modelos                |
| Apache Airflow | Automatización de flujos de trabajo                             |
| FastAPI        | Desarrollo de una API REST para predicciones                    |
| Docker         | Contenerización de servicios                                    |
| GitHub Actions | Integración y despliegue continuo                               |
| Monitoreo      | Supervisión del rendimiento y detección de cambios en los datos |

La incorporación de estas tecnologías se realizará por etapas.

## Estructura inicial

```text
bankPulseMlops/
├── data/
│   └── raw/
│       └── data.csv
├── src/
│   └── __init__.py
├── tests/
├── .gitignore
├── README.md
└── requirements.txt
```

La estructura se ampliará conforme se implementen nuevos módulos y herramientas.

## Etapas de desarrollo

- [x] Configuración inicial del repositorio.
- [x] Exploración y preprocesamiento del dataset.
- [x] Entrenamiento y evaluación de modelos.
- [x] Versionado de datos mediante DVC.
- [x] Seguimiento de experimentos con MLflow.
- [ ] Automatización de pipelines con Apache Airflow.
- [ ] Desarrollo de una API REST con FastAPI.
- [ ] Contenerización mediante Docker.
- [ ] Configuración de CI/CD con GitHub Actions.
- [ ] Implementación de monitoreo del modelo.

## Resultados esperados

Al finalizar el proyecto, se espera contar con un sistema capaz de realizar predicciones sobre la contratación de depósitos bancarios, acompañado de un flujo de trabajo reproducible para gestionar datos, experimentos y modelos.

También se busca comprender la integración de las herramientas de MLOps y su importancia en el desarrollo, mantenimiento y operación de soluciones de Machine Learning.

## Estado del proyecto

**Fase actual: Integración de herramientas MLOps.**

El repositorio incluye módulos de procesamiento de datos, entrenamiento, evaluación, persistencia y seguimiento de experimentos. El versionado de datos mediante DVC ya se encuentra implementado. El siguiente componente por implementar es la automatización de pipelines con Apache Airflow.

## Referencia del dataset

Moro, S., Cortez, P., & Rita, P. (2014). *A data-driven approach to predict the success of bank telemarketing*. Decision Support Systems, 62, 22–31.

[https://doi.org/10.1016/j.dss.2014.03.001](https://doi.org/10.1016/j.dss.2014.03.001)

---

**BankPulse MLOps** — Proyecto académico en desarrollo.

## Seguimiento de experimentos con MLflow

BankPulse MLOps utiliza MLflow para registrar los hiperparametros y las metricas del modelo, asi como comparar diferentes ejecuciones de entrenamiento.

### Entrenamiento y registro de experimentos

Desde la raiz del proyecto, ejecutar:

```powershell
.\.venv\Scripts\python.exe -m src.modelTraining
```

El entrenamiento registra automaticamente los resultados en el experimento `BankPulseModelTraining`, utilizando la base de datos local `mlflow.db`.

Se registran los parametros del modelo `LogisticRegression` y las metricas `accuracy`, `rocAuc` y `averagePrecision`.

### Iniciar la interfaz de MLflow

```powershell
.\.venv\Scripts\mlflow.exe ui --backend-store-uri sqlite:///mlflow.db
```

Abrir `http://127.0.0.1:5000` en el navegador.

En MLflow 3.18.0, seleccionar **Model training** y acceder al experimento `BankPulseModelTraining`.

### Comparación de ejecuciones

1. Abrir la seccion **Runs**.
2. Seleccionar dos o mas ejecuciones.
3. Hacer clic en **Compare**.
4. Seleccionar los parametros y las metricas que se desean visualizar.
5. Revisar los resultados y la seccion **Run details**.

### Resultados verificados

| Metrica | Ejecucion 1 | Ejecucion 2 |
| --- | ---: | ---: |
| Accuracy | 0.834669 | 0.834669 |
| ROC-AUC | 0.801041 | 0.801041 |
| Average Precision | 0.459830 | 0.459830 |

Las dos ejecuciones utilizaron la misma configuracion y produjeron las mismas metricas. Esto confirma la reproducibilidad observada del entrenamiento.

La base de datos local de MLflow no se incorpora al repositorio Git.

## Versionado de datos con DVC

BankPulse MLOps utiliza DVC para versionar el dataset sin almacenar su contenido directamente en Git.

### Dataset versionado

El archivo `data/raw/data.csv` contiene 41,188 registros y se rastrea mediante `data/raw/data.csv.dvc`.

### Almacenamiento local

El almacenamiento predeterminado es `localstorage`, ubicado en la carpeta hermana `BankPulseDvcStorage`. Su configuración se encuentra en `.dvc/config`.

Este almacenamiento requiere acceso a la carpeta local. Para utilizarlo desde otra computadora, es necesario disponer de una copia del almacenamiento en la ruta correspondiente.

### Comandos principales

- `dvc add data/raw/data.csv`: registra una versión del dataset.
- `dvc push`: envía los datos al almacenamiento configurado.
- `dvc pull`: recupera los datos versionados.
- `dvc status`: comprueba si existen cambios pendientes.

### Resultados verificados

- DVC 3.67.1 instalado correctamente.
- Dataset registrado mediante DVC.
- Almacenamiento local configurado.
- Envío y recuperación de datos verificados.
- Dataset excluido del seguimiento directo de Git.
