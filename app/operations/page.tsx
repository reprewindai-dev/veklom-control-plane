"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { Card, PageHeader, Button, Skeleton, ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import AuthorityPanel from "@/components/authority/AuthorityPanel";
import { 
  Server, 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Cpu,
  HardDrive,
  Wifi,
  Power,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Square,
  Plus,
  Filter,
  Search
} from "lucide-react";

interface Deployment {
  id: string;
  name: string;
  status: "running" | "stopped" | "error" | "deploying";
  model: string;
  region: string;
  instances: number;
  cpu_usage: number;
  memory_usage: number;
  requests_per_minute: number;
  uptime: string;
  last_deployed: string;
}

interface Metric {
  name: string;
  value: string;
  change: number;
  trend: "up" | "down" | "stable";
}

export default function OperationsPage() {
  const deployments = useApi<Deployment[]>("/api/v1/operations/deployments");
  const metrics = useApi<Record<string, Metric>>("/api/v1/operations/metrics");
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredDeployments = deployments.data?.filter(deployment => {
    const matchesSearch = deployment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deployment.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || deployment.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <Shell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Operations</h1>
          <p className="text-gray-400">
            Deployments, monitoring, and autonomous runtime controls with AuthorityRun integration
          </p>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Active Deployments</span>
                <Server className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {deployments.data?.filter(d => d.status === 'running').length || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                of {deployments.data?.length || 0} total
              </div>
            </div>
          </Card>

          <Card className="border border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Requests/min</span>
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {deployments.data?.reduce((sum, d) => sum + d.requests_per_minute, 0) || 0}
              </div>
              <div className="flex items-center text-xs mt-1">
                <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                <span className="text-green-400">+12%</span>
              </div>
            </div>
          </Card>

          <Card className="border border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Avg CPU Usage</span>
                <Cpu className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {deployments.data && deployments.data.length > 0 
                  ? Math.round(deployments.data.reduce((sum, d) => sum + d.cpu_usage, 0) / deployments.data.length)
                  : 0}%
              </div>
              <div className="flex items-center text-xs mt-1">
                <TrendingDown className="w-3 h-3 text-green-400 mr-1" />
                <span className="text-green-400">-5%</span>
              </div>
            </div>
          </Card>

          <Card className="border border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">System Health</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">98%</div>
              <div className="flex items-center text-xs mt-1">
                <CheckCircle className="w-3 h-3 text-green-400 mr-1" />
                <span className="text-green-400">Optimal</span>
              </div>
            </div>
          </Card>
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
                    placeholder="Search deployments..."
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
                  <option value="running">Running</option>
                  <option value="stopped">Stopped</option>
                  <option value="error">Error</option>
                  <option value="deploying">Deploying</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Deploy
                </Button>
              </div>
            </div>

            {/* Deployments List */}
            <Card className="border border-gray-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Deployments</h2>
                  <div className="text-sm text-gray-400">
                    {filteredDeployments.length} deployment{filteredDeployments.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {deployments.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="skeleton h-32 w-full rounded-lg" />
                    ))}
                  </div>
                ) : deployments.error ? (
                  <ErrorBox message={deployments.error.message} />
                ) : (
                  <div className="space-y-4">
                    {filteredDeployments.map((deployment) => (
                      <div 
                        key={deployment.id}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors"
                        onClick={() => setSelectedDeployment(deployment)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-2 rounded-lg ${
                            deployment.status === 'running' ? 'bg-green-500/20 border border-green-500/50' :
                            deployment.status === 'stopped' ? 'bg-gray-500/20 border border-gray-500/50' :
                            deployment.status === 'error' ? 'bg-red-500/20 border border-red-500/50' :
                            'bg-blue-500/20 border border-blue-500/50'
                          }`}>
                            {deployment.status === 'running' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                             deployment.status === 'stopped' ? <Square className="w-5 h-5 text-gray-400" /> :
                             deployment.status === 'error' ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                             <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate">{deployment.name}</h3>
                            <p className="text-sm text-gray-400">{deployment.model} • {deployment.region}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{deployment.instances} instances</span>
                              <span>•</span>
                              <span>{deployment.requests_per_minute} req/min</span>
                              <span>•</span>
                              <span>Uptime: {deployment.uptime}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Resources</div>
                            <div className="text-xs text-gray-300">
                              CPU: {deployment.cpu_usage}% | RAM: {deployment.memory_usage}%
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {filteredDeployments.length === 0 && (
                      <div className="text-center py-12">
                        <Server className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400 mb-2">No deployments found</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          {searchTerm || statusFilter !== "all" 
                            ? "Try adjusting your filters" 
                            : "Deploy your first model to get started"}
                        </p>
                        {!searchTerm && statusFilter === "all" && (
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Deploy Model
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Selected Deployment Details */}
            {selectedDeployment && (
              <Card className="border border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Deployment Details</h2>
                    <div className="flex items-center gap-2">
                      {selectedDeployment.status === 'running' ? (
                        <Button variant="outline" size="sm">
                          <Pause className="w-4 h-4 mr-2" />
                          Stop
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Redeploy
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400">Deployment Name</label>
                        <div className="font-medium text-white">{selectedDeployment.name}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Model</label>
                        <div className="text-sm text-gray-300">{selectedDeployment.model}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Region</label>
                        <div className="text-sm text-gray-300">{selectedDeployment.region}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Status</label>
                        <div className={`inline-flex px-2 py-1 rounded text-sm ${
                          selectedDeployment.status === 'running' ? 'bg-green-500/20 text-green-400' :
                          selectedDeployment.status === 'stopped' ? 'bg-gray-500/20 text-gray-400' :
                          selectedDeployment.status === 'error' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {selectedDeployment.status}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-400">Performance</label>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Instances:</span>
                            <span className="text-white">{selectedDeployment.instances}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Requests/min:</span>
                            <span className="text-white">{selectedDeployment.requests_per_minute}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Uptime:</span>
                            <span className="text-white">{selectedDeployment.uptime}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Resource Usage</label>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">CPU:</span>
                              <span className="text-white">{selectedDeployment.cpu_usage}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  selectedDeployment.cpu_usage >= 80 ? 'bg-red-500' :
                                  selectedDeployment.cpu_usage >= 60 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${selectedDeployment.cpu_usage}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400">Memory:</span>
                              <span className="text-white">{selectedDeployment.memory_usage}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  selectedDeployment.memory_usage >= 80 ? 'bg-red-500' :
                                  selectedDeployment.memory_usage >= 60 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${selectedDeployment.memory_usage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="text-sm text-gray-400 mb-2">Deployment Information</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                      <div>
                        <span className="text-gray-400">Last Deployed:</span> {new Date(selectedDeployment.last_deployed).toLocaleString()}
                      </div>
                      <div>
                        <span className="text-gray-400">Deployment ID:</span> {selectedDeployment.id}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <AuthorityPanel />
            
            {/* System Health */}
            <Card className="border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-gray-300">API Gateway</span>
                    </div>
                    <span className="text-green-400 text-sm">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-gray-300">Database</span>
                    </div>
                    <span className="text-green-400 text-sm">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <span className="text-gray-300">Load Balancer</span>
                    </div>
                    <span className="text-yellow-400 text-sm">Warning</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-gray-300">Storage</span>
                    </div>
                    <span className="text-green-400 text-sm">Healthy</span>
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
                    New Deployment
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Scale All
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Power className="w-4 h-4 mr-2" />
                    Emergency Stop
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Activity className="w-4 h-4 mr-2" />
                    View Logs
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recent Events */}
            <Card className="border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Events</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-white">Deployment completed</div>
                      <div className="text-xs text-gray-400">gpt-4-turbo • 2 minutes ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-white">High CPU usage detected</div>
                      <div className="text-xs text-gray-400">claude-3-sonnet • 15 minutes ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-white">Auto-scaling triggered</div>
                      <div className="text-xs text-gray-400">llama-3-70b • 1 hour ago</div>
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
