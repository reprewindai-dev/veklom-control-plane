"use client";
import { useState } from "react";
import { Card } from "@/components/ui";
import { ChevronLeft, ChevronRight, PlayCircle, BarChart, ShieldCheck } from "lucide-react";

export function VideoCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      type: "video-mock",
      title: "The Black Box Problem",
      description: "Visualizing traditional IAM vs Agentic Execution",
      icon: <PlayCircle size={32} className="text-brand-500" />
    },
    {
      type: "chart-mock",
      title: "Cost of Runaway Agents",
      description: "API spend trajectory without x402 boundaries",
      icon: <BarChart size={32} className="text-accent-red" />
    },
    {
      type: "diagram-mock",
      title: "SEKED Semantic Gateway",
      description: "Intent → Plan → Policy → Execution",
      icon: <ShieldCheck size={32} className="text-accent-green" />
    }
  ];

  const next = () => setActiveSlide((prev) => (prev + 1) % slides.length);
  const prev = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="my-8">
      <Card className="border-border p-0 overflow-hidden relative group">
        <div className="aspect-video bg-bg-900 flex flex-col items-center justify-center text-center p-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-bg-900" />
          
          <div className="relative z-10 flex flex-col items-center gap-4 animate-fade-up" key={activeSlide}>
            <div className="p-4 bg-bg-800 rounded-full border border-border shadow-xl">
              {slides[activeSlide].icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{slides[activeSlide].title}</h3>
              <p className="text-ink-300">{slides[activeSlide].description}</p>
            </div>
            
            {slides[activeSlide].type === "video-mock" && (
              <button className="mt-4 bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2">
                <PlayCircle size={18} /> Play Concept Video
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <button 
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-bg-800/80 hover:bg-bg-700 text-white rounded-full border border-border opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-bg-800/80 hover:bg-bg-700 text-white rounded-full border border-border opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight size={20} />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === activeSlide ? "bg-brand-400 w-4" : "bg-ink-600"}`}
            />
          ))}
        </div>
      </Card>
      <div className="text-center text-xs text-ink-400 mt-3 font-mono">Interactive Media Explorer</div>
    </div>
  );
}
