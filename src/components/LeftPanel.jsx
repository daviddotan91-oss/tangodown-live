import React, { useState, useEffect, useRef } from 'react'
import { getIntensityColor } from '../utils/dataUtils'
import ConflictZone from './ConflictZone'

function ThreatGauge({ level }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    // Background arc
    ctx.beginPath()
    ctx.arc(w / 2, h - 10, 60, Math.PI, 0)
    ctx.strokeStyle = '#0a1628'
    ctx.lineWidth = 8
    ctx.stroke()

    // Threat level arc
    const angle = Math.PI + (level / 100) * Math.PI
    const gradient = ctx.createLinearGradient(0, 0, w, 0)
    gradient.addColorStop(0, '#00ff88')
    gradient.addColorStop(0.4, '#ffd700')
    gradient.addColorStop(0.7, '#ff8800')
    gradient.addColorStop(1, '#ff2d2d')

    ctx.beginPath()
    ctx.arc(w / 2, h - 10, 60, Math.PI, angle)
    ctx.strokeStyle = gradient
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.stroke()

    // Needle
    const needleAngle = Math.PI + (level / 100) * Math.PI
    const nx = w / 2 + Math.cos(needleAngle) * 50
    const ny = (h - 10) + Math.sin(needleAngle) * 50
    ctx.beginPath()
    ctx.moveTo(w / 2, h - 10)
    ctx.lineTo(nx, ny)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Center dot
    ctx.beginPath()
    ctx.arc(w / 2, h - 10, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#00c8ff'
    ctx.fill()

  }, [level])

  return (
    <div className="threat-gauge">
      <div className="threat-gauge-title">GLOBAL THREAT LEVEL</div>
      <canvas ref={canvasRef} width={160} height={90} className="threat-gauge-canvas" />
      <div className="threat-gauge-value" style={{
        color: level > 80 ? '#ff2d2d' : level > 60 ? '#ff8800' : level > 40 ? '#ffd700' : '#00ff88'
      }}>
        {level}%
      </div>
      <div className="threat-gauge-label">
        {level > 80 ? 'CRITICAL' : level > 60 ? 'ELEVATED' : level > 40 ? 'GUARDED' : 'LOW'}
      </div>
    </div>
  )
}

function KillChainBar({ killChain }) {
  if (!killChain) return null
  const steps = [
    { key: 'detect', label: 'DETECT', color: '#00c8ff' },
    { key: 'classify', label: 'CLASSIFY', color: '#00c8ff' },
    { key: 'track', label: 'TRACK', color: '#ffd700' },
    { key: 'engage', label: 'ENGAGE', color: '#ff8800' },
    { key: 'neutralize', label: 'NEUTRALIZE', color: '#ff2d2d' }
  ]
  const total = steps.reduce((s, step) => s + (killChain[step.key] || 0), 0)

  return (
    <div className="kill-chain">
      <div className="kill-chain-title">KILL CHAIN — AVG RESPONSE</div>
      <div className="kill-chain-total">{total}s TOTAL</div>
      <div className="kill-chain-bars">
        {steps.map(step => (
          <div key={step.key} className="kill-chain-step">
            <div className="kill-chain-label">{step.label}</div>
            <div className="kill-chain-bar-bg">
              <div
                className="kill-chain-bar-fill"
                style={{
                  width: `${(killChain[step.key] / 60) * 100}%`,
                  backgroundColor: step.color
                }}
              />
            </div>
            <div className="kill-chain-value" style={{ color: step.color }}>{killChain[step.key]}s</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GlobalStats({ conflicts }) {
  const totals = conflicts.reduce((acc, c) => ({
    zones: acc.zones + 1,
    fronts: acc.fronts + (c.fronts?.length || 0),
    aircraft: acc.aircraft + (c.stats?.aircraftInTheater || 0),
    uas: acc.uas + (c.stats?.uasInTheater || 0),
    naval: acc.naval + (c.stats?.navalAssets || 0),
    engagements: acc.engagements + (c.stats?.dailyEngagements || 0)
  }), { zones: 0, fronts: 0, aircraft: 0, uas: 0, naval: 0, engagements: 0 })

  const stats = [
    { label: 'ACTIVE ZONES', value: totals.zones, color: '#ff2d2d' },
    { label: 'BATTLEFRONTS', value: totals.fronts, color: '#ff8800' },
    { label: 'AIRCRAFT', value: `${(totals.aircraft / 1000).toFixed(1)}K`, color: '#00c8ff' },
    { label: 'UAS IN THEATER', value: `${(totals.uas / 1000).toFixed(1)}K`, color: '#00c8ff' },
    { label: 'NAVAL ASSETS', value: totals.naval, color: '#00c8ff' },
    { label: 'DAILY ENGAGEMENTS', value: totals.engagements, color: '#ffd700' }
  ]

  return (
    <div className="global-stats">
      <div className="global-stats-title">GLOBAL STATS</div>
      <div className="global-stats-grid">
        {stats.map(s => (
          <div key={s.label} className="global-stat-item">
            <div className="global-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="global-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LeftPanel({ conflicts, onConflictSelect, selectedConflict }) {
  const [threatLevel, setThreatLevel] = useState(72)
  const [expandedConflict, setExpandedConflict] = useState(null)

  // Fluctuating threat level
  useEffect(() => {
    const interval = setInterval(() => {
      setThreatLevel(prev => {
        const delta = (Math.random() - 0.48) * 3
        return Math.max(55, Math.min(95, prev + delta))
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Compute a global average kill chain from the highest intensity conflict
  const primaryConflict = conflicts.find(c => c.intensity === 'CRITICAL') || conflicts[0]
  const killChain = primaryConflict?.killChain

  const handleConflictClick = (conflict) => {
    if (expandedConflict?.id === conflict.id) {
      setExpandedConflict(null)
    } else {
      setExpandedConflict(conflict)
      onConflictSelect?.(conflict)
    }
  }

  return (
    <div className="left-panel">
      <div className="panel-header">
        <span className="panel-header-icon">&#9650;</span>
        SITUATION OVERVIEW
      </div>

      <div className="left-panel-scroll">
        <ThreatGauge level={Math.round(threatLevel)} />
        <GlobalStats conflicts={conflicts} />
        <KillChainBar killChain={killChain} />

        <div className="conflict-zones-section">
          <div className="section-title">
            CONFLICT ZONES
            <span className="section-count">{conflicts.length}</span>
          </div>

          <div className="conflict-zones-list">
            {conflicts.map(conflict => (
              <div key={conflict.id}>
                <div
                  className={`conflict-zone-item ${expandedConflict?.id === conflict.id ? 'expanded' : ''}`}
                  onClick={() => handleConflictClick(conflict)}
                >
                  <div className="conflict-zone-header">
                    <span
                      className="conflict-intensity-dot"
                      style={{ backgroundColor: getIntensityColor(conflict.intensity) }}
                    />
                    <span className="conflict-zone-name">{conflict.name}</span>
                    <span
                      className="conflict-intensity-badge"
                      style={{ color: getIntensityColor(conflict.intensity), borderColor: getIntensityColor(conflict.intensity) }}
                    >
                      {conflict.intensity}
                    </span>
                  </div>
                  <div className="conflict-zone-meta">
                    <span>{conflict.region}</span>
                    <span>{conflict.stats.dailyEngagements} ENG/DAY</span>
                    <span>{conflict.fronts.length} FRONTS</span>
                  </div>
                </div>

                {expandedConflict?.id === conflict.id && (
                  <ConflictZone conflict={conflict} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
