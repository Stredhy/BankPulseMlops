from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile
from io import BytesIO


def prepareCiData():
    projectRoot = Path(__file__).resolve().parents[2]
    dataPath = projectRoot / "data" / "raw" / "data.csv"

    if dataPath.is_file():
        print("El dataset ya está disponible.")
        return

    datasetUrl = "https://archive.ics.uci.edu/static/public/222/bank+marketing.zip"

    print("Descargando dataset desde UCI...")

    with urlopen(datasetUrl, timeout=120) as response:
        datasetBytes = response.read()

    with ZipFile(BytesIO(datasetBytes)) as outerZip:
        with outerZip.open("bank-additional.zip") as innerFile:
            with ZipFile(BytesIO(innerFile.read())) as innerZip:
                with innerZip.open("bank-additional/bank-additional-full.csv") as csvFile:
                    dataPath.parent.mkdir(parents=True, exist_ok=True)
                    dataPath.write_bytes(csvFile.read())

    print(f"Dataset preparado correctamente: {dataPath}")


if __name__ == "__main__":
    prepareCiData()
