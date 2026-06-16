"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { Card, PageHeader, Button, Skeleton, ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import AuthorityPanel from "@/components/authority/AuthorityPanel";
import { 
  Shield, 
  ShieldCheck, 
  FileText, 
  Eye, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  Search,
  Filter,
  Calendar,
  User,
  Key,
  Activity,
  ClipboardList,
  Scale,
  FileSearch,
  Settings,
  MoreVertical,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface ComplianceFramework {
  id: string;
  name: string;
  status: "compliant" | "non_compliant" | "pending";
  last_assessment: string;
  score: number;
  requirements_met: number;
  total_requirements: number;
  next_review: string;
}

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  risk_level: "low" | "medium" | "high";
  category: string;
}

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved";
  created_at: string;
  category: string;
}

export default function TrustCenterPage() {
  const frameworks = useApi<ComplianceFramework[]>("/api/v1/trust-center/frameworks");
  const audits = useApi<AuditEntry[]>("/api/v1/trust-center/audits");
  const alerts = useApi<SecurityAlert[]>("/api/v1/trust-center/alerts");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const tabs = [
    { id: "overview", label: "Overview", icon: Scale },
    { id: "compliance", label: "Compliance", icon: ShieldCheck },
    { id: "audit", label: "Audit Trail", icon: FileSearch },
    { id: "security", label: "Security", icon: Shield },
    { id: "privacy", label: "Privacy", icon: Eye },
  ];

  return (
    <Shell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trust Center</h1>
          <p className="text-gray-400">
            Audit, compliance, privacy, safety, security, and trust controls with AuthorityRun integration
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <>
                {/* Trust Score */}
                <Card className="border border-gray-700">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-white">Trust Score</h2>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span className="text-green-400 text-sm">Excellent</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full border-8 border-gray-600"></div>
                        <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-green-400 border-t-transparent border-r-transparent transform rotate-45"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-white">94</div>
                            <div className="text-xs text-gray-400">Score</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">98%</div>
                        <div className="text-xs text-gray-400">Security</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">92%</div>
                        <div className="text-xs text-gray-400">Compliance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">89%</div>
                        <div className="text-xs text-gray-400">Privacy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">96%</div>
                        <div className="text-xs text-gray-400">Safety</div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card className="border border-gray-700">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                      <Button variant="outline" size="sm">
                        <Activity className="w-4 h-4 mr-2" />
                        View All
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm text-white">SOC2 Type II assessment completed</div>
                          <div className="text-xs text-gray-400">Compliance • 2 hours ago</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm text-white">Security patch applied to all systems</div>
                          <div className="text-xs text-gray-400">Security • 6 hours ago</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm text-white">New privacy policy published</div>
                          <div className="text-xs text-gray-400">Privacy • 1 day ago</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm text-white">Unusual access pattern detected</div>
                          <div className="text-xs text-gray-400">Security • 2 days ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* Compliance Tab */}
            {activeTab === "compliance" && (
              <Card className="border border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Compliance Frameworks</h2>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>

                  {frameworks.isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton h-20 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {frameworks.data?.map((framework) => (
                        <div key={framework.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                              framework.status === 'compliant' ? 'bg-green-500/20 border border-green-500/50' :
                              framework.status === 'non_compliant' ? 'bg-red-500/20 border border-red-500/50' :
                              'bg-yellow-500/20 border border-yellow-500/50'
                            }`}>
                              {framework.status === 'compliant' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                               framework.status === 'non_compliant' ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                               <Clock className="w-5 h-5 text-yellow-400" />}
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{framework.name}</h3>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                <span>Score: {framework.score}%</span>
                                <span>•</span>
                                <span>{framework.requirements_met}/{framework.total_requirements} requirements</span>
                                <span>•</span>
                                <span>Next review: {new Date(framework.next_review).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                framework.status === 'compliant' ? 'text-green-400' :
                                framework.status === 'non_compliant' ? 'text-red-400' :
                                'text-yellow-400'
                              }`}>
                                {framework.status.replace('_', ' ').toUpperCase()}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(framework.last_assessment).toLocaleDateString()}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Audit Trail Tab */}
            {activeTab === "audit" && (
              <Card className="border border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Audit Trail</h2>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search audit logs..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-64"
                        />
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {audits.isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton h-16 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {audits.data?.map((audit) => (
                        <div key={audit.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              audit.risk_level === 'high' ? 'bg-red-400' :
                              audit.risk_level === 'medium' ? 'bg-yellow-400' :
                              'bg-green-400'
                            }`}></div>
                            <div>
                              <div className="text-sm text-white">{audit.action}</div>
                              <div className="text-xs text-gray-400">
                                {audit.actor} • {audit.target} • {audit.category}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-300">
                              {new Date(audit.timestamp).toLocaleString()}
                            </div>
                            <div className={`text-xs ${
                              audit.risk_level === 'high' ? 'text-red-400' :
                              audit.risk_level === 'medium' ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              {audit.risk_level.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <Card className="border border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Security Alerts</h2>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>

                  {alerts.isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton h-20 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {alerts.data?.map((alert) => (
                        <div key={alert.id} className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <div className={`p-2 rounded-lg ${
                            alert.severity === 'critical' ? 'bg-red-500/20 border border-red-500/50' :
                            alert.severity === 'high' ? 'bg-orange-500/20 border border-orange-500/50' :
                            alert.severity === 'medium' ? 'bg-yellow-500/20 border border-yellow-500/50' :
                            'bg-blue-500/20 border border-blue-500/50'
                          }`}>
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-white">{alert.title}</h3>
                            <p className="text-sm text-gray-400 mt-1">{alert.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className={`px-2 py-1 rounded ${
                                alert.status === 'open' ? 'bg-red-500/20 text-red-400' :
                                alert.status === 'investigating' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {alert.status}
                              </span>
                              <span>{alert.category}</span>
                              <span>{new Date(alert.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Investigate
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <Card className="border border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Privacy Controls</h2>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Data Residency</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white">Primary Region</span>
                            <span className="text-blue-400">EU</span>
                          </div>
                          <div className="text-xs text-gray-400">All data stored within EU borders</div>
                        </div>
                        <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white">Backup Region</span>
                            <span className="text-green-400">EU</span>
                          </div>
                          <div className="text-xs text-gray-400">Backups also within EU jurisdiction</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Data Protection</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-green-400" />
                            <div>
                              <div className="text-sm text-white">Encryption at Rest</div>
                              <div className="text-xs text-gray-400">AES-256 encryption for all stored data</div>
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-green-400" />
                            <div>
                              <div className="text-sm text-white">Encryption in Transit</div>
                              <div className="text-xs text-gray-400">TLS 1.3 for all data transfers</div>
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-yellow-400" />
                            <div>
                              <div className="text-sm text-white">Data Redaction</div>
                              <div className="text-xs text-gray-400">Automatic PII detection and redaction</div>
                            </div>
                          </div>
                          <AlertCircle className="w-5 h-5 text-yellow-400" />
                        </div>
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
            
            {/* Quick Stats */}
            <Card className="border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Trust Metrics</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Compliance Score:</span>
                    <span className="text-green-400">94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Security Incidents:</span>
                    <span className="text-yellow-400">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Audit Entries:</span>
                    <span className="text-blue-400">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Assessment:</span>
                    <span className="text-gray-300">2 days ago</span>
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
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Run Assessment
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Export Evidence
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Review Alerts
                  </Button>
                </div>
              </div>
            </Card>

            {/* Upcoming Reviews */}
            <Card className="border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Upcoming Reviews</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">SOC2 Type II</div>
                      <div className="text-xs text-gray-400">Annual review</div>
                    </div>
                    <div className="text-xs text-gray-300">in 30 days</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">GDPR Compliance</div>
                      <div className="text-xs text-gray-400">Quarterly check</div>
                    </div>
                    <div className="text-xs text-gray-300">in 45 days</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">Security Audit</div>
                      <div className="text-xs text-gray-400">Penetration test</div>
                    </div>
                    <div className="text-xs text-gray-300">in 60 days</div>
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
