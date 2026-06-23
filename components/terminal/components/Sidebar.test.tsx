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

    // Check if agents count is present
    expect(screen.getByText('105 Nodes')).toBeInTheDocument();

    // Check if heartbeat is present
    expect(screen.getByText('NORMAL')).toBeInTheDocument();

    // Check if throughput is present
    expect(screen.getByText('125 KB/S')).toBeInTheDocument();
  });

  it('calls setActiveTab when a tab is clicked', () => {
    render(<Sidebar {...defaultProps} />);

    const runsLedgerTab = screen.getByRole('button', { name: /Runs Ledger/i });
    fireEvent.click(runsLedgerTab);

    expect(defaultProps.setActiveTab).toHaveBeenCalledWith('runs');
  });

  it('displays the correct heartbeat color based on status', () => {
    const { rerender } = render(<Sidebar {...defaultProps} />);

    let heartbeatText = screen.getByText('NORMAL');
    expect(heartbeatText).toHaveClass('text-matrix-emerald');

    rerender(<Sidebar {...defaultProps} mcpHeartbeat="ERROR" />);

    heartbeatText = screen.getByText('ERROR');
    expect(heartbeatText).toHaveClass('text-laser-red');
  });

  it('highlights the active tab', () => {
    const { rerender } = render(<Sidebar {...defaultProps} />);

    // Overview is default activeTab
    const overviewTab = screen.getByRole('button', { name: /Swarm Map/i });
    // It should have the text rendered with specific class indicating active state.
    // The inner text container has a different class based on active status.
    const overviewTextContainer = overviewTab.querySelector('div.flex-grow > div.text-xs');
    expect(overviewTextContainer).toHaveClass('text-white', 'font-semibold');

    // Run Spine is not active
    const runSpineTab = screen.getByRole('button', { name: /Run Spine/i });
    const runSpineTextContainer = runSpineTab.querySelector('div.flex-grow > div.text-xs');
    expect(runSpineTextContainer).toHaveClass('text-white/60');
  });
});
