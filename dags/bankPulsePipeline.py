import subprocess

import pendulum
from airflow.sdk import dag, task
from airflow.timetables.trigger import CronTriggerTimetable

projectPath = "/mnt/c/Users/mimoe/OneDrive/Documentos/ProyectDataMining/BankPulseMlops"
pythonPath = "/home/mimoe/airflowEnvironment/bin/python"
localTimezone = pendulum.timezone("America/Mexico_City")


@dag(
    dag_id="bankPulsePipeline",
    start_date=pendulum.datetime(2026, 11, 1, tz=localTimezone),
    schedule=CronTriggerTimetable("0 20 1 * *", timezone=localTimezone),
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
