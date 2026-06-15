const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP' }
});
app.use('/api/', limiter);

// SEKED v1.0 Constants
const SEKED_SPECIFICATION_VERSION = "1.0";
const SEKED_CANONICAL_FINGERPRINT = "038f8464884a556fbee43972b27cbdfd08d3b522e644c0c644ad1b2ded82fcc7";

// SEKED Calculation Functions
function calculateSekedRatios(measurement) {
  const { E, R, C, D, S } = measurement;
  const sigma = (E + D) / (R + 1);
  const I = 10 - R;
  const ci = C / I;
  const si = S / 10;
  
  return {
    sigma: Math.round(sigma * 100) / 100,
    ci: Math.round(ci * 100) / 100,
    si: Math.round(si * 100) / 100
  };
}

function getDirective(ratio) {
  if (ratio >= 4.0) {
    return {
      ratio,
      directive: "Execute primary objectives with full resources",
      action_type: "EXECUTE",
      confidence: 0.95,
      reasoning: "High operational capacity indicates optimal execution state"
    };
  } else if (ratio >= 2.5) {
    return {
      ratio,
      directive: "Prepare for execution with monitoring protocols",
      action_type: "PREPARE",
      confidence: 0.85,
      reasoning: "Moderate capacity suggests preparation phase"
    };
  } else if (ratio >= 1.5) {
    return {
      ratio,
      directive: "Conserve resources and maintain current state",
      action_type: "CONSERVE",
      confidence: 0.75,
      reasoning: "Limited capacity requires conservation"
    };
  } else if (ratio >= 0.5) {
    return {
      ratio,
      directive: "Initiate recovery protocols and resource allocation",
      action_type: "RECOVER",
      confidence: 0.80,
      reasoning: "Low capacity indicates need for recovery"
    };
  } else {
    return {
      ratio,
      directive: "Escalate to human intervention and emergency protocols",
      action_type: "ESCALATE",
      confidence: 0.90,
      reasoning: "Critical capacity requires immediate escalation"
    };
  }
}

function createSekedFingerprint(state) {
  const stateString = JSON.stringify(state);
  return createHash('sha256').update(stateString).digest('hex');
}

// Validation Middleware
function validateSekedMeasurement(req, res, next) {
  const { E, R, C, D, S } = req.body;
  
  if ([E, R, C, D, S].some(val => typeof val !== 'number' || val < 0 || val > 9)) {
    return res.status(400).json({ 
      error: 'All measurements must be numbers between 0 and 9' 
    });
  }
  
  next();
}

// Routes

