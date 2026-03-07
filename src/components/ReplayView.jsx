import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Globe from './Globe'
import { getEventColor, formatUTC } from '../utils/dataUtils'

const OPERATIONS = [
  {
    id: 'all',
    name: 'GLOBAL OVERVIEW',
    subtitle: '24HR BATTLESPACE SUMMARY',
    conflictIds: null
  },
  {
    id: 'iron-swords',
    name: 'OPERATION IRON SWORDS',
    subtitle: 'ISRAEL-PALESTINE THEATER',
    conflictIds: ['israel-palestine', 'iran-israel-shadow']
  },
  {
    id: 'eastern-front',
    name: 'EASTERN FRONT',
    subtitle: 'UKRAINE-RUSSIA THEATER',
    conflictIds: ['ukraine-russia']
  },
  {
    id: 'red-sea',
    name: 'OPERATION PROSPERITY GUARDIAN',
    subtitle: 'RED SEA / BAB EL-MANDEB',
    conflictIds: ['red-sea-houthi']
  },
  {
    id: 'africa',
    name: 'AFRICAN THEATERS',
    subtitle: 'SAHEL / SUDAN / SOMALIA / DRC / ETHIOPIA',
    conflictIds: ['sahel-insurgency', 'sudan-civil', 'somalia-alshabaab', 'drc-conflict', 'ethiopia-internal']
  }
]

