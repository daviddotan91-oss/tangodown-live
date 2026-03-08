import React, { useState, useEffect, useRef } from 'react'
import { playBootComplete } from '../utils/soundManager'

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
]

// These lines show AFTER data is ready
const DATA_READY_LINES = [
  { text: '[DATA] All databases synchronized — OK', delay: 0, type: 'success' },
  { text: '', delay: 100, type: 'blank' },
  { text: '[FEED] Connecting to OSINT live feeds...', delay: 200, type: 'data' },
  { text: '[FEED] Feed latency: <200ms — NOMINAL', delay: 400, type: 'success' },
  { text: '[3D]   Initializing globe renderer...', delay: 550, type: 'system' },
  { text: '[3D]   WebGL 2.0 context — OK', delay: 700, type: 'success' },
  { text: '', delay: 800, type: 'blank' },
  { text: '═══════════════════════════════════════════════════════', delay: 900, type: 'divider' },
  { text: 'ALL SYSTEMS NOMINAL. WELCOME, OPERATOR.', delay: 1000, type: 'final' },
]

export default function BootSequence({ onComplete, dataReady }) {
  const [visibleLines, setVisibleLines] = useState([])
  const [phase, setPhase] = useState('typing') // typing, waiting, finishing, fadeout
  const [progressPct, setProgressPct] = useState(0)
  const containerRef = useRef(null)
  const startRef = useRef(Date.now())
  const dataReadyHandled = useRef(false)
  const phase1Done = useRef(false)

  // Phase 1: Boot lines (runs immediately)
  useEffect(() => {
    const timers = BOOT_LINES.map((line, i) =>
      setTimeout(() => {
        setVisibleLines(prev => [...prev, line])
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      }, line.delay)
    )

    // Mark phase 1 as done after last boot line
    const lastDelay = BOOT_LINES[BOOT_LINES.length - 1].delay
    const doneTimer = setTimeout(() => {
      phase1Done.current = true
      setPhase('waiting')
    }, lastDelay + 100)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(doneTimer)
    }
  }, [])

  // Phase 2: When data is ready AND phase 1 is done, show the rest
  useEffect(() => {
    if (!dataReady || dataReadyHandled.current) return

    const runPhase2 = () => {
      if (!phase1Done.current) {
        // Data loaded faster than boot lines — wait for them
        const check = setInterval(() => {
          if (phase1Done.current) {
            clearInterval(check)
            runPhase2Impl()
          }
        }, 50)
        setTimeout(() => clearInterval(check), 5000)
        return
      }
      runPhase2Impl()
    }

    const runPhase2Impl = () => {
      dataReadyHandled.current = true
      setPhase('finishing')

      const timers = DATA_READY_LINES.map((line, i) =>
        setTimeout(() => {
          setVisibleLines(prev => [...prev, line])
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
          }
        }, line.delay)
      )

      const lastDelay = DATA_READY_LINES[DATA_READY_LINES.length - 1].delay

      // Fadeout
      const fadeTimer = setTimeout(() => {
        setPhase('fadeout')
        playBootComplete()
      }, lastDelay + 400)

      // Complete
      const completeTimer = setTimeout(() => {
        onComplete()
      }, lastDelay + 1000)

      return () => {
        timers.forEach(clearTimeout)
        clearTimeout(fadeTimer)
        clearTimeout(completeTimer)
      }
    }

    runPhase2()
  }, [dataReady, onComplete])

  // Progress bar — fills to 60% during phase 1, then to 100% during phase 2
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      if (phase === 'finishing' || phase === 'fadeout') {
        setProgressPct(prev => Math.min(100, prev + 2))
      } else if (phase === 'waiting') {
        // Pulse between 55-65% while waiting for data
        setProgressPct(58 + Math.sin(elapsed / 300) * 5)
      } else {
        setProgressPct(Math.min(58, (elapsed / 1800) * 58))
      }
    }, 30)
    return () => clearInterval(interval)
  }, [phase])

  // Skip on keypress
  useEffect(() => {
    const handleKey = () => {
      if (dataReady) onComplete()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [dataReady, onComplete])

  // Waiting indicator
  const showWaiting = phase === 'waiting'

  return (
    <div className={`boot-sequence ${phase === 'fadeout' ? 'boot-fadeout' : ''}`}>
      <div className="boot-scanlines" />
      <div className="boot-vignette" />
      <div className="boot-terminal" ref={containerRef}>
        {visibleLines.map((line, i) => (
          <div key={i} className={`boot-line boot-line-${line.type}`}>
            {line.type === 'blank' ? '\u00A0' : line.text}
            {i === visibleLines.length - 1 && phase !== 'fadeout' && <span className="boot-cursor">_</span>}
          </div>
        ))}
        {showWaiting && (
          <div className="boot-line boot-line-data boot-waiting">
            [DATA] Synchronizing live feeds...
            <span className="boot-spinner" />
          </div>
        )}
      </div>
      <div className="boot-progress-bar">
        <div className="boot-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="boot-progress-pct">{Math.floor(progressPct)}%</div>
      <div className="boot-skip" onClick={onComplete}>
        PRESS ANY KEY TO SKIP
      </div>
    </div>
  )
}
