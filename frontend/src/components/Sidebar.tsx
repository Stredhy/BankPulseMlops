import {
  Activity,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  Sparkles,
  Workflow,
} from 'lucide-react';
import type { ActiveSection } from '../types/dashboard';

interface SidebarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  apiConnected: boolean;
  airflowConnected: boolean;
}

const navItems: { id: ActiveSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Resumen MLOps', icon: LayoutDashboard },
  { id: 'experiments', label: 'MLflow & Modelo', icon: FlaskConical },
  { id: 'drift', label: 'Datos & Drift', icon: Activity },
  { id: 'predict', label: 'Inferencia en Vivo', icon: Sparkles },
  { id: 'pipeline', label: 'Airflow & CI/CD', icon: Workflow },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  apiConnected,
  airflowConnected,
}: SidebarProps) {
  return (
    <aside className="w-68 shrink-0 border-r border-[#3b1522] bg-[#12080c] flex flex-col justify-between min-h-screen">
      <div>
        <div className="p-6 border-b border-[#3b1522]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#8f1d44] to-[#4a0e23] border border-[#b52b5b]/40 flex items-center justify-center shadow-lg shadow-[#6b1432]/30">
              <Activity className="h-5 w-5 text-[#ffd6e3]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#fdf2f5]">
                BankPulse
              </h1>
              <p className="text-xs text-[#b88b9b]">MLOps Control Center</p>
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1f0d14] border border-[#421827] text-[11px] text-[#e5b3c4]">
            <GitBranch className="h-3.5 w-3.5 text-[#d9467a]" />
            <span>feat/webDashboard</span>
          </div>
        </div>

        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#6e1634] to-[#4a0f23] text-white border border-[#a82853]/60 shadow-md shadow-[#59112a]/40'
                    : 'text-[#c99aa9] hover:text-[#fdf2f5] hover:bg-[#1c0c12]'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? 'text-[#ff9ec0]' : 'text-[#9e6b7c]'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 m-4 rounded-xl bg-[#180b10] border border-[#381421] space-y-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9e6b7c]">
          Estado de Servicios
        </p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#d6aebc]">FastAPI (:8000)</span>
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${
              apiConnected ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                apiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {apiConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#d6aebc]">Airflow (:8080)</span>
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${
              airflowConnected ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                airflowConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {airflowConnected ? 'Activo' : 'Detenido'}
          </span>
        </div>
      </div>
    </aside>
  );
}