export default function ReplayView({ conflicts, incidents, naval }) {
  const [selectedOp, setSelectedOp] = useState(OPERATIONS[0])
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [progress, setProgress] = useState(0)
  const [currentEventIdx, setCurrentEventIdx] = useState(-1)
  const intervalRef = useRef(null)
  const progressRef = useRef(0)

  // Filter and sort incidents for selected operation
  const timeline = useMemo(() => {
    let filtered = [...incidents]
    if (selectedOp.conflictIds) {
      filtered = filtered.filter(inc => selectedOp.conflictIds.includes(inc.conflictId))
    }
    return filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }, [incidents, selectedOp])

  // Time range
  const timeRange = useMemo(() => {
    if (timeline.length === 0) return { start: 0, end: 1, duration: 1 }
    const start = new Date(timeline[0].timestamp).getTime()
    const end = new Date(timeline[timeline.length - 1].timestamp).getTime()
    const duration = Math.max(end - start, 1)
    return { start, end, duration }
  }, [timeline])

  // Visible incidents based on progress
  const visibleIncidents = useMemo(() => {
    const currentTime = timeRange.start + progress * timeRange.duration
    return timeline.filter(inc => new Date(inc.timestamp).getTime() <= currentTime)
  }, [timeline, progress, timeRange])

  // Current event
  const currentEvent = useMemo(() => {
    if (visibleIncidents.length === 0) return null
    return visibleIncidents[visibleIncidents.length - 1]
  }, [visibleIncidents])

  // Current time display
  const currentTimeStr = useMemo(() => {
    const t = new Date(timeRange.start + progress * timeRange.duration)
    return t.toISOString().replace('T', ' ').slice(0, 19) + 'Z'
  }, [progress, timeRange])

  // Simulate a feed for arc traces — only the most recently revealed incident
  const replayFeed = useMemo(() => {
    return visibleIncidents.slice().reverse()
  }, [visibleIncidents])

  // Playback loop
  useEffect(() => {
    if (!playing) {
      clearInterval(intervalRef.current)
      return
    }

    const step = 0.002 * speed
    intervalRef.current = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + step, 1)
      setProgress(progressRef.current)
      if (progressRef.current >= 1) {
        setPlaying(false)
      }
    }, 50)

    return () => clearInterval(intervalRef.current)
  }, [playing, speed])

  // Sync ref with state
  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  const handlePlayPause = useCallback(() => {
    if (progress >= 1) {
      setProgress(0)
      progressRef.current = 0
    }
    setPlaying(p => !p)
  }, [progress])

  const handleProgressClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const newProgress = Math.max(0, Math.min(1, x))
    setProgress(newProgress)
    progressRef.current = newProgress
  }, [])

  const handleOpSelect = useCallback((op) => {
    setSelectedOp(op)
    setProgress(0)
    progressRef.current = 0
    setPlaying(false)
  }, [])

  const handleRestart = useCallback(() => {
    setProgress(0)
    progressRef.current = 0
    setPlaying(true)
  }, [])

  return (
    <div className="replay-view">
      {/* Globe */}
      <Globe
        conflicts={selectedOp.conflictIds
          ? conflicts.filter(c => selectedOp.conflictIds.includes(c.id))
          : conflicts}
        incidents={visibleIncidents}
        feed={replayFeed}
        naval={selectedOp.conflictIds ? [] : naval}
        onIncidentClick={() => {}}
        selectedIncident={null}
      />

      {/* Operation Selector */}
      <div className="replay-ops-bar">
        {OPERATIONS.map(op => (
          <button
            key={op.id}
            className={`replay-op-btn ${selectedOp.id === op.id ? 'active' : ''}`}
            onClick={() => handleOpSelect(op)}
          >
            <span className="replay-op-name">{op.name}</span>
          </button>
        ))}
      </div>

      {/* Operation Title */}
      <div className="replay-title-overlay">
        <div className="replay-title">{selectedOp.name}</div>
        <div className="replay-subtitle">{selectedOp.subtitle}</div>
      </div>

      {/* Current Event Card */}
      {currentEvent && progress > 0 && (
        <div className="replay-event-card">
          <div className="replay-event-type" style={{ color: getEventColor(currentEvent.type) }}>
            {currentEvent.type}
          </div>
          <div className="replay-event-location">{currentEvent.location}</div>
          <div className="replay-event-time">{formatUTC(currentEvent.timestamp)}</div>
          <div className="replay-event-desc">{currentEvent.description}</div>
          <div className="replay-event-meta">
            <span className={`replay-event-force ${currentEvent.force}`}>
              {currentEvent.force?.toUpperCase()}
            </span>
            <span className="replay-event-source">{currentEvent.source}</span>
          </div>
        </div>
      )}

      {/* Stats overlay */}
      <div className="replay-stats-overlay">
        <div className="replay-stat">
          <span className="replay-stat-value">{visibleIncidents.length}</span>
          <span className="replay-stat-label">EVENTS</span>
        </div>
        <div className="replay-stat">
          <span className="replay-stat-value">{timeline.length}</span>
          <span className="replay-stat-label">TOTAL</span>
        </div>
        <div className="replay-stat">
          <span className="replay-stat-value">
            {visibleIncidents.filter(i => i.force === 'allied').length}
          </span>
          <span className="replay-stat-label">ALLIED</span>
        </div>
        <div className="replay-stat">
          <span className="replay-stat-value">
            {visibleIncidents.filter(i => i.force === 'hostile').length}
          </span>
          <span className="replay-stat-label">HOSTILE</span>
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="replay-timeline">
        <div className="replay-controls">
          <button className="replay-btn" onClick={handleRestart} title="Restart">
            &#9198;
          </button>
          <button className="replay-btn replay-play-btn" onClick={handlePlayPause}>
            {playing ? '\u275A\u275A' : '\u25B6'}
          </button>
          <div className="replay-speed">
            {[1, 2, 4, 8].map(s => (
              <button
                key={s}
                className={`replay-speed-btn ${speed === s ? 'active' : ''}`}
                onClick={() => setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="replay-progress-container" onClick={handleProgressClick}>
          {/* Event markers on timeline */}
          {timeline.map((inc, i) => {
            const pos = (new Date(inc.timestamp).getTime() - timeRange.start) / timeRange.duration
            return (
              <div
                key={inc.id}
                className={`replay-timeline-dot ${pos <= progress ? 'revealed' : ''}`}
                style={{
                  left: `${pos * 100}%`,
                  backgroundColor: getEventColor(inc.type)
                }}
                title={`${inc.type} — ${inc.location}`}
              />
            )
          })}
          {/* Progress bar */}
          <div className="replay-progress-track" />
          <div className="replay-progress-fill" style={{ width: `${progress * 100}%` }} />
          <div className="replay-progress-head" style={{ left: `${progress * 100}%` }} />
        </div>

        <div className="replay-time-display">
          {currentTimeStr}
        </div>
      </div>
    </div>
  )
}
