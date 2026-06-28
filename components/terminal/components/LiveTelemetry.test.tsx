"use client";
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import LiveTelemetry from './LiveTelemetry';

describe('LiveTelemetry Component', () => {
  const m = { throughput: 1, attestationRate: 9, gasSaved: 4, activeQueue: 5, uptime: '9%', totalExecutions: 1 };
  const l = [{ timestamp: '2023-10-27T10:00:00Z', source: 'SYS', message: 'Sys init', type: 'info' as const }];

  beforeEach(() => { window.HTMLElement.prototype.scrollIntoView = vi.fn(); });

  it('renders metrics and logs correctly', () => {
    render(<LiveTelemetry logs={l} metrics={m} onTriggerManualOverride={vi.fn()} />);
    expect(screen.getByText('1 KB/S')).toBeInTheDocument();
    expect(screen.getByText('Sys init')).toBeInTheDocument();
  });

  it('triggers manual override with form values', () => {
    const onTrigger = vi.fn();
    render(<LiveTelemetry logs={l} metrics={m} onTriggerManualOverride={onTrigger} />);
    const input = screen.getByPlaceholderText('E.g., Flush secondary caches and reboot root VM.');
    fireEvent.change(input, { target: { value: 'Restart' } });
    fireEvent.click(screen.getByRole('button', { name: /Trigger Manual Override/i }));
    expect(onTrigger).toHaveBeenCalledWith('Restart', 'SEC-GAS-LIMIT-MAX');
    expect(input).toHaveValue('');
  });
});
