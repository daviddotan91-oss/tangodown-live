import React from 'react'
import LeaderCard from './LeaderCard'

export default function KillList({ eliminated, active, orgName }) {
  return (
    <div className="kill-list">
      {/* Eliminated Section */}
      <div className="kill-list-section">
        <div className="kill-list-section-header eliminated">
          <span className="kill-section-icon">&#10006;</span>
          ELIMINATED
          <span className="kill-section-count">{eliminated.length}</span>
        </div>
        {eliminated.length === 0 ? (
          <div className="kill-list-empty">No confirmed eliminations tracked for {orgName}</div>
        ) : (
          <div className="kill-list-cards">
            {eliminated.map(leader => (
              <LeaderCard key={leader.id} leader={leader} status="eliminated" />
            ))}
          </div>
        )}
      </div>

      {/* Active / At Large Section */}
      <div className="kill-list-section">
        <div className="kill-list-section-header active">
          <span className="kill-section-icon">&#9888;</span>
          ACTIVE / AT LARGE
          <span className="kill-section-count">{active.length}</span>
        </div>
        {active.length === 0 ? (
          <div className="kill-list-empty">No tracked active leadership for {orgName}</div>
        ) : (
          <div className="kill-list-cards">
            {active.map(leader => (
              <LeaderCard key={leader.id} leader={leader} status="active" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
