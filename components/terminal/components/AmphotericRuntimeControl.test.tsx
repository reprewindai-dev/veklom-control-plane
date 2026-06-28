"use client";
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AmphotericRuntimeControl } from './AmphotericRuntimeControl';

// Mock the pglLoader module
vi.mock('../data/pglLoader', () => ({
  API_BASE_URL: 'http://localhost:8080'
}));

describe('AmphotericRuntimeControl', () => {
  it('renders discovery status', () => {
    render(<AmphotericRuntimeControl />);
    expect(screen.getByText(/Amphoteric Runtime Enforcement/i)).toBeDefined();
    expect(screen.getByText(/http:\/\/localhost:8080/i)).toBeDefined();
  });

  it('shows empty catalog initially', () => {
    render(<AmphotericRuntimeControl />);
    expect(screen.getByText(/0 Primitives/i)).toBeDefined();
  });
});
