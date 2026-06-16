const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SEKED Control Plane...');

  // Create default policies
  const defaultPolicies = [
    {
      name: 'High Performance Policy',
      sigma_threshold: 4.0,
      ci_threshold: 0.8,
      si_threshold: 0.7,
      action_rules: {
        'EXECUTE': { action: 'RUN', delay_seconds: 0 },
        'PREPARE': { action: 'RUN', delay_seconds: 5 },
        'CONSERVE': { action: 'HOLD', delay_seconds: 10 },
        'RECOVER': { action: 'HOLD', delay_seconds: 30 },
        'ESCALATE': { action: 'BLOCK', delay_seconds: 0 }
      }
    },
    {
      name: 'Balanced Policy',
      sigma_threshold: 2.5,
      ci_threshold: 0.6,
      si_threshold: 0.5,
      action_rules: {
        'EXECUTE': { action: 'RUN', delay_seconds: 5 },
        'PREPARE': { action: 'HOLD', delay_seconds: 15 },
        'CONSERVE': { action: 'HOLD', delay_seconds: 20 },
        'RECOVER': { action: 'HOLD', delay_seconds: 45 },
        'ESCALATE': { action: 'BLOCK', delay_seconds: 0 }
      }
    },
    {
      name: 'Conservative Policy',
      sigma_threshold: 1.5,
      ci_threshold: 0.4,
      si_threshold: 0.3,
      action_rules: {
        'EXECUTE': { action: 'HOLD', delay_seconds: 15 },
        'PREPARE': { action: 'HOLD', delay_seconds: 30 },
        'CONSERVE': { action: 'HOLD', delay_seconds: 60 },
        'RECOVER': { action: 'BLOCK', delay_seconds: 0 },
        'ESCALATE': { action: 'BLOCK', delay_seconds: 0 }
      }
    }
  ];

  for (const policy of defaultPolicies) {
    await prisma.policy.upsert({
      where: { name: policy.name },
      update: policy,
      create: policy
    });
  }

  // Create sample agent states
  const sampleAgents = [
    {
      agent_id: 'agent-001-stripe',
      name: 'Stripe Connect Engineer',
      status: 'active',
      measurement: { E: 8, R: 2, C: 7, D: 9, S: 6, timestamp: new Date().toISOString() },
      ratios: { sigma: 5.67, ci: 0.88, si: 0.6 },
      directive: {
        ratio: 5.67,
        directive: 'Execute payment processing with enhanced monitoring',
        action_type: 'EXECUTE',
        confidence: 0.92,
        reasoning: 'High energy and drive with low resistance indicates optimal execution state'
      },
      performance_metrics: {
        response_time_ms: 245,
        success_rate: 0.98,
        error_rate: 0.02,
        throughput: 1250
      }
    },
    {
      agent_id: 'agent-002-referral',
      name: 'Referral System Engineer',
      status: 'recovering',
      measurement: { E: 4, R: 6, C: 5, D: 3, S: 4, timestamp: new Date().toISOString() },
      ratios: { sigma: 0.88, ci: 0.56, si: 0.4 },
      directive: {
        ratio: 0.88,
        directive: 'Conserve resources and implement recovery protocols',
        action_type: 'RECOVER',
        confidence: 0.75,
        reasoning: 'Low energy and high resistance indicates need for recovery'
      },
      performance_metrics: {
        response_time_ms: 892,
        success_rate: 0.85,
        error_rate: 0.15,
        throughput: 450
      }
    },
    {
      agent_id: 'agent-003-ux',
      name: 'UX Completion Engineer',
      status: 'active',
      measurement: { E: 7, R: 3, C: 8, D: 6, S: 7, timestamp: new Date().toISOString() },
      ratios: { sigma: 3.25, ci: 0.8, si: 0.7 },
      directive: {
        ratio: 3.25,
        directive: 'Prepare for execution with monitoring protocols',
        action_type: 'PREPARE',
        confidence: 0.85,
        reasoning: 'Moderate capacity suggests preparation phase'
      },
      performance_metrics: {
        response_time_ms: 320,
        success_rate: 0.94,
        error_rate: 0.06,
        throughput: 890
      }
    }
  ];

  for (const agent of sampleAgents) {
    await prisma.agentState.upsert({
      where: { agent_id: agent.agent_id },
      update: agent,
      create: agent
    });
  }

  // Create initial health status
  await prisma.healthStatus.create({
    data: {
      status: 'healthy',
      engine_url: 'http://localhost:3001',
      policies_count: 3,
      proofs_count: 0
    }
  });

  console.log('SEKED Control Plane seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
