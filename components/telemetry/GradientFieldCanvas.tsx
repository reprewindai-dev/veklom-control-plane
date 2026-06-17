"use client";

import React, { useEffect, useRef } from 'react';

export default function GradientFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;
    
    // Resize handler
    const handleResize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const nodes = [
      { id: 'ollama', x: 0.2, y: 0.5, label: 'Ollama (Primary)', color: '#10b981' },
      { id: 'groq', x: 0.5, y: 0.3, label: 'Groq (Fast Fallback)', color: '#06b6d4' },
      { id: 'gemini', x: 0.8, y: 0.5, label: 'Gemini (Heavy Fallback)', color: '#8b5cf6' },
      { id: 'openai', x: 0.8, y: 0.7, label: 'OpenAI (Heavy Fallback)', color: '#f59e0b' }
    ];

    let time = 0;

    const render = () => {
      time += 0.01;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw connections / gradient field
      ctx.lineWidth = 2;
      
      const drawConnection = (n1: any, n2: any, intensity: number) => {
        const x1 = n1.x * width;
        const y1 = n1.y * height;
        const x2 = n2.x * width;
        const y2 = n2.y * height;
        
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `${n1.color}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`);
        grad.addColorStop(1, `${n2.color}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        
        // Add some curve based on time
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2 + Math.sin(time) * 30;
        
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.strokeStyle = grad;
        ctx.stroke();
        
        // Particle moving along the line
        const t = (Math.sin(time * 2 + (n1.y * 10)) + 1) / 2;
        const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
        const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
        
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
      };

      // Ollama to Groq
      drawConnection(nodes[0], nodes[1], 0.6);
      // Groq to Gemini
      drawConnection(nodes[1], nodes[2], 0.8);
      // Groq to OpenAI
      drawConnection(nodes[1], nodes[3], 0.4);
      // Ollama direct to Gemini (heavy inference)
      drawConnection(nodes[0], nodes[2], 0.3);

      ctx.shadowBlur = 0;

      // Draw nodes
      nodes.forEach(node => {
        const x = node.x * width;
        const y = node.y * height;
        
        // Node pulse
        const pulse = Math.sin(time * 3 + node.x * 5) * 5;
        
        ctx.beginPath();
        ctx.arc(x, y, 12 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = `${node.color}33`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x, y + 25);
      });

      requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="w-full h-64 bg-[#05080f] rounded-xl border border-slate-800/50 relative overflow-hidden mb-8 shadow-[0_0_40px_-15px_rgba(16,185,129,0.1)]">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">Gradient Field Path Optimizer</span>
      </div>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
      
      {/* Decorative scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)'
      }} />
    </div>
  );
}
