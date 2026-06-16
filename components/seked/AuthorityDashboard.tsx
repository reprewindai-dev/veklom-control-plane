"use client";

import { useState } from "react";
import useSWR from "swr";
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Eye,
  RefreshCw 
} from "lucide-react";
import { 
  getAuthorityRuns,
  approveAuthorityRun,
  rejectAuthorityRun,
  getEvidencePack,
  downloadEvidencePack
} from "../../lib/seked-api";
import type { AuthorityRun, DecisionResponse } from "../../types/seked";

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const colors = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    approved: "bg-green-500/20 text-green-400 border-green-500/50",
    rejected: "bg-red-500/20 text-red-400 border-red-500/50",
    executed: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors] || "bg-gray-500/20 text-gray-400 border-gray-500/50"}`}>
      {status.toUpperCase()}
    </span>
  );
}

interface ActionBadgeProps {
  action: string;
}

function ActionBadge({ action }: ActionBadgeProps) {
  const colors = {
    RUN: "bg-green-500/20 text-green-400",
    HOLD: "bg-yellow-500/20 text-yellow-400",
    BLOCK: "bg-red-500/20 text-red-400",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[action as keyof typeof colors] || "bg-gray-500/20 text-gray-400"}`}>
      {action}
    </span>
  );
}

export default function AuthorityDashboard() {
  const { data: runs, error, mutate } = useSWR<AuthorityRun[]>("/authority-runs", getAuthorityRuns);
  const [selectedRun, setSelectedRun] = useState<AuthorityRun | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (runId: string) => {
    setLoading(runId);
    try {
      await approveAuthorityRun(runId);
      mutate();
    } catch (error) {
      console.error("Failed to approve run:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (runId: string, reason?: string) => {
    setLoading(runId);
    try {
      await rejectAuthorityRun(runId, reason);
      mutate();
    } catch (error) {
      console.error("Failed to reject run:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleViewEvidence = async (runId: string) => {
    try {
      const evidencePack = await getEvidencePack(runId);
      setSelectedRun(runs?.find(r => r.id === runId) || null);
      // In a real implementation, you'd show a modal with evidence details
      console.log("Evidence pack:", evidencePack);
    } catch (error) {
      console.error("Failed to load evidence pack:", error);
    }
  };

  const handleDownloadEvidence = async (runId: string) => {
    try {
      const blob = await downloadEvidencePack(runId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evidence-pack-${runId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download evidence pack:", error);
    }
  };

  if (error) return <div className="text-red-500">Failed to load authority runs</div>;
  if (!runs) return <div>Loading authority runs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Authority Dashboard</h2>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Runs</p>
              <p className="text-2xl font-bold text-white">{runs.length}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">
                {runs.filter(r => r.status === "pending").length}
              </p>
            </div>
            <Pause className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Approved</p>
              <p className="text-2xl font-bold text-green-400">
                {runs.filter(r => r.status === "approved").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-red-400">
                {runs.filter(r => r.status === "rejected").length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Authority Runs List */}
      <div className="space-y-4">
        {runs.map((run) => (
          <div
            key={run.id}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{run.job_id}</h3>
                  <StatusBadge status={run.status} />
                  {run.decision && <ActionBadge action={run.decision.action} />}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Run ID:</span>
                    <span className="ml-2 text-white font-mono">{run.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Created:</span>
                    <span className="ml-2 text-white">
                      {new Date(run.created_at).toLocaleString()}
                    </span>
                  </div>
                  {run.decision && (
                    <div>
                      <span className="text-gray-400">Carbon Value:</span>
                      <span className="ml-2 text-white">{run.decision.carbon_value}</span>
                    </div>
                  )}
                </div>

                {run.decision && (
                  <div className="bg-gray-900 rounded p-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-400">Delay:</span>
                        <span className="ml-2 text-white">{run.decision.delay_seconds}s</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Proof ID:</span>
                        <span className="ml-2 text-white font-mono">{run.decision.proof_id}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                {run.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(run.id)}
                      disabled={loading === run.id}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(run.id, "Manual rejection")}
                      disabled={loading === run.id}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                {(run.status === "approved" || run.status === "executed") && (
                  <>
                    <button
                      onClick={() => handleViewEvidence(run.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Evidence
                    </button>
                    <button
                      onClick={() => handleDownloadEvidence(run.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {runs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No authority runs yet</p>
            <p className="text-sm">Runs will appear here when decisions are requested</p>
          </div>
        )}
      </div>
    </div>
  );
}
