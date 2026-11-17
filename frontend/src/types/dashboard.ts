export interface MlflowRun {
  runIndex: number;
  runId: string;
  runName: string;
  status: string;
  startTime: string | null;
  metrics: {
    accuracy?: number;
    rocAuc?: number;
    averagePrecision?: number;
  };
  params: Record<string, string>;
}

export interface DriftFeatureDetail {
  statistic: number;
  pValue: number;
  driftDetected: boolean;
}

export interface DashboardSummary {
  timestamp: string;
  api: {
    connected: boolean;
    version: string;
    metrics: {
      totalRequests: number;
      requestsByEndpoint: Record<string, number>;
      predictionsByClass: Record<string, number>;
      totalPredictions: number;
      avgLatencyMs: number | null;
    };
  };
  mlflow: {
    available: boolean;
    reason: string | null;
    experimentName: string;
    runs: MlflowRun[];
  };
  dataMonitoring: {
    available: boolean;
    reason: string | null;
    dvcTracked: boolean;
    referenceRows: number | null;
    currentRows: number | null;
    drift: {
      totalFeatures: number;
      driftedFeatures: number;
      driftDetected: boolean;
      features: Record<string, DriftFeatureDetail>;
    } | null;
  };
  airflow: {
    connected: boolean;
    dagId: string;
    schedule: string;
    recentLogs: string[];
  };
  artifacts: {
    modelReady: boolean;
    modelSizeKb: number | null;
    modelUpdatedAt: string | null;
    ciWorkflowConfigured: boolean;
  };
}

export type ActiveSection = 'overview' | 'experiments' | 'drift' | 'predict' | 'pipeline';
