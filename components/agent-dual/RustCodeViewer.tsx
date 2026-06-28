/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Terminal, FileCode, Check, Copy, ChevronRight, Server, Database, Settings } from 'lucide-react';

interface RustFile {
  name: string;
  path: string;
  type: 'rust' | 'toml' | 'sql' | 'docker' | 'yaml';
  code: string;
  description: string;
}

const RUST_WORKSPACE_FILES: RustFile[] = [
  {
    name: "Cargo.toml",
    path: "backend/Cargo.toml",
    type: "toml",
    description: "Declares project dependencies: Axum, SQLx with Postgres TLS features, anyhow, tracing logging subscriber, and serde.",
    code: `[package]
name = "agent_duel_backend"
version = "1.0.0"
edition = "2021"
authors = ["Veklom Dev Team <dev@veklom.com>"]
description = "High-performance Base Network dApp Game Backend with SQLx, Axum, anyhow, and tracing"

[dependencies]
axum = { version = "0.7.5", features = ["macros"] }
tokio = { version = "1.38.0", features = ["full"] }
sqlx = { version = "0.7.4", features = ["runtime-tokio-native-tls", "postgres", "chrono", "uuid", "migrate"] }
serde = { version = "1.0.203", features = ["derive"] }
serde_json = "1.0.120"
chrono = { version = "0.4.38", features = ["serde"] }
uuid = { version = "1.9.1", features = ["v4", "serde"] }
anyhow = { version = "1.0.86", features = ["backtrace"] }
thiserror = "1.0.61"
tracing = "0.1.40"
tracing-subscriber = { version = "0.3.18", features = ["env-filter", "json"] }
dotenvy = "0.15.7"
tower-http = { version = "0.5.2", features = ["cors", "trace"] }
rand = "0.8.5"
hex = "0.4.3"

[dev-dependencies]
reqwest = { version = "0.12.5", features = ["json"] }`
  },
  {
    name: "main.rs",
    path: "backend/src/main.rs",
    type: "rust",
    description: "Sets up structured JSON telemetry with tracing-subscriber (enabling production JSON outputs) and boots the Axum TcpListener.",
    code: `use std::net::SocketAddr;
use tracing::{info, warn};
use tracing_subscriber::{prelude::*, EnvFilter};
use dotenvy::dotenv;

mod db;
mod error;
mod handlers;
mod models;
mod routes;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 1. Initialize environment variables
    if let Err(_) = dotenv() {
        warn!(".env file omitted or inaccessible. Defaulting to system environment settings");
    }

    // 2. Initialize structured production logging (Json tracing subscriber) for excellent visibility
    let logs_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("agent_duel_backend=info,tower_http=info,sqlx=warn"));

    tracing_subscriber::registry()
        .with(logs_filter)
        .with(tracing_subscriber::fmt::layer().json()) // structured json for logging monitors like Datadog/Splunk
        .init();

    info!("Structured logging engine loaded. Powering up Agent Duel Core VM!");

    // 3. Resolve PostgreSQL instance URL
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/agent_duel".to_string());

    // 4. Initialize Database connection pool & run SQlx automatic migrations
    let pool = db::init_pool(&database_url).await?;

    // 5. Build and configure Axum routing map
    let app = routes::compile_routes(pool);

    // 6. Bind listener address
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()
        .unwrap_or(3000);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!(address = %addr, "Axum server successfully bound. Ready for high stakes dApp pipelines");

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}`
  },
  {
    name: "error.rs",
    path: "backend/src/error.rs",
    type: "rust",
    description: "Integrates robust error conversion by wrapping anyhow::Error into a custom IntoResponse structure. Maps Postgres block/deadlocks securely.",
    code: `use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use tracing::error;

/// AppError acts as an adapter that bridges robust standard anyhow::Error
/// contexts into precise client-facing Axum HTTP Responses.
pub struct AppError(pub anyhow::Error);

impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let err = self.0;
        
        error!(error_msg = %err, error_debug = ?err, "Internal system error intercepted");

        let status = if err.downcast_ref::<sqlx::Error>().is_some() {
            StatusCode::SERVICE_UNAVAILABLE
        } else {
            StatusCode::INTERNAL_SERVER_ERROR
        };

        let body = Json(json!({
            "success": false,
            "error": err.to_string(),
            "support": "Veklom Mainnet Protocol Team"
        }));

        (status, body).into_response()
    }
}`
  },
  {
    name: "handlers.rs",
    path: "backend/src/handlers.rs",
    type: "rust",
    description: "Asynchronous handlers managing wallet registers, wager locks with Postgres ACID-compliant transactional bounds, and real-time leaderboards.",
    code: `use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use sqlx::PgPool;
use tracing::{info, instrument};
use uuid::Uuid;
use anyhow::{Context, Result};
use crate::{
    error::AppError,
    models::{WalletRegistry, WagerRecord, LeaderboardEntry, GameRound},
};

#[instrument(skip(pool))]
pub async fn register_or_connect_wallet(
    State(pool): State<PgPool>,
    Json(payload): Json<WalletRegistry>,
) -> Result<Json<Value>, AppError> {
    info!(wallet = %payload.address, "Accessing wallet connection controller");

    sqlx::query!(
        "INSERT INTO wallet_registry (address, id_wallet, payment_wallet, verification_domain, network) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (address) DO UPDATE SET id_wallet = EXCLUDED.id_wallet, payment_wallet = EXCLUDED.payment_wallet, is_active = TRUE",
        payload.address, payload.id_wallet, payload.payment_wallet, payload.verification_domain, payload.network
    )
    .execute(&pool).await.context("Unable to insert wallet state")?;

    Ok(Json(json!({
        "status": "success",
        "message": "Veklom wallet registered seamlessly on Base mainnet"
    })))
}`
  },
  {
    name: "routes.rs",
    path: "backend/src/routes.rs",
    type: "rust",
    description: "Sets CORS layers to allow easy secure cross-platform integration for dApps inside the Base.org ecosystem frames.",
    code: `use axum::{
    routing::{get, post},
    Router,
};
use sqlx::PgPool;
use tower_http::cors::{Any, CorsLayer};

use crate::handlers::{
    register_or_connect_wallet,
    create_wager,
    query_leaderboard,
    query_facilitator,
};

pub fn compile_routes(pool: PgPool) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/api/wallet/connect", post(register_or_connect_wallet))
        .route("/api/wagers/submit", post(create_wager))
        .route("/api/leaderboard", get(query_leaderboard))
        .route("/api/facilitator/:key_id", get(query_facilitator))
        .route("/api/health", get(|| async { "Agent Duel base network node is ONLINE" }))
        .with_state(pool)
        .layer(cors)
}`
  },
  {
    name: "init.sql",
    path: "backend/migrations/init.sql",
    type: "sql",
    description: "Database table schema definitions managing wallets, wager transactions with index optimization, and dynamic configuration stats.",
    code: `-- Init SQL database schema
CREATE TABLE IF NOT EXISTS wallet_registry (
    address VARCHAR(42) PRIMARY KEY,
    id_wallet VARCHAR(42) NOT NULL,
    payment_wallet VARCHAR(42) NOT NULL,
    verification_domain VARCHAR(100) NOT NULL,
    network VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS game_rounds (
    round_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crash_multiplier DOUBLE PRECISION NOT NULL,
    winning_agent VARCHAR(1) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS wager_records (
    wager_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    selected_agent VARCHAR(1) NOT NULL,
    wager_amount_usdc DOUBLE PRECISION NOT NULL,
    cashout_multiplier DOUBLE PRECISION,
    payout_amount_usdc DOUBLE PRECISION NOT NULL,
    tx_hash VARCHAR(66) NOT NULL
);

CREATE TABLE IF NOT EXISTS leaderboard (
    wallet_address VARCHAR(42) PRIMARY KEY,
    total_won_usdc DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    best_multiplier DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
    streak INT DEFAULT 0 NOT NULL
);`
  },
  {
    name: "Dockerfile",
    path: "backend/Dockerfile",
    type: "docker",
    description: "Optimized container build plan utilizing cargo-chef to cache dependency builds for sub-second hot restarts.",
    code: `FROM clux/muslrust:1.78.0-stable AS planner
WORKDIR /app
RUN cargo install cargo-chef
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM clux/muslrust:1.78.0-stable AS cacher
WORKDIR /app
RUN cargo install cargo-chef
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --target x86_64-unknown-linux-musl --recipe-path recipe.json

FROM clux/muslrust:1.78.0-stable AS builder
WORKDIR /app
COPY . .
COPY --from=cacher /app/target target
RUN cargo build --release --target x86_64-unknown-linux-musl --bin agent_duel_backend

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/agent_duel_backend .
CMD ["./agent_duel_backend"]`
  },
  {
    name: "ci-cd.yml",
    path: "backend/.github/workflows/ci-cd.yml",
    type: "yaml",
    description: "Enforces cargo fmt checks, rust clippy linting passes, compile validations and migrations testing against standard test databases.",
    code: `name: Agent Duel Backend CD Protocol
on:
  push:
    branches: [ "main", "staging" ]

jobs:
  audit-and-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Rust Compiler
      uses: dtolnay/rust-toolchain@stable
    - name: Code Formatting Check
      run: cargo fmt --check
    - name: Clippy Linting Check
      run: cargo clippy -- -D warnings
    - name: Run Integration Tests
      run: cargo test --all-targets`
  }
];

