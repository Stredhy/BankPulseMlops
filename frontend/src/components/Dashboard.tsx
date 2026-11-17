import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FlaskConical,
  Gauge,
  GitCommit,
  RefreshCw,
  Server,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import type { ActiveSection, DashboardSummary } from '../types/dashboard';
import { DriftTable } from './DriftTable';
import { MetricCard } from './MetricCard';
import { ModelPerformanceChart } from './ModelPerformanceChart';
import { PredictionTester } from './PredictionTester';

interface DashboardProps {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  activeSection: ActiveSection;
  apiBaseUrl: string;
  onRefresh: () => void;
}

const sectionTitles: Record<ActiveSection, { title: string; subtitle: string }> = {
  overview: {
    title: 'Panel General MLOps',
    subtitle: 'Telemetría en vivo de FastAPI, MLflow, DVC, Drift y Airflow',
  },
  experiments: {
    title: 'Experimentos MLflow & Modelo',
    subtitle: 'Historial real de entrenamiento en BankPulseModelTraining',
  },
  drift: {
    title: 'Monitoreo de Datos & Drift',
    subtitle: 'Comparación estadística contra trainingReference.csv',
  },
  predict: {
    title: 'Inferencia en Tiempo Real',
    subtitle: 'Evaluación directa sobre el modelo desplegado en FastAPI',
  },
  pipeline: {
    title: 'Orquestación Airflow & CI/CD',
    subtitle: 'Estado del DAG mensual bankPulsePipeline y automatización',
  },
};

