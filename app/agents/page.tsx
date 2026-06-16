"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { Card, PageHeader, Button, Skeleton, ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import AuthorityPanel from "@/components/authority/AuthorityPanel";
import { 
  Fingerprint, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  User,
  FileText,
  Globe,
  Wallet,
  Zap,
  Target,
  Brain,
  Plus,
  Settings,
  Activity,
  Clock
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  certificate_id: string;
  genome_hash: string;
  status: string;
  created_at: string;
  last_seen: string;
  trust_score: number;
  risk_category: string;
}

export default function AgentsPage() {
  const agents = useApi<Agent[]>("/api/v1/pgl/agents");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <Shell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Agents</h1>
          <p className="text-gray-400">
            Manage PGL certificates, genomes, and agent authority profiles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Agents List */}
            <Card className="border border-gray-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Agent Registry</h2>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Agent
                  </Button>
                </div>

                {agents.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="skeleton h-20 w-full rounded-lg" />
                    ))}
                  </div>
                ) : agents.error ? (
                  <ErrorBox message={agents.error.message} />
                ) : (
                  <div className="space-y-4">
                    {agents.data?.map((agent) => (
                      <div 
                        key={agent.id}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors"
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/50">
                            <Fingerprint className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{agent.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <span>ID: {agent.id}</span>
                              <span>•</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                agent.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                agent.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {agent.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Trust Score</div>
                            <div className="font-medium text-white">{Math.round(agent.trust_score * 100)}%</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Risk</div>
                            <div className={`text-sm font-medium ${
                              agent.risk_category === 'low' ? 'text-green-400' :
                              agent.risk_category === 'medium' ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {agent.risk_category}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(!agents.data || agents.data.length === 0) && (
                      <div className="text-center py-12">
                        <Fingerprint className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No agents yet</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Create your first agent to get started
                        </p>
                        <Button onClick={() => setShowCreateModal(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Agent
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Selected Agent Details */}
            {selectedAgent && (
              <Card className="border border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Agent Details</h2>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400">Agent Name</label>
                        <div className="font-medium text-white">{selectedAgent.name}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Certificate ID</label>
                        <div className="font-mono text-sm text-gray-300">{selectedAgent.certificate_id}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Genome Hash</label>
                        <div className="font-mono text-sm text-gray-300">{selectedAgent.genome_hash}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400">Status</label>
                        <div className={`inline-flex px-2 py-1 rounded text-sm ${
                          selectedAgent.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          selectedAgent.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {selectedAgent.status}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Created</label>
                        <div className="text-sm text-gray-300">
                          {new Date(selectedAgent.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Last Seen</label>
                        <div className="text-sm text-gray-300">
                          {new Date(selectedAgent.last_seen).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        View Certificate
                      </Button>
                      <Button variant="outline" size="sm">
                        <Brain className="w-4 h-4 mr-2" />
                        View Genome
                      </Button>
                      <Button variant="outline" size="sm">
                        <Activity className="w-4 h-4 mr-2" />
                        Activity Log
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <AuthorityPanel />
            
            {/* Quick Stats */}
            <Card className="border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Agent Stats</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Agents:</span>
                    <span className="text-white">{agents.data?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active:</span>
                    <span className="text-green-400">
                      {agents.data?.filter(a => a.status === 'active').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Trust:</span>
                    <span className="text-blue-400">
                      {agents.data && agents.data.length > 0 
                        ? Math.round(agents.data.reduce((sum, a) => sum + a.trust_score, 0) / agents.data.length * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Agent
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Certificates
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Clock className="w-4 h-4 mr-2" />
                    View Lineage
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
