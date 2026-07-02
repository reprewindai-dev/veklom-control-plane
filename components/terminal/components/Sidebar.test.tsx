"use client";
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from './Sidebar';

describe('Sidebar Component', () => {
  const defaultProps = {
    activeTab: 'overview',
    setActiveTab: vi.fn(),
    mcpHeartbeat: 'NORMAL',
    throughput: 125,
    agentsCount: 105,
  };

  it('renders correctly with given props', () => {
    render(<Sidebar {...defaultProps} />);

    // Check if main title exists
    expect(screen.getByText('UACP')).toBeInTheDocument();

    // Check if Swarm Map is present (menu item)
    expect(screen.getByText('Swarm Map')).toBeInTheDocument();

    // Check if Control Node is present (menu item)
    expect(screen.getByText('Control Node')).toBeInTheDocument();

    // Check if Swarm Terminal is present (menu item)
    expect(screen.getByText('Swarm Terminal')).toBeInTheDocument();
  });

  it('calls setActiveTab when a tab is clicked', () => {
    render(<Sidebar {...defaultProps} />);

    const incidentsTab = screen.getByRole('button', { name: /Incidents & Slashing/i });
    fireEvent.click(incidentsTab);

    expect(defaultProps.setActiveTab).toHaveBeenCalledWith('runs');
  });

  it('displays the correct heartbeat color based on status', () => {
    const { rerender } = render(<Sidebar {...defaultProps} />);

    let heartbeatText = screen.getByText('ONLINE');
    expect(heartbeatText).toHaveClass('text-matrix-emerald');

    rerender(<Sidebar {...defaultProps} mcpHeartbeat="ERROR" />);

    heartbeatText = screen.getByText('ERROR');
    expect(heartbeatText).toHaveClass('text-laser-red');
  });

  it('highlights the active tab', () => {
    const { rerender } = render(<Sidebar {...defaultProps} />);

    // Control Node is default activeTab ('overview')
    const controlNodeTab = screen.getByRole('button', { name: /Control Node/i });
    const controlNodeTextContainer = controlNodeTab.querySelector('div.flex-grow > div');
    expect(controlNodeTextContainer).toHaveClass('text-white', 'font-semibold');

    // Pipelines & GPC is not active ('spine')
    const pipelinesTab = screen.getByRole('button', { name: /Pipelines & GPC/i });
    const pipelinesTextContainer = pipelinesTab.querySelector('div.flex-grow > div');
    expect(pipelinesTextContainer).toHaveClass('text-white/60');
  });
});
