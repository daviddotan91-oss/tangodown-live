import React, { useState, useMemo } from 'react'
import { getIntensityColor, formatDate } from '../utils/dataUtils'

const THREAT_MATRIX = [
  { region: 'MIDDLE EAST', level: 'CRITICAL', trend: 'ESCALATING', summary: 'Multi-front conflict in Israel-Palestine, Houthi anti-shipping campaign in Red Sea, Iranian proxy operations across the theater.' },
  { region: 'EUROPE', level: 'CRITICAL', trend: 'STATIC', summary: 'Full-scale conventional war in Ukraine. 1,200km frontline, mass drone warfare, nuclear escalation risk persists.' },
  { region: 'EAST ASIA', level: 'HIGH', trend: 'ESCALATING', summary: 'Increasing Chinese maritime aggression in South China Sea. Philippine resupply missions regularly contested.' },
  { region: 'SAHEL', level: 'HIGH', trend: 'DETERIORATING', summary: 'JNIM and ISGS expand territory following withdrawal of French forces. Russian Africa Corps (formerly Wagner) active in Mali and Burkina Faso.' },
  { region: 'EAST AFRICA', level: 'HIGH', trend: 'VOLATILE', summary: 'Al-Shabaab maintains operational capability in Somalia. Sudan civil war intensifies with RSF siege operations.' },
  { region: 'CENTRAL AFRICA', level: 'MEDIUM', trend: 'ESCALATING', summary: 'M23 rebel offensive in eastern DRC threatens Goma. MONUSCO withdrawal complicates stability operations.' },
  { region: 'SOUTHEAST ASIA', level: 'MEDIUM', trend: 'SHIFTING', summary: 'Myanmar resistance forces gain ground against Tatmadaw. Brotherhood Alliance controls key border crossings.' }
]

function SitrepCard({ conflict, index }) {
  const [expanded, setExpanded] = useState(false)
  const color = getIntensityColor(conflict.intensity)

  return (
    <div className="intel-sitrep-card" onClick={() => setExpanded(!expanded)}>
      <div className="intel-sitrep-header">
        <div className="intel-sitrep-indicator" style={{ backgroundColor: color }} />
        <div className="intel-sitrep-title">
          <span className="intel-sitrep-name">{conflict.name}</span>
          <span className="intel-sitrep-region">{conflict.region}</span>
        </div>
        <div className="intel-sitrep-badge" style={{ color, borderColor: color + '66', backgroundColor: color + '15' }}>
          {conflict.intensity}
        </div>
      </div>
      {expanded && (
        <div className="intel-sitrep-body">
          <p className="intel-sitrep-desc">{conflict.description}</p>
          <div className="intel-sitrep-grid">
            <div className="intel-metric">
              <span className="intel-metric-val">{conflict.stats.activePersonnel?.toLocaleString()}</span>
              <span className="intel-metric-lbl">PERSONNEL</span>
            </div>
            <div className="intel-metric">
              <span className="intel-metric-val">{conflict.stats.dailyEngagements}</span>
              <span className="intel-metric-lbl">DAILY ENGAGEMENTS</span>
            </div>
            <div className="intel-metric">
              <span className="intel-metric-val">{conflict.stats.aircraftInTheater}</span>
              <span className="intel-metric-lbl">AIRCRAFT</span>
            </div>
            <div className="intel-metric">
              <span className="intel-metric-val">{conflict.stats.uasInTheater?.toLocaleString()}</span>
              <span className="intel-metric-lbl">UAS IN THEATER</span>
            </div>
            <div className="intel-metric">
              <span className="intel-metric-val">{conflict.stats.navalAssets}</span>
              <span className="intel-metric-lbl">NAVAL ASSETS</span>
            </div>
            <div className="intel-metric">
              <span className="intel-metric-val">{conflict.fronts?.length || 0}</span>
              <span className="intel-metric-lbl">ACTIVE FRONTS</span>
            </div>
          </div>
          <div className="intel-sitrep-parties">
            <span className="intel-parties-label">BELLIGERENTS:</span>
            {conflict.parties?.map((p, i) => (
              <span key={i} className="intel-party-tag">{p}</span>
            ))}
          </div>
          <div className="intel-sitrep-since">ACTIVE SINCE {formatDate(conflict.startDate)}</div>
        </div>
      )}
    </div>
  )
}

