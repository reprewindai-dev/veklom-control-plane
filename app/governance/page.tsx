'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield,
  TrendingUp,
  Award,
  Lock,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Copy,
  ChevronRight,
  Database,
  Users,
} from 'lucide-react';

interface TrustScoreEvent {
  id: string;
  timestamp: string;
  event_type: string;
  threat_type?: string;
  ai_confidence: number;
  description: string;
  evidence_hash: string;
  status: 'open' | 'resolved';
  resolution_notes?: string;
}

interface OperatorIdentity {
  id: string;
  wallet_address: string;
  operator_name: string;
  trust_score: number;
  rank: string;
  rank_badge_color: string;
  security_level: string;
  events_total: number;
  events_critical: number;
  events_resolved: number;
  joined_at: string;
  verified_at?: string;
  verification_status: 'unverified' | 'pending' | 'verified';
}

const RANK_TIERS = [
  { rank: 'Recruit', minScore: 0, color: 'bg-slate-500', icon: '🎯' },
  { rank: 'Operator', minScore: 20, color: 'bg-blue-500', icon: '⚙️' },
  { rank: 'Trusted Operator', minScore: 50, color: 'bg-emerald-500', icon: '✓' },
  { rank: 'Sovereign', minScore: 75, color: 'bg-purple-500', icon: '👑' },
  { rank: 'Elite Sovereign', minScore: 90, color: 'bg-yellow-500', icon: '⭐' },
  { rank: 'Apex', minScore: 98, color: 'bg-rose-500', icon: '🔴' },
];

const THREAT_TYPES = [
  'All',
  'brute_force',
  'sql_injection',
  'xss',
  'unauthorized_access',
  'data_exfiltration',
  'suspicious_login',
  'rate_limit_abuse',
  'anomaly',
];

