"use client";

import { useState } from "react";
import { 
  Bot, 
  Cpu, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Zap,
  Shield,
  Target,
  Brain
} from "lucide-react";
import useSWR from "swr";
import { api } from "../../lib/api";
import type { 
  SekedMeasurement, 
  SekedRatios, 
  SekedDirective, 
  SekedState 
} from "../../types/seked";

interface AgentState {
  agent_id: string;
  name: string;
  status: "active" | "idle" | "error" | "recovering";
  measurement: SekedMeasurement;
  ratios: SekedRatios;
  directive: SekedDirective;
  last_updated: string;
  performance_metrics: {
    response_time_ms: number;
    success_rate: number;
    error_rate: number;
    throughput: number;
  };
}

interface AgentMetricProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  threshold?: number;
}

function AgentMetric({ label, value, max, unit, color, threshold }: AgentMetricProps) {
  const percentage = (value / max) * 100;
  const isThresholdExceeded = threshold && value > threshold;
  
  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">{label}</span>
        <span className={`text-lg font-bold ${isThresholdExceeded ? 'text-red-400' : 'text-white'}`}>
          {value}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all ${color} ${isThresholdExceeded ? 'opacity-100' : 'opacity-80'}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {threshold && (
        <div className="text-xs text-gray-500 mt-1">
          Threshold: {threshold}{unit}
        </div>
      )}
    </div>
  );
}

function AgentStatusBadge({ status }: { status: string }) {
  const config = {
    active: { color: "bg-green-500/20 text-green-400 border-green-500/50", icon: CheckCircle },
    idle: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50", icon: Activity },
    error: { color: "bg-red-500/20 text-red-400 border-red-500/50", icon: AlertTriangle },
    recovering: { color: "bg-blue-500/20 text-blue-400 border-blue-500/50", icon: TrendingUp },
  };

  const { color, icon: Icon } = config[status as keyof typeof config] || config.idle;

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon className="w-3 h-3" />
      {status.toUpperCase()}
    </div>
  );
}

export default function AgentSekedMonitoring() {
  const { data: agents, error, mutate } = useSWR<AgentState[]>("/api/v1/seked/agents", api);

  // Mock data for demonstration
  const mockAgents: AgentState[] = [
    {
      agent_id: "agent-001-stripe",
      name: "Stripe Connect Engineer",
      status: "active",
      measurement: { E: 8, R: 2, C: 7, D: 9, S: 6, timestamp: new Date().toISOString() },
      ratios: { sigma: 5.67, ci: 0.88, si: 0.6 },
      directive: {
        ratio: 5.67,
        directive: "Execute payment processing with enhanced monitoring",
        action_type: "EXECUTE",
        confidence: 0.92,
        reasoning: "High energy and drive with low resistance indicates optimal execution state"
      },
      last_updated: new Date().toISOString(),
      performance_metrics: {
        response_time_ms: 245,
        success_rate: 0.98,
        error_rate: 0.02,
        throughput: 1250
      }
    },
    {
      agent_id: "agent-002-referral",
      name: "Referral System Engineer", 
      status: "recovering",
      measurement: { E: 4, R: 6, C: 5, D: 3, S: 4, timestamp: new Date().toISOString() },
      ratios: { sigma: 0.88, ci: 0.56, si: 0.4 },
      directive: {
        ratio: 0.88,
        directive: "Conserve resources and implement recovery protocols",
        action_type: "RECOVER",
        confidence: 0.75,
        reasoning: "Low energy and high resistance indicates need for recovery"
      },
      last_updated: new Date().toISOString(),
      performance_metrics: {
        response_time_ms: 892,
        success_rate: 0.85,
        error_rate: 0.15,
        throughput: 450
      }
    }
  ];

  const agentData = agents || mockAgents;

  if (error) return <div className="text-red-500">Failed to load agent data</div>;
  if (!agents && !mockAgents) return <div>Loading agent monitoring...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Agent SEKED Monitoring</h2>
          <p className="text-gray-400 mt-1">
            Real-time agent state measurement using σ = (E + D) / (R + 1)
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Bot className="w-4 h-4" />
          <span>{agentData.length} agents monitored</span>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Agents</p>
              <p className="text-2xl font-bold text-green-400">
                {agentData.filter(a => a.status === "active").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Sigma (σ)</p>
              <p className="text-2xl font-bold text-blue-400">
                {(agentData.reduce((sum, a) => sum + a.ratios.sigma, 0) / agentData.length).toFixed(2)}
              </p>
            </div>
            <Brain className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Recovering</p>
              <p className="text-2xl font-bold text-yellow-400">
                {agentData.filter(a => a.status === "recovering").length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Error Rate</p>
              <p className="text-2xl font-bold text-red-400">
                {(agentData.reduce((sum, a) => sum + a.performance_metrics.error_rate, 0) / agentData.length * 100).toFixed(1)}%
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="space-y-4">
        {agentData.map((agent) => (
          <div key={agent.agent_id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                  <p className="text-sm text-gray-400 font-mono">{agent.agent_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AgentStatusBadge status={agent.status} />
                <span className="text-xs text-gray-500">
                  {new Date(agent.last_updated).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* SEKED Metrics */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">SEKED State Measurements</h4>
              <div className="grid grid-cols-5 gap-3">
                <AgentMetric
                  label="Energy (E)"
                  value={agent.measurement.E}
                  max={9}
                  unit=""
                  color="bg-yellow-500"
                  threshold={7}
                />
                <AgentMetric
                  label="Resistance (R)"
                  value={agent.measurement.R}
                  max={9}
                  unit=""
                  color="bg-red-500"
                  threshold={5}
                />
                <AgentMetric
                  label="Clarity (C)"
                  value={agent.measurement.C}
                  max={9}
                  unit=""
                  color="bg-blue-500"
                  threshold={6}
                />
                <AgentMetric
                  label="Drive (D)"
                  value={agent.measurement.D}
                  max={9}
                  unit=""
                  color="bg-green-500"
                  threshold={7}
                />
                <AgentMetric
                  label="Stability (S)"
                  value={agent.measurement.S}
                  max={9}
                  unit=""
                  color="bg-purple-500"
                  threshold={6}
                />
              </div>
            </div>

            {/* Ratios and Directive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">SEKED Ratios</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sigma (σ):</span>
                    <span className="text-white font-mono">{agent.ratios.sigma}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cognitive Index:</span>
                    <span className="text-white font-mono">{agent.ratios.ci}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stability Index:</span>
                    <span className="text-white font-mono">{agent.ratios.si}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Current Directive</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      agent.directive.action_type === 'EXECUTE' ? 'bg-green-500/20 text-green-400' :
                      agent.directive.action_type === 'RECOVER' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {agent.directive.action_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(agent.directive.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-white">{agent.directive.directive}</p>
                  <p className="text-xs text-gray-400">{agent.directive.reasoning}</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Performance Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Response Time:</span>
                  <span className="ml-2 text-white font-mono">{agent.performance_metrics.response_time_ms}ms</span>
                </div>
                <div>
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="ml-2 text-white font-mono">{(agent.performance_metrics.success_rate * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Error Rate:</span>
                  <span className="ml-2 text-white font-mono">{(agent.performance_metrics.error_rate * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Throughput:</span>
                  <span className="ml-2 text-white font-mono">{agent.performance_metrics.throughput}/min</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
