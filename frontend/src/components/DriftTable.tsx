import type { DriftFeatureDetail } from '../types/dashboard';

interface DriftTableProps {
  available: boolean;
  reason: string | null;
  features: Record<string, DriftFeatureDetail>;
}

export function DriftTable({ available, reason, features }: DriftTableProps) {
  const entries = Object.entries(features);

  if (!available || entries.length === 0) {
    return (
      <div className="rounded-2xl bg-[#160a0e] border border-[#3d1624] p-6 text-center">
        <p className="text-sm font-semibold text-[#f5d0dc]">
          Sin análisis de Data Drift disponible
        </p>
        <p className="mt-1 text-xs text-[#9e6b7c]">
          {reason || 'No se encontraron variables numéricas comparables entre los datasets.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#160a0e] border border-[#3d1624] p-6 shadow-lg shadow-black/30">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#fdf2f5]">
          Prueba Kolmogorov-Smirnov por Característica
        </h3>
        <p className="text-xs text-[#9e6b7c]">
          Comparación estadística entre trainingReference.csv y data.csv (α = 0.05)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#3d1624] text-[#b38293] uppercase tracking-wider">
              <th className="py-3 px-3">Característica</th>
              <th className="py-3 px-3">Estadístico KS</th>
              <th className="py-3 px-3">p-value</th>
              <th className="py-3 px-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#290e18]">
            {entries.map(([featureName, detail]) => (
              <tr key={featureName} className="hover:bg-[#1f0c13]">
                <td className="py-2.5 px-3 font-mono font-medium text-[#fdf2f5]">
                  {featureName}
                </td>
                <td className="py-2.5 px-3 text-[#d6aebc]">
                  {detail.statistic.toFixed(4)}
                </td>
                <td className="py-2.5 px-3 text-[#d6aebc]">
                  {detail.pValue.toExponential(3)}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full font-medium border ${
                      detail.driftDetected
                        ? 'bg-amber-950/70 text-amber-300 border-amber-700/50'
                        : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                    }`}
                  >
                    {detail.driftDetected ? 'Drift detectado' : 'Estable'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
