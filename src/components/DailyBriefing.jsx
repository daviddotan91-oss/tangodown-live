import React, { useState, useMemo } from 'react'
import { getEventColor, getIntensityColor } from '../utils/dataUtils'

const LAST_VISIT_KEY = 'tangodown_last_visit'
const BRIEFING_THRESHOLD = 4 * 60 * 60 * 1000 // 4 hours

export function shouldShowBriefing() {
  const last = localStorage.getItem(LAST_VISIT_KEY)
  if (!last) return true
  return Date.now() - parseInt(last, 10) > BRIEFING_THRESHOLD
}

export function markVisit() {
  localStorage.setItem(LAST_VISIT_KEY, String(Date.now()))
}

export default function DailyBriefing({ conflicts, incidents, leaders, naval, onDismiss }) {
  const [expanded, setExpanded] = useState(false)

  // All recent strikes from conflict data
  const recentStrikes = useMemo(() => {
    const all = []
    conflicts.forEach(c => {
      (c.recentStrikes || []).forEach(s => {
        all.push({ ...s, conflictName: c.name, conflictId: c.id })
      })
    })
    return all.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)
  }, [conflicts])

  // Top weapons by daily use
  const topWeapons = useMemo(() => {
    const all = []
    conflicts.forEach(c => {
      (c.weapons || []).forEach(w => {
        all.push({ ...w, theater: c.name })
      })
    })
    return all.sort((a, b) => (b.dailyUse || 0) - (a.dailyUse || 0)).slice(0, 8)
  }, [conflicts])

  // Theater summary
  const theaterSummary = useMemo(() => {
    return conflicts
      .slice()
      .sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
        return (order[a.intensity] ?? 4) - (order[b.intensity] ?? 4)
      })
      .map(c => ({
        name: c.name,
        intensity: c.intensity,
        engagements: c.stats?.dailyEngagements || 0,
        personnel: c.stats?.activePersonnel || 0,
        fronts: c.fronts?.length || 0,
        aircraft: c.stats?.aircraftInTheater || 0,
        uas: c.stats?.uasInTheater || 0,
        parties: c.parties || [],
        description: c.description
      }))
  }, [conflicts])

  // Recent eliminations (all from data)
  const eliminations = useMemo(() => {
    return (leaders.eliminated || [])
      .slice()
      .sort((a, b) => new Date(b.dateEliminated) - new Date(a.dateEliminated))
      .slice(0, 6)
  }, [leaders.eliminated])

  // Global aggregate stats
  const globalStats = useMemo(() => {
    const totalEngagements = conflicts.reduce((s, c) => s + (c.stats?.dailyEngagements || 0), 0)
    const totalPersonnel = conflicts.reduce((s, c) => s + (c.stats?.activePersonnel || 0), 0)
    const totalAircraft = conflicts.reduce((s, c) => s + (c.stats?.aircraftInTheater || 0), 0)
    const totalUAS = conflicts.reduce((s, c) => s + (c.stats?.uasInTheater || 0), 0)
    const totalFronts = conflicts.reduce((s, c) => s + (c.fronts?.length || 0), 0)
    const criticalZones = conflicts.filter(c => c.intensity === 'CRITICAL').length
    const highZones = conflicts.filter(c => c.intensity === 'HIGH').length
    const totalNaval = naval.length
    const alliedNaval = naval.filter(s => s.force === 'allied').length
    const hostileNaval = naval.filter(s => s.force === 'hostile').length
    const totalWeaponExpenditure = topWeapons.reduce((s, w) => s + (w.dailyUse || 0), 0)
    return { totalEngagements, totalPersonnel, totalAircraft, totalUAS, totalFronts, criticalZones, highZones, totalNaval, alliedNaval, hostileNaval, totalWeaponExpenditure }
  }, [conflicts, naval, topWeapons])

  const maxEng = Math.max(...theaterSummary.map(t => t.engagements), 1)
  const maxWeapon = Math.max(...topWeapons.map(w => w.dailyUse || 0), 1)

  const dateStr = new Date().toISOString().slice(0, 10)
  const timeStr = new Date().toISOString().slice(11, 19) + 'Z'

  // Top 3 theaters for compact view
  const topTheaters = theaterSummary.slice(0, 3)

  // ─── COMPACT MODE ───
  if (!expanded) {
    return (
      <div className="briefing-compact">
        <div className="briefing-compact-header">
          <div>
            <div className="briefing-compact-classification">UNCLASSIFIED // OSINT</div>
            <div className="briefing-compact-title">DAILY INTELLIGENCE BRIEFING</div>
            <div className="briefing-compact-date">{dateStr} — {timeStr}</div>
          </div>
          <button className="briefing-compact-close" onClick={onDismiss}>✕</button>
        </div>

        <div className="briefing-compact-stats">
          <div className="briefing-compact-stat briefing-compact-stat--critical">
            <span className="briefing-compact-stat-val">{globalStats.criticalZones + globalStats.highZones}</span>
            <span className="briefing-compact-stat-label">ZONES</span>
          </div>
          <div className="briefing-compact-stat">
            <span className="briefing-compact-stat-val">{globalStats.totalEngagements.toLocaleString()}</span>
            <span className="briefing-compact-stat-label">ENGAGEMENTS</span>
          </div>
          <div className="briefing-compact-stat">
            <span className="briefing-compact-stat-val">{globalStats.totalAircraft.toLocaleString()}</span>
            <span className="briefing-compact-stat-label">AIRCRAFT</span>
          </div>
          <div className="briefing-compact-stat">
            <span className="briefing-compact-stat-val">{globalStats.totalUAS.toLocaleString()}</span>
            <span className="briefing-compact-stat-label">UAS</span>
          </div>
        </div>

        <div className="briefing-compact-theaters">
          {topTheaters.map(t => {
            const color = getIntensityColor(t.intensity)
            return (
              <div key={t.name} className="briefing-compact-theater">
                <span className="briefing-compact-theater-dot" style={{ backgroundColor: color }} />
                <span className="briefing-compact-theater-name">{t.name}</span>
                <span className="briefing-compact-theater-int" style={{ color }}>{t.intensity}</span>
                <span className="briefing-compact-theater-eng">{t.engagements}/day</span>
              </div>
            )
          })}
        </div>

        <div className="briefing-compact-actions">
          <button className="briefing-compact-expand" onClick={() => setExpanded(true)}>
            EXPAND FULL BRIEFING
          </button>
          <button className="briefing-compact-dismiss" onClick={onDismiss}>
            DISMISS
          </button>
        </div>
      </div>
    )
  }

  // ─── EXPANDED (FULL) MODE ───
  return (
    <div className="briefing-overlay">
      <div className="briefing-modal">
        {/* HEADER */}
        <div className="briefing-header">
          <div className="briefing-header-left">
            <div className="briefing-classification">UNCLASSIFIED // OPEN SOURCE INTELLIGENCE</div>
            <div className="briefing-title">DAILY INTELLIGENCE BRIEFING</div>
            <div className="briefing-date">{dateStr} — {timeStr}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="briefing-collapse-btn" onClick={() => setExpanded(false)}>
              COLLAPSE
            </button>
            <button className="briefing-dismiss" onClick={onDismiss}>
              ENTER BATTLESPACE
              <span className="briefing-dismiss-arrow">→</span>
            </button>
          </div>
        </div>

        {/* GLOBAL THREAT SUMMARY */}
        <div className="briefing-section">
          <div className="briefing-section-title">GLOBAL THREAT SUMMARY</div>
          <div className="briefing-stats-grid">
            <div className="briefing-stat-card briefing-stat--critical">
              <span className="briefing-stat-val">{globalStats.criticalZones + globalStats.highZones}</span>
              <span className="briefing-stat-label">HIGH+ CONFLICT ZONES</span>
            </div>
            <div className="briefing-stat-card">
              <span className="briefing-stat-val">{globalStats.totalEngagements.toLocaleString()}</span>
              <span className="briefing-stat-label">DAILY ENGAGEMENTS</span>
            </div>
            <div className="briefing-stat-card">
              <span className="briefing-stat-val">{(globalStats.totalPersonnel / 1000000).toFixed(1)}M</span>
              <span className="briefing-stat-label">ACTIVE PERSONNEL</span>
            </div>
            <div className="briefing-stat-card">
              <span className="briefing-stat-val">{globalStats.totalFronts}</span>
              <span className="briefing-stat-label">ACTIVE FRONTS</span>
            </div>
            <div className="briefing-stat-card">
              <span className="briefing-stat-val">{globalStats.totalAircraft.toLocaleString()}</span>
              <span className="briefing-stat-label">AIRCRAFT IN THEATER</span>
            </div>
            <div className="briefing-stat-card">
              <span className="briefing-stat-val">{globalStats.totalUAS.toLocaleString()}</span>
              <span className="briefing-stat-label">UAS / DRONES</span>
            </div>
            <div className="briefing-stat-card">
              <span className="briefing-stat-val">{globalStats.totalNaval}</span>
              <span className="briefing-stat-label">NAVAL ASSETS TRACKED</span>
            </div>
            <div className="briefing-stat-card">
              <span className="briefing-stat-val">{globalStats.totalWeaponExpenditure}</span>
              <span className="briefing-stat-label">WEAPONS / DAY</span>
            </div>
          </div>
        </div>

        {/* ACTIVE THEATERS */}
        <div className="briefing-section">
          <div className="briefing-section-title">ACTIVE THEATERS OF OPERATION</div>
          <div className="briefing-theaters">
            {theaterSummary.map(t => {
              const color = getIntensityColor(t.intensity)
              const pct = (t.engagements / maxEng) * 100
              return (
                <div key={t.name} className="briefing-theater-card">
                  <div className="briefing-theater-header">
                    <span className="briefing-theater-dot" style={{ backgroundColor: color }} />
                    <span className="briefing-theater-name">{t.name}</span>
                    <span className="briefing-theater-int" style={{ color, borderColor: color + '55', backgroundColor: color + '12' }}>{t.intensity}</span>
                  </div>
                  <div className="briefing-theater-desc">{t.description}</div>
                  <div className="briefing-theater-bar-row">
                    <div className="briefing-theater-bar-track">
                      <div className="briefing-theater-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="briefing-theater-eng" style={{ color }}>{t.engagements}/day</span>
                  </div>
                  <div className="briefing-theater-stats">
                    <span>{t.personnel.toLocaleString()} personnel</span>
                    <span>{t.fronts} fronts</span>
                    <span>{t.aircraft} aircraft</span>
                    <span>{t.uas} UAS</span>
                  </div>
                  <div className="briefing-theater-parties">
                    {t.parties.map((p, i) => <span key={i} className="briefing-party-tag">{p}</span>)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CONFIRMED STRIKES */}
        {recentStrikes.length > 0 && (
          <div className="briefing-section">
            <div className="briefing-section-title">
              CONFIRMED STRIKES
              <span className="briefing-osint-tag">OSINT VERIFIED</span>
            </div>
            <div className="briefing-strikes-table">
              <div className="briefing-strikes-header">
                <span>DATE</span>
                <span>TARGET</span>
                <span>WEAPON</span>
                <span>PLATFORM</span>
                <span>RESULT</span>
              </div>
              {recentStrikes.map((s, i) => (
                <div key={i} className="briefing-strike-row">
                  <span className="briefing-strike-date">{s.date}</span>
                  <span className="briefing-strike-target">{s.target}</span>
                  <span className="briefing-strike-weapon">{s.weapon?.split('(')[0].trim()}</span>
                  <span className="briefing-strike-platform">{s.aircraft || '—'}</span>
                  <span className="briefing-strike-result">{s.result}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEAPONS EXPENDITURE */}
        <div className="briefing-section">
          <div className="briefing-section-title">WEAPONS — DAILY EXPENDITURE BY THEATER</div>
          <div className="briefing-weapons-grid">
            {topWeapons.map((w, i) => {
              const pct = ((w.dailyUse || 0) / maxWeapon) * 100
              return (
                <div key={i} className="briefing-weapon-row">
                  <div className="briefing-weapon-info">
                    <span className="briefing-weapon-name">{w.name}</span>
                    <span className="briefing-weapon-type">{w.type} — {w.operator}</span>
                  </div>
                  <div className="briefing-weapon-bar-track">
                    <div className="briefing-weapon-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="briefing-weapon-count">{w.dailyUse}/day</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* HIGH-VALUE TARGET ELIMINATIONS */}
        {eliminations.length > 0 && (
          <div className="briefing-section">
            <div className="briefing-section-title">
              <span className="briefing-elim-x">╳</span>
              HIGH-VALUE TARGET ELIMINATIONS
            </div>
            <div className="briefing-elim-grid">
              {eliminations.map(t => (
                <div key={t.id} className="briefing-elim-card">
                  <div className="briefing-elim-header">
                    <span className="briefing-elim-x">╳</span>
                    <span className="briefing-elim-name">{t.name}</span>
                    <span className="briefing-elim-org">{t.orgId?.toUpperCase()}</span>
                  </div>
                  <div className="briefing-elim-title">{t.title}</div>
                  <div className="briefing-elim-details">
                    <span className="briefing-elim-date">{t.dateEliminated}</span>
                    <span className="briefing-elim-method">{t.method}</span>
                  </div>
                  <div className="briefing-elim-location">{t.location}</div>
                  <div className="briefing-elim-stamp">ELIMINATED</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NAVAL POSTURE */}
        <div className="briefing-section">
          <div className="briefing-section-title">NAVAL ORDER OF BATTLE</div>
          <div className="briefing-naval-summary">
            <span className="briefing-naval-stat"><strong style={{ color: '#00AAFF' }}>{globalStats.alliedNaval}</strong> ALLIED</span>
            <span className="briefing-naval-divider">/</span>
            <span className="briefing-naval-stat"><strong style={{ color: '#FF4444' }}>{globalStats.hostileNaval}</strong> ADVERSARY</span>
            <span className="briefing-naval-divider">/</span>
            <span className="briefing-naval-stat"><strong>{globalStats.totalNaval}</strong> TOTAL TRACKED</span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="briefing-footer">
          <div className="briefing-footer-text">
            DISTRIBUTION: UNLIMITED — CLASSIFICATION: UNCLASSIFIED // OPEN SOURCE<br />
            PREPARED BY TANGODOWN.LIVE OSINT DESK — {dateStr}
          </div>
          <button className="briefing-enter-btn" onClick={onDismiss}>
            ENTER BATTLESPACE →
          </button>
        </div>
      </div>
    </div>
  )
}
