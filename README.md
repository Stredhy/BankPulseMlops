# BankPulse MLOps

**Sistema de Predicción de Contratación de Depósitos Bancarios mediante Machine Learning y MLOps**\


## Descripción

**BankPulse MLOps** es un proyecto académico enfocado en el desarrollo de un sistema de aprendizaje automático para predecir la probabilidad de que un cliente bancario contrate un depósito a plazo fijo.

El proyecto utiliza el conjunto de datos **Bank Marketing**, disponible en el UCI Machine Learning Repository, y tiene como propósito explorar la integración de herramientas y prácticas de **Machine Learning Operations (MLOps)**.

Su desarrollo se realizará de manera progresiva, comenzando con la organización de datos y el control de versiones, para posteriormente incorporar entrenamiento de modelos, seguimiento de experimentos, automatización, despliegue y monitoreo.

> **Estado actual:** El proyecto se encuentra en su fase inicial de desarrollo. La arquitectura y las herramientas descritas representan los componentes previstos y no necesariamente funcionalidades implementadas.

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
- [ ] Seguimiento de experimentos con MLflow.
- [ ] Automatización de pipelines con Apache Airflow.
- [ ] Desarrollo de una API REST con FastAPI.
- [ ] Contenerización mediante Docker.
- [ ] Configuración de CI/CD con GitHub Actions.
- [ ] Implementación de monitoreo del modelo.

## Resultados esperados

Al finalizar el proyecto, se espera contar con un sistema capaz de realizar predicciones sobre la contratación de depósitos bancarios, acompañado de un flujo de trabajo reproducible para gestionar datos, experimentos y modelos.

También se busca comprender la integración de las herramientas de MLOps y su importancia en el desarrollo, mantenimiento y operación de soluciones de Machine Learning.

## Estado del proyecto

**Fase actual: Inicialización y organización.**

El repositorio se encuentra en preparación. Las instrucciones de instalación, ejecución, entrenamiento y consumo de la API se incorporarán cuando sus respectivos componentes estén implementados.

## Referencia del dataset

Moro, S., Cortez, P., & Rita, P. (2014). *A data-driven approach to predict the success of bank telemarketing*. Decision Support Systems, 62, 22–31.

[https://doi.org/10.1016/j.dss.2014.03.001](https://doi.org/10.1016/j.dss.2014.03.001)

---

**BankPulse MLOps** — Proyecto académico en desarrollo.
