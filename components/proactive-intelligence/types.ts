export interface CircuitState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  threshold: number;
  cooldown_seconds: number;
}

export interface Alert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  created_at: string;
  resolved: boolean;
}

export interface Insights {
  total_requests_today: number;
  avg_latency_ms: number;
  error_rate_percent: number;
  top_models: { model: string; calls: number }[];
  provider_split: { ollama?: number; groq?: number; [k: string]: number | undefined };
}

export interface Budget {
  amount: string;
  current_spend: string;
  remaining: string;
  percent_used: number;
  forecast_exhaustion_date?: string;
  alert_level: 'ok' | 'warning' | 'critical' | 'exhausted';
}

export interface SecStats {
  security_score: number;
  open: number;
  critical: number;
}

export interface AiRec {
  recommended_provider: string;
  recommended_model: string;
  expected_quality: number;
  expected_cost: string;
}

export interface Intelligence {
  circuit: CircuitState | null;
  alerts: Alert[];
  insights: Insights | null;
  budget: Budget | null;
  security: SecStats | null;
  aiRec: AiRec | null;
  lastRefreshed: Date;
  loading: boolean;
}
