#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
CONTAINER_NAME="bankpulseApi"
IMAGE_NAME="bankpulse-api:1.2.0"
MLFLOW_PID=""

cleanup() {
  echo ""
  echo "[BankPulse] Apagando servicios..."
  if [ -n "$MLFLOW_PID" ] && kill -0 "$MLFLOW_PID" 2>/dev/null; then
    kill "$MLFLOW_PID" 2>/dev/null || true
    echo "[BankPulse] MLflow UI detenido."
  fi
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
    echo "[BankPulse] Contenedor $CONTAINER_NAME detenido."
  fi
}
trap cleanup EXIT INT TERM

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo "[BankPulse] Error: Docker no esta activo. Inicia el daemon de Docker e intenta de nuevo."
  exit 1
fi

if [ -z "$(docker images -q "$IMAGE_NAME")" ]; then
  echo "[BankPulse] Construyendo imagen $IMAGE_NAME..."
  docker build -t "$IMAGE_NAME" "$PROJECT_ROOT"
fi

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d --rm --name "$CONTAINER_NAME" -p 8000:8000 -v "$PROJECT_ROOT/mlflow.db:/app/mlflow.db" -v "$PROJECT_ROOT/data:/app/data:ro" -v "$PROJECT_ROOT/scripts:/app/scripts:ro" -v "$PROJECT_ROOT/.github:/app/.github:ro" "$IMAGE_NAME" >/dev/null

if [ -x "$PROJECT_ROOT/.venv/bin/python" ] && "$PROJECT_ROOT/.venv/bin/python" -m mlflow --version >/dev/null 2>&1; then
  (cd "$PROJECT_ROOT" && "$PROJECT_ROOT/.venv/bin/python" -m mlflow ui --backend-store-uri "sqlite:///mlflow.db" --port 5000 >/dev/null 2>&1) &
  MLFLOW_PID=$!
elif command -v python3 >/dev/null 2>&1 && python3 -m mlflow --version >/dev/null 2>&1; then
  (cd "$PROJECT_ROOT" && python3 -m mlflow ui --backend-store-uri "sqlite:///mlflow.db" --port 5000 >/dev/null 2>&1) &
  MLFLOW_PID=$!
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  npm --prefix "$FRONTEND_DIR" install
fi

echo "============================================================"
echo "  BankPulse MLOps Activo (Ctrl + C para detener todo)"
echo "  - Dashboard Web : http://localhost:5173/"
echo "  - FastAPI Docs  : http://localhost:8000/docs"
echo "  - MLflow UI     : http://127.0.0.1:5000/"
echo "============================================================"

npm --prefix "$FRONTEND_DIR" run dev