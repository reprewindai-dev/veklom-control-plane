"use client";

import { useState } from "react";
import useSWR from "swr";
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  Shield,
  AlertTriangle,
  Copy,
  ExternalLink
} from "lucide-react";
import { 
  getProofs,
  getEvidencePack,
  verifyEvidencePack,
  downloadEvidencePack
} from "../../lib/seked-api";
import type { Proof, EvidencePack } from "../../types/seked";

interface VerificationStatusProps {
  status: string;
}

function VerificationStatus({ status }: VerificationStatusProps) {
  const config = {
    pending: { icon: Clock, color: "text-yellow-400", label: "Pending" },
    verified: { icon: CheckCircle, color: "text-green-400", label: "Verified" },
    failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  };

  const { icon: Icon, color, label } = config[status as keyof typeof config] || config.pending;

  return (
    <div className={`flex items-center gap-2 ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export default function EvidenceViewer() {
  const { data: proofs, error, mutate } = useSWR<Proof[]>("/proofs", getProofs);
  const [selectedEvidencePack, setSelectedEvidencePack] = useState<EvidencePack | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const handleVerifyEvidencePack = async (runId: string) => {
    setVerifying(runId);
    try {
      const evidencePack = await verifyEvidencePack(runId);
      setSelectedEvidencePack(evidencePack);
      mutate();
    } catch (error) {
      console.error("Failed to verify evidence pack:", error);
    } finally {
      setVerifying(null);
    }
  };

  const handleDownloadEvidencePack = async (runId: string) => {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (error) return <div className="text-red-500">Failed to load evidence</div>;
  if (!proofs) return <div>Loading evidence...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Evidence Viewer</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Shield className="w-4 h-4" />
          <span>{proofs.length} total proofs</span>
        </div>
      </div>

      {/* Evidence Pack Details Modal */}
      {selectedEvidencePack && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Evidence Pack Details</h3>
            <button
              onClick={() => setSelectedEvidencePack(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Pack ID:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white font-mono">{selectedEvidencePack.id}</span>
                  <button
                    onClick={() => copyToClipboard(selectedEvidencePack.id)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div>
                <span className="text-gray-400">Authority Run ID:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white font-mono">{selectedEvidencePack.authority_run_id}</span>
                  <button
                    onClick={() => copyToClipboard(selectedEvidencePack.authority_run_id)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div>
                <span className="text-gray-400">Created:</span>
                <span className="ml-2 text-white">
                  {new Date(selectedEvidencePack.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <div className="mt-1">
                  <VerificationStatus status={selectedEvidencePack.verification_status} />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Included Proofs ({selectedEvidencePack.proofs.length})</h4>
              <div className="space-y-2">
                {selectedEvidencePack.proofs.map((proof) => (
                  <div key={proof.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-gray-400" />
                      <span className="text-white">{proof.job_id}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">{proof.action}</span>
                    </div>
                    <span className="text-gray-400">
                      {new Date(proof.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleVerifyEvidencePack(selectedEvidencePack.authority_run_id)}
                disabled={verifying === selectedEvidencePack.authority_run_id}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Shield className="w-4 h-4" />
                {verifying === selectedEvidencePack.authority_run_id ? "Verifying..." : "Re-verify"}
              </button>
              <button
                onClick={() => handleDownloadEvidencePack(selectedEvidencePack.authority_run_id)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Pack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proofs List */}
      <div className="space-y-4">
        {proofs.map((proof) => (
          <div
            key={proof.id}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{proof.job_id}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    proof.action === "RUN" 
                      ? "bg-green-500/20 text-green-400"
                      : proof.action === "HOLD"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {proof.action}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Proof ID:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white font-mono text-xs">{proof.id}</span>
                      <button
                        onClick={() => copyToClipboard(proof.id)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Carbon Value:</span>
                    <span className="ml-2 text-white">{proof.carbon_value}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Policy:</span>
                    <span className="ml-2 text-white">{proof.policy_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Created:</span>
                    <span className="ml-2 text-white">
                      {new Date(proof.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 rounded p-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-400">Engine URL:</span>
                      <span className="ml-2 text-white text-xs break-all">{proof.engine_url}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Timestamp:</span>
                      <span className="ml-2 text-white">{proof.timestamp}</span>
                    </div>
                  </div>
                  {proof.evidence && Object.keys(proof.evidence).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <span className="text-gray-400">Evidence:</span>
                      <pre className="mt-1 text-xs text-gray-300 overflow-x-auto">
                        {JSON.stringify(proof.evidence, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleVerifyEvidencePack(proof.job_id)}
                  disabled={verifying === proof.job_id}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                >
                  <Shield className="w-3 h-3" />
                  Verify
                </button>
                <button
                  onClick={() => handleDownloadEvidencePack(proof.job_id)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
              </div>
            </div>
          </div>
        ))}
        {proofs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No evidence available</p>
            <p className="text-sm">Evidence will appear here when decisions are made</p>
          </div>
        )}
      </div>
    </div>
  );
}
