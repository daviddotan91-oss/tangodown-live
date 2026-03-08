// ═══════════════════════════════════════════════════════
// TANGODOWN.LIVE — Sound Design System
// All sounds generated procedurally via Web Audio API
// No external audio files needed
// ═══════════════════════════════════════════════════════

let audioCtx = null
let masterGain = null
let muted = false
let initialized = false

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    masterGain = audioCtx.createGain()
    masterGain.gain.value = 0.3
    masterGain.connect(audioCtx.destination)
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function getMaster() {
  getCtx()
  return masterGain
}

// ── UI Click (mechanical switch) ──
export function playClick() {
  if (muted) return
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(1800, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03)
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
  osc.connect(gain)
  gain.connect(getMaster())
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.05)
}

// ── Tab Switch (deeper mechanical) ──
export function playTabSwitch() {
  if (muted) return
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(400, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.06)
  gain.gain.setValueAtTime(0.06, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
  osc.connect(gain)
  gain.connect(getMaster())
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.08)
}

// ── New Incident Beep (tactical ping) ──
export function playIncidentBeep() {
  if (muted) return
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1200, ctx.currentTime)
  osc.frequency.setValueAtTime(800, ctx.currentTime + 0.05)
  gain.gain.setValueAtTime(0.06, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  osc.connect(gain)
  gain.connect(getMaster())
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.15)
}

// ── Impact Sound (thud + reverb) ──
export function playImpact() {
  if (muted) return
  const ctx = getCtx()
  // Low thud
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(80, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3)
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
  osc.connect(gain)
  gain.connect(getMaster())
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.4)

  // Noise burst
  const bufferSize = ctx.sampleRate * 0.1
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15))
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.04, ctx.currentTime)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
  noise.connect(noiseGain)
  noiseGain.connect(getMaster())
  noise.start(ctx.currentTime)
}

// ── Flash Traffic Klaxon (2-tone alarm) ──
export function playFlashTraffic() {
  if (muted) return
  const ctx = getCtx()
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    const t = ctx.currentTime + i * 0.2
    osc.frequency.setValueAtTime(880, t)
    osc.frequency.setValueAtTime(660, t + 0.1)
    gain.gain.setValueAtTime(0.05, t)
    gain.gain.setValueAtTime(0.03, t + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19)
    osc.connect(gain)
    gain.connect(getMaster())
    osc.start(t)
    osc.stop(t + 0.2)
  }
}

// ── Boot Sequence Typing ──
export function playBootKey() {
  if (muted) return
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(2400 + Math.random() * 400, ctx.currentTime)
  gain.gain.setValueAtTime(0.015, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02)
  osc.connect(gain)
  gain.connect(getMaster())
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.02)
}

// ── Boot Complete (ascending chime) ──
export function playBootComplete() {
  if (muted) return
  const ctx = getCtx()
  const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    const t = ctx.currentTime + i * 0.1
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0.06, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
    osc.connect(gain)
    gain.connect(getMaster())
    osc.start(t)
    osc.stop(t + 0.3)
  })
}

// ── Ambient Hum (start/stop) ──
let ambientOsc = null
let ambientOsc2 = null
let ambientGain = null

export function startAmbient() {
  if (muted || ambientOsc) return
  const ctx = getCtx()

  // Primary: low sawtooth hum
  ambientOsc = ctx.createOscillator()
  ambientGain = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  ambientOsc.type = 'sawtooth'
  ambientOsc.frequency.setValueAtTime(55, ctx.currentTime)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(120, ctx.currentTime)
  filter.Q.setValueAtTime(2, ctx.currentTime)
  ambientGain.gain.setValueAtTime(0, ctx.currentTime)
  ambientGain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 2)
  ambientOsc.connect(filter)
  filter.connect(ambientGain)
  ambientGain.connect(getMaster())
  ambientOsc.start(ctx.currentTime)

  // Secondary: sine sub-bass with LFO modulation
  ambientOsc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  ambientOsc2.type = 'sine'
  ambientOsc2.frequency.setValueAtTime(40, ctx.currentTime)
  gain2.gain.setValueAtTime(0, ctx.currentTime)
  gain2.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 3)
  // LFO slowly modulates the sub-bass frequency
  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(0.08, ctx.currentTime) // very slow wobble
  lfoGain.gain.setValueAtTime(3, ctx.currentTime)
  lfo.connect(lfoGain)
  lfoGain.connect(ambientOsc2.frequency)
  ambientOsc2.connect(gain2)
  gain2.connect(getMaster())
  ambientOsc2.start(ctx.currentTime)
  lfo.start(ctx.currentTime)
}

export function stopAmbient() {
  if (ambientOsc) {
    try {
      ambientGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5)
      setTimeout(() => {
        try { ambientOsc.stop() } catch (e) {}
        try { ambientOsc2?.stop() } catch (e) {}
        ambientOsc = null
        ambientOsc2 = null
        ambientGain = null
      }, 600)
    } catch (e) {
      ambientOsc = null
      ambientOsc2 = null
      ambientGain = null
    }
  }
}

// ── Glitch static (for view transitions) ──
export function playGlitch() {
  if (muted) return
  const ctx = getCtx()
  const bufferSize = ctx.sampleRate * 0.08
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.04, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
  noise.connect(gain)
  gain.connect(getMaster())
  noise.start(ctx.currentTime)
}

// ── Mute Control ──
export function toggleMute() {
  muted = !muted
  if (muted) stopAmbient()
  else startAmbient()
  return muted
}

export function isMuted() { return muted }

// ── Init on first user interaction ──
export function initAudio() {
  if (initialized) return
  initialized = true
  getCtx()
  startAmbient()
}