export default function GovernancePage() {
  const [identity, setIdentity] = useState<OperatorIdentity | null>(null);
  const [events, setEvents] = useState<TrustScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchWallet, setSearchWallet] = useState('');
  const [filterThreatType, setFilterThreatType] = useState('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch current operator identity
  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        const res = await fetch('http://api.veklom.com/api/v1/identity/me');
        const data = await res.json();
        setIdentity(data);

        // Check for rank-up celebration
        if (data.trust_score >= 98 && data.rank === 'Apex') {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      } catch (err) {
        console.error('Failed to fetch identity:', err);
        setIdentity(generateDemoOperator());
      } finally {
        setLoading(false);
      }
    };

    fetchIdentity();
  }, []);

  // Fetch trust events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(
          'http://api.veklom.com/api/v1/security/events?limit=50'
        );
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : data.events || []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setEvents(generateDemoEvents());
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  // Resolve event
  const resolveEvent = async (eventId: string, notes: string) => {
    try {
      const res = await fetch(
        `http://api.veklom.com/api/v1/security/events/${eventId}/resolve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution_notes: notes }),
        }
      );
      if (res.ok) {
        setEvents(
          events.map((e) =>
            e.id === eventId ? { ...e, status: 'resolved' } : e
          )
        );
      }
    } catch (err) {
      console.error('Failed to resolve event:', err);
    }
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterStatus === 'open' && e.status !== 'open') return false;
      if (filterStatus === 'resolved' && e.status !== 'resolved') return false;
      if (filterThreatType !== 'All' && e.threat_type !== filterThreatType)
        return false;
      return true;
    });
  }, [events, filterStatus, filterThreatType]);

  // Calculate rank
  const currentRank = useMemo(() => {
    if (!identity) return RANK_TIERS[0];
    return (
      [...RANK_TIERS].reverse().find((t) => identity.trust_score >= t.minScore) ||
      RANK_TIERS[0]
    );
  }, [identity]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-white text-lg">Loading governance layer...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Rank Celebration */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center animate-bounce">
            <div className="text-8xl mb-4">{currentRank.icon}</div>
            <p className="text-4xl font-bold text-white">{currentRank.rank}</p>
            <p className="text-xl text-emerald-400 mt-2">Rank Unlocked! 🎉</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🛡️ GOVERNANCE LAYER</h1>
          <p className="text-slate-400">Sovereign operator identity & trust verification</p>
          {/* Quick links to sub-modules */}
          <div className="flex flex-wrap gap-3 mt-4">
            <Link href="/governance/registry" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:text-white transition">
              <Database className="w-4 h-4 text-cyan-400" />
              Sovereign Operator Registry
              <ChevronRight className="w-3 h-3 opacity-50" />
            </Link>
            <Link href="/audit" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:text-white transition">
              <Shield className="w-4 h-4 text-emerald-400" />
              Audit Log
              <ChevronRight className="w-3 h-3 opacity-50" />
            </Link>
            <Link href="/compliance" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:text-white transition">
              <Award className="w-4 h-4 text-violet-400" />
              Compliance Frameworks
              <ChevronRight className="w-3 h-3 opacity-50" />
            </Link>
          </div>
        </div>

        {/* Operator Card */}
        {identity && (
          <div className="mb-8 bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-lg overflow-hidden">
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Identity */}
                <div>
                  <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-4">
                    Operator Identity
                  </h3>
                  <p className="text-2xl font-bold text-white mb-2">
                    {identity.operator_name}
                  </p>
                  <p className="text-slate-400 font-mono text-sm break-all mb-4">
                    {identity.wallet_address}
                  </p>
                  <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded flex items-center gap-2 transition">
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>

                {/* Trust Score */}
                <div>
                  <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-4">
                    Trust Index
                  </h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <p className="text-5xl font-bold text-blue-400">
                      {identity.trust_score}
                    </p>
                    <p className="text-slate-400">/100</p>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${identity.trust_score}%` }}
                    />
                  </div>
                </div>

                {/* Rank */}
                <div>
                  <h3 className="text-slate-400 text-sm uppercase tracking-wider mb-4">
                    Rank
                  </h3>
                  <div className={`inline-block px-6 py-3 rounded-lg text-white font-bold mb-4 ${currentRank.color}`}>
                    <span className="text-2xl mr-2">{currentRank.icon}</span>
                    {currentRank.rank}
                  </div>
                  <p className="text-slate-400 text-sm">
                    {100 - identity.trust_score} points to next tier
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-600">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                    Total Events
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {identity.events_total}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                    Critical
                  </p>
                  <p className="text-2xl font-bold text-red-400">
                    {identity.events_critical}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                    Resolved
                  </p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {identity.events_resolved}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                    Status
                  </p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <p className="text-white font-semibold">Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rank Progression */}
        <div className="mb-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Rank Progression
          </h3>
          <div className="grid grid-cols-6 gap-4">
            {RANK_TIERS.map((tier, idx) => {
              const isActive =
                identity && identity.trust_score >= tier.minScore;
              const isCurrent = currentRank.rank === tier.rank;

              return (
                <div
                  key={tier.rank}
                  className={`p-4 rounded-lg border transition ${
                    isActive
                      ? isCurrent
                        ? `${tier.color} border-white`
                        : 'bg-slate-700 border-slate-600'
                      : 'bg-slate-900 border-slate-700 opacity-50'
                  }`}
                >
                  <p className="text-2xl mb-2">{tier.icon}</p>
                  <p
                    className={`text-xs font-semibold ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {tier.rank}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isActive ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {tier.minScore}+
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Events Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 sticky top-8">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h4>

              <div className="mb-6">
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Threat Type
                </label>
                <select
                  value={filterThreatType}
                  onChange={(e) => setFilterThreatType(e.target.value)}
                  className="w-full p-2 bg-slate-700 text-white border border-slate-600 rounded focus:border-blue-500 focus:outline-none text-sm"
                >
                  {THREAT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'all', label: 'All Events' },
                    { key: 'open', label: 'Open' },
                    { key: 'resolved', label: 'Resolved' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() =>
                        setFilterStatus(opt.key as 'all' | 'open' | 'resolved')
                      }
                      className={`w-full text-left px-3 py-2 rounded transition text-sm ${
                        filterStatus === opt.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Event Ledger */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Immutable Trust Event Ledger
                </h3>
              </div>

              <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
                {filteredEvents.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    No events match filters
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() =>
                        setExpandedEvent(
                          expandedEvent === event.id ? null : event.id
                        )
                      }
                      className="p-6 hover:bg-slate-700 cursor-pointer transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="text-white font-semibold">
                              {event.event_type}
                            </p>
                            {event.threat_type && (
                              <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                                {event.threat_type}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm">
                            {event.description}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                            event.status === 'resolved'
                              ? 'bg-emerald-900 text-emerald-300'
                              : 'bg-amber-900 text-amber-300'
                          }`}
                        >
                          {event.status === 'resolved' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {event.status}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <p>{new Date(event.timestamp).toLocaleString()}</p>
                        <p>
                          Confidence: <span className="text-white">{(event.ai_confidence * 100).toFixed(0)}%</span>
                        </p>
                      </div>

                      {/* Evidence Hash */}
                      <div className="mt-3 pt-3 border-t border-slate-600">
                        <p className="text-xs text-slate-400 mb-1">Evidence Hash (HMAC-SHA256)</p>
                        <p className="font-mono text-xs text-slate-300 break-all">
                          {event.evidence_hash}
                        </p>
                      </div>

                      {/* Expanded Details */}
                      {expandedEvent === event.id && event.status === 'open' && (
                        <div className="mt-4 pt-4 border-t border-slate-600 space-y-3">
                          <textarea
                            placeholder="Resolution notes..."
                            className="w-full p-2 bg-slate-700 text-white border border-slate-600 rounded focus:border-blue-500 focus:outline-none text-sm"
                            defaultValue={event.resolution_notes || ''}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const notes = (
                                e.currentTarget.parentElement
                                  ?.querySelector('textarea') as HTMLTextAreaElement
                              )?.value;
                              resolveEvent(event.id, notes || '');
                            }}
                            className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition font-semibold"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Public Secure Directory */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Public Secure Directory
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700 text-slate-300 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Operator</th>
                  <th className="px-6 py-3 text-left">Rank</th>
                  <th className="px-6 py-3 text-center">Trust Score</th>
                  <th className="px-6 py-3 text-center">Events</th>
                  <th className="px-6 py-3 text-left">Joined</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {identity && (
                  <tr className="hover:bg-slate-700 transition">
                    <td className="px-6 py-4 text-white font-semibold">
                      {identity.operator_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${currentRank.color} text-white`}>
                        {currentRank.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-blue-400 font-semibold">
                        {identity.trust_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400">
                      {identity.events_total}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(identity.joined_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-900 text-emerald-300 rounded text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo data
function generateDemoOperator(): OperatorIdentity {
  return {
    id: 'op_demo_123',
    wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f6bEd0',
    operator_name: 'Sovereign Alice',
    trust_score: 87,
    rank: 'Sovereign',
    rank_badge_color: 'bg-purple-500',
    security_level: 'HIGH',
    events_total: 42,
    events_critical: 2,
    events_resolved: 38,
    joined_at: '2025-06-01T00:00:00Z',
    verified_at: '2025-06-05T00:00:00Z',
    verification_status: 'verified',
  };
}

function generateDemoEvents(): TrustScoreEvent[] {
  return [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      event_type: 'suspicious_login',
      threat_type: 'suspicious_login',
      ai_confidence: 0.92,
      description: '3 failed login attempts from unusual IP',
      evidence_hash: 'sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      status: 'resolved',
      resolution_notes: 'User confirmed legitimate access attempt',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      event_type: 'anomaly',
      threat_type: 'rate_limit_abuse',
      ai_confidence: 0.78,
      description: 'Unusual spike in API key usage detected',
      evidence_hash: 'sha256:q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6',
      status: 'open',
    },
  ];
}
