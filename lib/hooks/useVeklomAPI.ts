// lib/hooks/useVeklomAPI.ts
import { useState, useCallback } from 'react';
import { apiBaseUrl } from '../api';

const API_BASE = process.env.NEXT_PUBLIC_VEKLOM_API_URL || apiBaseUrl();
const API_KEY = process.env.NEXT_PUBLIC_VEKLOM_API_KEY || 'demo_key';

export interface APIError {
  message: string;
  status?: number;
  code?: string;
}

export function useVeklomAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);

  const request = useCallback(
    async <T,>(
      endpoint: string,
      options?: {
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        body?: any;
        headers?: Record<string, string>;
        useAuth?: boolean;
      }
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const url = `${API_BASE}${endpoint}`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...options?.headers,
        };

        if (options?.useAuth !== false) {
          headers['X-API-Key'] = API_KEY;
        }

        const response = await fetch(url, {
          method: options?.method || 'GET',
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText}`
          );
        }

        const data: T = await response.json();
        return data;
      } catch (err) {
        const apiError: APIError = {
          message: err instanceof Error ? err.message : 'Unknown error',
          status: err instanceof Error ? undefined : undefined,
        };
        setError(apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { request, loading, error };
}

// lib/hooks/useSystemStatus.ts
export function useSystemStatus() {
  const { request, loading, error } = useVeklomAPI();

  const getStatus = useCallback(async () => {
    return request('/status', { useAuth: false });
  }, [request]);

  return { getStatus, loading, error };
}

// lib/hooks/useExecution.ts
export interface ExecutionRequest {
  prompt: string;
  model?: string;
  conversation_id?: string;
  use_memory?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface ExecutionResponse {
  response: string;
  provider: 'ollama' | 'groq';
  model: string;
  conversation_id?: string;
  tenant_id: string;
  log_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
}

export function useExecution() {
  const { request, loading, error } = useVeklomAPI();

  const execute = useCallback(
    async (payload: ExecutionRequest) => {
      return request<ExecutionResponse>('/v1/exec', {
        method: 'POST',
        body: payload,
      });
    },
    [request]
  );

  return { execute, loading, error };
}

// lib/hooks/useCostPrediction.ts
export interface CostPredictionRequest {
  operation_type: string;
  provider: string;
  input_text: string;
  model: string;
}

export interface CostPredictionResponse {
  predicted_cost: string;
  confidence_lower: string;
  confidence_upper: string;
  accuracy_score: number;
  alternative_providers: Array<{
    provider: string;
    cost: string;
    savings_percent: number;
  }>;
}

export function useCostPrediction() {
  const { request, loading, error } = useVeklomAPI();

  const predict = useCallback(
    async (payload: CostPredictionRequest) => {
      return request<CostPredictionResponse>(
        '/api/v1/cost/predict',
        {
          method: 'POST',
          body: payload,
        }
      );
    },
    [request]
  );

  return { predict, loading, error };
}

// lib/hooks/useBenchmarks.ts
export interface BenchmarkLeaderboard {
  leaderboard: Array<{
    id: string;
    name: string;
    provider: string;
    latency_p50: number;
    latency_p95: number;
    latency_p99: number;
    sla_success_percent: number;
    drift_index: number;
    trust_score: number;
    sovereign_tier: string;
    staked_amount: number;
    category: string;
  }>;
}

export interface StakingMarkets {
  markets: Array<{
    id: string;
    api_id: string;
    api_name: string;
    yes_price: number;
    no_price: number;
    yes_volume: number;
    no_volume: number;
    target_resolution_date: string;
    status: 'open' | 'closed' | 'resolved';
  }>;
}

export interface OracleLogs {
  logs: Array<{
    id: string;
    timestamp: string;
    api_name: string;
    latency_ms: number;
    success: boolean;
    message: string;
  }>;
}

export function useBenchmarks() {
  const { request, loading, error } = useVeklomAPI();

  const getLeaderboard = useCallback(async () => {
    return request<BenchmarkLeaderboard>(
      '/api/v1/benchmarks/leaderboard',
      { useAuth: false }
    );
  }, [request]);

  const getStakingMarkets = useCallback(async () => {
    return request<StakingMarkets>(
      '/api/v1/benchmarks/staking/markets',
      { useAuth: false }
    );
  }, [request]);

  const placeBet = useCallback(
    async (payload: {
      pool_id: string;
      amount: number;
      choice: 'yes' | 'no';
    }) => {
      return request('/api/v1/benchmarks/staking/stake', {
        method: 'POST',
        body: payload,
      });
    },
    [request]
  );

  const getLogs = useCallback(async () => {
    return request<OracleLogs>(
      '/api/v1/benchmarks/logs',
      { useAuth: false }
    );
  }, [request]);

  return {
    getLeaderboard,
    getStakingMarkets,
    placeBet,
    getLogs,
    loading,
    error,
  };
}

// lib/hooks/useBilling.ts
export interface WalletBalance {
  balance_usd: number;
  currency: string;
}

export function useBilling() {
  const { request, loading, error } = useVeklomAPI();

  const getBalance = useCallback(async () => {
    return request<WalletBalance>(
      '/api/v1/wallet/balance'
    );
  }, [request]);

  return { getBalance, loading, error };
}

// lib/hooks/useAuth.ts
export interface CurrentUser {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  workspace_id: string;
}

export function useAuth() {
  const { request, loading, error } = useVeklomAPI();

  const getCurrentUser = useCallback(async () => {
    return request<CurrentUser>(
      '/api/v1/auth/me'
    );
  }, [request]);

  return { getCurrentUser, loading, error };
}
