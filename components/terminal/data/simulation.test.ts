import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateHash, ControlPlaneSimulationStore } from './simulation';

describe('generateHash', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with the provided prefix and an underscore', () => {
    const prefix = 'test';
    const hash = generateHash(prefix);
    expect(hash.startsWith(`${prefix}_`)).toBe(true);
  });

  it('should append exactly 24 characters after the prefix and underscore', () => {
    const prefix = 'test';
    const hash = generateHash(prefix);
    const parts = hash.split('_');

    expect(parts.length).toBeGreaterThanOrEqual(2);

    const generatedPart = hash.substring(prefix.length + 1);
    expect(generatedPart.length).toBe(24);
    expect(hash.length).toBe(prefix.length + 1 + 24);
  });

  it('should only contain valid characters in the generated part', () => {
    const prefix = 'ent';
    const hash = generateHash(prefix);
    const generatedPart = hash.substring(prefix.length + 1);

    // Check against characters present in SECURE_ENTROPY
    expect(/^[a-f0-9]{24}$/.test(generatedPart)).toBe(true);
  });

  it('should generate unique hashes for the same prefix', () => {
    const hash1 = generateHash('prefix');
    const hash2 = generateHash('prefix');

    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty prefixes correctly', () => {
    const hash = generateHash('');
    expect(hash.startsWith('_')).toBe(true);
    expect(hash.length).toBe(1 + 24);
  });

  it('should use crypto.getRandomValues to generate characters', () => {
    const getRandomValuesSpy = vi.spyOn(window.crypto, 'getRandomValues').mockImplementation((arr) => {
      const typedArr = arr as Uint8Array;
      for (let i = 0; i < typedArr.length; i++) {
        typedArr[i] = 8;
      }
      return arr;
    });

    const hash = generateHash('spy');

    expect(getRandomValuesSpy).toHaveBeenCalled();
    expect(hash.substring(4)).toHaveLength(24);
    const generatedPart = hash.substring(4);
    expect(generatedPart.split('').every(c => c === '2')).toBe(true);
  });
});

describe('ControlPlaneSimulationStore', () => {
  let store: ControlPlaneSimulationStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new ControlPlaneSimulationStore();
  });

  afterEach(() => {
    store.stopSimulation();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('subscribes and calls listeners when notify is triggered (e.g. via triggerManualRun)', () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    expect(listener).not.toHaveBeenCalled();

    store.triggerManualRun('Test intent');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.triggerManualRun('Another intent');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('starts and stops the simulation tick interval properly', () => {
    const listener = vi.fn();
    store.subscribe(listener);
    expect(listener).not.toHaveBeenCalled();

    store.stopSimulation();
    vi.advanceTimersByTime(2000);
    expect(listener).not.toHaveBeenCalled();

    store.startSimulation();
    vi.advanceTimersByTime(1800);
    expect(listener).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1800);
    expect(listener).toHaveBeenCalledTimes(2);

    store.stopSimulation();
    vi.advanceTimersByTime(2000);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('prevents starting multiple intervals if startSimulation is called consecutively', () => {
    const listener = vi.fn();
    store.subscribe(listener);

    store.stopSimulation();
    expect(listener).not.toHaveBeenCalled();

    store.startSimulation();
    store.startSimulation();

    vi.advanceTimersByTime(1800);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
