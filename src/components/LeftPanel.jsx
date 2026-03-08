import React, { useState, useEffect, useMemo } from 'react'
import { getIntensityColor, getEventColor } from '../utils/dataUtils'
import ConflictZone from './ConflictZone'

function formatKillDate(dateStr) {
  const d = new Date(dateStr)
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function relativeTime(timestamp) {
  const diff = Math.max(0, Date.now() - new Date(timestamp).getTime())
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

/* ═══════════════════ 24HR SITREP SECTION ═══════════════════ */
function DailySitrep({ conflicts, feed, leaders }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 10000)
    return () => clearInterval(iv)
  }, [])

  // 24hr feed breakdown
  const stats24h = useMemo(() => {
    const now = Date.now()
    const recent = feed.filter(f => now - new Date(f.timestamp).getTime() < 86400000)
    const typeCounts = {}
    const forceCounts = { allied: 0, hostile: 0, unknown: 0 }
    const theaterCounts = {}
    recent.forEach(inc => {
      typeCounts[inc.type] = (typeCounts[inc.type] || 0) + 1
      forceCounts[inc.force || 'unknown'] = (forceCounts[inc.force || 'unknown'] || 0) + 1
      if (inc.conflictId) {
        theaterCounts[inc.conflictId] = (theaterCounts[inc.conflictId] || 0) + 1
      }
    })
    const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
    const topTheaters = Object.entries(theaterCounts).sort((a, b) => b[1] - a[1]).slice(0, 4)
    return { total: recent.length, typeCounts, topTypes, forceCounts, topTheaters }
  }, [feed])

  // Recent strikes from conflicts data (actual OSINT data)
  const recentStrikes = useMemo(() => {
    const all = []
    conflicts.forEach(c => {
      (c.recentStrikes || []).forEach(s => {
        all.push({ ...s, conflictName: c.name, conflictId: c.id })
      })
    })
    return all.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  }, [conflicts])

  // Weapons usage across all theaters
  const topWeapons = useMemo(() => {
    const all = []
    conflicts.forEach(c => {
      (c.weapons || []).forEach(w => {
        all.push({ ...w, theater: c.name })
      })
    })
    return all.sort((a, b) => (b.dailyUse || 0) - (a.dailyUse || 0)).slice(0, 6)
  }, [conflicts])

  // Recent eliminations (last 90 days)
  const recentEliminations = useMemo(() => {
    const now = Date.now()
    return (leaders.eliminated || [])
      .filter(l => now - new Date(l.dateEliminated).getTime() < 90 * 86400000)
      .sort((a, b) => new Date(b.dateEliminated) - new Date(a.dateEliminated))
      .slice(0, 3)
  }, [leaders.eliminated])

  // Conflict name lookup
  const conflictMap = useMemo(() => {
    const m = {}
    conflicts.forEach(c => { m[c.id] = c })
    return m
  }, [conflicts])

  const totalDailyUse = topWeapons.reduce((s, w) => s + (w.dailyUse || 0), 0)

  return (
    <div className="sitrep-section">
      {/* 24HR HEADLINE STATS */}
      <div className="sitrep-headline-grid">
        <div className="sitrep-headline-stat">
          <span className="sitrep-hl-val" style={{ color: '#FF4444' }}>{stats24h.total}</span>
          <span className="sitrep-hl-label">OPS / 24HR</span>
        </div>
        <div className="sitrep-headline-stat">
          <span className="sitrep-hl-val" style={{ color: '#00AAFF' }}>{stats24h.forceCounts.allied}</span>
          <span className="sitrep-hl-label">ALLIED</span>
        </div>
        <div className="sitrep-headline-stat">
          <span className="sitrep-hl-val" style={{ color: '#FF8800' }}>{stats24h.forceCounts.hostile}</span>
          <span className="sitrep-hl-label">HOSTILE</span>
        </div>
        <div className="sitrep-headline-stat">
          <span className="sitrep-hl-val" style={{ color: '#44CC44' }}>{recentEliminations.length}</span>
          <span className="sitrep-hl-label">HVT ELIM</span>
        </div>
      </div>

      {/* OPERATION BREAKDOWN */}
      <div className="sitrep-block">
        <div className="sitrep-block-title">OPERATION BREAKDOWN — 24HR</div>
        <div className="sitrep-ops-list">
          {stats24h.topTypes.slice(0, 6).map(([type, count]) => {
            const pct = (count / stats24h.total) * 100
            const color = getEventColor(type)
            return (
              <div key={type} className="sitrep-op-row">
                <span className="sitrep-op-dot" style={{ backgroundColor: color }} />
                <span className="sitrep-op-name">{type}</span>
                <div className="sitrep-op-bar-track">
                  <div className="sitrep-op-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <span className="sitrep-op-count" style={{ color }}>{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* HOTTEST THEATERS */}
      <div className="sitrep-block">
        <div className="sitrep-block-title">HOTTEST THEATERS</div>
        <div className="sitrep-theater-list">
          {stats24h.topTheaters.map(([id, count]) => {
            const c = conflictMap[id]
            if (!c) return null
            const color = getIntensityColor(c.intensity)
            return (
              <div key={id} className="sitrep-theater-row">
                <span className="sitrep-theater-dot" style={{ backgroundColor: color }} />
                <span className="sitrep-theater-name">{c.name}</span>
                <span className="sitrep-theater-int" style={{ color }}>{c.intensity}</span>
                <span className="sitrep-theater-count">{count} ops</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* RECENT CONFIRMED STRIKES (OSINT) */}
      {recentStrikes.length > 0 && (
        <div className="sitrep-block">
          <div className="sitrep-block-title">
            CONFIRMED STRIKES
            <span className="sitrep-osint-tag">OSINT</span>
          </div>
          <div className="sitrep-strikes-list">
            {recentStrikes.map((s, i) => (
              <div key={i} className="sitrep-strike-card">
                <div className="sitrep-strike-row1">
                  <span className="sitrep-strike-date">{s.date}</span>
                  <span className="sitrep-strike-op">{s.operator}</span>
                </div>
                <div className="sitrep-strike-target">{s.target}</div>
                <div className="sitrep-strike-row3">
                  <span className="sitrep-strike-weapon">{s.weapon?.split('(')[0].trim()}</span>
                  {s.aircraft && <span className="sitrep-strike-platform">{s.aircraft}</span>}
                </div>
                <div className="sitrep-strike-result">{s.result}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP WEAPONS IN USE */}
      <div className="sitrep-block">
        <div className="sitrep-block-title">WEAPONS — DAILY EXPENDITURE</div>
        <div className="sitrep-weapons-list">
          {topWeapons.map((w, i) => {
            const pct = (w.dailyUse / totalDailyUse) * 100
            return (
              <div key={i} className="sitrep-weapon-row">
                <div className="sitrep-weapon-info">
                  <span className="sitrep-weapon-name">{w.name}</span>
                  <span className="sitrep-weapon-type">{w.type}</span>
                </div>
                <div className="sitrep-weapon-bar-track">
                  <div className="sitrep-weapon-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="sitrep-weapon-count">{w.dailyUse}/day</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* RECENT HVT ELIMINATIONS */}
      {recentEliminations.length > 0 && (
        <div className="sitrep-block">
          <div className="sitrep-block-title">
            <span className="sitrep-elim-x">╳</span> RECENT ELIMINATIONS
          </div>
          <div className="sitrep-elim-list">
            {recentEliminations.map(target => (
              <div key={target.id} className="sitrep-elim-card">
                <div className="sitrep-elim-row1">
                  <span className="sitrep-elim-name">{target.name.toUpperCase()}</span>
                  <span className="sitrep-elim-org">{target.orgId?.toUpperCase()}</span>
                </div>
                <div className="sitrep-elim-title">{target.title?.split(';')[0].split(',')[0]}</div>
                <div className="sitrep-elim-row3">
                  <span className="sitrep-elim-date">{formatKillDate(target.dateEliminated)}</span>
                  <span className="sitrep-elim-method">{target.method?.split(' — ')[0]}</span>
                </div>
                <div className="sitrep-elim-stamp">ELIMINATED</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════ MAIN LEFT PANEL ═══════════════════ */
export default function LeftPanel({ conflicts, onConflictSelect, selectedConflict, feed = [], leaders = {}, organizations = [], networks = {} }) {
  const [expandedConflict, setExpandedConflict] = useState(null)
  const [activeSection, setActiveSection] = useState('sitrep')
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

  // Org lookup map
  const orgMap = useMemo(() => {
    const map = {}
    organizations.forEach(o => { map[o.id] = o })
    return map
  }, [organizations])

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
      {/* HEADER + OPS TEMPO COMPACT */}
      <div className="war-header">
        <div className="war-header-top-row">
          <div>
            <div className="war-header-title">LION'S EYE — GLOBAL BATTLESPACE</div>
            <div className="war-header-sub">
              OPEN-SOURCE INTEL&nbsp;
              <span className="war-osint-badge">● OSINT</span>
              &nbsp;//&nbsp;
              <span className="war-sim-badge">◇ SIMULATED</span>
            </div>
          </div>
          <span className="ops-defcon" style={{ color: defconColor, borderColor: defconColor + '66' }}>
            DEFCON {defcon}
          </span>
        </div>
        {/* Mini ops tempo bar */}
        <div className="ops-tempo-mini">
          <div className="ops-mini-stat">
            <span className="ops-mini-val" style={{ color: defconColor }}>{perMinute}</span>
            <span className="ops-mini-label">ENG/MIN</span>
          </div>
          <div className="ops-mini-divider" />
          <div className="ops-mini-stat">
            <span className="ops-mini-val">{dailyRate.toLocaleString()}</span>
            <span className="ops-mini-label">DAILY</span>
          </div>
          <div className="ops-mini-divider" />
          <div className="ops-mini-stat">
            <span className="ops-mini-val">{opsRate}</span>
            <span className="ops-mini-label">LAST 60s</span>
          </div>
          <div className="ops-mini-divider" />
          <div className="ops-mini-stat">
            <span className="ops-tempo-trend" style={{ color: opsTrend === 'rising' ? '#FF4444' : opsTrend === 'falling' ? '#44CC44' : '#FFB800' }}>
              {opsTrend === 'rising' ? '▲' : opsTrend === 'falling' ? '▼' : '●'}
            </span>
            <span className="ops-mini-label">TREND</span>
          </div>
        </div>
      </div>

      {/* SECTION TABS */}
      <div className="left-section-tabs">
        <button
          className={`left-section-tab ${activeSection === 'sitrep' ? 'active' : ''}`}
          onClick={() => setActiveSection('sitrep')}
        >
          24HR SITREP
        </button>
        <button
          className={`left-section-tab ${activeSection === 'killboard' ? 'active' : ''}`}
          onClick={() => setActiveSection('killboard')}
        >
          <span className="kill-tab-x">╳</span> KILL BOARD
          <span className="left-tab-count">{eliminatedTargets.length}</span>
        </button>
        <button
          className={`left-section-tab ${activeSection === 'zones' ? 'active' : ''}`}
          onClick={() => setActiveSection('zones')}
        >
          ZONES
          <span className="left-tab-count">{conflicts.length}</span>
        </button>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="left-panel-scroll">

        {/* 24HR SITREP TAB */}
        {activeSection === 'sitrep' && (
          <DailySitrep conflicts={conflicts} feed={feed} leaders={leaders} />
        )}

        {/* KILL BOARD TAB */}
        {activeSection === 'killboard' && (
          <div className="kill-board">
            <div className="kill-board-header">
              <span className="kill-board-label">
                <span className="kill-tab-x">╳</span> ELIMINATED — {eliminatedTargets.length}
              </span>
            </div>
            <div className="kill-board-list">
              {eliminatedTargets.slice(0, 10).map(target => {
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

            {activeTargets.length > 0 && (
              <>
                <div className="kill-board-header" style={{ marginTop: 12 }}>
                  <span className="kill-board-label wanted">
                    <span className="kill-crosshair">◎</span> MOST WANTED — {activeTargets.length}
                  </span>
                </div>
                <div className="kill-board-list">
                  {activeTargets.slice(0, 8).map(target => {
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
              </>
            )}
          </div>
        )}

        {/* CONFLICT ZONES TAB */}
        {activeSection === 'zones' && (
          <div className="war-zone-list">
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
        )}
      </div>
    </div>
  )
}