export function Dashboard({
  summary,
  loading,
  error,
  activeSection,
  apiBaseUrl,
  onRefresh,
}: DashboardProps) {
  const apiConnected = Boolean(summary?.api.connected && !error);
  const runs = summary?.mlflow.runs ?? [];
  const latestRun = runs.length > 0 ? runs[runs.length - 1] : null;
  const driftInfo = summary?.dataMonitoring.drift ?? null;
  const metrics = summary?.api.metrics ?? null;

  const formatPercent = (value?: number) =>
    value != null ? `${(value * 100).toFixed(2)}%` : 'Sin datos';

  const headerInfo = sectionTitles[activeSection];

  return (
    <main className="flex-1 min-w-0 p-6 lg:p-8 space-y-6 overflow-y-auto">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#361320]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#fff5f8]">
            {headerInfo.title}
          </h2>
          <p className="text-sm text-[#b38293] mt-0.5">{headerInfo.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {summary?.timestamp && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#9e6b7c] bg-[#160a0e] border border-[#361320] px-3 py-1.5 rounded-xl">
              <Clock className="h-3.5 w-3.5 text-[#d9467a]" />
              {new Date(summary.timestamp).toLocaleTimeString()}
            </span>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#240d15] hover:bg-[#33121e] border border-[#591e33] text-xs font-semibold text-[#ffd6e3] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Sincronizando...' : 'Actualizar'}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl bg-rose-950/60 border border-rose-700/60 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-rose-200">
              FastAPI no responde en {apiBaseUrl}
            </p>
            <p className="text-rose-300/90">
              Detalle: {error}. Verifica que el contenedor Docker de BankPulse API esté en ejecución. No se muestran métricas simuladas.
            </p>
          </div>
        </div>
      )}

      {activeSection === 'overview' && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              title="ROC AUC (Último Run)"
              value={formatPercent(latestRun?.metrics.rocAuc)}
              subtitle={
                latestRun
                  ? `Run ${latestRun.runId} (${latestRun.runName})`
                  : 'Sin ejecuciones en MLflow'
              }
              icon={FlaskConical}
              badge={
                latestRun
                  ? { text: latestRun.status, tone: 'success' }
                  : { text: 'Sin datos', tone: 'neutral' }
              }
            />

            <MetricCard
              title="Accuracy del Modelo"
              value={formatPercent(latestRun?.metrics.accuracy)}
              subtitle={
                latestRun?.metrics.averagePrecision != null
                  ? `Avg Precision: ${(latestRun.metrics.averagePrecision * 100).toFixed(2)}%`
                  : 'Métrica de clasificación'
              }
              icon={Gauge}
              badge={
                summary?.artifacts.modelReady
                  ? { text: `${summary.artifacts.modelSizeKb} KB`, tone: 'neutral' }
                  : { text: 'Artefacto ausente', tone: 'danger' }
              }
            />

            <MetricCard
              title="Predicciones Servidas"
              value={metrics ? String(metrics.totalPredictions) : '—'}
              subtitle={
                metrics
                  ? `Clase 1: ${metrics.predictionsByClass['1'] ?? 0} · Clase 0: ${metrics.predictionsByClass['0'] ?? 0}`
                  : 'API desconectada'
              }
              icon={Cpu}
              badge={
                metrics?.avgLatencyMs != null
                  ? { text: `${metrics.avgLatencyMs} ms prom.`, tone: 'success' }
                  : { text: 'Sin tráfico aún', tone: 'neutral' }
              }
            />

            <MetricCard
              title="Estado de Data Drift"
              value={
                driftInfo
                  ? `${driftInfo.driftedFeatures} / ${driftInfo.totalFeatures}`
                  : '—'
              }
              subtitle={
                summary?.dataMonitoring.available
                  ? `${summary.dataMonitoring.referenceRows?.toLocaleString()} ref vs ${summary.dataMonitoring.currentRows?.toLocaleString()} actuales`
                  : summary?.dataMonitoring.reason || 'Datasets no disponibles'
              }
              icon={Activity}
              badge={
                !driftInfo
                  ? { text: 'Sin datos', tone: 'neutral' }
                  : driftInfo.driftDetected
                    ? { text: 'Drift detectado', tone: 'warning' }
                    : { text: 'Estable', tone: 'success' }
              }
            />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ModelPerformanceChart
                runs={runs}
                available={Boolean(summary?.mlflow.available)}
                reason={summary?.mlflow.reason ?? null}
              />
            </div>

            <div className="rounded-2xl bg-[#160a0e] border border-[#3d1624] p-6 shadow-lg shadow-black/30 flex flex-col justify-between space-y-5">
              <div>
                <h3 className="text-base font-semibold text-[#fdf2f5]">
                  Telemetría HTTP & Stack
                </h3>
                <p className="text-xs text-[#9e6b7c]">
                  Contadores reales expuestos en /metrics
                </p>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#11070a] border border-[#30111c]">
                    <span className="text-[#c99aa9]">Solicitudes HTTP Totales</span>
                    <span className="font-bold text-white">
                      {metrics ? metrics.totalRequests : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#11070a] border border-[#30111c]">
                    <span className="text-[#c99aa9]">Versionado DVC</span>
                    <span className="font-semibold text-[#ffd6e3]">
                      {summary?.dataMonitoring.dvcTracked ? 'Rastreado (.dvc)' : 'No detectado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#11070a] border border-[#30111c]">
                    <span className="text-[#c99aa9]">GitHub Actions CI</span>
                    <span className="font-semibold text-[#ffd6e3]">
                      {summary?.artifacts.ciWorkflowConfigured ? 'Configurado' : 'No detectado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#11070a] border border-[#30111c]">
                    <span className="text-[#c99aa9]">Orquestador Airflow</span>
                    <span
                      className={`font-semibold ${
                        summary?.airflow.connected ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {summary?.airflow.connected ? 'En línea (:8080)' : 'Detenido'}
                    </span>
                  </div>
                </div>
              </div>

              {metrics && Object.keys(metrics.requestsByEndpoint).length > 0 && (
                <div className="pt-3 border-t border-[#2e101b]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9e6b7c] mb-2">
                    Tráfico por Endpoint
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(metrics.requestsByEndpoint).map(([ep, count]) => (
                      <div key={ep} className="flex justify-between text-[#d6aebc]">
                        <span className="font-mono">{ep}</span>
                        <span className="font-semibold text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {activeSection === 'experiments' && (
        <div className="space-y-6">
          <ModelPerformanceChart
            runs={runs}
            available={Boolean(summary?.mlflow.available)}
            reason={summary?.mlflow.reason ?? null}
          />

          <div className="rounded-2xl bg-[#160a0e] border border-[#3d1624] p-6 shadow-lg shadow-black/30">
            <h3 className="text-base font-semibold text-[#fdf2f5] mb-1">
              Ejecuciones Registradas en SQLite (mlflow.db)
            </h3>
            <p className="text-xs text-[#9e6b7c] mb-4">
              Experimento: {summary?.mlflow.experimentName ?? 'BankPulseModelTraining'}
            </p>

            {runs.length === 0 ? (
              <p className="text-xs text-[#9e6b7c]">
                No hay ejecuciones activas para mostrar.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#3d1624] text-[#b38293] uppercase tracking-wider">
                      <th className="py-3 px-3">Run</th>
                      <th className="py-3 px-3">Nombre</th>
                      <th className="py-3 px-3">Fecha (UTC)</th>
                      <th className="py-3 px-3">Accuracy</th>
                      <th className="py-3 px-3">ROC AUC</th>
                      <th className="py-3 px-3">Avg Precision</th>
                      <th className="py-3 px-3">Solver / C</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#290e18]">
                    {runs.map((run) => (
                      <tr key={run.runId} className="hover:bg-[#1f0c13]">
                        <td className="py-2.5 px-3 font-mono text-[#ff9ec0]">
                          {run.runId}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#fdf2f5]">
                          {run.runName}
                        </td>
                        <td className="py-2.5 px-3 text-[#c99aa9]">
                          {run.startTime ? new Date(run.startTime).toLocaleString() : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-white font-semibold">
                          {formatPercent(run.metrics.accuracy)}
                        </td>
                        <td className="py-2.5 px-3 text-white font-semibold">
                          {formatPercent(run.metrics.rocAuc)}
                        </td>
                        <td className="py-2.5 px-3 text-white font-semibold">
                          {formatPercent(run.metrics.averagePrecision)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#c99aa9]">
                          {run.params.solver ?? '—'} / C={run.params.C ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'drift' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Dataset Referencia"
              value={
                summary?.dataMonitoring.referenceRows != null
                  ? summary.dataMonitoring.referenceRows.toLocaleString()
                  : 'Sin datos'
              }
              subtitle="data/reference/trainingReference.csv"
              icon={Database}
            />
            <MetricCard
              title="Dataset Actual (DVC)"
              value={
                summary?.dataMonitoring.currentRows != null
                  ? summary.dataMonitoring.currentRows.toLocaleString()
                  : 'Sin datos'
              }
              subtitle="data/raw/data.csv"
              icon={Server}
            />
            <MetricCard
              title="Variables con Drift"
              value={
                driftInfo
                  ? `${driftInfo.driftedFeatures} de ${driftInfo.totalFeatures}`
                  : 'Sin datos'
              }
              subtitle="Umbral de significancia p < 0.05"
              icon={ShieldCheck}
            />
          </div>

          <DriftTable
            available={Boolean(summary?.dataMonitoring.available)}
            reason={summary?.dataMonitoring.reason ?? null}
            features={driftInfo?.features ?? {}}
          />
        </div>
      )}

      {activeSection === 'predict' && (
        <PredictionTester
          apiConnected={apiConnected}
          apiBaseUrl={apiBaseUrl}
          onPredictionSuccess={onRefresh}
        />
      )}

      {activeSection === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#160a0e] border border-[#3d1624] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Workflow className="h-5 w-5 text-[#f472a1]" />
                <h3 className="text-base font-semibold text-[#fdf2f5]">
                  Apache Airflow (WSL Ubuntu)
                </h3>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                  summary?.airflow.connected
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                    : 'bg-amber-950/70 text-amber-300 border-amber-700/50'
                }`}
              >
                {summary?.airflow.connected ? 'Servidor activo' : 'Servicio detenido'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-[#d6aebc]">
              <p>
                <span className="text-[#9e6b7c]">DAG ID:</span>{' '}
                <span className="font-mono text-white">
                  {summary?.airflow.dagId ?? 'bankPulsePipeline'}
                </span>
              </p>
              <p>
                <span className="text-[#9e6b7c]">Programación:</span>{' '}
                <span className="font-mono text-white">
                  {summary?.airflow.schedule ?? '0 20 1 * * (America/Mexico_City)'}
                </span>
              </p>
              <p className="text-[#9e6b7c]">
                La tarea programada de Windows permanece deshabilitada para evitar ejecuciones no deseadas en segundo plano.
              </p>
            </div>

            <div className="pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9e6b7c] mb-2">
                Últimas líneas de airflowAutoStartup.log
              </p>
              {summary?.airflow.recentLogs && summary.airflow.recentLogs.length > 0 ? (
                <pre className="p-3 rounded-xl bg-[#0e0508] border border-[#2e101b] text-[11px] text-[#e5b3c4] overflow-x-auto">
                  {summary.airflow.recentLogs.join('\n')}
                </pre>
              ) : (
                <p className="text-xs text-[#9e6b7c]">
                  Sin registros recientes en scripts/airflowAutoStartup.log.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-[#160a0e] border border-[#3d1624] p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <GitCommit className="h-5 w-5 text-[#f472a1]" />
              <h3 className="text-base font-semibold text-[#fdf2f5]">
                Artefactos & Integración Continua
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#11070a] border border-[#30111c]">
                <span className="text-[#c99aa9]">Modelo Serializado (joblib)</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                  {summary?.artifacts.modelReady ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Listo ({summary.artifacts.modelSizeKb} KB)
                    </>
                  ) : (
                    'No encontrado'
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#11070a] border border-[#30111c]">
                <span className="text-[#c99aa9]">Última actualización del modelo</span>
                <span className="font-mono text-[#ffd6e3]">
                  {summary?.artifacts.modelUpdatedAt
                    ? new Date(summary.artifacts.modelUpdatedAt).toLocaleString()
                    : 'Sin datos'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#11070a] border border-[#30111c]">
                <span className="text-[#c99aa9]">Pipeline CI (.github/workflows/ci.yml)</span>
                <span className="font-semibold text-emerald-400">
                  {summary?.artifacts.ciWorkflowConfigured ? 'Activo en repo' : 'No configurado'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
