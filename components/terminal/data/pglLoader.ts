export interface PGLAgent {
  agent: string;
  pgl_id: string;
  run_id: string;
  status: string;
}

// Fallback registry for safety/dev if network fails
import fallbackRegistry from './veklom-agents/master-agent-army/pgl_registry.json';

// Toggles between live API vs Local Dev Backend based on VITE_ env vars
// If you want to force local, set VITE_USE_LOCAL_BACKEND=true in .env
export let API_BASE_URL = import.meta.env.VITE_USE_LOCAL_BACKEND === 'true' 
  ? 'http://localhost:8000' 
  : 'https://api.veklom.com';

let CAPPO_BASE_URL = import.meta.env.VITE_USE_LOCAL_BACKEND === 'true'
  ? 'http://localhost:8001'
  : 'https://api.cappo.veklom.com';

export const setCapiBaseUrl = (url: string) => {
  API_BASE_URL = url;
  // If it's a localhost URL, we might need to adjust CAPPO as well if they are on adjacent ports
  if (url.includes('localhost:8088')) {
     CAPPO_BASE_URL = 'http://localhost:8001'; // Standard CAPPO local
  }
};

export const establishBackendHandshake = async (): Promise<PGLAgent[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/pgl/registry`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Handshake failed with status ${response.status}`);
    }

    const data = await response.json();
    return data as PGLAgent[];
  } catch (error) {
    console.error('[HANDSHAKE ERROR] Failed to connect to backend PGL Registry. Falling back to local offline registry.', error);
    return fallbackRegistry as PGLAgent[];
  }
};

export interface ExecutionReceipt {
  status: string;
  intent_hash: string;
  verdict: string;
  evidence_chain_id: string;
  result?: any;
}

import { modal, config } from '../config/wagmi';
import { getAccount, sendTransaction } from '@wagmi/core';
import { parseEther } from 'viem';

