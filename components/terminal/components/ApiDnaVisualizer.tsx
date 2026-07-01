"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Award, Info } from 'lucide-react';

interface DimensionScore {
  name: string;
  score: number;
  weight: number;
  desc: string;
}

interface ApiDnaVisualizerProps {
  dimensions: DimensionScore[];
  apiName: string;
  apiScore: number;
  apiGrade: string;
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
}

export const ApiDnaVisualizer: React.FC<ApiDnaVisualizerProps> = ({
  dimensions,
  apiName,
  apiScore,
  apiGrade,
  hoveredIndex,
  setHoveredIndex,
}) => {
  const [phase, setPhase] = useState(0);
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  // Animation loop for rotating the DNA double helix
  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== null) {
        const deltaTime = time - previousTimeRef.current;
        // Rotation speed
        setPhase((prev) => (prev + deltaTime * 0.001) % (2 * Math.PI));
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const width = 280;
  const height = 360;
  const padding = 25;
  const spacing = (height - 2 * padding) / 9;
  const center = width / 2;
  const maxAmplitude = 75;

  // Render nodes and rungs
  const rungs = dimensions.map((dim, idx) => {
    const scoreFactor = dim.score / 100;
    
    // Each rung is offset by an angle to form a spiral
    const rungAngle = (idx * Math.PI / 4.5) + phase;
    const cosVal = Math.cos(rungAngle);
    const sinVal = Math.sin(rungAngle); // Depth (-1 to 1)

    // Modulate amplitude by score to form the "Quality Shape"
    const amplitude = maxAmplitude * (0.3 + 0.7 * scoreFactor);
    const y = padding + idx * spacing;

    // Node coordinates
    const x1 = center - amplitude * cosVal;
    const x2 = center + amplitude * cosVal;

    // Node 1 is left-strand, Node 2 is right-strand
    // We use sinVal to style foreground vs background
    const z1 = sinVal;
    const z2 = -sinVal;

    // Color gradient based on score
    let color = '#8B5CF6'; // Purple for < 90
    if (dim.score >= 95) color = '#00FF66'; // Green for excellent
    else if (dim.score >= 90) color = '#00E5FF'; // Cyan for good

    return {
      idx,
      name: dim.name,
      score: dim.score,
      desc: dim.desc,
      weight: dim.weight,
      y,
      x1,
      x2,
      z1,
      z2,
      color,
      scoreFactor,
    };
  });

  return (
    <div className="flex flex-col items-center p-4 bg-black/60 rounded-xl border border-white/5 relative overflow-hidden select-none w-full h-full min-h-[400px] justify-between">
      {/* Decorative Cybernetic Frame lines */}
      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#00E5FF]/40" />
      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#00E5FF]/40" />
      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#00E5FF]/40" />
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#00E5FF]/40" />

      {/* Header and status */}
      <div className="w-full flex items-center justify-between border-b border-white/5 pb-2.5 font-mono text-[10px] tracking-wider text-white/40">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
          <span className="uppercase">QUALITY VECTOR MAP (DNA)</span>
        </div>
        <div className="text-glow-cyan text-[#00E5FF] font-bold">10-D COHERENCE</div>
      </div>

      {/* SVG Canvas for Double Helix */}
      <div className="relative flex-grow flex items-center justify-center py-2 w-full">
        <svg 
          width={width} 
          height={height} 
          viewBox={`0 0 ${width} ${height}`} 
          className="overflow-visible"
        >
          {/* Subtle grid lines in the background */}
          <line x1={center} y1={0} x2={center} y2={height} stroke="rgba(255,255,255,0.03)" strokeWidth={1} strokeDasharray="3 3" />
          <line x1={center - maxAmplitude} y1={0} x2={center - maxAmplitude} y2={height} stroke="rgba(255,255,255,0.015)" strokeWidth={1} />
          <line x1={center + maxAmplitude} y1={0} x2={center + maxAmplitude} y2={height} stroke="rgba(255,255,255,0.015)" strokeWidth={1} />

          {/* Rung connectors (Base Pairs) */}
          {rungs.map((rung) => {
            const isHovered = hoveredIndex === rung.idx;
            const opacityFactor = isHovered ? 1 : 0.45;
            return (
              <g 
                key={`rung-${rung.idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(rung.idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Glow underlay if hovered */}
                {isHovered && (
                  <line
                    x1={rung.x1}
                    y1={rung.y}
                    x2={rung.x2}
                    y2={rung.y}
                    stroke={rung.color}
                    strokeWidth={6}
                    strokeOpacity={0.15}
                    className="blur-sm"
                  />
                )}

                {/* Connecting Base Pair Line */}
                <line
                  x1={rung.x1}
                  y1={rung.y}
                  x2={rung.x2}
                  y2={rung.y}
                  stroke={isHovered ? rung.color : `rgba(255,255,255,${0.1 + 0.15 * rung.scoreFactor})`}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  strokeDasharray={isHovered ? 'none' : '4 2'}
                  opacity={opacityFactor}
                />

                {/* Hydrogen Bond Center Dot */}
                <circle
                  cx={center}
                  cy={rung.y}
                  r={isHovered ? 4 : 2}
                  fill={rung.color}
                  opacity={opacityFactor}
                  className="shadow-glow"
                />
              </g>
            );
          })}

          {/* Helix Strands (Backbone curves) */}
          {/* We draw curved paths between successive base-pair nodes to make the spiral ribbon stand out */}
          <path
            d={rungs.reduce((acc, r, i) => {
              if (i === 0) return `M ${r.x1} ${r.y}`;
              return `${acc} L ${r.x1} ${r.y}`;
            }, '')}
            fill="none"
            stroke="url(#strand-grad-left)"
            strokeWidth={1.5}
            opacity={0.3}
          />
          <path
            d={rungs.reduce((acc, r, i) => {
              if (i === 0) return `M ${r.x2} ${r.y}`;
              return `${acc} L ${r.x2} ${r.y}`;
            }, '')}
            fill="none"
            stroke="url(#strand-grad-right)"
            strokeWidth={1.5}
            opacity={0.3}
          />

          {/* DNA Strand Nodes (Spheres) */}
          {rungs.map((rung) => {
            const isHovered = hoveredIndex === rung.idx;
            
            // Strand A Node (Left side originally)
            const r1 = (rung.z1 > 0 ? 5.5 : 3.5) + (isHovered ? 2 : 0);
            const op1 = rung.z1 > 0 ? 1 : 0.4;
            const glow1 = rung.z1 > 0 && rung.score >= 90 ? '0 0 10px ' + rung.color : 'none';

            // Strand B Node (Right side originally)
            const r2 = (rung.z2 > 0 ? 5.5 : 3.5) + (isHovered ? 2 : 0);
            const op2 = rung.z2 > 0 ? 1 : 0.4;
            const glow2 = rung.z2 > 0 && rung.score >= 90 ? '0 0 10px ' + rung.color : 'none';

            return (
              <g 
                key={`nodes-${rung.idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(rung.idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Node 1 */}
                <circle
                  cx={rung.x1}
                  cy={rung.y}
                  r={r1}
                  fill={isHovered ? '#FFFFFF' : rung.color}
                  opacity={op1}
                  style={{ filter: glow1 !== 'none' ? 'drop-shadow(0px 0px 4px ' + rung.color + ')' : undefined }}
                />

                {/* Node 2 */}
                <circle
                  cx={rung.x2}
                  cy={rung.y}
                  r={r2}
                  fill={isHovered ? '#FFFFFF' : rung.color}
                  opacity={op2}
                  style={{ filter: glow2 !== 'none' ? 'drop-shadow(0px 0px 4px ' + rung.color + ')' : undefined }}
                />

                {/* Horizontal marker overlay on hover */}
                {isHovered && (
                  <rect
                    x={0}
                    y={rung.y - 12}
                    width={width}
                    height={24}
                    fill="rgba(0, 229, 255, 0.03)"
                    stroke="rgba(0, 229, 255, 0.08)"
                    strokeWidth={0.5}
                    pointerEvents="none"
                    rx={4}
                  />
                )}
              </g>
            );
          })}

          {/* Definitions for SVG Gradients */}
          <defs>
            <linearGradient id="strand-grad-left" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00FF66" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="strand-grad-right" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#00FF66" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>

        {/* DNA Hover Tooltip */}
        {hoveredIndex !== null && (
          <div 
            className="absolute bottom-4 left-4 right-4 bg-void-black/95 border border-white/10 p-3 rounded-lg backdrop-blur shadow-xl font-mono text-[9px] flex flex-col gap-1 transition-all duration-200 z-20"
          >
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="font-bold text-white uppercase">{dimensions[hoveredIndex].name}</span>
              <span className="font-bold text-[#00E5FF]">{dimensions[hoveredIndex].score} / 100</span>
            </div>
            <div className="text-white/50 leading-normal">{dimensions[hoveredIndex].desc}</div>
            <div className="flex justify-between items-center text-[8px] text-white/30 uppercase mt-0.5 pt-1 border-t border-white/5">
              <span>WEIGHT VALUE</span>
              <span className="font-bold text-white/60">{dimensions[hoveredIndex].weight}% COMPONENT</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom explanation */}
      <div className="w-full text-center text-[9px] font-mono text-white/30 uppercase leading-normal border-t border-white/5 pt-2.5">
        Hover helix nodes to pinpoint constraint thresholds.<br />
        Shape is mapped to the custom 10D API vector.
      </div>
    </div>
  );
};

interface MiniDnaVisualizerProps {
  dimensions: DimensionScore[];
  score: number;
}

export const MiniDnaVisualizer: React.FC<MiniDnaVisualizerProps> = ({ dimensions, score }) => {
  const width = 200;
  const height = 32;
  const paddingX = 10;
  const spacingX = (width - 2 * paddingX) / 9;
  const centerY = height / 2;

  const rungs = dimensions.map((dim, idx) => {
    const scoreFactor = dim.score / 100;
    const angle = (idx * Math.PI / 2.5); // Fixed spiral angle for distinct, consistent shapes
    const cosVal = Math.cos(angle);
    const amplitude = 2 + 8 * scoreFactor; // Shrunk/pinched on lower score, fat on high score
    
    const x = paddingX + idx * spacingX;
    const y1 = centerY - amplitude * cosVal;
    const y2 = centerY + amplitude * cosVal;

    let color = '#8B5CF6'; // Purple for < 90
    if (dim.score >= 95) color = '#00FF66'; // Green for excellent
    else if (dim.score >= 90) color = '#00E5FF'; // Cyan for good

    return {
      x,
      y1,
      y2,
      color,
    };
  });

  const leftPath = rungs.map((r, i) => (i === 0 ? 'M' : 'L') + ` ${r.x} ${r.y1}`).join(' ');
  const rightPath = rungs.map((r, i) => (i === 0 ? 'M' : 'L') + ` ${r.x} ${r.y2}`).join(' ');

  return (
    <div className="w-full h-8 flex items-center relative overflow-hidden select-none">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Subtle grid line in the center */}
        <line x1={0} y1={centerY} x2={width} y2={centerY} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} strokeDasharray="3 3" />

        {/* Connecting base pairs */}
        {rungs.map((rung, i) => (
          <line
            key={`mini-rung-${i}`}
            x1={rung.x}
            y1={rung.y1}
            x2={rung.x}
            y2={rung.y2}
            stroke={rung.color}
            strokeWidth={0.75}
            opacity={0.25}
          />
        ))}

        {/* Backbone strands */}
        <path d={leftPath} fill="none" stroke="url(#mini-grad-left)" strokeWidth={1} opacity={0.35} />
        <path d={rightPath} fill="none" stroke="url(#mini-grad-right)" strokeWidth={1} opacity={0.35} />

        {/* Nodes and center dots */}
        {rungs.map((rung, i) => (
          <g key={`mini-dots-${i}`}>
            <circle cx={rung.x} cy={rung.y1} r={1.2} fill={rung.color} opacity={0.9} />
            <circle cx={rung.x} cy={rung.y2} r={1.2} fill={rung.color} opacity={0.9} />
            <circle cx={rung.x} cy={centerY} r={0.6} fill={rung.color} opacity={0.5} />
          </g>
        ))}

        <defs>
          <linearGradient id="mini-grad-left" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00FF66" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="mini-grad-right" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#00FF66" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