export default function IntelView({ conflicts, incidents, naval }) {
  const [activeTab, setActiveTab] = useState('sitrep')

  // Aggregate stats
  const globalMetrics = useMemo(() => {
    const totalPersonnel = conflicts.reduce((s, c) => s + (c.stats?.activePersonnel || 0), 0)
    const totalAircraft = conflicts.reduce((s, c) => s + (c.stats?.aircraftInTheater || 0), 0)
    const totalUAS = conflicts.reduce((s, c) => s + (c.stats?.uasInTheater || 0), 0)
    const totalEngagements = conflicts.reduce((s, c) => s + (c.stats?.dailyEngagements || 0), 0)
    const totalNaval = naval.length
    const criticalZones = conflicts.filter(c => c.intensity === 'CRITICAL').length
    const highZones = conflicts.filter(c => c.intensity === 'HIGH').length
    const totalFronts = conflicts.reduce((s, c) => s + (c.fronts?.length || 0), 0)
    return { totalPersonnel, totalAircraft, totalUAS, totalEngagements, totalNaval, criticalZones, highZones, totalFronts }
  }, [conflicts, naval])

  // Sort conflicts by intensity for SITREP
  const sortedConflicts = useMemo(() => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return [...conflicts].sort((a, b) => (order[a.intensity] ?? 4) - (order[b.intensity] ?? 4))
  }, [conflicts])

  // Auto-generated executive summary
  const execSummary = useMemo(() => {
    const critical = conflicts.filter(c => c.intensity === 'CRITICAL')
    const high = conflicts.filter(c => c.intensity === 'HIGH')
    const alliedNaval = naval.filter(s => s.force === 'allied').length
    const hostileNaval = naval.filter(s => s.force === 'hostile').length
    const topZone = sortedConflicts[0]

    const lines = []
    lines.push(`GLOBAL THREAT ASSESSMENT: ${critical.length} CRITICAL and ${high.length} HIGH intensity conflict zones active across ${conflicts.length} theaters of operation.`)
    if (topZone) {
      lines.push(`PRIMARY THEATER: ${topZone.name.toUpperCase()} — ${topZone.stats.dailyEngagements} daily engagements, ${topZone.fronts?.length || 0} active fronts, ${topZone.stats.activePersonnel?.toLocaleString()} personnel deployed.`)
    }
    lines.push(`NAVAL POSTURE: ${alliedNaval} allied and ${hostileNaval} adversary vessels tracked. ${globalMetrics.totalAircraft.toLocaleString()} aircraft and ${globalMetrics.totalUAS.toLocaleString()} UAS platforms in theater globally.`)
    lines.push(`ASSESSMENT: Global instability index remains ELEVATED. Multiple concurrent high-intensity conflicts stress allied force projection capability. Recommend sustained ISR coverage across all theaters.`)
    return lines
  }, [conflicts, naval, sortedConflicts, globalMetrics])

  return (
    <div className="intel-view">
      {/* Header */}
      <div className="intel-header">
        <div className="intel-header-left">
          <div className="intel-header-title">INTELLIGENCE BRIEFING</div>
          <div className="intel-header-sub">DAILY SITUATION REPORT — {new Date().toISOString().slice(0, 10)}</div>
        </div>
        <div className="intel-header-class">
          <span className="intel-class-badge">UNCLASSIFIED // OSINT</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="intel-tabs">
        {[
          { id: 'sitrep', label: 'SITUATION REPORT' },
          { id: 'threat', label: 'THREAT MATRIX' },
          { id: 'overview', label: 'FORCE OVERVIEW' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`intel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="intel-content">
        {/* SITREP Tab */}
        {activeTab === 'sitrep' && (
          <div className="intel-sitrep-tab">
            {/* Executive Summary */}
            <div className="intel-exec-summary">
              <div className="intel-exec-header">
                <span className="intel-exec-stamp">EXECUTIVE SUMMARY</span>
                <span className="intel-exec-date">{new Date().toISOString().slice(0, 10)} // {new Date().toISOString().slice(11, 19)}Z</span>
              </div>
              {execSummary.map((line, i) => (
                <p key={i} className="intel-exec-line">{line}</p>
              ))}
            </div>

            {/* Key Metrics Bar */}
            <div className="intel-metrics-bar">
              <div className="intel-metric-block">
                <span className="intel-metric-big">{globalMetrics.criticalZones + globalMetrics.highZones}</span>
                <span className="intel-metric-sub">HIGH+ ZONES</span>
              </div>
              <div className="intel-metric-block">
                <span className="intel-metric-big">{globalMetrics.totalEngagements}</span>
                <span className="intel-metric-sub">DAILY ENGAGEMENTS</span>
              </div>
              <div className="intel-metric-block">
                <span className="intel-metric-big">{(globalMetrics.totalPersonnel / 1000000).toFixed(1)}M</span>
                <span className="intel-metric-sub">ACTIVE PERSONNEL</span>
              </div>
              <div className="intel-metric-block">
                <span className="intel-metric-big">{globalMetrics.totalFronts}</span>
                <span className="intel-metric-sub">ACTIVE FRONTS</span>
              </div>
            </div>

            {/* Conflict SITREPs */}
            <div className="intel-sitrep-list">
              {sortedConflicts.map((c, i) => (
                <SitrepCard key={c.id} conflict={c} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Threat Matrix Tab */}
        {activeTab === 'threat' && (
          <div className="intel-threat-tab">
            <div className="intel-threat-header-row">
              <span className="intel-th">REGION</span>
              <span className="intel-th">THREAT LEVEL</span>
              <span className="intel-th">TREND</span>
              <span className="intel-th">ASSESSMENT</span>
            </div>
            {THREAT_MATRIX.map((row, i) => {
              const color = getIntensityColor(row.level)
              const trendIcon = row.trend === 'ESCALATING' ? '\u2191' :
                row.trend === 'DETERIORATING' ? '\u2193' :
                row.trend === 'STATIC' ? '\u2194' :
                row.trend === 'VOLATILE' ? '\u21C5' : '\u2192'
              const trendColor = (row.trend === 'ESCALATING' || row.trend === 'DETERIORATING') ? '#FF4444' :
                row.trend === 'VOLATILE' ? '#FFB800' : '#44CC44'
              return (
                <div key={i} className="intel-threat-row">
                  <span className="intel-td intel-td-region">{row.region}</span>
                  <span className="intel-td">
                    <span className="intel-level-badge" style={{ color, borderColor: color + '66', backgroundColor: color + '15' }}>
                      {row.level}
                    </span>
                  </span>
                  <span className="intel-td">
                    <span className="intel-trend" style={{ color: trendColor }}>
                      {trendIcon} {row.trend}
                    </span>
                  </span>
                  <span className="intel-td intel-td-summary">{row.summary}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Force Overview Tab */}
        {activeTab === 'overview' && (
          <div className="intel-overview-tab">
            <div className="intel-overview-grid">
              <div className="intel-overview-card">
                <div className="intel-overview-card-title">GLOBAL FORCE POSTURE</div>
                <div className="intel-overview-stats">
                  <div className="intel-ov-stat">
                    <span className="intel-ov-val">{globalMetrics.totalPersonnel.toLocaleString()}</span>
                    <span className="intel-ov-lbl">ACTIVE PERSONNEL IN THEATER</span>
                  </div>
                  <div className="intel-ov-stat">
                    <span className="intel-ov-val">{globalMetrics.totalAircraft.toLocaleString()}</span>
                    <span className="intel-ov-lbl">AIRCRAFT IN THEATER</span>
                  </div>
                  <div className="intel-ov-stat">
                    <span className="intel-ov-val">{globalMetrics.totalUAS.toLocaleString()}</span>
                    <span className="intel-ov-lbl">UAS / DRONE PLATFORMS</span>
                  </div>
                  <div className="intel-ov-stat">
                    <span className="intel-ov-val">{globalMetrics.totalNaval}</span>
                    <span className="intel-ov-lbl">TRACKED NAVAL ASSETS</span>
                  </div>
                </div>
              </div>

              <div className="intel-overview-card">
                <div className="intel-overview-card-title">NAVAL ORDER OF BATTLE</div>
                <div className="intel-naval-list">
                  {naval.map(ship => (
                    <div key={ship.id} className="intel-naval-row">
                      <span className={`intel-naval-flag ${ship.force}`}>{ship.flag}</span>
                      <span className="intel-naval-name">{ship.name}</span>
                      <span className="intel-naval-class">{ship.class}</span>
                      <span className="intel-naval-theater">{ship.theater}</span>
                      <span className={`intel-naval-status ${ship.force}`}>{ship.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="intel-overview-card">
                <div className="intel-overview-card-title">CONFLICT ZONE METRICS</div>
                <div className="intel-zone-bars">
                  {sortedConflicts.map(c => {
                    const color = getIntensityColor(c.intensity)
                    const maxEng = Math.max(...conflicts.map(x => x.stats.dailyEngagements))
                    const pct = (c.stats.dailyEngagements / maxEng) * 100
                    return (
                      <div key={c.id} className="intel-zone-bar-row">
                        <span className="intel-zone-bar-label">{c.name}</span>
                        <div className="intel-zone-bar-track">
                          <div
                            className="intel-zone-bar-fill"
                            style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}
                          />
                        </div>
                        <span className="intel-zone-bar-val" style={{ color }}>{c.stats.dailyEngagements}/day</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="intel-overview-card">
                <div className="intel-overview-card-title">KILL CHAIN RESPONSE TIMES</div>
                <div className="intel-killchain-list">
                  {sortedConflicts.filter(c => c.killChain).slice(0, 6).map(c => {
                    const kc = c.killChain
                    const total = kc.detect + kc.classify + kc.track + kc.engage + kc.neutralize
                    return (
                      <div key={c.id} className="intel-kc-row">
                        <span className="intel-kc-name">{c.name}</span>
                        <div className="intel-kc-phases">
                          {['detect', 'classify', 'track', 'engage', 'neutralize'].map(phase => (
                            <div
                              key={phase}
                              className="intel-kc-phase"
                              style={{ flex: kc[phase] / total }}
                              title={`${phase.toUpperCase()}: ${kc[phase]}s`}
                            >
                              <span className="intel-kc-phase-label">{kc[phase]}s</span>
                            </div>
                          ))}
                        </div>
                        <span className="intel-kc-total">{total}s</span>
                      </div>
                    )
                  })}
                  <div className="intel-kc-legend">
                    {['DETECT', 'CLASSIFY', 'TRACK', 'ENGAGE', 'NEUTRALIZE'].map((label, i) => (
                      <span key={label} className={`intel-kc-legend-item phase-${i}`}>{label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="intel-footer">
        <span>DISTRIBUTION: UNLIMITED</span>
        <span>CLASSIFICATION: UNCLASSIFIED // OPEN SOURCE</span>
        <span>PREPARED BY: TANGODOWN.LIVE OSINT DESK</span>
      </div>
    </div>
  )
}