export const triggerCAPIExecution = async (
  agent_id: string,
  pgl_id: string,
  target_protocol: string,
  action: string,
  payload: any,
  onProgress?: (log: string) => void
): Promise<ExecutionReceipt> => {
  const intent = {
    agent_id,
    pgl_id,
    target_protocol,
    action,
    payload
  };

  const generateHash = (prefix: string) => {
    return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
  };
  const traceId = generateHash('trx');

  const headers: any = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'X-Veklom-Origin-Node': API_BASE_URL,
    'X-Veklom-Trace-Id': traceId,
    'X-Veklom-Timestamp': Date.now().toString(),
    'X-Veklom-Audit-Sig': generateHash('sig')
  };

  let response = await fetch(`${API_BASE_URL}/api/v1/capi/execute`, {
    method: 'POST',
    headers,
    body: JSON.stringify(intent)
  });

  // x402 Interceptor Logic
  if (response.status === 402) {
    const prHeader = response.headers.get('payment-required');
    if (prHeader) {
      try {
        const decoded = JSON.parse(atob(prHeader));
        console.log('[x402] Payment Required:', decoded);
        
        const account = getAccount(config);
        if (!account.isConnected) {
          await modal.open();
          // Poll until wallet is connected
          await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
              if (getAccount(config).isConnected) {
                clearInterval(interval);
                resolve();
              }
            }, 1000);
          });
        }
        
        // At this point, the user is connected via Reown AppKit!
        const connectedAccount = getAccount(config);
        headers['X-Wallet-Address'] = connectedAccount.address;
        
        // For standard x402, we would send the on-chain tx here and attach the receipt.
        // For demo purposes and immediate verification of the real modal:
        alert(`Wallet Connected: ${connectedAccount.address}\n\nx402 Challenge Received:\nPrice: ${decoded.accepts[0]?.price}\nPay To: ${decoded.accepts[0]?.payTo}`);
        
        // Re-attempt request with authenticated wallet header
        response = await fetch(`${API_BASE_URL}/api/v1/capi/execute`, {
          method: 'POST',
          headers,
          body: JSON.stringify(intent)
        });
      } catch (err) {
        console.error('[x402] Failed to process payment challenge:', err);
      }
    }
  }

  if (!response.ok) {
    let errMessage = `cAPI execution failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errMessage = errorData.detail?.message || errorData.detail || errMessage;
    } catch { /* ignore */ }
    throw new Error(errMessage);
  }

  if (!response.body) throw new Error("No response body for streaming");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let receipt: ExecutionReceipt | null = null;
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ""; 
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.substring(6).trim();
        if (!dataStr) continue;
        try {
          const eventData = JSON.parse(dataStr);
          if (eventData.type === 'log') {
            if (onProgress) onProgress(`[Phase ${eventData.phase}] ${eventData.text}`);
          } else if (eventData.type === 'error') {
            throw new Error(eventData.detail?.message || eventData.detail || 'Execution error');
          } else if (eventData.type === 'receipt') {
            receipt = eventData.data;
          }
        } catch (e) {
          console.warn("Failed to parse SSE JSON:", dataStr);
        }
      }
    }
  }

  if (!receipt) {
    throw new Error("Stream closed without returning an execution receipt");
  }

  return receipt;
};

export interface WorkspaceOverview {
  workspace_id: string;
  plan: string;
  members_count: number;
  models_enabled: number;
  total_requests_today: number;
  requests_per_min: number;
  p50_latency_ms: number;
  tokens_per_sec: number;
  spend_today_usd: number;
  spend_cap_usd: number;
  spend_percent: number;
  spend_status: string;
  burn_rate_usd_per_min: number;
  forecast_eod_usd: number;
  budget_remaining_usd: number;
  active_pipelines: number;
  active_deployments: number;
  active_models: number;
  audit_entries: number;
  recent_runs: Array<{
    id: string;
    model: string;
    route: string;
    latency: number;
    tokens: number;
    cost: number;
    policy: string;
    ts: string;
  }>;
  policy_events: Array<{
    t: string;
    title: string;
    body: string;
    tone: string;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    severity: string;
    source: string;
    time: string;
  }>;
  audit_logs: Array<{
    id: string;
    action: string;
    target: string;
    actor: string;
    hash: string;
    ts: string;
  }>;
  fleet: Array<{
    id: string;
    name: string;
    quant: string;
    replicas: number;
    route: string;
    p50: number;
  }>;
  routing: {
    hetzner_percent: number;
    aws_percent: number;
    primary_region: string;
    burst_region: string;
    history: Array<{ t: string; hetzner: number; aws: number }>;
    regions: Array<{ label: string; value: string; sub: string; route: string }>;
  };
  updated_at: string;
}

export const fetchWorkspaceOverview = async (): Promise<WorkspaceOverview | null> => {
  try {
    const [veklomRes, cappoRes] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/api/v1/workspace/overview/live`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }),
      fetch(`${CAPPO_BASE_URL}/api/v1/workspace/overview/live`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })
    ]);

    let veklomData: WorkspaceOverview | null = null;
    let cappoData: WorkspaceOverview | null = null;

    if (veklomRes.status === 'fulfilled' && veklomRes.value.ok) {
      veklomData = await veklomRes.value.json() as WorkspaceOverview;
    }
    if (cappoRes.status === 'fulfilled' && cappoRes.value.ok) {
      cappoData = await cappoRes.value.json() as WorkspaceOverview;
      // Preemptively map cappo strings for distinct UI logs
      if (cappoData.recent_runs) {
        cappoData.recent_runs = cappoData.recent_runs.map(r => ({ ...r, route: 'CAPPO/' + r.route }));
      }
      if (cappoData.audit_logs) {
        cappoData.audit_logs = cappoData.audit_logs.map(l => ({ ...l, target: 'CAPPO/' + l.target }));
      }
    }

    if (!veklomData && !cappoData) {
      throw new Error('Both backends failed to return overview data.');
    }

    if (veklomData && cappoData) {
      // Merge data from both backends to give a unified view
      // We'll prioritize Veklom as the base and add Cappo data into it.
      const mergedData = { ...veklomData };
      mergedData.total_requests_today = (veklomData.total_requests_today || 0) + (cappoData.total_requests_today || 0);
      mergedData.tokens_per_sec = (veklomData.tokens_per_sec || 0) + (cappoData.tokens_per_sec || 0);
      mergedData.active_models = (veklomData.active_models || 0) + (cappoData.active_models || 0);
      mergedData.active_pipelines = (veklomData.active_pipelines || 0) + (cappoData.active_pipelines || 0);

      // Merge arrays
      mergedData.recent_runs = [...(veklomData.recent_runs || []), ...(cappoData.recent_runs || [])];
      mergedData.audit_logs = [...(veklomData.audit_logs || []), ...(cappoData.audit_logs || [])];
      mergedData.policy_events = [...(veklomData.policy_events || []), ...(cappoData.policy_events || [])];
      mergedData.alerts = [...(veklomData.alerts || []), ...(cappoData.alerts || [])];

      // Sort arrays by timestamp descending
      mergedData.recent_runs.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
      mergedData.audit_logs.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

      return mergedData;
    }

    return veklomData || cappoData;

  } catch (error) {
    console.error('[OVERVIEW ERROR] Failed to fetch workspace overview from backends.', error);
    return null;
  }
};

