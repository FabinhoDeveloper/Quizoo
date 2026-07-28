// Som do jogo gerado proceduralmente (Web Audio) — sem arquivos de áudio.
let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = typeof localStorage !== 'undefined' && localStorage.getItem('quizoo_muted') === '1'
let musicTimer: ReturnType<typeof setInterval> | null = null

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.9
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Chame no primeiro gesto do usuário (clique/toque) para liberar o áudio. */
export function primeAudio() {
  ensure()
}

export function isMuted() {
  return muted
}

export function setMuted(v: boolean) {
  muted = v
  if (typeof localStorage !== 'undefined') localStorage.setItem('quizoo_muted', v ? '1' : '0')
  if (master) master.gain.value = v ? 0 : 0.9
  if (v) stopMusic()
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.5) {
  const c = ensure()
  if (!c || !master) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = c.currentTime + start
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(vol, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export function playTick(urgent = false) {
  tone(urgent ? 1180 : 880, 0, 0.08, 'square', urgent ? 0.35 : 0.2)
}

export function playCorrect() {
  ;[523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle', 0.45))
}

export function playWrong() {
  tone(220, 0, 0.28, 'sawtooth', 0.3)
  tone(174, 0.06, 0.3, 'sawtooth', 0.28)
}

export function playFanfare() {
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.35, 'triangle', 0.5))
  tone(1318.5, 0.5, 0.5, 'triangle', 0.4)
}

// Música de fundo: acordes suaves em loop.
const CHORDS = [
  [261.63, 329.63, 392.0], // C
  [293.66, 349.23, 440.0], // Dm
  [349.23, 440.0, 523.25], // F
  [392.0, 493.88, 587.33], // G
]
export function startMusic() {
  if (muted || musicTimer) return
  let i = 0
  const playChord = () => {
    const chord = CHORDS[i % CHORDS.length]
    chord.forEach((f) => tone(f, 0, 1.9, 'sine', 0.06))
    i++
  }
  playChord()
  musicTimer = setInterval(playChord, 2000)
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer)
    musicTimer = null
  }
}
