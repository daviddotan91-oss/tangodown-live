import React, { useState, useEffect } from 'react'
import { getIntensityColor } from '../utils/dataUtils'
import ConflictZone from './ConflictZone'

export default function LeftPanel({ conflicts, onConflictSelect, selectedConflict }) {
  const [threatLevel, setThreatLevel] = useState(91)
  const [expandedConflict, setExpandedConflict] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setThreatLevel(prev => {
        const delta = (Math.random() - 0.48) * 3
        return Math.max(55, Math.min(98, prev + delta))
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const totals = conflicts.reduce((acc, c) => ({
    zones: acc.zones + 1,
    fronts: acc.fronts + (c.fronts?.length || 0),
    aircraft: acc.aircraft + (c.stats?.aircraftInTheater || 0),
    uas: acc.uas + (c.stats?.uasInTheater || 0),
    naval: acc.naval + (c.stats?.navalAssets || 0),
    engagements: acc.engagements + (c.stats?.dailyEngagements || 0)
  }), { zones: 0, fronts: 0, aircraft: 0, uas: 0, naval: 0, engagements: 0 })

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

  const level = Math.round(threatLevel)
  const threatColor = level > 80 ? '#FF4444' : level > 60 ? '#FF6644' : level > 40 ? '#FFB800' : '#44CC44'
  const threatLabel = level > 80 ? 'CRITICAL' : level > 60 ? 'ELEVATED' : level > 40 ? 'GUARDED' : 'LOW'

  const killSteps = killChain ? [
    { key: 'detect', label: 'DETECT', color: '#0088FF' },
    { key: 'classify', label: 'CLASSIFY', color: '#00AAFF' },
    { key: 'track', label: 'TRACK', color: '#FFB800' },
    { key: 'engage', label: 'ENGAGE', color: '#FF6644' },
    { key: 'neutralize', label: 'KILL', color: '#FF4444' }
  ] : []
  const kcTotal = killSteps.reduce((s, step) => s + (killChain?.[step.key] || 0), 0)

  return (
    <div className="war-panel-left">
      {/* Header */}
      <div className="war-header">
        <div className="war-header-title">GOD'S EYE — GLOBAL BATTLESPACE</div>
        <div className="war-header-sub">
          CONFLICTS: OPEN-SOURCE INTEL&nbsp;
          <span className="war-osint-badge">● OSINT</span>
          &nbsp;//&nbsp;
          ENGAGEMENTS:&nbsp;
          <span className="war-sim-badge">◇ SIMULATED</span>
        </div>
      </div>

      {/* Threat Level */}
      <div className="war-threat">
        <div className="war-panel-title">GLOBAL THREAT LEVEL</div>
        <div className="war-threat-gauge">
          <div
            className="war-threat-fill"
            style={{
              width: `${level}%`,
              background: `linear-gradient(90deg, #44CC44, #FFB800, #FF6644, #FF4444)`,
              color: threatColor
            }}
          />
        </div>
        <div className="war-threat-value" style={{ color: threatColor }}>
          {level}% — {threatLabel}
        </div>
      </div>

      {/* Global Stats */}
      <div className="war-global-stats">
        <div className="war-stat">
          <div className="war-stat-value">{totals.zones}</div>
          <div className="war-stat-label">ACTIVE ZONES</div>
        </div>
        <div className="war-stat">
          <div className="war-stat-value">{totals.fronts}</div>
          <div className="war-stat-label">BATTLEFRONTS</div>
        </div>
        <div className="war-stat">
          <div className="war-stat-value">{(totals.aircraft / 1000).toFixed(1)}K</div>
          <div className="war-stat-label">AIRCRAFT</div>
        </div>
        <div className="war-stat">
          <div className="war-stat-value">{(totals.uas / 1000).toFixed(1)}K</div>
          <div className="war-stat-label">UAS IN THEATER</div>
        </div>
        <div className="war-stat">
          <div className="war-stat-value">{totals.naval}</div>
          <div className="war-stat-label">NAVAL ASSETS</div>
        </div>
        <div className="war-stat">
          <div className="war-stat-value">{(totals.engagements / 1000).toFixed(1)}K</div>
          <div className="war-stat-label">DAILY ENGAGEMENTS</div>
        </div>
      </div>

      {/* Kill Chain */}
      {killChain && (
        <div className="war-killchain">
          <div className="war-panel-title">KILL CHAIN — AVG RESPONSE</div>
          <div className="war-killchain-total">{kcTotal.toFixed(1)}s TOTAL</div>
          <div className="war-killchain-stages">
            {killSteps.map(step => {
              const val = killChain[step.key] || 0
              return (
                <div key={step.key} className="war-killchain-stage">
                  <div
                    className="war-killchain-bar"
                    style={{
                      width: `${(val / 10) * 100}%`,
                      backgroundColor: step.color,
                      color: step.color
                    }}
                  />
                  <div className="war-killchain-label">
                    <span>{step.label}</span>
                    <span>{val}s</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Conflict Zones */}
      <div className="war-zone-list">
        <div className="war-panel-title">CONFLICT ZONES</div>
        {conflicts.map(conflict => {
          const color = getIntensityColor(conflict.intensity)
          const isExpanded = expandedConflict?.id === conflict.id
          return (
            <div key={conflict.id}>
              <div
                className={`war-zone-item ${isExpanded ? 'war-zone-active' : ''}`}
                onClick={() => handleConflictClick(conflict)}
              >
                <div className="war-zone-header">
                  <span className="war-zone-status" style={{ backgroundColor: color }} />
                  <span className="war-zone-name">{conflict.name}</span>
                </div>
                <div className="war-zone-meta">
                  <span className="war-zone-type">{conflict.type?.toUpperCase()}</span>
                  <span className="war-zone-intensity" style={{ color }}>{conflict.intensity}</span>
                  <span className="war-zone-engagements">{conflict.stats.dailyEngagements}/day</span>
                </div>
              </div>
              {isExpanded && <ConflictZone conflict={conflict} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
