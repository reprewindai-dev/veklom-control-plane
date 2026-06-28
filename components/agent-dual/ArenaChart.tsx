/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface Point {
  t: number;
  m: number;
}

interface ArenaChartProps {
  points: Point[];
  phase: 'idle' | 'running' | 'crashed' | 'ejected';
  currentMulti: number;
}

export function ArenaChart({ points, phase, currentMulti }: ArenaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let resizeObserver: ResizeObserver;

    const draw = (width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);

      // 1. Render Background Grid Lines (Cyberpunk grid style)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (points.length < 2) {
        // Render a basic empty line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.moveTo(40, height - 30);
        ctx.lineTo(width - 20, height - 30);
        ctx.stroke();
        return;
      }

      // 2. Map coordinates with fluid paddings
      const maxT = Math.max(...points.map((p) => p.t), 2.5);
      const maxM = Math.max(...points.map((p) => p.m), 2.0);

      const pad = { left: 45, right: 25, top: 25, bottom: 35 };
      const gW = width - pad.left - pad.right;
      const gH = height - pad.top - pad.bottom;

      const toX = (t: number) => pad.left + (t / maxT) * gW;
      const toY = (m: number) => pad.top + gH - ((m - 1) / (maxM - 1)) * gH;

      // 3. Define Line Color States
      const isCrashed = phase === 'crashed';
      const isEjected = phase === 'ejected';
      
      let lineColor = '#3b82f6'; // Immersive Blue active
      let glowColor = 'rgba(59, 130, 246, 0.15)';
      
      if (isCrashed) {
        lineColor = '#ff1744'; // Red failure
        glowColor = 'rgba(255, 23, 68, 0.15)';
      } else if (isEjected) {
        lineColor = '#00e676'; // Green success
        glowColor = 'rgba(0, 230, 118, 0.15)';
      } else if (currentMulti >= 3.0) {
        lineColor = '#ff6d00'; // High stakes warning Orange
        glowColor = 'rgba(255, 109, 0, 0.2)';
      }

      // 4. Draw Linear Gradient Under the Curve
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(1));
      points.forEach((p) => ctx.lineTo(toX(p.t), toY(p.m)));
      ctx.lineTo(toX(points[points.length - 1].t), height - pad.bottom);
      ctx.lineTo(toX(0), height - pad.bottom);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();

      // 5. Draw Curve stroked line
      ctx.beginPath();
      ctx.moveTo(toX(points[0].t), toY(points[0].m));
      points.forEach((p) => ctx.lineTo(toX(p.t), toY(p.m)));
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // 6. Draw Glow Dot at the active front point
      const last = points[points.length - 1];
      const lx = toX(last.t);
      const ly = toY(last.m);
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 7. Y Axis Multipliers
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillStyle = 'rgba(90, 100, 120, 0.7)';
      ctx.textAlign = 'right';
      
      const step = Math.max(1, Math.floor(maxM / 4));
      for (let m = 1; m <= Math.ceil(maxM); m += step) {
        const y = toY(m);
        if (y > pad.top && y < height - pad.bottom + 5) {
          ctx.fillText(`${m}x`, pad.left - 8, y + 4);
        }
      }

      // 8. Bottom X Axis Timestamps
      ctx.font = '9px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(90, 100, 120, 0.5)';
      const tStep = maxT / 5;
      for (let i = 0; i <= 5; i++) {
        const t = i * tStep;
        ctx.fillText(`${t.toFixed(1)}s`, toX(t), height - 12);
      }
    };

    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        if (!entries || entries.length === 0) return;
        const rect = entries[0].contentRect;
        canvas.width = rect.width;
        canvas.height = rect.height;
        draw(rect.width, rect.height);
      });
      resizeObserver.observe(containerRef.current);
    } else {
      // Fallback: draw directly with current container dimensions or basic window resize listener
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
        draw(canvas.width, canvas.height);
      }
      
      const handleWindowResize = () => {
        if (containerRef.current) {
          canvas.width = containerRef.current.clientWidth;
          canvas.height = containerRef.current.clientHeight;
          draw(canvas.width, canvas.height);
        }
      };
      window.addEventListener('resize', handleWindowResize);
      return () => {
        window.removeEventListener('resize', handleWindowResize);
      };
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [points, phase, currentMulti]);

  return (
    <div id="chart-stage" ref={containerRef} className="w-full h-full relative min-h-[220px]">
      <canvas id="arena-line-canvas" ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
