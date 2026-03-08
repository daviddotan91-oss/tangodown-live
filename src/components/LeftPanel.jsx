import React, { useState, useEffect, useMemo } from 'react'
import { getIntensityColor } from '../utils/dataUtils'
import ConflictZone from './ConflictZone'

function formatKillDate(dateStr) {
  const d = new Date(dateStr)
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export default function LeftPanel({ conflicts, onConflictSelect, selectedConflict, feed = [], leaders = {}, organizations = [], networks = {} }) {
  const [expandedConflict, setExpandedConflict] = useState(null)
  const [opsRate, setOpsRate] = useState(0)
  const [opsTrend, setOpsTrend] = useState('stable')
  const [killBoardTab, setKillBoardTab] = useState('eliminated')

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

  // Org lookup map
  const orgMap = useMemo(() => {
    const map = {}
    organizations.forEach(o => { map[o.id] = o })
    return map
  }, [organizations])

  // Axis of Resistance — Iran proxy connections
  const proxyConnections = useMemo(() => {
    return (networks.connections || [])
      .filter(c => c.source === 'irgc')
      .sort((a, b) => b.strength - a.strength)
  }, [networks])

  const totalProxyFunding = useMemo(() => {
    const amounts = { hezbollah: 850, hamas: 100, houthis: 150, pij: 40 }
    const total = proxyConnections.reduce((s, c) => s + (amounts[c.target] || 0), 0)
    return total > 0 ? `$${(total / 1000).toFixed(1)}B+` : null
  }, [proxyConnections])

  const connectionTypeColors = {
    funding: '#FFB800', command: '#FF4444', weapons: '#FF8800',
    training: '#44CC44', influence: '#00AAFF', affiliate: '#00AAFF'
  }

  // Kill board data
  const eliminatedTargets = useMemo(() => {
    return (leaders.eliminated || [])
      .slice()
      .sort((a, b) => new Date(b.dateEliminated) - new Date(a.dateEliminated))
  }, [leaders.eliminated])

  const activeTargets = useMemo(() => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return (leaders.active || [])
      .slice()
      .sort((a, b) => (order[a.threatAssessment] || 3) - (order[b.threatAssessment] || 3))
  }, [leaders.active])

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

      {/* KILL BOARD */}
      {(eliminatedTargets.length > 0 || activeTargets.length > 0) && (
        <div className="kill-board">
          <div className="kill-board-header">
            <button
              className={`kill-board-tab ${killBoardTab === 'eliminated' ? 'active' : ''}`}
              onClick={() => setKillBoardTab('eliminated')}
            >
              <span className="kill-tab-x">╳</span> KILL BOARD
              <span className="kill-tab-count">{eliminatedTargets.length}</span>
            </button>
            <button
              className={`kill-board-tab wanted ${killBoardTab === 'active' ? 'active' : ''}`}
              onClick={() => setKillBoardTab('active')}
            >
              <span className="kill-tab-crosshair">◎</span> MOST WANTED
              <span className="kill-tab-count">{activeTargets.length}</span>
            </button>
          </div>

          {killBoardTab === 'eliminated' && (
            <div className="kill-board-list">
              {eliminatedTargets.slice(0, 5).map(target => {
                const org = orgMap[target.orgId]
                return (
                  <div key={target.id} className="kill-card eliminated">
                    <div className="kill-card-row1">
                      <span className="kill-x">╳</span>
                      <span className="kill-name">{target.name.toUpperCase()}</span>
                      <span className="kill-org-badge" style={{ color: org?.color || '#FF4444', borderColor: (org?.color || '#FF4444') + '55' }}>
                        {org?.name || target.orgId.toUpperCase()}
                      </span>
                    </div>
                    <div className="kill-card-row2">
                      <span className="kill-title">{target.title.split(';')[0].split(',')[0]}</span>
                    </div>
                    <div className="kill-card-row3">
                      <span className="kill-date">{formatKillDate(target.dateEliminated)}</span>
                      <span className="kill-method">{target.method.split(' — ')[0]}</span>
                    </div>
                    <div className="kill-card-row4">
                      <span className="kill-location">{target.location.split(',').slice(0, 2).join(',')}</span>
                      {target.bounty && <span className="kill-bounty">{target.bounty.split(' (')[0]}</span>}
                    </div>
                    <div className="kill-stamp">ELIMINATED</div>
                  </div>
                )
              })}
            </div>
          )}

          {killBoardTab === 'active' && (
            <div className="kill-board-list">
              {activeTargets.slice(0, 5).map(target => {
                const org = orgMap[target.orgId]
                const threatColor = { CRITICAL: '#FF0000', HIGH: '#FF4444', MEDIUM: '#FF8800', LOW: '#FFB800' }[target.threatAssessment] || '#FF4444'
                return (
                  <div key={target.id} className="kill-card active">
                    <div className="kill-card-row1">
                      <span className="kill-crosshair">◎</span>
                      <span className="kill-name">{target.name.toUpperCase()}</span>
                      <span className="kill-org-badge" style={{ color: org?.color || '#FF4444', borderColor: (org?.color || '#FF4444') + '55' }}>
                        {org?.name || target.orgId.toUpperCase()}
                      </span>
                    </div>
                    <div className="kill-card-row2">
                      <span className="kill-title">{target.title.split(';')[0].split(',')[0]}</span>
                    </div>
                    <div className="kill-card-row3">
                      <span className="kill-threat" style={{ color: threatColor, borderColor: threatColor + '55' }}>{target.threatAssessment}</span>
                      <span className="kill-location">{target.lastKnownLocation?.split('(')[0].trim()}</span>
                    </div>
                    {target.bounty && (
                      <div className="kill-card-row4">
                        <span className="kill-bounty wanted">{target.bounty.split(' (')[0]}</span>
                      </div>
                    )}
                    <div className="kill-stamp wanted">WANTED</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* AXIS OF RESISTANCE */}
      {proxyConnections.length > 0 && (
        <div className="proxy-network">
          <div className="war-panel-title">AXIS OF RESISTANCE — IRAN PROXY NETWORK</div>
          <div className="proxy-list">
            {proxyConnections.map((conn, i) => {
              const org = orgMap[conn.target]
              const typeColor = connectionTypeColors[conn.type] || '#FF4444'
              return (
                <div key={i} className="proxy-row">
                  <span className="proxy-dot" style={{ backgroundColor: org?.color || '#FF4444' }} />
                  <div className="proxy-info">
                    <span className="proxy-org">{org?.name || conn.target.toUpperCase()}</span>
                    <span className="proxy-link-type" style={{ color: typeColor }}>{conn.type.toUpperCase()}</span>
                  </div>
                  <div className="proxy-label">{conn.label}</div>
                  <div className="proxy-strength-track">
                    <div className="proxy-strength-fill" style={{
                      width: `${(conn.strength / 10) * 100}%`,
                      backgroundColor: typeColor
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
          {totalProxyFunding && (
            <div className="proxy-total">
              TOTAL ANNUAL FUNDING: <span className="proxy-total-value">{totalProxyFunding}</span>
            </div>
          )}
        </div>
      )}

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
