"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Fingerprint, 
  Activity, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  User,
  FileText,
  Zap,
  Target,
  Brain
} from "lucide-react";
import useSWR from "swr";
import { api } from "../../lib/api";

interface AuthorityContext {
  authority_run?: {
    id: string;
    status: string;
    start_time: string;
    seked_initial_measurement?: any;
    seked_final_directive?: any;
  };
  agent?: {
    id: string;
    name: string;
    certificate_id: string;
    genome_hash: string;
    trust_score: number;
  };
  authority_bundle?: {
    name: string;
    risk_level: string;
    tool_permissions: any;
  };
  seked_state?: {
    measurement: any;
    ratios: any;
    directive: any;
  };
  budget?: {
    approved_cents: number;
    remaining_cents: number;
    currency: string;
  };
  evidence?: {
    pack_id: string;
    audit_hash: string;
    compliance_status: string;
  };
}

interface AuthorityPanelProps {
  agentId?: string;
  authorityRunId?: string;
  workspaceId?: string;
  compact?: boolean;
}

export default function AuthorityPanel({ 
  agentId, 
  authorityRunId, 
  workspaceId,
  compact = false 
}: AuthorityPanelProps) {
  const [expanded, setExpanded] = useState(!compact);

  // Build query params
  const queryParams = new URLSearchParams();
  if (agentId) queryParams.set('agent_id', agentId);
  if (authorityRunId) queryParams.set('authority_run_id', authorityRunId);
  if (workspaceId) queryParams.set('workspace_id', workspaceId);

  const { data: context, error } = useSWR<AuthorityContext>(
    `/api/v1/authority/context?${queryParams.toString()}`,
    api
  );

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Authority context unavailable</span>
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-2 text-gray-400">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Loading authority context...</span>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'approved':
        return 'text-green-400';
      case 'pending':
      case 'preparing':
        return 'text-yellow-400';
      case 'failed':
      case 'denied':
      case 'revoked':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'approved':
        return CheckCircle;
      case 'pending':
      case 'preparing':
        return Clock;
      case 'failed':
      case 'denied':
      case 'revoked':
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'text-green-400 bg-green-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'high':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const StatusIcon = context.authority_run?.status ? 
    getStatusIcon(context.authority_run.status) : Activity;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-white">Authority Panel</span>
          {context.authority_run?.status && (
            <div className={`flex items-center gap-1 ${getStatusColor(context.authority_run.status)}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm capitalize">{context.authority_run.status}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {context.authority_bundle?.risk_level && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(context.authority_bundle.risk_level)}`}>
              {context.authority_bundle.risk_level.toUpperCase()}
            </span>
          )}
          <Activity className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            
            {/* Identity Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Fingerprint className="w-4 h-4" />
                Identity
              </div>
              
              {context.agent && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Agent:</span>
                    <span className="text-white">{context.agent.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Certificate:</span>
                    <span className="text-white font-mono text-xs">
                      {context.agent.certificate_id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trust Score:</span>
                    <span className="text-white">{context.agent.trust_score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Genome Hash:</span>
                    <span className="text-white font-mono text-xs">
                      {context.agent.genome_hash.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SEKED Policy Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Brain className="w-4 h-4" />
                SEKED Policy
              </div>
              
              {context.seked_state && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sigma (σ):</span>
                    <span className="text-white font-mono">{context.seked_state.ratios?.sigma}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Directive:</span>
                    <span className="text-white capitalize">
                      {context.seked_state.directive?.action_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-white">
                      {Math.round((context.seked_state.directive?.confidence || 0) * 100)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 mt-2">
                    "{context.seked_state.directive?.directive}"
                  </div>
                </div>
              )}
            </div>

            {/* Budget Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <DollarSign className="w-4 h-4" />
                Budget
              </div>
              
              {context.budget && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Approved:</span>
                    <span className="text-white">
                      ${(context.budget.approved_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Remaining:</span>
                    <span className={`font-medium ${
                      context.budget.remaining_cents > 1000 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      ${(context.budget.remaining_cents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        context.budget.remaining_cents > 1000 ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ 
                        width: `${(context.budget.remaining_cents / context.budget.approved_cents) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Authority Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Shield className="w-4 h-4" />
                Authority
              </div>
              
              {context.authority_run && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Run ID:</span>
                    <span className="text-white font-mono text-xs">
                      {context.authority_run.id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Started:</span>
                    <span className="text-white">
                      {new Date(context.authority_run.start_time).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bundle:</span>
                    <span className="text-white">{context.authority_bundle?.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Risk Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <AlertTriangle className="w-4 h-4" />
                Risk
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(context.authority_bundle?.risk_level || 'medium')}`}>
                    {context.authority_bundle?.risk_level?.toUpperCase() || 'MEDIUM'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tools Allowed:</span>
                  <span className="text-white">
                    {Object.keys(context.authority_bundle?.tool_permissions || {}).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Evidence Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <FileText className="w-4 h-4" />
                Evidence
              </div>
              
              {context.evidence && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pack ID:</span>
                    <span className="text-white font-mono text-xs">
                      {context.evidence.pack_id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Compliance:</span>
                    <span className={`capitalize ${
                      context.evidence.compliance_status === 'compliant' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {context.evidence.compliance_status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Audit Hash:</span>
                    <span className="text-white font-mono text-xs">
                      {context.evidence.audit_hash.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
