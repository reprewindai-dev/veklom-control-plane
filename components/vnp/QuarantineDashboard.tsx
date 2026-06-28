import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { AlertTriangle, CheckCircle, XCircle, ShieldAlert, Clock, Terminal } from 'lucide-react';

interface QuarantinedIntent {
  id: string;
  agent_id: string;
  target_protocol: string;
  action: string;
  payload: Record<string, any>;
  phase: number;
  reason: string;
  timestamp: string;
  status: string;
}

export default function QuarantineDashboard() {
  const [intents, setIntents] = useState<QuarantinedIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuarantined = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/api/v1/capi/quarantine');
      setIntents(res.data.quarantined || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quarantined intents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuarantined();
    const interval = setInterval(fetchQuarantined, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/api/v1/capi/quarantine/${id}/resolve`, {
        action,
        reason: `Human operator manual ${action}`
      });
      // Optimistic update
      setIntents(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      alert(`Failed to resolve: ${err.message}`);
    }
  };

  if (loading && intents.length === 0) {
    return <div className="text-slate-500 font-mono text-[10px] p-4">Loading Quarantine Inbox...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-[#8B5CF6] font-bold text-sm tracking-wider uppercase flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Human Review Inbox (Phase 5)
          </h3>
          <p className="text-[10px] text-slate-500 font-mono mt-1">Pending anomalous execution intents awaiting M-of-N quorum</p>
        </div>
        <div className="text-[10px] font-mono bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-800">
          Total Quarantined: <span className="text-[#8B5CF6] font-bold">{intents.length}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-[11px]">
          {error}
        </div>
      )}

      {intents.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-[11px] font-mono border border-slate-800/50 rounded-lg bg-slate-900/20 flex flex-col items-center gap-2">
          <CheckCircle className="w-6 h-6 text-slate-700" />
          No agents are currently quarantined.
        </div>
      ) : (
        <div className="space-y-4">
          {intents.map(intent => (
            <div key={intent.id} className="border border-[#8B5CF6]/30 bg-[#8B5CF6]/[0.02] rounded-xl overflow-hidden flex flex-col">
              
              <div className="p-4 flex justify-between items-start border-b border-[#8B5CF6]/10">
                <div className="flex gap-3">
                  <div className="mt-1">
                    <AlertTriangle className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold text-xs">{intent.action}</span>
                      <span className="text-[9px] font-mono bg-[#8B5CF6]/20 text-[#8B5CF6] px-1.5 py-0.5 rounded border border-[#8B5CF6]/30">
                        {intent.id}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Agent: <span className="text-slate-300">{intent.agent_id}</span> | Protocol: <span className="text-slate-300">{intent.target_protocol}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {new Date(intent.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-[9px] text-[#FF003C] font-mono mt-1 uppercase tracking-widest font-bold">
                    {intent.reason.replace('QUARANTINED: ', '')}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/50">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Terminal className="w-3 h-3" /> Execution Payload
                </div>
                <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto custom-scrollbar p-3 bg-black/60 rounded border border-slate-800">
                  {JSON.stringify(intent.payload, null, 2)}
                </pre>
              </div>

              <div className="p-3 border-t border-[#8B5CF6]/10 bg-slate-900/50 flex gap-3">
                <button 
                  onClick={() => handleResolve(intent.id, 'approve')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded border border-[#00FF66]/30 text-[#00FF66] hover:bg-[#00FF66]/10 text-xs font-bold transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve & Execute
                </button>
                <button 
                  onClick={() => handleResolve(intent.id, 'reject')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded border border-[#FF003C]/30 text-[#FF003C] hover:bg-[#FF003C]/10 text-xs font-bold transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject Intent
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
