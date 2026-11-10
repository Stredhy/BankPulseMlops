from datetime import datetime
import subprocess

from airflow.sdk import dag, task


projectPath = "/mnt/c/Users/mimoe/OneDrive/Documentos/ProyectDataMining/BankPulseMlops"
pythonPath = "/home/mimoe/airflowEnvironment/bin/python"


@dag(
    dag_id="bankPulsePipeline",
    start_date=datetime(2026, 11, 1),
    schedule=None,
    catchup=False,
    tags=["bankPulse", "mlops"],
)
def bankPulsePipeline():

    @task
    def trainPipeline():
        subprocess.run(
            [pythonPath, "-m", "src.modelTraining"],
            cwd=projectPath,
            check=True,
        )

    trainPipeline()


bankPulsePipeline()