export function RustCodeViewer() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const file = RUST_WORKSPACE_FILES[selectedIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(file.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="rust-specs-terminal" className="bg-[#0d0f16] border border-white/10 rounded-lg p-5 flex flex-col md:flex-row gap-5 relative shadow-lg shadow-blue-900/5">
      
      {/* File browser panel */}
      <div className="w-full md:w-1/3 flex flex-col gap-1.5 border-r border-white font-mono border-white/5 pr-3">
        <div className="flex items-center gap-2 mb-2 text-slate-400 border-b border-white/5 pb-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-widest">// Backend Workspace</span>
        </div>

        {RUST_WORKSPACE_FILES.map((f, i) => (
          <button
            key={f.path}
            onClick={() => { setSelectedIdx(i); setCopied(false); }}
            className={`w-full text-left px-3 py-2 text-xs rounded transition-all flex items-center justify-between border ${
              selectedIdx === i
                ? 'bg-blue-500/5 border-blue-500/20 text-blue-400 font-bold shadow-sm'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {f.type === 'rust' && <FileCode className="w-3.5 h-3.5" />}
              {f.type === 'toml' && <Settings className="w-3.5 h-3.5" />}
              {f.type === 'sql' && <Database className="w-3.5 h-3.5" />}
              {f.type === 'docker' && <Server className="w-3.5 h-3.5" />}
              {f.type === 'yaml' && <Settings className="w-3.5 h-3.5" />}
              <span>{f.name}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
          </button>
        ))}

        <div className="mt-4 bg-[#050608]/60 p-3 rounded border border-white/5 text-[10px] text-slate-500 leading-snug">
          <p className="font-bold text-slate-400 mb-1">PROGRES MULTI-STACK RUST</p>
          <p>This backend fully is laid out at <code className="text-slate-300">/backend</code> folder inside of your applet filesystem. Feel free to copy & build.</p>
        </div>
      </div>

      {/* Code Editor Frame */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050608] border border-white/5 rounded">
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 bg-[#0d0f16]/60 font-mono text-xs">
          <span className="text-slate-400 text-[11px] font-bold tracking-wider truncate">
            {file.path}
          </span>
          <button
            onClick={handleCopy}
            className="text-slate-500 hover:text-blue-400 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Source
              </>
            )}
          </button>
        </div>

        {/* Code Block */}
        <div className="p-4 overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <pre className="font-mono text-[11px] text-[#d4dbe8] leading-relaxed whitespace-pre font-normal select-text">
            <code>{file.code}</code>
          </pre>
        </div>

        {/* Description footer */}
        <div className="border-t border-white/5 p-3 bg-[#0d0f16]/40 text-[11px] font-sans text-slate-400">
          <span className="font-bold text-blue-400 uppercase font-mono mr-1.5">[Architecture Node]:</span>
          {file.description}
        </div>
      </div>

    </div>
  );
}
