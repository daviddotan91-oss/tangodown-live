import React, { useState, useEffect, useMemo } from 'react'
import { getIntensityColor } from '../utils/dataUtils'
import ConflictZone from './ConflictZone'

export default function LeftPanel({ conflicts, onConflictSelect, selectedConflict, feed = [] }) {
  const [expandedConflict, setExpandedConflict] = useState(null)
  const [opsRate, setOpsRate] = useState(0)
  const [opsTrend, setOpsTrend] = useState('stable')

  // Real-time ops tempo from feed
  useEffect(() => {
    const calc = () => {
      const now = Date.now()
      const last60 = feed.filter(f => now - new Date(f.timestamp).getTime() < 60000).length
      const prev60 = feed.filter(f => {
        const age = now - new Date(f.timestamp).getTime()
        return age >= 60000 && age < 120000
      }).length
      setOpsTrend(last60 > prev60 ? 'rising' : last60 < prev60 ? 'falling' : 'stable')
      setOpsRate(last60)
    }
    calc()
    const interval = setInterval(calc, 3000)
    return () => clearInterval(interval)
  }, [feed])

  const criticalCount = conflicts.filter(c => c.intensity === 'CRITICAL').length
  const highCount = conflicts.filter(c => c.intensity === 'HIGH').length
  const defcon = criticalCount >= 3 ? 1 : criticalCount >= 2 ? 2 : criticalCount >= 1 ? 3 : highCount >= 2 ? 4 : 5
  const defconColor = { 1: '#FF0000', 2: '#FF4444', 3: '#FF8800', 4: '#FFB800', 5: '#44CC44' }[defcon]

  const dailyRate = conflicts.reduce((s, c) => s + (c.stats?.dailyEngagements || 0), 0)
  const perMinute = (dailyRate / 1440).toFixed(1)

  const topWeapons = useMemo(() => {
    return conflicts
      .flatMap(c => (c.weapons || []).map(w => ({ ...w, conflict: c.name })))
      .sort((a, b) => (b.dailyUse || 0) - (a.dailyUse || 0))
      .slice(0, 8)
  }, [conflicts])
  const maxWeaponUse = topWeapons[0]?.dailyUse || 1

  const isHostile = (operator) => {
    const hostiles = ['Russia', 'Hamas', 'Hezbollah', 'Houthi', 'Wagner', 'Islamic Jihad', 'Al-Shabaab', 'Boko Haram', 'ISIS', 'ISIL', 'Taliban', 'RSF', 'Junta']
    return hostiles.some(h => operator?.includes(h))
  }

  const handleConflictClick = (conflict) => {
    if (expandedConflict?.id === conflict.id) {
      setExpandedConflict(null)
    } else {
      setExpandedConflict(conflict)
      onConflictSelect?.(conflict)
    }
  }

  const maxEng = Math.max(...conflicts.map(c => c.stats?.dailyEngagements || 0), 1)

  return (
    <div className="war-panel-left">
      {/* Header */}
      <div className="war-header">
        <div className="war-header-title">LION'S EYE — GLOBAL BATTLESPACE</div>
        <div className="war-header-sub">
          OPEN-SOURCE INTEL&nbsp;
          <span className="war-osint-badge">● OSINT</span>
          &nbsp;//&nbsp;
          <span className="war-sim-badge">◇ SIMULATED</span>
        </div>
      </div>

      {/* OPS TEMPO */}
      <div className="ops-tempo">
        <div className="ops-tempo-header">
          <span className="war-panel-title" style={{ marginBottom: 0 }}>OPS TEMPO</span>
          <span className="ops-defcon" style={{ color: defconColor, borderColor: defconColor + '66' }}>
            DEFCON {defcon}
          </span>
        </div>
        <div className="ops-tempo-display">
          <div className="ops-tempo-rings">
            <div className="ops-ring ops-ring-outer" style={{ borderColor: defconColor + '33', animationDuration: `${Math.max(0.8, 3 - opsRate * 0.15)}s` }} />
            <div className="ops-ring ops-ring-mid" style={{ borderColor: defconColor + '55', animationDuration: `${Math.max(0.6, 2.5 - opsRate * 0.12)}s` }} />
            <div className="ops-ring ops-ring-inner" style={{ borderColor: defconColor + '88', animationDuration: `${Math.max(0.4, 2 - opsRate * 0.1)}s` }} />
            <div className="ops-tempo-core" style={{ backgroundColor: defconColor + '15', boxShadow: `0 0 20px ${defconColor}33` }}>
              <div className="ops-tempo-value" style={{ color: defconColor }}>{perMinute}</div>
              <div className="ops-tempo-unit">ENG/MIN</div>
            </div>
          </div>
          <div className="ops-tempo-stats">
            <div className="ops-tempo-stat">
              <span className="ops-tempo-stat-val">{dailyRate.toLocaleString()}</span>
              <span className="ops-tempo-stat-label">DAILY ENGAGEMENTS</span>
            </div>
            <div className="ops-tempo-stat">
              <span className="ops-tempo-stat-val">{opsRate}</span>
              <span className="ops-tempo-stat-label">LAST 60 SECONDS</span>
            </div>
            <div className="ops-tempo-stat">
              <span className="ops-tempo-trend" style={{ color: opsTrend === 'rising' ? '#FF4444' : opsTrend === 'falling' ? '#44CC44' : '#FFB800' }}>
                {opsTrend === 'rising' ? '▲ RISING' : opsTrend === 'falling' ? '▼ FALLING' : '● STEADY'}
              </span>
              <span className="ops-tempo-stat-label">TREND</span>
            </div>
          </div>
        </div>
      </div>

      {/* WEAPONS ACTIVE */}
      <div className="weapons-active">
        <div className="war-panel-title">WEAPONS ACTIVE — ALL THEATERS</div>
        <div className="weapons-list">
          {topWeapons.map((w, i) => (
            <div key={i} className="weapon-row">
              <div className="weapon-info">
                <span className="weapon-name">{w.name}</span>
                <span className="weapon-operator">{w.operator}</span>
              </div>
              <div className="weapon-bar-track">
                <div
                  className="weapon-bar-fill"
                  style={{
                    width: `${(w.dailyUse / maxWeaponUse) * 100}%`,
                    backgroundColor: isHostile(w.operator) ? '#FF4444' : '#00AAFF'
                  }}
                />
              </div>
              <span className="weapon-count">{w.dailyUse}/d</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Zones */}
      <div className="war-zone-list">
        <div className="war-panel-title">CONFLICT ZONES — {conflicts.length} ACTIVE</div>
        {conflicts.map(conflict => {
          const color = getIntensityColor(conflict.intensity)
          const isExpanded = expandedConflict?.id === conflict.id
          const engPct = ((conflict.stats?.dailyEngagements || 0) / maxEng) * 100
          return (
            <div key={conflict.id}>
              <div
                className={`war-zone-item ${isExpanded ? 'war-zone-active' : ''}`}
                onClick={() => handleConflictClick(conflict)}
              >
                <div className="war-zone-header">
                  <span className="war-zone-status" style={{ backgroundColor: color }} />
                  <span className="war-zone-name">{conflict.name}</span>
                  <span className="war-zone-intensity" style={{ color }}>{conflict.intensity}</span>
                </div>
                <div className="war-zone-engagement-bar">
                  <div className="war-zone-eng-fill" style={{ width: `${engPct}%`, backgroundColor: color + 'aa' }} />
                </div>
                <div className="war-zone-meta">
                  <span className="war-zone-type">{conflict.type?.toUpperCase()}</span>
                  <span className="war-zone-engagements">{conflict.stats.dailyEngagements}/day</span>
                  <span className="war-zone-fronts-count">{conflict.fronts?.length || 0} FRONTS</span>
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
