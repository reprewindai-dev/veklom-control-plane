import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import DataGrid from '../DataGrid';
import { VeklomRun } from '../../types';

const mockRuns: VeklomRun[] = [
  {
    id: 'RUN-1001',
    intent: 'Deploy contract',
    status: 'completed',
    timestamp: '2023-10-27T10:00:00Z',
    duration: '124ms',
    currentStep: 'Attestation',
    steps: [],
    attestation: { seked: 'passed', arbiter: 'passed', converge: 'passed' },
    evidenceCount: 3,
    policyRule: 'SEC-GAS-LIMIT-MAX',
    policyStatus: 'passed',
    policyDetails: 'Gas limit within bounds',
    hash: '0xabc123',
  },
  {
    id: 'RUN-1002',
    intent: 'Transfer funds',
    status: 'failed',
    timestamp: '2023-10-27T10:05:00Z',
    duration: '45ms',
    currentStep: 'ArbiterOS',
    steps: [],
    attestation: { seked: 'passed', arbiter: 'failed', converge: 'pending' },
    evidenceCount: 1,
    policyRule: 'IAM-ATTESTATION',
    policyStatus: 'violated',
    policyDetails: 'Unauthorized user',
    hash: '0xdef456',
  },
  {
    id: 'RUN-1003',
    intent: 'Read state',
    status: 'running',
    timestamp: '2023-10-27T10:10:00Z',
    duration: '200ms',
    currentStep: 'Plan',
    steps: [],
    attestation: { seked: 'pending', arbiter: 'pending', converge: 'pending' },
    evidenceCount: 0,
    policyRule: 'OP-REDIS-LUA-QUEUE',
    policyStatus: 'warning',
    policyDetails: 'Queue approaching capacity',
    hash: '0xghi789',
  }
];

describe('DataGrid', () => {
  it('renders runs ledger by default', () => {
    render(<DataGrid runs={mockRuns} />);

    // Check headers
    expect(screen.getByText('RUN ID')).toBeInTheDocument();
    expect(screen.getByText('INTENT PRE-VALIDATION')).toBeInTheDocument();

    // Check data
    expect(screen.getByText('RUN-1001')).toBeInTheDocument();
    expect(screen.getByText('Deploy contract')).toBeInTheDocument();
    expect(screen.getByText('RUN-1002')).toBeInTheDocument();
    expect(screen.getByText('Transfer funds')).toBeInTheDocument();
  });

  it('filters by search text', () => {
    render(<DataGrid runs={mockRuns} />);

    const searchInput = screen.getByPlaceholderText('Search execution runs...');
    fireEvent.change(searchInput, { target: { value: 'Transfer' } });

    expect(screen.queryByText('RUN-1001')).not.toBeInTheDocument();
    expect(screen.getByText('RUN-1002')).toBeInTheDocument();
    expect(screen.queryByText('RUN-1003')).not.toBeInTheDocument();
  });

  it('filters by policy status', () => {
    render(<DataGrid runs={mockRuns} />);

    const violatedButton = screen.getByText('violated');
    fireEvent.click(violatedButton);

    expect(screen.queryByText('RUN-1001')).not.toBeInTheDocument();
    expect(screen.getByText('RUN-1002')).toBeInTheDocument(); // Violated
    expect(screen.queryByText('RUN-1003')).not.toBeInTheDocument();
  });

  it('switches to evidence tab', () => {
    render(<DataGrid runs={mockRuns} />);

    const evidenceTab = screen.getByText(/Evidence Credentials/);
    fireEvent.click(evidenceTab);

    // Should show evidence columns
    expect(screen.getByText('CREDENTIAL ID')).toBeInTheDocument();
    expect(screen.getByText('DELEGATIVE SEAL HASH')).toBeInTheDocument();

    // Should show evidence data
    expect(screen.getByText('0xabc123')).toBeInTheDocument();
    expect(screen.getByText('0xdef456')).toBeInTheDocument();
  });

  it('handles empty states correctly', () => {
    render(<DataGrid runs={[]} />);
    expect(screen.getByText(/No matching running transactions inside proof pool/i)).toBeInTheDocument();
  });
});
