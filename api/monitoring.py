from prometheus_client import Counter, Histogram


httpRequestsTotal = Counter(
    "bankpulse_http_requests_total",
    "Cantidad total de solicitudes HTTP recibidas.",
    ["method", "endpoint", "statusCode"]
)

httpRequestDurationSeconds = Histogram(
    "bankpulse_http_request_duration_seconds",
    "Duracion de las solicitudes HTTP en segundos.",
    ["method", "endpoint"]
)

modelPredictionsTotal = Counter(
    "bankpulse_model_predictions_total",
    "Cantidad total de predicciones realizadas por el modelo.",
    ["prediction"]
)
