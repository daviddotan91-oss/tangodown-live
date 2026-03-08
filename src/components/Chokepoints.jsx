import React, { useState, useEffect } from 'react'
import InfoTooltip from './InfoTooltip'

const STATUS_COLORS = {
  NOMINAL: '#44CC44',
  ELEVATED: '#FFB800',
  DEGRADED: '#FF8800',
  CRITICAL: '#FF4444',
}

const THREAT_COLORS = {
  LOW: '#44CC44',
  MEDIUM: '#FFB800',
  HIGH: '#FF8800',
  CRITICAL: '#FF4444',
}

export default function Chokepoints() {
  const [data, setData] = useState([])
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetch('/data/chokepoints.json')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data.length) return null

  const critCount = data.filter(d => d.status === 'CRITICAL').length
  const degradedCount = data.filter(d => d.status === 'DEGRADED' || d.status === 'ELEVATED').length

  return (
    <div className="chokepoints-section">
      <div className="chokepoints-header">
        <div className="chokepoints-title">
          MARITIME CHOKEPOINTS
          <InfoTooltip text="Status of critical maritime chokepoints controlling global trade and energy supply routes. Color indicates operational status and threat level." position="bottom" />
        </div>
        <div className="chokepoints-summary">
          {critCount > 0 && <span className="chokepoints-alert critical">{critCount} CRITICAL</span>}
          {degradedCount > 0 && <span className="chokepoints-alert degraded">{degradedCount} IMPAIRED</span>}
        </div>
      </div>

      <div className="chokepoints-grid">
        {data.map(cp => {
          const statusColor = STATUS_COLORS[cp.status] || '#666'
          const threatColor = THREAT_COLORS[cp.threat] || '#666'
          const isExpanded = expanded === cp.id
          const transitPct = Math.round((cp.dailyTransits / cp.dailyTransitsNormal) * 100)

          return (
            <div
              key={cp.id}
              className={`chokepoint-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpanded(isExpanded ? null : cp.id)}
            >
              <div className="chokepoint-row1">
                <div className="chokepoint-status-dot" style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                <span className="chokepoint-name">{cp.name}</span>
                <span className="chokepoint-status-badge" style={{ color: statusColor, borderColor: statusColor + '55', backgroundColor: statusColor + '12' }}>
                  {cp.status}
                </span>
              </div>

              <div className="chokepoint-row2">
                <div className="chokepoint-metric">
                  <span className="chokepoint-metric-val">{cp.dailyTransits}</span>
                  <span className="chokepoint-metric-lbl">TRANSITS/DAY</span>
                </div>
                <div className="chokepoint-capacity-bar">
                  <div
                    className="chokepoint-capacity-fill"
                    style={{
                      width: `${Math.min(transitPct, 100)}%`,
                      backgroundColor: transitPct >= 90 ? '#44CC44' : transitPct >= 60 ? '#FFB800' : '#FF4444'
                    }}
                  />
                </div>
                <span className="chokepoint-capacity-pct" style={{
                  color: transitPct >= 90 ? '#44CC44' : transitPct >= 60 ? '#FFB800' : '#FF4444'
                }}>{transitPct}%</span>
              </div>

              <div className="chokepoint-row3">
                <span className="chokepoint-oil">{cp.oilFlow}</span>
                <span className="chokepoint-threat" style={{ color: threatColor }}>
                  THREAT: {cp.threat}
                </span>
              </div>

              {isExpanded && (
                <div className="chokepoint-details">
                  <div className="chokepoint-summary-text">{cp.summary}</div>
                  <div className="chokepoint-control">
                    <span className="chokepoint-control-label">CONTROLLED BY:</span>
                    <span className="chokepoint-control-val">{cp.controlledBy}</span>
                  </div>
                  <div className="chokepoint-threats-list">
                    <span className="chokepoint-threats-label">THREATS:</span>
                    {cp.threats?.map((t, i) => (
                      <span key={i} className="chokepoint-threat-tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        .chokepoints-section {
          margin-bottom: 20px;
        }
        .chokepoints-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .chokepoints-title {
          font-family: 'Orbitron', var(--font-display);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--text-primary);
        }
        .chokepoints-summary {
          display: flex;
          gap: 6px;
        }
        .chokepoints-alert {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 2px 8px;
          border-radius: 2px;
        }
        .chokepoints-alert.critical {
          color: #FF4444;
          background: rgba(255, 68, 68, 0.1);
          border: 1px solid rgba(255, 68, 68, 0.3);
          animation: chokepoint-blink 2s ease-in-out infinite;
        }
        .chokepoints-alert.degraded {
          color: #FFB800;
          background: rgba(255, 184, 0, 0.1);
          border: 1px solid rgba(255, 184, 0, 0.3);
        }
        @keyframes chokepoint-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .chokepoints-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .chokepoint-card {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: 4px;
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .chokepoint-card:hover {
          border-color: rgba(255, 68, 68, 0.3);
          background: var(--bg-hover);
        }
        .chokepoint-card.expanded {
          grid-column: 1 / -1;
          border-color: rgba(255, 184, 0, 0.3);
        }

        .chokepoint-row1 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .chokepoint-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .chokepoint-name {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 0.5px;
          flex: 1;
        }
        .chokepoint-status-badge {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 1px 6px;
          border-radius: 2px;
          border: 1px solid;
        }

        .chokepoint-row2 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 5px;
        }
        .chokepoint-metric {
          display: flex;
          align-items: baseline;
          gap: 4px;
          flex-shrink: 0;
        }
        .chokepoint-metric-val {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 700;
          color: var(--accent-gold);
        }
        .chokepoint-metric-lbl {
          font-family: var(--font-mono);
          font-size: 7px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }
        .chokepoint-capacity-bar {
          flex: 1;
          height: 4px;
          background: var(--bg-primary);
          border-radius: 2px;
          overflow: hidden;
        }
        .chokepoint-capacity-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }
        .chokepoint-capacity-pct {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          width: 30px;
          text-align: right;
        }

        .chokepoint-row3 {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chokepoint-oil {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }
        .chokepoint-threat {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .chokepoint-details {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--border-primary);
          animation: chokepoint-expand 0.2s ease;
        }
        @keyframes chokepoint-expand {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 200px; }
        }
        .chokepoint-summary-text {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 8px;
        }
        .chokepoint-control {
          display: flex;
          gap: 6px;
          margin-bottom: 6px;
        }
        .chokepoint-control-label {
          font-family: var(--font-mono);
          font-size: 8px;
          color: var(--text-muted);
          letter-spacing: 1px;
        }
        .chokepoint-control-val {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-primary);
        }
        .chokepoint-threats-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          align-items: center;
        }
        .chokepoint-threats-label {
          font-family: var(--font-mono);
          font-size: 8px;
          color: var(--text-muted);
          letter-spacing: 1px;
          margin-right: 4px;
        }
        .chokepoint-threat-tag {
          font-family: var(--font-mono);
          font-size: 8px;
          color: #FF8800;
          background: rgba(255, 136, 0, 0.08);
          border: 1px solid rgba(255, 136, 0, 0.2);
          padding: 2px 6px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
