import React, { useState, useEffect, useRef } from 'react'

const BOOT_LINES = [
  { text: 'TANGODOWN.LIVE // BATTLESPACE INTELLIGENCE SYSTEM', delay: 0, type: 'header' },
  { text: '═══════════════════════════════════════════════════════', delay: 150, type: 'divider' },
  { text: '', delay: 250, type: 'blank' },
  { text: '[BOOT] Initializing kernel...', delay: 300, type: 'system' },
  { text: '[BOOT] Memory check: 64GB ECC — OK', delay: 450, type: 'system' },
  { text: '[NET]  Establishing encrypted uplink...', delay: 600, type: 'system' },
  { text: '[NET]  TLS 1.3 handshake — VERIFIED', delay: 800, type: 'success' },
  { text: '[AUTH] Operator clearance: UNCLASSIFIED // OSINT', delay: 1000, type: 'auth' },
  { text: '', delay: 1100, type: 'blank' },
  { text: '[DATA] Loading conflict database...', delay: 1200, type: 'data' },
  { text: '[DATA] Loading organization intel...', delay: 1350, type: 'data' },
  { text: '[DATA] Loading naval order of battle...', delay: 1500, type: 'data' },
  { text: '[DATA] Loading weapons arsenal...', delay: 1600, type: 'data' },
  { text: '[DATA] Loading broadcast feeds...', delay: 1700, type: 'data' },
  { text: '[DATA] All databases synchronized — OK', delay: 1900, type: 'success' },
  { text: '', delay: 2000, type: 'blank' },
  { text: '[FEED] Connecting to OSINT live feeds...', delay: 2100, type: 'data' },
  { text: '[FEED] Feed latency: <200ms — NOMINAL', delay: 2300, type: 'success' },
  { text: '[3D]   Initializing globe renderer...', delay: 2450, type: 'system' },
  { text: '[3D]   WebGL 2.0 context — OK', delay: 2600, type: 'success' },
  { text: '', delay: 2700, type: 'blank' },
  { text: '═══════════════════════════════════════════════════════', delay: 2800, type: 'divider' },
  { text: 'ALL SYSTEMS NOMINAL. WELCOME, OPERATOR.', delay: 2900, type: 'final' },
]

const TOTAL_DURATION = 3600

export default function BootSequence({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [phase, setPhase] = useState('typing') // typing, fadeout
  const [progressPct, setProgressPct] = useState(0)
  const containerRef = useRef(null)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const timers = BOOT_LINES.map((line, i) =>
      setTimeout(() => {
        setVisibleLines(prev => [...prev, line])
        setProgressPct(Math.min(100, ((line.delay / 2900) * 100)))
        // Auto-scroll
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      }, line.delay)
    )

    // Start fadeout
    const fadeTimer = setTimeout(() => setPhase('fadeout'), TOTAL_DURATION - 600)
    // Complete
    const completeTimer = setTimeout(() => onComplete(), TOTAL_DURATION)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  // Progress bar animation
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      setProgressPct(Math.min(100, (elapsed / (TOTAL_DURATION - 600)) * 100))
    }, 30)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`boot-sequence ${phase === 'fadeout' ? 'boot-fadeout' : ''}`}>
      <div className="boot-scanlines" />
      <div className="boot-terminal" ref={containerRef}>
        {visibleLines.map((line, i) => (
          <div key={i} className={`boot-line boot-line-${line.type}`}>
            {line.type === 'blank' ? '\u00A0' : line.text}
            {i === visibleLines.length - 1 && phase === 'typing' && <span className="boot-cursor">_</span>}
          </div>
        ))}
      </div>
      <div className="boot-progress-bar">
        <div className="boot-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="boot-progress-pct">{Math.floor(progressPct)}%</div>
    </div>
  )
}
