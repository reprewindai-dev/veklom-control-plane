// @ts-nocheck
"use client";
import React from 'react';
import { FailureEvent, SeverityType } from '../types';
import { AlertCircle, ShieldAlert, BadgeInfo, Info } from 'lucide-react';

interface MatrixTableProps {
  events: FailureEvent[];
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
}

export default function MatrixTable({ events, selectedEventId, onSelectEvent }: MatrixTableProps) {
  
  const getSeverityBadge = (severity: SeverityType) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-rose-700 bg-rose-50 border border-rose-100 glow-shadow-rose">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-amber-700 bg-amber-50 border border-amber-100 glow-shadow-amber">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase text-blue-700 bg-blue-50 border border-blue-100 glow-shadow-blue">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase text-slate-600 bg-slate-100 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-display font-medium text-slate-800 text-sm tracking-tight mb-1 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-indigo-600" />
          Degradation Vectored Scenarios
        </h4>
        <p className="text-[11px] text-slate-400 font-mono">Select a path below to active lock simulator controls</p>
      </div>

      <div id="fault-matrix-incidents-list" className="space-y-3">
        {events.map((event) => {
          const isSelected = event.id === selectedEventId;
          return (
            <div
              key={event.id}
              id={`fault-card-${event.id}`}
              onClick={() => onSelectEvent(event.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/20 ring-4 ring-indigo-50'
                  : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="space-y-0.5">
                  <h5 className="font-display font-bold text-slate-800 text-xs tracking-tight">
                    {event.name}
                  </h5>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">
                    Target: {event.componentAffected}
                  </span>
                </div>
                <div className="shrink-0">
                  {getSeverityBadge(event.severity)}
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-500 mb-3 font-sans">
                {event.shortImpact}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-50 text-[10px] font-mono text-slate-400">
                <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-slate-500">
                  Lease Model: {event.lockType}
                </span>
                <span className="text-slate-300">•</span>
                <span>Standby: {event.recoveryTtl}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

