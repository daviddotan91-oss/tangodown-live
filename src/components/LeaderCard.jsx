import React, { useState } from 'react'

export default function LeaderCard({ leader, status }) {
  const [expanded, setExpanded] = useState(false)
  const isEliminated = status === 'eliminated'

  const threatColors = {
    'CRITICAL': '#FF4444',
    'HIGH': '#FF6644',
    'MEDIUM': '#FFB800',
    'LOW': '#44CC44'
  }

  return (
    <div
      className={`leader-card ${isEliminated ? 'eliminated' : 'active'} ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Photo */}
      <div className="leader-photo">
        {leader.image ? (
          <img
            src={leader.image}
            alt={leader.name}
            className="leader-photo-img"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
        ) : null}
        <div className="leader-silhouette" style={leader.image ? { display: 'none' } : undefined}>
          <svg viewBox="0 0 60 60" width="60" height="60">
            <circle cx="30" cy="22" r="12" fill="#1a2a3a" />
            <ellipse cx="30" cy="52" rx="20" ry="16" fill="#1a2a3a" />
          </svg>
        </div>
        {isEliminated && (
          <div className="eliminated-stamp">
            <span>ELIMINATED</span>
          </div>
        )}
        {!isEliminated && leader.threatAssessment && (
          <div
            className="threat-badge"
            style={{
              color: threatColors[leader.threatAssessment],
              borderColor: threatColors[leader.threatAssessment],
              backgroundColor: threatColors[leader.threatAssessment] + '15'
            }}
          >
            {leader.threatAssessment}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="leader-info">
        <div className={`leader-name ${isEliminated ? 'strikethrough' : ''}`}>
          {leader.name}
        </div>
        <div className="leader-title">{leader.title}</div>

        {isEliminated ? (
          <div className="leader-elimination">
            <div className="elim-date">{leader.dateEliminated}</div>
            <div className="elim-method">{leader.method}</div>
          </div>
        ) : (
          <div className="leader-location">
            <span className="location-label">LAST KNOWN:</span>
            <span className="location-value">{leader.lastKnownLocation}</span>
          </div>
        )}

        {/* Wanted By */}
        {leader.wantedBy?.length > 0 && (
          <div className="leader-wanted">
            {leader.wantedBy.map((w, i) => (
              <span key={i} className="wanted-tag">{w}</span>
            ))}
          </div>
        )}

        {/* Bounty */}
        {leader.bounty && (
          <div className="leader-bounty">
            <span className="bounty-label">BOUNTY</span>
            <span className="bounty-value">{leader.bounty}</span>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="leader-expanded">
          <div className="leader-significance">
            {isEliminated ? leader.significance : leader.description}
          </div>
          {isEliminated && leader.location && (
            <div className="leader-detail-row">
              <span className="detail-label">LOCATION</span>
              <span className="detail-value">{leader.location}</span>
            </div>
          )}
          {isEliminated && leader.operationName && (
            <div className="leader-detail-row">
              <span className="detail-label">OPERATION</span>
              <span className="detail-value">{leader.operationName}</span>
            </div>
          )}
          {!isEliminated && leader.knownAssociates?.length > 0 && (
            <div className="leader-associates">
              <span className="associates-label">KNOWN ASSOCIATES</span>
              <div className="associates-list">
                {leader.knownAssociates.map((a, i) => (
                  <span key={i} className="associate-tag">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
