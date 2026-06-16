"use client";

import { useState, useEffect } from "react";
import { Shield, Settings, FileText, Activity, Brain, Bot } from "lucide-react";
import PolicyManager from "../../components/seked/PolicyManager";
import AuthorityDashboard from "../../components/seked/AuthorityDashboard";
import EvidenceViewer from "../../components/seked/EvidenceViewer";
import SekedMeasurement from "../../components/seked/SekedMeasurement";
import AgentSekedMonitoring from "../../components/seked/AgentSekedMonitoring";
import { getHealthStatus } from "../../lib/seked-api";
import type { HealthStatus } from "../../types/seked";

const tabs = [
  { id: "measurement", name: "Measurement", icon: Brain },
  { id: "agents", name: "Agents", icon: Bot },
  { id: "policies", name: "Policies", icon: Settings },
  { id: "authority", name: "Authority", icon: Shield },
  { id: "evidence", name: "Evidence", icon: FileText },
] as const;

export default function SekedPage() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]["id"]>("measurement");
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);

  // Poll health status
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const status = await getHealthStatus();
        setHealthStatus(status);
      } catch (error) {
        console.error("Failed to fetch health status:", error);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "measurement":
        return <SekedMeasurement />;
      case "agents":
        return <AgentSekedMonitoring />;
      case "policies":
        return <PolicyManager />;
      case "authority":
        return <AuthorityDashboard />;
      case "evidence":
        return <EvidenceViewer />;
      default:
        return <SekedMeasurement />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">SEKED Control Plane</h1>
              <p className="text-gray-400">
                Human state measurement language v1.0 - σ = (E + D) / (R + 1)
              </p>
            </div>
            
            {/* Health Status */}
            {healthStatus && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className={`text-sm font-medium ${
                  healthStatus.status === "healthy" 
                    ? "text-green-400"
                    : healthStatus.status === "degraded"
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}>
                  {healthStatus.status.toUpperCase()}
                </span>
                {healthStatus.specification_version && (
                  <span className="text-sm text-gray-400">
                    • v{healthStatus.specification_version}
                  </span>
                )}
                {healthStatus.fingerprint && (
                  <span className="text-sm text-gray-400">
                    • {healthStatus.fingerprint.slice(0, 8)}...
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
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
                      : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="min-h-[600px]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
