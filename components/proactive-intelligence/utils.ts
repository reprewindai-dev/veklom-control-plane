export function severityColor(sev: string) {
  if (sev === 'CRITICAL') return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (sev === 'WARNING') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
}

export function budgetColor(level: string) {
  if (level === 'exhausted') return 'text-red-400';
  if (level === 'critical') return 'text-red-400';
  if (level === 'warning') return 'text-amber-400';
  return 'text-accent-green';
}

export function circuitColor(state: string) {
  if (state === 'OPEN') return 'text-red-400';
  if (state === 'HALF_OPEN') return 'text-amber-400';
  return 'text-accent-green';
}
