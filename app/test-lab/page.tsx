"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { Card, PageHeader, Button, Skeleton, ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import AuthorityPanel from "@/components/authority/AuthorityPanel";
import { 
  FlaskConical, 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Settings, 
  Trophy, 
  Target, 
  Brain, 
  Zap, 
  Clock, 
  TrendingUp, 
  Users, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Star,
  Sword,
  Shield,
  Gauge,
  Timer,
  Search,
  Filter,
  MoreVertical,
  BarChart3,
  Award
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "standard" | "expert" | "master";
  category: string;
  participants: number;
  avg_score: number;
  duration_minutes: number;
  status: "active" | "upcoming" | "completed";
  starts_at?: string;
  ends_at?: string;
  seked_required: boolean;
  authority_enforced: boolean;
}

interface AgentSubmission {
  id: string;
  agent_name: string;
  challenge_id: string;
  score: number;
  rank: number;
  seked_compliance: number;
  authority_run_id: string;
  submitted_at: string;
  status: "submitted" | "running" | "completed" | "failed";
}

interface LeaderboardEntry {
  rank: number;
  agent_name: string;
  score: number;
  seked_ratio: number;
  compliance_rate: number;
  submissions: number;
}

export default function TestLabPage() {
  const challenges = useApi<Challenge[]>("/api/v1/agent-arena/challenges");
  const submissions = useApi<AgentSubmission[]>("/api/v1/agent-arena/submissions");
  const leaderboard = useApi<LeaderboardEntry[]>("/api/v1/agent-arena/leaderboard");
  const [activeTab, setActiveTab] = useState("challenges");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  const tabs = [
    { id: "challenges", label: "Challenges", icon: Target },
    { id: "submissions", label: "My Submissions", icon: FlaskConical },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "arena", label: "Live Arena", icon: Zap },
  ];

  const filteredChallenges = challenges.data?.filter(challenge => {
    const matchesDifficulty = difficultyFilter === "all" || challenge.difficulty === difficultyFilter;
    return matchesDifficulty;
  }) || [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "text-green-400 bg-green-500/20 border-green-500/50";
      case "standard": return "text-blue-400 bg-blue-500/20 border-blue-500/50";
      case "expert": return "text-purple-400 bg-purple-500/20 border-purple-500/50";
      case "master": return "text-red-400 bg-red-500/20 border-red-500/50";
      default: return "text-gray-400 bg-gray-500/20 border-gray-500/50";
    }
  };

  return (
    <Shell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Test Lab</h1>
          <p className="text-gray-400">
            Agent Arena integration and testing environment with AuthorityRun enforcement and SEKED governance
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
            
            {/* Challenges Tab */}
            {activeTab === "challenges" && (
              <>
                {/* Filters */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-400">Difficulty:</label>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="standard">Standard</option>
                      <option value="expert">Expert</option>
                      <option value="master">Master</option>
                    </select>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Challenge
                  </Button>
                </div>

                {/* Challenges List */}
                <Card className="border border-gray-700">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-white">Available Challenges</h2>
                      <div className="text-sm text-gray-400">
                        {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {challenges.isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="skeleton h-28 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredChallenges.map((challenge) => (
                          <div 
                            key={challenge.id}
                            className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 cursor-pointer transition-colors"
                            onClick={() => setSelectedChallenge(challenge)}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`p-2 rounded-lg border ${getDifficultyColor(challenge.difficulty)}`}>
                                <Target className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-white truncate">{challenge.title}</h3>
                                <p className="text-sm text-gray-400 truncate">{challenge.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span>{challenge.category}</span>
                                  <span>•</span>
                                  <span>{challenge.participants} participants</span>
                                  <span>•</span>
                                  <span>{challenge.duration_minutes} min</span>
                                  <span>•</span>
                                  <span>Avg: {challenge.avg_score}%</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {challenge.seked_required && (
                                  <div className="flex items-center gap-1 text-xs text-purple-400">
                                    <Brain className="w-3 h-3" />
                                    <span>SEKED</span>
                                  </div>
                                )}
                                {challenge.authority_enforced && (
                                  <div className="flex items-center gap-1 text-xs text-blue-400">
                                    <Shield className="w-3 h-3" />
                                    <span>Authority</span>
                                  </div>
                                )}
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                                {challenge.difficulty}
                              </div>
                              <Button variant="outline" size="sm">
                                Enter
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {filteredChallenges.length === 0 && (
                          <div className="text-center py-12">
                            <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-400 mb-2">No challenges found</h3>
                            <p className="text-sm text-gray-500 mb-4">
                              Try adjusting your filters or create a new challenge
                            </p>
                            <Button>
                              <Plus className="w-4 h-4 mr-2" />
                              Create Challenge
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}

            {/* Submissions Tab */}
            {activeTab === "submissions" && (
              <Card className="border border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">My Submissions</h2>
                    <Button variant="outline" size="sm">
                      <FlaskConical className="w-4 h-4 mr-2" />
                      New Submission
                    </Button>
                  </div>

                  {submissions.isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton h-20 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submissions.data?.map((submission) => (
                        <div key={submission.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg border ${
                              submission.status === 'completed' ? 'bg-green-500/20 border-green-500/50' :
                              submission.status === 'running' ? 'bg-blue-500/20 border-blue-500/50' :
                              submission.status === 'failed' ? 'bg-red-500/20 border-red-500/50' :
                              'bg-gray-500/20 border-gray-500/50'
                            }`}>
                              {submission.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                               submission.status === 'running' ? <Activity className="w-5 h-5 text-blue-400 animate-pulse" /> :
                               submission.status === 'failed' ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                               <Clock className="w-5 h-5 text-gray-400" />}
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{submission.agent_name}</h3>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                <span>Rank: #{submission.rank}</span>
                                <span>•</span>
                                <span>Score: {submission.score}%</span>
                                <span>•</span>
                                <span>SEKED: {submission.seked_compliance}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                submission.status === 'completed' ? 'text-green-400' :
                                submission.status === 'running' ? 'text-blue-400' :
                                submission.status === 'failed' ? 'text-red-400' :
                                'text-gray-400'
                              }`}>
                                {submission.status}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(submission.submitted_at).toLocaleDateString()}
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

            {/* Leaderboard Tab */}
            {activeTab === "leaderboard" && (
              <Card className="border border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Global Leaderboard</h2>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Stats
                    </Button>
                  </div>

                  {leaderboard.isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton h-16 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.data?.map((entry) => (
                        <div key={entry.rank} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              entry.rank === 1 ? 'bg-yellow-500 text-black' :
                              entry.rank === 2 ? 'bg-gray-400 text-black' :
                              entry.rank === 3 ? 'bg-orange-600 text-white' :
                              'bg-gray-600 text-gray-300'
                            }`}>
                              {entry.rank}
                            </div>
                            <div>
                              <div className="font-medium text-white">{entry.agent_name}</div>
                              <div className="text-xs text-gray-400">
                                {entry.submissions} submissions • {entry.compliance_rate}% compliance
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">{entry.score}%</div>
                              <div className="text-xs text-gray-400">Score</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-purple-400">{entry.seked_ratio}</div>
                              <div className="text-xs text-gray-400">SEKED</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Live Arena Tab */}
            {activeTab === "arena" && (
              <Card className="border border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Live Arena</h2>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-green-400 text-sm">Live</span>
                    </div>
                  </div>

                  <div className="text-center py-12">
                    <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Live Arena Coming Soon</h3>
                    <p className="text-gray-400 mb-6">
                      Real-time agent competitions with AuthorityRun enforcement and SEKED governance
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                        <Brain className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <h4 className="font-medium text-white mb-1">SEKED Integration</h4>
                        <p className="text-xs text-gray-400">Real-time policy compliance monitoring</p>
                      </div>
                      <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                        <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <h4 className="font-medium text-white mb-1">Authority Enforcement</h4>
                        <p className="text-xs text-gray-400">Automatic rule enforcement and violations</p>
                      </div>
                      <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                        <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <h4 className="font-medium text-white mb-1">Fair Competition</h4>
                        <p className="text-xs text-gray-400">Level playing field with governance</p>
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
            
            {/* Arena Stats */}
            <Card className="border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Arena Statistics</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Challenges:</span>
                    <span className="text-white">{challenges.data?.filter(c => c.status === 'active').length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Participants:</span>
                    <span className="text-white">
                      {challenges.data?.reduce((sum, c) => sum + c.participants, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">My Submissions:</span>
                    <span className="text-blue-400">{submissions.data?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Best Rank:</span>
                    <span className="text-green-400">
                      {submissions.data && submissions.data.length > 0 
                        ? Math.min(...submissions.data.map(s => s.rank))
                        : '-'}
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
                    New Submission
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Brain className="w-4 h-4 mr-2" />
                    SEKED Analysis
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Authority Report
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Award className="w-4 h-4 mr-2" />
                    View Awards
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Arena Activity</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Trophy className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-white">New challenge created</div>
                      <div className="text-xs text-gray-400">Advanced Data Analysis • 1 hour ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-white">Submission completed</div>
                      <div className="text-xs text-gray-400">Your agent ranked #3 • 2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-white">New participant joined</div>
                      <div className="text-xs text-gray-400">Web Search Challenge • 3 hours ago</div>
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
