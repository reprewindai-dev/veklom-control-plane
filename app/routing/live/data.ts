// @ts-nocheck
"use client";
import { FailureEvent } from './types';

export const FAULT_MATRIX_DATA: FailureEvent[] = [
  {
    id: 'worker-compute-lag',
    name: 'Worker Compute Lag',
    shortImpact: 'The initial thread loses its lock mid-flight. Another request claims the slot.',
    immediateImpact: 'Execution outruns ROUTING_IDEMPOTENCY_TTL_SECONDS. The initial worker thread loses its distributed Redis lock mid-flight, allowing a duplicate retry request to claim the execution slot.',
    mitigationArchitecture: 'The late-running thread triggers standard atomic LUA_COMPLETE_IF_MATCH logic on completion. The Redis script safely rejects the delayed write because the owner token was modified, returning a 409 Conflict. No data corruption or lock-stomping occurs.',
    severity: 'high',
    componentAffected: 'Worker Compute Cluster',
    lockType: 'Atomic Mutex Lock (Redis TTL based)',
    recoveryTtl: 'Dynamic IDEMPOTENCY_TTL',
    codeReference: `// Atomic LUA script running in Redis engine
const luaCompIfMatch = \`
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("set", KEYS[1], ARGV[2], "EX", ARGV[3])
  else
    return 0
  end
\`;`,
    parameters: [
      {
        id: 'lag-duration',
        name: 'Worker Compute Lag',
        type: 'slider',
        value: 12000,
        min: 2000,
        max: 20000,
        unit: 'ms',
        description: 'Actual execution time of Worker Node 1 compute loop.'
      },
      {
        id: 'idempotency-ttl',
        name: 'ROUTING_IDEMPOTENCY_TTL_SECONDS',
        type: 'slider',
        value: 5,
        min: 1,
        max: 15,
        unit: 's',
        description: 'Duration before Redis automatically releases the exclusive computation lock.'
      }
    ],
    scenarioSteps: [
      {
        id: 1,
        title: 'Compute Lock Acquisition',
        description: 'Client submits active task request with unique UUID and OwnerToken "TKN-WORKER-01". Distributed Lock is reserved in Redis with active TTL flag.',
        actor: 'Redis Lock Gate',
        status: 'pending',
        codeSnippet: `redis.set("lock:tx_9984", "TKN-WORKER-01", "NX", "EX", TTL_SECONDS)`
      },
      {
        id: 2,
        title: 'CPU Pressure Peak',
        description: 'Worker Node 01 begins task calculation. Extreme disk memory paging triggers heavy scheduler thread starvation, slowing down processing.',
        actor: 'Worker VM',
        status: 'pending'
      },
      {
        id: 3,
        title: 'Lock Natural Expiry',
        description: 'Worker computing duration exceeds the set ROUTING_IDEMPOTENCY_TTL_SECONDS limit. Redis safely purges the lock key automatically.',
        actor: 'Redis Lock Gate',
        status: 'pending'
      },
      {
        id: 4,
        title: 'Duplicate Lock Stolen',
        description: 'Due to response timeout, a retry client request is issued. It finds the lock vacant, re-registers the key with "TKN-WORKER-02", and routes calculation to Worker Node 02.',
        actor: 'API Proxy',
        status: 'pending',
        codeSnippet: `redis.set("lock:tx_9984", "TKN-WORKER-02", "NX", "EX", TTL_SECONDS) // SUCCESS`
      },
      {
        id: 5,
        title: 'Late Result Commit',
        description: 'Worker Node 01 finally finishes the calculation. It commands an write-back update to Redis, invoking the atomic LUA transaction.',
        actor: 'Worker VM',
        status: 'pending'
      },
      {
        id: 6,
        title: 'LUA_COMPLETE_IF_MATCH Rejection',
        description: 'Redis LUA script checks: expected "TKN-WORKER-01", found active lock "TKN-WORKER-02". It rejects the transaction, returning 409 Conflict. Lock-stomping is averted.',
        actor: 'Redis Lock Gate',
        status: 'pending',
        codeSnippet: `redis.eval(luaCompleteIfMatch, 1, "lock:tx_9984", "TKN-WORKER-01", "COMPLETED_STATE") -> Returns 0 (409 Conflict)`
      }
    ]
  },
  {
    id: 'redis-node-outage',
    name: 'Redis Node Outage / Crash',
    shortImpact: 'The proxy cannot acquire locks, read replays, or update routing targets.',
    immediateImpact: 'The central Redis lock registry goes dark. Connection pool fails immediately, throwing active socket exceptions across all gateway servers.',
    mitigationArchitecture: 'The router catch boundary intercepts the SocketException, writes an emergency backup broadcast alert to the remote telemetry endpoint, and initiates a graceful failback sequence. It utilizes a standby asyncio.Queue containing pre-pooled Rust routers to safely recycle resources without memory exhaustion, issuing clean, informative 500 responses.',
    severity: 'critical',
    componentAffected: 'API Gateway & Redis Cluster',
    lockType: 'No Lock possible (Degraded State)',
    recoveryTtl: 'Immediate failback to standby queue',
    codeReference: `try:
    await lock_registry.acquire(client_uuid)
except SocketException as e:
    telemetry.alert_critical("Redis Node Down", e)
    return HTTP_500_Server_Error()
finally:
    await rust_router_pool.put(borrowed_router)`,
    parameters: [
      {
        id: 'connection-timeout',
        name: 'Socket Connection Timeout',
        type: 'slider',
        value: 1500,
        min: 250,
        max: 5000,
        unit: 'ms',
        description: 'Network threshold before giving up on connection to Redis node.'
      },
      {
        id: 'retry-attempts',
        name: 'Retry Attempt Limit',
        type: 'slider',
        value: 3,
        min: 1,
        max: 5,
        unit: 'tries',
        description: 'Total connect attempts before raising a fatal socket pool exception.'
      }
    ],
    scenarioSteps: [
      {
        id: 1,
        title: 'Incoming Request Dispatch',
        description: 'API Proxy receives high priority data packet. Router targets routing paths and prepares lock authentication.',
        actor: 'API Proxy',
        status: 'pending'
      },
      {
        id: 2,
        title: 'Socket Connection Failure',
        description: 'Proxy attempts connection to Redis cluster. Standby node is unresponsive. Net socket returns a connection timed out event.',
        actor: 'Redis Lock Gate',
        status: 'pending',
        codeSnippet: `TCP connection failed to redis-cluster-node-01:6379 after 1500ms.`
      },
      {
        id: 3,
        title: 'Retry Budget Depleted',
        description: 'Gateway attempts sequential retries on alternative shards. All pool exceptions remain unhandled. Connection pool throws a fatal SocketException.',
        actor: 'API Proxy',
        status: 'pending'
      },
      {
        id: 4,
        title: 'Telemetry Alert Broadcast',
        description: 'General catch block intercepts SocketException. Applet triggers non-blocking write to high-priority metrics pipeline and telemetry tracker.',
        actor: 'Audit Logger',
        status: 'pending',
        codeSnippet: `telemetry.alert_critical("CRITICAL: Redis Connection Pool Exhausted", error)`
      },
      {
        id: 5,
        title: 'Rust Router Reclamation',
        description: 'The high-performance Rust core router, lent to the connection context, is safely recycled into the asyncio.Queue to prevent leaks.',
        actor: 'API Proxy',
        status: 'pending',
        codeSnippet: `finally: await rust_router_pool.put(borrowed_router) // Handled`
      },
      {
        id: 6,
        title: 'Clean Outage Handshake',
        description: 'Gateway issues an internal 500 Server Error to the client, providing failure details and preventing memory leaks.',
        actor: 'API Proxy',
        status: 'pending',
        codeSnippet: `HTTP/1.1 500 Internal Server Error \n { "error": "SystemDegraded", "tracking_id": "err_911" }`
      }
    ]
  },
  {
    id: 'async-client-retries',
    name: 'Asynchronous Client Retries',
    shortImpact: 'The client fires duplicate payloads during high-traffic bottlenecks.',
    immediateImpact: 'Network jitter leads to impatient browser/client automatic retries, submitting identical transactional UUIDs while computation is actively running.',
    mitigationArchitecture: 'The incoming duplicate connection is checked at the atomic cache.set gateway using the NX argument. The secondary lock claim fails instantly. Instead of spinning up duplicate workers, the router routes the client directly to a graceful tracking status page with a 202 Accepted header.',
    severity: 'medium',
    componentAffected: 'API Gateway Gatekeeper',
    lockType: 'Atomic Key Locking (SET owner NX)',
    recoveryTtl: 'Dynamic Tracking Status Redirect',
    codeReference: `// Atomic conditional set prevents race conditions
is_new_job = redis.set(f"job:{uuid}", "running", nx=True, ex=300)
if not is_new_job:
    return HTTP_202_Accepted(location=f"/api/status/{uuid}")`,
    parameters: [
      {
        id: 'client-retry-interval',
        name: 'Retry Trigger Latency',
        type: 'slider',
        value: 1200,
        min: 500,
        max: 3000,
        unit: 'ms',
        description: 'Time threshold at which client issue retry packets.'
      },
      {
        id: 'computation-weight',
        name: 'Task Compute Weight',
        type: 'slider',
        value: 3500,
        min: 1000,
        max: 8000,
        unit: 'ms',
        description: 'Time taken by the background worker to fully complete the payload job.'
      }
    ],
    scenarioSteps: [
      {
        id: 1,
        title: 'Initial Request Registered',
        description: 'Client submits expensive data compute job. Proxy acquires atomic lock, registers status as "RUNNING", and starts the background worker.',
        actor: 'API Proxy',
        status: 'pending',
        codeSnippet: `redis.set("job:7762", "running", nx=True, ex=300) // Returns True`
      },
      {
        id: 2,
        title: 'Active Computation Loop',
        description: 'Worker VM receives the job context and fires heavy parsing computation thread.',
        actor: 'Worker VM',
        status: 'pending'
      },
      {
        id: 3,
        title: 'Impatient Duplicate Attack',
        description: 'Network delay blocks response acknowledgment. Client timeout threshold is crossed; client automatically re-transmits full duplicate request.',
        actor: 'Client',
        status: 'pending'
      },
      {
        id: 4,
        title: 'Atomic Boundary Gate',
        description: 'Secondary request hits the proxy gateway. Proxy checks Redis database with a conditional SETNX command.',
        actor: 'API Proxy',
        status: 'pending',
        codeSnippet: `redis.set("job:7762", "running", nx=True) -> Returns False`
      },
      {
        id: 5,
        title: 'Duplicate Filter Interception',
        description: 'The atomic check fails because the key already exists and holds active lock. Duplicate computation execution is aborted.',
        actor: 'Redis Lock Gate',
        status: 'pending'
      },
      {
        id: 6,
        title: 'Graceful Redirect Mitigation',
        description: 'The middleware redirects user to a clean job tracker, returning Response 202 Accepted with a Location tracking HTTP response header.',
        actor: 'API Proxy',
        status: 'pending',
        codeSnippet: `HTTP/1.1 202 Accepted \n Location: /api/status/7762`
      }
    ]
  },
  {
    id: 'physical-node-crash',
    name: 'Physical Worker Node Crash',
    shortImpact: 'The active thread calculation vanishes instantly. The borrowed Rust instance is unreturned.',
    immediateImpact: 'An active computing worker container or bare-metal hypervisor dies instantly (e.g. OOM, node restart) inside calculation context.',
    mitigationArchitecture: 'Because the compute lock was reserved with a secure 60-second lock TTL window, the lock remains protected in Redis. No other worker can taint context parameters. Once the 60-second TTL expires naturally, subsequent client retries automatically clear the gate, spawning an execution thread on a healthy cluster node.',
    severity: 'high',
    componentAffected: 'Worker Hypervisor Node',
    lockType: 'Automatic Expiring Key-level Lease',
    recoveryTtl: '60s lock expiration default',
    codeReference: `# Redis distributed lock with auto lease duration
lock_acquired = redis.set("worker_lease:tx_8854", "worker_node_4", nx=True, ex=60)
# Under fatal crash, key is deleted strictly in 60s by Redis cluster.`,
    parameters: [
      {
        id: 'lock-lease-time',
        name: 'Redis Key lease window (EX)',
        type: 'slider',
        value: 60,
        min: 10,
        max: 120,
        unit: 's',
        description: 'Duration before critical transaction lock releases when heartbeats fail.'
      },
      {
        id: 'recovery-gap',
        name: 'Container Spin-Up Gap',
        type: 'slider',
        value: 15,
        min: 5,
        max: 30,
        unit: 's',
        description: 'Time required for container orchestration (K8s) to boot a new worker VM.'
      }
    ],
    scenarioSteps: [
      {
        id: 1,
        title: 'Worker Allocation',
        description: 'Client triggers long calculation. API Proxy selects Worker Container 04, assigning job security credentials.',
        actor: 'API Proxy',
        status: 'pending'
      },
      {
        id: 2,
        title: 'Distributed Lock Lease',
        description: 'Worker Node 04 creates exclusive ownership lease inside Redis, acquiring lock with active ex=60 TTL parameter.',
        actor: 'Redis Lock Gate',
        status: 'pending',
        codeSnippet: `redis.set("worker_lease:tx_8854", "worker_node_4", nx=True, ex=60) // Active`
      },
      {
        id: 3,
        title: 'Absolute Hardware Failure',
        description: 'The physical device hosting Worker Node 04 suffers sudden thermal overload, OOM kernel crash, or Docker daemon failure. Process vanishes instantly.',
        actor: 'Worker VM',
        status: 'pending'
      },
      {
        id: 4,
        title: 'Active Block Protected',
        description: 'Redis continues to hold the lock index record. This blocks other components from accessing or corrupting semi-finished storage indexes.',
        actor: 'Redis Lock Gate',
        status: 'pending'
      },
      {
        id: 5,
        title: 'Natural Lease Timeout',
        description: 'The Redis internal master timer detects lease countdown hit zero. Redis automatically clears lock record key from the memory tree.',
        actor: 'Redis Lock Gate',
        status: 'pending',
        codeSnippet: `Lock key "worker_lease:tx_8854" expired. Deleted.`
      },
      {
        id: 6,
        title: 'Healthy Node Failover',
        description: 'Subsequent scheduled client retry executes. Finding the lock vacancy, it successfully spins up computation on healthy Worker Node 05.',
        actor: 'API Proxy',
        status: 'pending',
        codeSnippet: `redis.set("worker_lease:tx_8854", "worker_node_5", nx=True, ex=60) -> TRUE`
      }
    ]
  },
  {
    id: 'heterogeneous-node-drift',
    name: 'Heterogeneous Node Architecture',
    shortImpact: 'Float data calculations run across disparate hardware stacks.',
    immediateImpact: 'Arithmetic differences between x86_x64 (CISC) and ARM64 (RISC) server register structures create slight floating-point discrepancies, yielding hash validation failures.',
    mitigationArchitecture: 'System mandates binary double encoding through standard strict struct format struct.pack("<...d"). This forces little-endian IEEE 754 byte presentation, preserving precision alignment across different chip architectures and ensuring cryptography checks consistently match.',
    severity: 'low',
    componentAffected: 'Binary Struct Encoding Engine',
    lockType: 'Strict Hardware Binary Layout',
    recoveryTtl: 'N/A (Real-time Compilation)',
    codeReference: `import struct
# Pack double precision floating point into Little-Endian stream
def serialize_double(value: float) -> bytes:
    return struct.pack("<d", value) # Guaranteed IEEE 754 across systems`,
    parameters: [
      {
        id: 'precision-decimals',
        name: 'Float Math Precision Limit',
        type: 'slider',
        value: 15,
        min: 4,
        max: 18,
        unit: 'decimals',
        description: 'Decimal resolution of double precision arithmetic payload calculations.'
      },
      {
        id: 'is-big-endian',
        name: 'Host Native Big-Endian Check',
        type: 'toggle',
        value: false,
        description: 'Specifies if host systems require manual byte inversion (true for big endian, e.g. legacy Mainframes).'
      }
    ],
    scenarioSteps: [
      {
        id: 1,
        title: 'Disparate Server Processing',
        description: 'Complex math algorithm is scheduled across heterogeneous nodes: ARM64 server (RISC) and AMD64 node (CISC).',
        actor: 'Worker VM',
        status: 'pending'
      },
      {
        id: 2,
        title: 'Floating Point Drift',
        description: 'Calculations run in native floating-point registers. Disparate compiler instruction sequences result in tiny variations in final bits.',
        actor: 'Worker VM',
        status: 'pending'
      },
      {
        id: 3,
        title: 'Binary Structure Integrity Risk',
        description: 'Calculated properties must be signed for cryptographic audit trail. Discrepancy in double representations would cause signature failures.',
        actor: 'Audit Logger',
        status: 'pending'
      },
      {
        id: 4,
        title: 'Strict IEEE 754 Packing',
        description: 'Serializer leverages native python/rust format struct definitions to package internal floats using "<d" formatting.',
        actor: 'API Proxy',
        status: 'pending',
        codeSnippet: `packed_bytes = struct.pack("<d", 41.2829018442)`
      },
      {
        id: 5,
        title: 'Cross-Architecture Byte Equality',
        description: 'The output is hard-cast to standard Little-Endian sequence. Intel (AMD64) and Apple/Graviton (ARM64) registers yield identical bytes.',
        actor: 'API Proxy',
        status: 'pending',
        codeSnippet: `Intel: 0x54, 0x85... | Graviton: 0x54, 0x85... (Perfect Match)`
      },
      {
        id: 6,
        title: 'Audit Consistency Secured',
        description: 'Cryptographic hash updates consistently. System logs are fully reproducible across platforms with absolute byte alignment.',
        actor: 'Audit Logger',
        status: 'pending',
        codeSnippet: `sha256_checksum: "a07f...bc93" // SUCCESS`
      }
    ]
  }
];

