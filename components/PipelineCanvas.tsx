"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

export interface PNode {
  id: string;
  nodeType: string;
  label: string;
  cat: string; // models | retrieval | tools | routing | output | langchain | input
  x: number;
  y: number;
  certification?: {
    status?: string;
    adapter?: string;
    requires?: string[];
  };
}
export interface PEdge {
  id: string;
  source: string;
  target: string;
}

export const CAT_COLOR: Record<string, string> = {
  veklom: "#FFB800",      // Veklom governance
  agents: "#F59E0B",      // amber-orange
  models: "#22D3EE",      // cyan
  retrieval: "#A78BFA",   // violet
  integrations: "#3FB6FF",// blue
  data: "#60A5FA",        // steel-blue
  runtime: "#34D399",     // green
  custom: "#FB7185",      // rose
  tools: "#3FB6FF",       // legacy
  routing: "#FFB800",     // amber
  output: "#3EE7A2",      // green
  langchain: "#F59E0B",   // amber-orange
  input: "#8892AB",       // neutral
};

const NODE_W = 168;
const NODE_H = 46;

function portPos(n: PNode, side: "in" | "out") {
  return { x: n.x + (side === "out" ? NODE_W : 0), y: n.y + NODE_H / 2 };
}

export default function PipelineCanvas({
  nodes,
  edges,
  setNodes,
  setEdges,
  selected,
  setSelected,
  running,
  activeNodeId,
  onDelete,
}: {
  nodes: PNode[];
  edges: PEdge[];
  setNodes: (updater: (n: PNode[]) => PNode[]) => void;
  setEdges: (updater: (e: PEdge[]) => PEdge[]) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
  running: boolean;
  activeNodeId?: string | null;
  onDelete?: (id: string) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const [connect, setConnect] = useState<{ from: string; x: number; y: number } | null>(null);

  const boardPoint = useCallback((clientX: number, clientY: number) => {
    const r = boardRef.current!.getBoundingClientRect();
    return { x: clientX - r.left + boardRef.current!.scrollLeft, y: clientY - r.top + boardRef.current!.scrollTop };
  }, []);

  // Node dragging
  useEffect(() => {
    function move(e: PointerEvent) {
      if (drag.current) {
        const p = boardPoint(e.clientX, e.clientY);
        const { id, offX, offY } = drag.current;
        setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, x: Math.max(0, p.x - offX), y: Math.max(0, p.y - offY) } : n)));
      } else if (connect) {
        const p = boardPoint(e.clientX, e.clientY);
        setConnect((c) => (c ? { ...c, x: p.x, y: p.y } : c));
      }
    }
    function up(e: PointerEvent) {
      if (connect) {
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const targetId = el?.closest("[data-node-id]")?.getAttribute("data-node-id");
        if (targetId && targetId !== connect.from) {
          setEdges((es) => {
            if (es.some((ed) => ed.source === connect.from && ed.target === targetId)) return es;
            return [...es, { id: `e-${connect.from}-${targetId}-${Date.now()}`, source: connect.from, target: targetId }];
          });
        }
        setConnect(null);
      }
      drag.current = null;
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [connect, boardPoint, setNodes, setEdges]);

  function onNodePointerDown(e: React.PointerEvent, n: PNode) {
    if ((e.target as HTMLElement).dataset.port) return; // ignore when grabbing a port
    const p = boardPoint(e.clientX, e.clientY);
    drag.current = { id: n.id, offX: p.x - n.x, offY: p.y - n.y };
    setSelected(n.id);
  }

  return (
    <div
      ref={boardRef}
      className="relative h-[440px] w-full overflow-auto rounded-xl border border-border bg-bg-900"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
      onClick={(e) => { if (e.target === boardRef.current) setSelected(null); }}
    >
      <div className="relative" style={{ width: 1600, height: 760 }}>
        {/* Edges */}
        <svg className="absolute inset-0 pointer-events-none" width={1600} height={760}>
          <defs>
            <marker id="pc-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L6,4 L0,8 Z" fill="#5b6478" />
            </marker>
          </defs>
          {edges.map((ed) => {
            const s = nodes.find((n) => n.id === ed.source);
            const t = nodes.find((n) => n.id === ed.target);
            if (!s || !t) return null;
            const a = portPos(s, "out");
            const b = portPos(t, "in");
            const d = `M ${a.x} ${a.y} C ${a.x + 70} ${a.y}, ${b.x - 70} ${b.y}, ${b.x} ${b.y}`;
            return (
              <path
                key={ed.id}
                d={d}
                fill="none"
                stroke={running ? "#FFB800" : "#5b6478"}
                strokeWidth={1.6}
                markerEnd="url(#pc-arrow)"
                strokeDasharray={running ? "6 5" : undefined}
                className={running ? "pc-flow" : undefined}
              />
            );
          })}
          {connect && (() => {
            const s = nodes.find((n) => n.id === connect.from);
            if (!s) return null;
            const a = portPos(s, "out");
            return <path d={`M ${a.x} ${a.y} C ${a.x + 70} ${a.y}, ${connect.x - 70} ${connect.y}, ${connect.x} ${connect.y}`} fill="none" stroke="#FFB800" strokeWidth={1.6} strokeDasharray="4 4" />;
          })()}
        </svg>

        {/* Nodes */}
        {nodes.map((n) => {
          const color = CAT_COLOR[n.cat] || CAT_COLOR.input;
          const isSel = selected === n.id;
          const isActive = activeNodeId === n.id;
          const certStatus = n.certification?.status || "real";
          return (
            <div
              key={n.id}
              data-node-id={n.id}
              onPointerDown={(e) => onNodePointerDown(e, n)}
              className={clsx(
                "group absolute select-none rounded-lg border bg-bg-800 shadow-lg cursor-grab active:cursor-grabbing transition-shadow",
                isSel ? "border-brand-400 ring-1 ring-brand-400/40"
                : isActive ? "border-amber-400 ring-2 ring-amber-400/50 bg-amber-400/10 animate-pulse shadow-amber-950"
                : "border-border-strong hover:border-ink-600"
              )}
              style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
            >
              <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg" style={{ background: color }} />
              {/* input port */}
              <span
                data-port="in"
                className="absolute -left-[6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-bg-900"
                style={{ background: color }}
              />
              {/* output port */}
              <span
                data-port="out"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const p = boardPoint(e.clientX, e.clientY);
                  setConnect({ from: n.id, x: p.x, y: p.y });
                }}
                className="absolute -right-[6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-bg-900 cursor-crosshair hover:scale-125 transition"
                style={{ background: color }}
                title="Drag to connect"
              />
              <div className="flex items-center gap-2 px-2.5 h-full pl-3.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-ink-50 truncate leading-tight">{n.label}</div>
                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-ink-600 truncate">
                    <span className="truncate">{n.cat}</span>
                    <span className={clsx(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      certStatus === "real" ? "bg-accent-green" : certStatus === "unsafe" ? "bg-accent-red" : "bg-brand-400"
                    )} title={`Node certification: ${certStatus}`} />
                  </div>
                </div>
              </div>
              {isSel && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    setNodes((ns) => ns.filter((x) => x.id !== n.id));
                    setEdges((es) => es.filter((e) => e.source !== n.id && e.target !== n.id));
                    onDelete?.(n.id);
                    setSelected(null);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 grid place-items-center rounded-full bg-accent-red/90 text-white hover:bg-accent-red"
                  title="Delete node"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
