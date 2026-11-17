import { useState, type FormEvent } from 'react';
import { Send, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface PredictionTesterProps {
  apiConnected: boolean;
  apiBaseUrl: string;
  onPredictionSuccess: () => void;
}

interface PredictionResponse {
  prediction: number;
  probability: number;
  willSubscribe: boolean;
}

const initialFormState = {
  age: 42,
  job: 'management',
  marital: 'married',
  education: 'university.degree',
  default: 'no',
  housing: 'yes',
  loan: 'no',
  contact: 'cellular',
  month: 'may',
  dayOfWeek: 'thu',
  campaign: 1,
  pdays: 999,
  previous: 0,
  poutcome: 'nonexistent',
  empVarRate: -1.8,
  consPriceIdx: 92.893,
  consConfIdx: -46.2,
  euribor3m: 1.313,
  nrEmployed: 5099.1,
};

export function PredictionTester({
  apiConnected,
  apiBaseUrl,
  onPredictionSuccess,
}: PredictionTesterProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age),
          campaign: Number(formData.campaign),
          pdays: Number(formData.pdays),
          previous: Number(formData.previous),
          empVarRate: Number(formData.empVarRate),
          consPriceIdx: Number(formData.consPriceIdx),
          consConfIdx: Number(formData.consConfIdx),
          euribor3m: Number(formData.euribor3m),
          nrEmployed: Number(formData.nrEmployed),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      const data: PredictionResponse = await response.json();
      setResult(data);
      onPredictionSuccess();
    } catch (error) {
      setResult(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo completar la inferencia.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl bg-[#12070b] border border-[#451827] px-3 py-2 text-sm text-[#fdf2f5] focus:outline-none focus:border-[#c93b6b]';
  const labelClass = 'block text-xs font-medium text-[#c99aa9] mb-1';

  return (
    <div className="rounded-2xl bg-[#160a0e] border border-[#3d1624] p-6 shadow-lg shadow-black/30">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-base font-semibold text-[#fdf2f5]">
            Simulador de Inferencia en Vivo (/predict)
          </h3>
          <p className="text-xs text-[#9e6b7c]">
            Envía un perfil real a FastAPI e incrementa el contador de Prometheus
          </p>
        </div>
        {!apiConnected && (
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-rose-950/80 border border-rose-700/60 text-rose-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            API desconectada
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Edad</label>
            <input
              type="number"
              min={0}
              max={120}
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Ocupación (job)</label>
            <select
              value={formData.job}
              onChange={(e) => setFormData({ ...formData, job: e.target.value })}
              className={inputClass}
            >
              <option value="management">management</option>
              <option value="technician">technician</option>
              <option value="admin.">admin.</option>
              <option value="blue-collar">blue-collar</option>
              <option value="services">services</option>
              <option value="retired">retired</option>
              <option value="student">student</option>
              <option value="entrepreneur">entrepreneur</option>
              <option value="self-employed">self-employed</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Estado Civil</label>
            <select
              value={formData.marital}
              onChange={(e) => setFormData({ ...formData, marital: e.target.value })}
              className={inputClass}
            >
              <option value="married">married</option>
              <option value="single">single</option>
              <option value="divorced">divorced</option>
              <option value="unknown">unknown</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Educación</label>
            <select
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              className={inputClass}
            >
              <option value="university.degree">university.degree</option>
              <option value="high.school">high.school</option>
              <option value="professional.course">professional.course</option>
              <option value="basic.9y">basic.9y</option>
              <option value="basic.4y">basic.4y</option>
              <option value="unknown">unknown</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Crédito Hipotecario</label>
            <select
              value={formData.housing}
              onChange={(e) => setFormData({ ...formData, housing: e.target.value })}
              className={inputClass}
            >
              <option value="yes">yes</option>
              <option value="no">no</option>
              <option value="unknown">unknown</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Préstamo Personal</label>
            <select
              value={formData.loan}
              onChange={(e) => setFormData({ ...formData, loan: e.target.value })}
              className={inputClass}
            >
              <option value="no">no</option>
              <option value="yes">yes</option>
              <option value="unknown">unknown</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Canal de Contacto</label>
            <select
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className={inputClass}
            >
              <option value="cellular">cellular</option>
              <option value="telephone">telephone</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Resultado Campaña Previa</label>
            <select
              value={formData.poutcome}
              onChange={(e) => setFormData({ ...formData, poutcome: e.target.value })}
              className={inputClass}
            >
              <option value="nonexistent">nonexistent</option>
              <option value="failure">failure</option>
              <option value="success">success</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Contactos Campaña (campaign)</label>
            <input
              type="number"
              min={1}
              value={formData.campaign}
              onChange={(e) => setFormData({ ...formData, campaign: Number(e.target.value) })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Días Último Contacto (pdays)</label>
            <input
              type="number"
              min={0}
              value={formData.pdays}
              onChange={(e) => setFormData({ ...formData, pdays: Number(e.target.value) })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Euribor 3M</label>
            <input
              type="number"
              step="0.001"
              value={formData.euribor3m}
              onChange={(e) => setFormData({ ...formData, euribor3m: Number(e.target.value) })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Tasa Variación Empleo</label>
            <input
              type="number"
              step="0.1"
              value={formData.empVarRate}
              onChange={(e) => setFormData({ ...formData, empVarRate: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="submit"
            disabled={!apiConnected || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8f1d44] to-[#61122d] hover:from-[#a82451] hover:to-[#781738] disabled:opacity-45 text-sm font-semibold text-white border border-[#c93b6b]/40 shadow-lg shadow-[#59112a]/40 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Consultando modelo...' : 'Ejecutar Predicción'}
          </button>

          {errorMessage && (
            <p className="text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 px-3 py-2 rounded-xl">
              {errorMessage}
            </p>
          )}

          {result && (
            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${
                result.willSubscribe
                  ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-200'
                  : 'bg-[#260e16] border-[#6e223c] text-[#ffd6e3]'
              }`}
            >
              {result.willSubscribe ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-[#f472a1] shrink-0" />
              )}
              <div className="text-xs">
                <p className="font-semibold">
                  {result.willSubscribe
                    ? 'Alta probabilidad: Contratará depósito (Clase 1)'
                    : 'Baja probabilidad: No contratará depósito (Clase 0)'}
                </p>
                <p className="text-[#c99aa9]">
                  Probabilidad estimada:{' '}
                  <span className="font-bold text-white">
                    {(result.probability * 100).toFixed(2)}%
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
