"use client";

import { useState } from "react";
import { 
  GitBranch, 
  Shield, 
  Play, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  FileText,
  Settings,
  Zap,
  Target,
  Brain
} from "lucide-react";
import AuthorityPanel from "../../components/authority/AuthorityPanel";
import useSWR from "swr";
import { api } from "../../lib/api";

interface BuildStage {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  icon: React.ElementType;
  description: string;
  evidence?: any;
  seked_decision?: any;
}

interface BuildRun {
  id: string;
  source: {
    type: "repo" | "prompt" | "tool";
    url: string;
    branch?: string;
    commit?: string;
  };
  current_stage: string;
  stages: BuildStage[];
  authority_run_id: string;
  created_at: string;
  updated_at: string;
}

export default function BuildReleasePage() {
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [activeBuildRun, setActiveBuildRun] = useState<BuildRun | null>(null);

  const { data: buildRuns, mutate: mutateBuildRuns } = useSWR<BuildRun[]>(
    "/api/v1/build-release/runs",
    api
  );

  const buildStages: Omit<BuildStage, "id" | "status" | "evidence" | "seked_decision">[] = [
    {
      name: "Source",
      icon: GitBranch,
      description: "Connected source repository or prompt"
    },
    {
      name: "Risk",
      icon: Shield,
      description: "RepoGate risk assessment and security scan"
    },
    {
      name: "Plan",
      icon: Settings,
      description: "GPC governed plan compilation"
    },
    {
      name: "Authority",
      icon: Target,
      description: "PGL authority profile and SEKED policy validation"
    },
    {
      name: "Payment",
      icon: DollarSign,
      description: "x402 payment gate and budget verification"
    },
    {
      name: "Test",
      icon: Play,
      description: "Runtime test and dry-run execution"
    },
    {
      name: "Evidence",
      icon: FileText,
      description: "Evidence pack generation and compliance check"
    },
    {
      name: "Release",
      icon: CheckCircle,
      description: "Human release gate and deployment approval"
    }
  ];

  const startBuild = async (sourceUrl: string, sourceType: "repo" | "prompt" | "tool") => {
    setIsBuilding(true);
    
    try {
      const response = await api("/api/v1/build-release/start", {
        method: "POST",
        body: JSON.stringify({
          source: {
            type: sourceType,
            url: sourceUrl,
            branch: "main"
          }
        })
      });

      const buildRun: BuildRun = await response.json();
      setActiveBuildRun(buildRun);
      mutateBuildRuns();
    } catch (error) {
      console.error("Failed to start build:", error);
    } finally {
      setIsBuilding(false);
    }
  };

  const getStageStatus = (stageName: string, buildRun: BuildRun | null) => {
    if (!buildRun) return "pending";
    
    const stage = buildRun.stages.find(s => s.name === stageName);
    return stage?.status || "pending";
  };

  const getStageIcon = (stage: BuildStage) => {
    const Icon = stage.icon;
    const status = getStageStatus(stage.name, activeBuildRun);
    
    return (
      <div className={`p-3 rounded-lg border ${
        status === "completed" ? "bg-green-500/20 border-green-500/50" :
        status === "running" ? "bg-blue-500/20 border-blue-500/50" :
        status === "failed" ? "bg-red-500/20 border-red-500/50" :
        "bg-gray-700 border-gray-600"
      }`}>
        <Icon className={`w-5 h-5 ${
          status === "completed" ? "text-green-400" :
          status === "running" ? "text-blue-400" :
          status === "failed" ? "text-red-400" :
          "text-gray-400"
        }`} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Build & Release</h1>
          <p className="text-gray-400">
            Governed path from source to deployment with authority, policy, and evidence
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Build Flow */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Source Selection */}
            {!activeBuildRun && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Select Source</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Repository URL
                    </label>
                    <input
                      type="text"
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      placeholder="https://github.com/user/repo.git"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => selectedSource && startBuild(selectedSource, "repo")}
                      disabled={!selectedSource || isBuilding}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <GitBranch className="w-4 h-4" />
                      {isBuilding ? "Starting..." : "Build Repository"}
                    </button>
                    
                    <button
                      onClick={() => startBuild("prompt://new", "prompt")}
                      disabled={isBuilding}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-4 h-4" />
                      Build from Prompt
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Build Pipeline */}
            {activeBuildRun && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Build Pipeline</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Started {new Date(activeBuildRun.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Pipeline Stages */}
                <div className="relative">
                  {/* Connection Line */}
                  <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-gray-600" />
                  
                  {/* Stages */}
                  <div className="space-y-8">
                    {buildStages.map((stage, index) => (
                      <div key={stage.name} className="flex items-start gap-4">
                        {getStageIcon({ ...stage, 
                          status: getStageStatus(stage.name, activeBuildRun),
                          evidence: undefined,
                          seked_decision: undefined
                        } as BuildStage)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-white">{stage.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded ${
                              getStageStatus(stage.name, activeBuildRun) === "completed" ? "bg-green-500/20 text-green-400" :
                              getStageStatus(stage.name, activeBuildRun) === "running" ? "bg-blue-500/20 text-blue-400" :
                              getStageStatus(stage.name, activeBuildRun) === "failed" ? "bg-red-500/20 text-red-400" :
                              "bg-gray-500/20 text-gray-400"
                            }`}>
                              {getStageStatus(stage.name, activeBuildRun)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{stage.description}</p>
                          
                          {/* SEKED Decision for Authority Stage */}
                          {stage.name === "Authority" && activeBuildRun.stages.find(s => s.name === "Authority")?.seked_decision && (
                            <div className="bg-gray-700 rounded-lg p-3 mt-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                <Brain className="w-4 h-4" />
                                SEKED Decision
                              </div>
                              <div className="text-xs text-gray-400 space-y-1">
                                <div>Sigma (σ): {activeBuildRun.stages.find(s => s.name === "Authority")?.seked_decision?.ratios?.sigma}</div>
                                <div>Directive: {activeBuildRun.stages.find(s => s.name === "Authority")?.seked_decision?.directive?.action_type}</div>
                                <div>Confidence: {Math.round((activeBuildRun.stages.find(s => s.name === "Authority")?.seked_decision?.directive?.confidence || 0) * 100)}%</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Evidence for Evidence Stage */}
                          {stage.name === "Evidence" && activeBuildRun.stages.find(s => s.name === "Evidence")?.evidence && (
                            <div className="bg-gray-700 rounded-lg p-3 mt-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                <FileText className="w-4 h-4" />
                                Evidence Pack
                              </div>
                              <div className="text-xs text-gray-400 space-y-1">
                                <div>Pack ID: {activeBuildRun.stages.find(s => s.name === "Evidence")?.evidence?.pack_id?.slice(0, 16)}...</div>
                                <div>Compliance: {activeBuildRun.stages.find(s => s.name === "Evidence")?.evidence?.compliance_status}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setActiveBuildRun(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    New Build
                  </button>
                  
                  {getStageStatus("Release", activeBuildRun) === "completed" && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <CheckCircle className="w-4 h-4" />
                      Deploy to Production
                    </button>
                  )}
                  
                  {getStageStatus("Release", activeBuildRun) === "failed" && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      View Failure Details
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Recent Builds */}
            {!activeBuildRun && buildRuns && buildRuns.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Builds</h2>
                
                <div className="space-y-3">
                  {buildRuns.slice(0, 5).map((run) => (
                    <div 
                      key={run.id}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
                      onClick={() => setActiveBuildRun(run)}
                    >
                      <div className="flex items-center gap-3">
                        <GitBranch className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-white">
                            {run.source.url.split('/').pop()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(run.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          run.stages.every(s => s.status === "completed") ? "bg-green-500/20 text-green-400" :
                          run.stages.some(s => s.status === "failed") ? "bg-red-500/20 text-red-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {run.stages.every(s => s.status === "completed") ? "Completed" :
                           run.stages.some(s => s.status === "failed") ? "Failed" :
                           "Running"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Authority Panel */}
          <div className="space-y-6">
            <AuthorityPanel 
              authorityRunId={activeBuildRun?.authority_run_id}
              workspaceId={undefined}
            />
            
            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Build Stats</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Builds:</span>
                  <span className="text-white">{buildRuns?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-green-400">
                    {buildRuns ? 
                      Math.round((buildRuns.filter(r => r.stages.every(s => s.status === "completed")).length / buildRuns.length) * 100) : 0
                    }%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Build Time:</span>
                  <span className="text-white">~4.2 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
