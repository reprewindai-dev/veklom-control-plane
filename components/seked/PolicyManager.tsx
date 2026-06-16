"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Settings, Trash2, Edit } from "lucide-react";
import { 
  createPolicy, 
  updatePolicy, 
  deletePolicy, 
  getPolicies 
} from "../../lib/seked-api";
import type { Policy } from "../../types/seked";

interface PolicyFormData {
  name: string;
  threshold: number;
  delay_seconds: number;
}

export default function PolicyManager() {
  const { data: policies, error, mutate } = useSWR<Policy[]>("/policies", getPolicies);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState<PolicyFormData>({
    name: "",
    threshold: 250,
    delay_seconds: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPolicy) {
        await updatePolicy(editingPolicy.name, formData);
        setEditingPolicy(null);
      } else {
        await createPolicy(formData);
        setIsCreating(false);
      }
      setFormData({ name: "", threshold: 250, delay_seconds: 30 });
      mutate();
    } catch (error) {
      console.error("Failed to save policy:", error);
    }
  };

  const handleEdit = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      threshold: policy.threshold,
      delay_seconds: policy.delay_seconds,
    });
  };

  const handleDelete = async (policyName: string) => {
    if (confirm("Are you sure you want to delete this policy?")) {
      try {
        await deletePolicy(policyName);
        mutate();
      } catch (error) {
        console.error("Failed to delete policy:", error);
      }
    }
  };

  if (error) return <div className="text-red-500">Failed to load policies</div>;
  if (!policies) return <div>Loading policies...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Policy Management</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Policy
        </button>
      </div>

      {/* Policy Form */}
      {(isCreating || editingPolicy) && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingPolicy ? "Edit Policy" : "Create New Policy"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Policy Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!editingPolicy}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Carbon Threshold
              </label>
              <input
                type="number"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Delay Seconds
              </label>
              <input
                type="number"
                value={formData.delay_seconds}
                onChange={(e) => setFormData({ ...formData, delay_seconds: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingPolicy ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingPolicy(null);
                  setFormData({ name: "", threshold: 250, delay_seconds: 30 });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Policies List */}
      <div className="grid gap-4">
        {policies.map((policy) => (
          <div
            key={policy.name}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">{policy.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Threshold:</span>
                    <span className="ml-2 text-white">{policy.threshold}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Delay:</span>
                    <span className="ml-2 text-white">{policy.delay_seconds}s</span>
                  </div>
                </div>
                {policy.created_at && (
                  <div className="text-xs text-gray-500">
                    Created: {new Date(policy.created_at).toLocaleString()}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(policy)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(policy.name)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {policies.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No policies configured yet</p>
            <p className="text-sm">Create your first policy to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