// Health Check
app.get('/health', async (req, res) => {
  try {
    const policiesCount = await prisma.policy.count();
    const proofsCount = await prisma.proof.count();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      engine_url: `${req.protocol}://${req.get('host')}`,
      policies_count: policiesCount,
      proofs_count: proofsCount,
      specification_version: SEKED_SPECIFICATION_VERSION,
      fingerprint: SEKED_CANONICAL_FINGERPRINT
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

// SEKED Measurement Engine
app.post('/calculate', validateSekedMeasurement, (req, res) => {
  try {
    const ratios = calculateSekedRatios(req.body);
    res.json(ratios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/directive/:ratio', (req, res) => {
  try {
    const ratio = parseFloat(req.params.ratio);
    if (isNaN(ratio)) {
      return res.status(400).json({ error: 'Invalid ratio parameter' });
    }
    
    const directive = getDirective(ratio);
    res.json(directive);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/state', validateSekedMeasurement, async (req, res) => {
  try {
    const measurement = {
      ...req.body,
      timestamp: new Date().toISOString()
    };
    
    const ratios = calculateSekedRatios(measurement);
    const directive = getDirective(ratios.sigma);
    
    const state = {
      measurement,
      ratios,
      directive
    };
    
    const fingerprint = createSekedFingerprint(state);
    
    const sekedState = await prisma.sekedState.create({
      data: {
        measurement,
        ratios,
        directive,
        fingerprint
      }
    });
    
    res.json({
      id: sekedState.id,
      measurement,
      ratios,
      directive,
      fingerprint,
      created_at: sekedState.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/verify', async (req, res) => {
  try {
    const { measurement, ratios, directive } = req.body;
    const state = { measurement, ratios, directive };
    const expectedFingerprint = createSekedFingerprint(state);
    
    const existingState = await prisma.sekedState.findFirst({
      where: { fingerprint: expectedFingerprint }
    });
    
    res.json({
      valid: !!existingState,
      fingerprint: expectedFingerprint
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Policy Management
app.get('/policies', async (req, res) => {
  try {
    const policies = await prisma.policy.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/policies', async (req, res) => {
  try {
    const { name, sigma_threshold, ci_threshold, si_threshold, action_rules } = req.body;
    
    const policy = await prisma.policy.create({
      data: {
        name,
        sigma_threshold,
        ci_threshold,
        si_threshold,
        action_rules
      }
    });
    
    res.json({ status: 'saved', policy_id: policy.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/policies/:id', async (req, res) => {
  try {
    const policy = await prisma.policy.findUnique({
      where: { id: req.params.id }
    });
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    res.json(policy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/policies/:id', async (req, res) => {
  try {
    const { name, sigma_threshold, ci_threshold, si_threshold, action_rules } = req.body;
    
    const policy = await prisma.policy.update({
      where: { id: req.params.id },
      data: {
        name,
        sigma_threshold,
        ci_threshold,
        si_threshold,
        action_rules
      }
    });
    
    res.json({ status: 'saved', policy_id: policy.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/policies/:id', async (req, res) => {
  try {
    await prisma.policy.delete({
      where: { id: req.params.id }
    });
    
    res.json({ status: 'deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ExecutionIdentityV1 minting
function mintExecutionIdentity(runData, sekedState, pglCertificate) {
  const executionIdentity = {
    execution_id: uuidv4(),
    run_id: runData.run_id,
    workspace_id: runData.workspace_id,
    pgl_pre_certificate_id: pglCertificate.certificate_id,
    pgl_post_certificate_id: null,
    genome_hash: pglCertificate.genome_hash,
    constitution_hash: pglCertificate.constitution_hash,
    plan_hash: pglCertificate.plan_hash,
    tool_manifest_hash: runData.tool_manifest_hash || "",
    delegation_chain_hash: runData.delegation_chain_hash || "",
    input_hash: runData.input_hash || "",
    seked_attestation_hash: sekedState.fingerprint,
    directive: sekedState.directive.directive,
    risk_tier: sekedState.ratios.sigma >= 4.0 ? "LOW" : sekedState.ratios.sigma >= 2.0 ? "MEDIUM" : "HIGH",
    budget_approved_cents: runData.budget_approved_cents || 10000,
    budget_reserve_cents: runData.budget_reserve_cents || null,
    delegation_depth: runData.delegation_depth || 0,
    ttl_seconds: runData.ttl_seconds || 3600,
    expires_at: new Date(Date.now() + (runData.ttl_seconds || 3600) * 1000).toISOString(),
    scope_json: runData.scope || {},
    human_attestation_hash: runData.human_attestation_hash || null,
    ai_attestation_hash: runData.ai_attestation_hash || null,
    execution_attestation_hash: null,
    issuer: "seked-control-plane",
    issued_at: new Date().toISOString(),
    signature: "signed-by-seked", // In production, use actual cryptographic signing
    hash: ""
  };
  
  executionIdentity.hash = createSekedFingerprint(executionIdentity);
  return executionIdentity;
}

// Decision Engine with ExecutionIdentityV1 integration
app.post('/decision', validateSekedMeasurement, async (req, res) => {
  try {
    const { job_id, measurement, context, run_data, pgl_certificate } = req.body;
    
    // Create SEKED state
    const ratios = calculateSekedRatios(measurement);
    const directive = getDirective(ratios.sigma);
    
    const sekedState = await prisma.sekedState.create({
      data: {
        measurement: { ...measurement, timestamp: new Date().toISOString() },
        ratios,
        directive,
        fingerprint: createSekedFingerprint({ measurement, ratios, directive })
      }
    });
    
    // Find applicable policy
    const policy = await prisma.policy.findFirst({
      where: {
        AND: [
          { sigma_threshold: { lte: ratios.sigma } },
          { ci_threshold: { lte: ratios.ci } },
          { si_threshold: { lte: ratios.si } }
        ]
      }
    });
    
    // Make decision
    let action = directive.action_type;
    let delaySeconds = 0;
    
    if (action === 'EXECUTE') {
      action = 'RUN';
    } else if (action === 'RECOVER') {
      action = 'HOLD';
      delaySeconds = 30;
    } else if (action === 'ESCALATE') {
      action = 'BLOCK';
      delaySeconds = 0;
    } else {
      action = 'HOLD';
      delaySeconds = 15;
    }
    
    // Create proof
    const proof = await prisma.proof.create({
      data: {
        job_id,
        action,
        seked_state_id: sekedState.id,
        policy_id: policy?.id,
        engine_url: `${req.protocol}://${req.get('host')}`,
        evidence: { context, ratios, directive }
      }
    });
    
    // Create decision
    const decision = await prisma.decision.create({
      data: {
        job_id,
        action,
        delay_seconds: delaySeconds,
        proof_id: proof.id,
        seked_state_id: sekedState.id,
        policy_id: policy?.id,
        engine_response: { ratios, directive, policy_applied: !!policy }
      }
    });
    
    // Mint ExecutionIdentityV1 if PGL certificate is provided
    let executionIdentity = null;
    if (pgl_certificate && run_data) {
      // Verify PGL certificate exists and is persisted
      const certExists = await prisma.pGLCertificate.findFirst({
        where: {
          certificate_id: pgl_certificate.certificate_id,
          persisted: true
        }
      });
      
      if (certExists) {
        executionIdentity = mintExecutionIdentity(run_data, sekedState, pgl_certificate);
        
        // Persist ExecutionIdentityV1
        await prisma.executionIdentity.create({
          data: {
            execution_id: executionIdentity.execution_id,
            run_id: executionIdentity.run_id,
            workspace_id: executionIdentity.workspace_id,
            pgl_pre_certificate_id: executionIdentity.pgl_pre_certificate_id,
            pgl_post_certificate_id: executionIdentity.pgl_post_certificate_id,
            genome_hash: executionIdentity.genome_hash,
            constitution_hash: executionIdentity.constitution_hash,
            plan_hash: executionIdentity.plan_hash,
            tool_manifest_hash: executionIdentity.tool_manifest_hash,
            delegation_chain_hash: executionIdentity.delegation_chain_hash,
            input_hash: executionIdentity.input_hash,
            seked_attestation_hash: executionIdentity.seked_attestation_hash,
            directive: executionIdentity.directive,
            risk_tier: executionIdentity.risk_tier,
            budget_approved_cents: executionIdentity.budget_approved_cents,
            budget_reserve_cents: executionIdentity.budget_reserve_cents,
            delegation_depth: executionIdentity.delegation_depth,
            ttl_seconds: executionIdentity.ttl_seconds,
            expires_at: executionIdentity.expires_at,
            scope_json: executionIdentity.scope_json,
            human_attestation_hash: executionIdentity.human_attestation_hash,
            ai_attestation_hash: executionIdentity.ai_attestation_hash,
            execution_attestation_hash: executionIdentity.execution_attestation_hash,
            issuer: executionIdentity.issuer,
            issued_at: executionIdentity.issued_at,
            signature: executionIdentity.signature,
            hash: executionIdentity.hash
          }
        });
      }
    }
    
    res.json({
      action,
      delay_seconds: delaySeconds,
      proof_id: proof.id,
      seked_state: {
        id: sekedState.id,
        measurement,
        ratios,
        directive,
        fingerprint: sekedState.fingerprint,
        created_at: sekedState.created_at
      },
      policy_id: policy?.id,
      execution_identity: executionIdentity,
      engine_response: decision.engine_response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MCP Gateway Validation - LAW 0 Enforcement
app.post('/mcp-gateway/validate', async (req, res) => {
  try {
    const { execution_identity, tool_name, action, estimated_cost_cents } = req.body;
    
    if (!execution_identity) {
      return res.status(403).json({
        error: "EXECUTION_IDENTITY_REQUIRED",
        detail: "ExecutionIdentityV1 is required for all side-effecting operations",
        law0: true
      });
    }
    
    // Retrieve the execution identity from database
    const identity = await prisma.executionIdentity.findUnique({
      where: { execution_id: execution_identity.execution_id }
    });
    
    if (!identity) {
      return res.status(403).json({
        error: "EXECUTION_IDENTITY_NOT_FOUND",
        detail: "The provided ExecutionIdentityV1 does not exist",
        law0: true
      });
    }
    
    // Check if identity is revoked
    if (identity.revoked) {
      return res.status(403).json({
        error: "EXECUTION_IDENTITY_REVOKED",
        detail: "The ExecutionIdentityV1 has been revoked",
        law0: true
      });
    }
    
    // Check expiration
    if (new Date() > new Date(identity.expires_at)) {
      return res.status(403).json({
        error: "EXECUTION_IDENTITY_EXPIRED",
        detail: "The ExecutionIdentityV1 has expired",
        law0: true
      });
    }
    
    // Validate PGL certificate
    const pglCert = await prisma.pGLCertificate.findFirst({
      where: {
        certificate_id: identity.pgl_pre_certificate_id,
        persisted: true
      }
    });
    
    if (!pglCert) {
      return res.status(403).json({
        error: "PGL_CERTIFICATE_INVALID",
        detail: "PGL certificate not found or not persisted",
        law0: true
      });
    }
    
    // Verify hash integrity
    const expectedHash = createSekedFingerprint({
      execution_id: identity.execution_id,
      run_id: identity.run_id,
      workspace_id: identity.workspace_id,
      pgl_pre_certificate_id: identity.pgl_pre_certificate_id,
      seked_attestation_hash: identity.seked_attestation_hash,
      directive: identity.directive,
      expires_at: identity.expires_at.toISOString(),
      issuer: identity.issuer
    });
    
    if (identity.hash !== expectedHash) {
      return res.status(403).json({
        error: "EXECUTION_IDENTITY_TAMPERED",
        detail: "ExecutionIdentityV1 hash verification failed",
        law0: true
      });
    }
    
    // Check scope coverage
    const scope = identity.scope_json;
    if (scope.allowed_tools && !scope.allowed_tools.includes(tool_name)) {
      return res.status(403).json({
        error: "SCOPE_VIOLATION",
        detail: `Tool '${tool_name}' is not in the allowed scope`,
        law0: true
      });
    }
    
    // Check budget
    if (estimated_cost_cents && identity.budget_approved_cents < estimated_cost_cents) {
      return res.status(403).json({
        error: "BUDGET_EXCEEDED",
        detail: "Estimated cost exceeds approved budget",
        law0: true
      });
    }
    
    // Check SEKED directive permits execution
    if (identity.directive !== "EXECUTE" && identity.directive !== "PREPARE") {
      return res.status(403).json({
        error: "SEKED_DIRECTIVE_FORBIDS_EXECUTION",
        detail: `SEKED directive '${identity.directive}' does not permit execution`,
        law0: true
      });
    }
    
    // All validations passed
    res.json({
      valid: true,
      execution_id: identity.execution_id,
      risk_tier: identity.risk_tier,
      budget_remaining_cents: identity.budget_approved_cents - (estimated_cost_cents || 0),
      expires_at: identity.expires_at
    });
    
  } catch (error) {
    console.error("MCP Gateway validation error:", error);
    res.status(500).json({ 
      error: "VALIDATION_ERROR", 
      detail: error.message,
      law0: true 
    });
  }
});

// PGL Certificate validation
app.get('/pgl-certificates/:certificate_id/validate', async (req, res) => {
  try {
    const { certificate_id } = req.params;
    
    const certificate = await prisma.pGLCertificate.findFirst({
      where: {
        certificate_id,
        persisted: true
      }
    });
    
    if (!certificate) {
      return res.status(404).json({
        valid: false,
        error: "PGL_CERTIFICATE_NOT_FOUND",
        detail: "Certificate not found or not persisted"
      });
    }
    
    res.json({
      valid: true,
      certificate: {
        certificate_id: certificate.certificate_id,
        run_id: certificate.run_id,
        workspace_id: certificate.workspace_id,
        genome_hash: certificate.genome_hash,
        constitution_hash: certificate.constitution_hash,
        plan_hash: certificate.plan_hash,
        persisted: certificate.persisted,
        created_at: certificate.created_at
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agent Monitoring
app.get('/agents', async (req, res) => {
  try {
    const agents = await prisma.agentState.findMany({
      orderBy: { last_updated: 'desc' }
    });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/agents/:id/state', validateSekedMeasurement, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, performance_metrics } = req.body;
    
    const measurement = { ...req.body, timestamp: new Date().toISOString() };
    const ratios = calculateSekedRatios(measurement);
    const directive = getDirective(ratios.sigma);
    
    // Determine agent status based on sigma
    let status = 'idle';
    if (ratios.sigma >= 4.0) status = 'active';
    else if (ratios.sigma >= 2.5) status = 'idle';
    else if (ratios.sigma >= 1.5) status = 'recovering';
    else status = 'error';
    
    const agentState = await prisma.agentState.upsert({
      where: { agent_id: id },
      update: {
        name,
        status,
        measurement,
        ratios,
        directive,
        performance_metrics,
        last_updated: new Date()
      },
      create: {
        agent_id: id,
        name,
        status,
        measurement,
        ratios,
        directive,
        performance_metrics
      }
    });
    
    res.json(agentState);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`SEKED Control Plane running on port ${PORT}`);
  console.log(`SEKED v1.0 Specification - Fingerprint: ${SEKED_CANONICAL_FINGERPRINT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
