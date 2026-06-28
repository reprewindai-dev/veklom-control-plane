"use client";
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { config, queryClient } from './config/wagmi';
import App from './App.tsx';
import './index.css';
import { controlStore } from './data/simulation';

// Simple API Interceptor for Quantum Terminal
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const url = args[0].toString();

  if (url.includes('/api/agents/task-force')) {
    return new Response(JSON.stringify(controlStore.agents), { status: 200 });
  }
  if (url.includes('/api/uacp/hub/metrics')) {
    return new Response(JSON.stringify({
      determinism_ratio: 3.0,
      certainty_index: 0.9999,
      latency: 12.8,
      active_agents_consensus: 84,
      operational_plane_locked: true
    }), { status: 200 });
  }
  if (url.includes('/api/pgl/genome')) {
    return new Response(JSON.stringify({
      hash: 'a1b2c3d4',
      layers: {
        model: 'Olmo3-Hybrid',
        prompt: 'PGL-Constitutional',
        policy: 'Article-12',
        watchtower: 'MELT-Guard'
      },
      timestamp: new Date().toISOString()
    }), { status: 200 });
  }
  if (url.includes('/api/pgl/ledger')) {
    return new Response(JSON.stringify([
      { id: 'g1', type: 'genome', label: 'Root Genome' },
      { id: 'g2', type: 'genome', label: 'Current State' }
    ]), { status: 200 });
  }
  if (url.includes('/api/status')) {
    return new Response(JSON.stringify({
      status: 'healthy',
      llm_model: 'Olmo3-Hybrid',
      uptime_seconds: 123456,
      llm_ok: true,
      circuit_breaker: { state: 'CLOSED' }
    }), { status: 200 });
  }
  if (url.includes('/api/quantum-metrics')) {
    return new Response(JSON.stringify({
      fidelity: 99.8,
      leakage_rate: 0.001,
      zeno_cycles: 1024,
      timestamp: new Date().toISOString()
    }), { status: 200 });
  }

  return originalFetch(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
