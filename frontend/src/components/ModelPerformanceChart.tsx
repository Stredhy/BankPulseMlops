import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MlflowRun } from '../types/dashboard';

interface ModelPerformanceChartProps {
  runs: MlflowRun[];
  available: boolean;
  reason: string | null;
}

export function ModelPerformanceChart({
  runs,
  available,
  reason,
}: ModelPerformanceChartProps) {
  if (!available || runs.length === 0) {
    return (
      <div className="rounded-2xl bg-[#160a0e] border border-[#3d1624] p-6 flex flex-col items-center justify-center min-h-72 text-center">
        <p className="text-sm font-semibold text-[#f5d0dc]">
          Sin datos de experimentos disponibles
        </p>
        <p className="mt-1 text-xs text-[#9e6b7c] max-w-md">
          {reason || 'No se encontraron ejecuciones registradas en mlflow.db.'}
        </p>
      </div>
    );
  }

  const chartData = runs.map((run) => ({
    label: `#${run.runIndex} (${run.runId})`,
    runName: run.runName,
    accuracy: run.metrics.accuracy != null ? Number((run.metrics.accuracy * 100).toFixed(2)) : null,
    rocAuc: run.metrics.rocAuc != null ? Number((run.metrics.rocAuc * 100).toFixed(2)) : null,
    averagePrecision:
      run.metrics.averagePrecision != null
        ? Number((run.metrics.averagePrecision * 100).toFixed(2))
        : null,
  }));

  return (
    <div className="rounded-2xl bg-[#160a0e] border border-[#3d1624] p-6 shadow-lg shadow-black/30">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-base font-semibold text-[#fdf2f5]">
            Historial de Rendimiento en MLflow
          </h3>
          <p className="text-xs text-[#9e6b7c]">
            Métricas reales registradas en BankPulseModelTraining (%)
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-lg bg-[#260e16] border border-[#4a1829] text-[#e5b3c4]">
          {runs.length} {runs.length === 1 ? 'ejecución' : 'ejecuciones'}
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 4 }}>
            <CartesianGrid stroke="#33121e" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              stroke="#9e6b7c"
              tick={{ fill: '#c99aa9', fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#9e6b7c"
              tick={{ fill: '#c99aa9', fontSize: 12 }}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a0b10',
                borderColor: '#6e223c',
                borderRadius: '12px',
                color: '#fdf2f5',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#e5b3c4' }} />
            <Line
              type="monotone"
              dataKey="accuracy"
              name="Accuracy (%)"
              stroke="#f43f5e"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#f43f5e' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="rocAuc"
              name="ROC AUC (%)"
              stroke="#fb7185"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#fb7185' }}
            />
            <Line
              type="monotone"
              dataKey="averagePrecision"
              name="Avg Precision (%)"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4, fill: '#f59e0b' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
