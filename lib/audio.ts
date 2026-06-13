"use client";

// Persist the UI sound settings in localStorage
let isMutedGlobal = false;

if (typeof window !== "undefined") {
  isMutedGlobal = localStorage.getItem("cyber_ui_muted") === "true";
}

export function setMuteState(muted: boolean) {
  isMutedGlobal = muted;
  if (typeof window !== "undefined") {
    localStorage.setItem("cyber_ui_muted", String(muted));
    // Dispatch a custom event to notify other components of the mute state change
    window.dispatchEvent(new CustomEvent("cyber_mute_changed", { detail: muted }));
  }
}

export function getMuteState(): boolean {
  return isMutedGlobal;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  return new AudioCtx();
}

// High pitched digital beep/blip on action click
export function playClickSound() {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

// Digital hum or hover chirp on element hover
export function playHoverSound() {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.setValueAtTime(900, ctx.currentTime + 0.02);

  gain.gain.setValueAtTime(0.012, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.04);
}

// Tri-tone digital chime on success/load events
export function playSuccessSound() {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "sine";
  osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.06); // E5
  osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12); // G5

  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.12); // C6

  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start();
  osc2.start();
  
  osc1.stop(ctx.currentTime + 0.25);
  osc2.stop(ctx.currentTime + 0.25);
}

// Glitch warning alarm for errors/disconnect alerts
export function playWarningSound() {
  if (isMutedGlobal) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(160, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.22);
}
