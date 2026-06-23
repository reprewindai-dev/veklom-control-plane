import { useCallback } from 'react';

export function useLockSound() {
  const playLockSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // Low frequency solid locking latch "clunk" sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Sweep frequency down from 95Hz to 45Hz to simulate heavy mass locking home
      osc.frequency.setValueAtTime(95, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      // Extremely fast attack for the impact thud
      gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.005);
      // Smooth decay
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      // High-pitched triangle click for the metallic shear bolt notch alignment
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(880, ctx.currentTime);
      clickOsc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);

      clickGain.gain.setValueAtTime(0, ctx.currentTime);
      // Fast attack
      clickGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.001);
      // Exponential decay
      clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      // Connect and start
      osc.connect(gain);
      gain.connect(ctx.destination);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);

      osc.start();
      clickOsc.start();

      osc.stop(ctx.currentTime + 0.3);
      clickOsc.stop(ctx.currentTime + 0.06);
    } catch (err) {
      console.warn('AudioContext failed:', err);
    }
  }, []);

  return playLockSound;
}
