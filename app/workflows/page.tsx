"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { Card, PageHeader, Button, Skeleton, ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import AuthorityPanel from "@/components/authority/AuthorityPanel";
import { 
  Workflow, 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Settings, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Zap,
  Target,
  Brain,
  FileText,
  Activity,
  TrendingUp,
  Filter,
  Search,
  MoreVertical
} from "lucide-react";

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "stopped" | "error";
  created_at: string;
  last_run: string;
  total_runs: number;
  success_rate: number;
  avg_duration: number;
  authority_run_id?: string;
  seked_compliance: number;
}

export default function WorkflowsPage() {
  const workflows = useApi<WorkflowItem[]>("/api/v1/workflows");
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredWorkflows = workflows.data?.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <Shell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Workflows</h1>
          <p className="text-gray-400">
            Visual workflow builder with Authority Panel integration and SEKED governance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search workflows..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-full sm:w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="stopped">Stopped</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Workflow
              </Button>
            </div>

            {/* Workflows List */}
            <Card className="border border-gray-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Workflow Registry</h2>
                  <div className="text-sm text-gray-400">
                    {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {workflows.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="skeleton h-24 w-full rounded-lg" />
                    ))}
                  </div>
                ) : workflows.error ? (
                  <ErrorBox message={workflows.error.message} />
                ) : (
                  <div className="space-y-4">
                    {filteredWorkflows.map((workflow) => (
                      <div 
                        key={workflow.id}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors"
                        onClick={() => setSelectedWorkflow(workflow)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-2 rounded-lg ${
                            workflow.status === 'active' ? 'bg-green-500/20 border border-green-500/50' :
                            workflow.status === 'paused' ? 'bg-yellow-500/20 border border-yellow-500/50' :
                            workflow.status === 'error' ? 'bg-red-500/20 border border-red-500/50' :
                            'bg-gray-500/20 border border-gray-500/50'
                          }`}>
                            {workflow.status === 'active' ? <Play className="w-5 h-5 text-green-400" /> :
                             workflow.status === 'paused' ? <Pause className="w-5 h-5 text-yellow-400" /> :
                             workflow.status === 'error' ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                             <Square className="w-5 h-5 text-gray-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate">{workflow.name}</h3>
                            <p className="text-sm text-gray-400 truncate">{workflow.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{workflow.total_runs} runs</span>
                              <span>•</span>
                              <span>{workflow.success_rate}% success</span>
                              <span>•</span>
                              <span>SEKED: {workflow.seked_compliance}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Last run</div>
                            <div className="text-xs text-gray-300">
                              {new Date(workflow.last_run).toLocaleDateString()}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {filteredWorkflows.length === 0 && (
                      <div className="text-center py-12">
                        <Workflow className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No workflows found</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {searchTerm || statusFilter !== "all" 
                            ? "Try adjusting your filters" 
                            : "Create your first workflow to get started"}
                        </p>
                        {!searchTerm && statusFilter === "all" && (
                          <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Workflow
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Selected Workflow Details */}
            {selectedWorkflow && (
              <Card className="border border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Workflow Details</h2>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Run
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400">Workflow Name</label>
                        <div className="font-medium text-white">{selectedWorkflow.name}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Description</label>
                        <div className="text-sm text-gray-300">{selectedWorkflow.description}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Status</label>
                        <div className={`inline-flex px-2 py-1 rounded text-sm ${
                          selectedWorkflow.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          selectedWorkflow.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                          selectedWorkflow.status === 'error' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {selectedWorkflow.status}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400">Performance</label>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Success Rate:</span>
                            <span className="text-white">{selectedWorkflow.success_rate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Runs:</span>
                            <span className="text-white">{selectedWorkflow.total_runs}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Avg Duration:</span>
                            <span className="text-white">{selectedWorkflow.avg_duration}s</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">SEKED Compliance</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                selectedWorkflow.seked_compliance >= 90 ? 'bg-green-500' :
                                selectedWorkflow.seked_compliance >= 70 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${selectedWorkflow.seked_compliance}%` }}
                            />
                          </div>
                          <span className="text-sm text-white">{selectedWorkflow.seked_compliance}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedWorkflow.authority_run_id && (
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <div className="text-sm text-gray-400 mb-2">Authority Integration</div>
                      <div className="text-xs text-gray-300 font-mono">
                        Authority Run ID: {selectedWorkflow.authority_run_id}
                      </div>
                    </div>
                  )}
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
                <h3 className="text-lg font-semibold text-white mb-4">Workflow Stats</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Workflows:</span>
                    <span className="text-white">{workflows.data?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active:</span>
                    <span className="text-green-400">
                      {workflows.data?.filter(w => w.status === 'active').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Success Rate:</span>
                    <span className="text-blue-400">
                      {workflows.data && workflows.data.length > 0 
                        ? Math.round(workflows.data.reduce((sum, w) => sum + w.success_rate, 0) / workflows.data.length)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg SEKED Compliance:</span>
                    <span className="text-purple-400">
                      {workflows.data && workflows.data.length > 0 
                        ? Math.round(workflows.data.reduce((sum, w) => sum + w.seked_compliance, 0) / workflows.data.length)
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
                    Create New Workflow
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Activity className="w-4 h-4 mr-2" />
                    View All Runs
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Performance Report
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Brain className="w-4 h-4 mr-2" />
                    SEKED Analysis
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-white">Data Processing completed</div>
                      <div className="text-xs text-gray-400">2 minutes ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Play className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-white">API Integration started</div>
                      <div className="text-xs text-gray-400">15 minutes ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-white">Report Generation paused</div>
                      <div className="text-xs text-gray-400">1 hour ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
