import React, { useState, useEffect } from 'react'
import KillList from './KillList'

function WeaponIntelCard({ weapon, conflicts, orgName }) {
  const [expanded, setExpanded] = useState(false)

  // Find this weapon (or similar) across all conflict data
  const usage = []
  conflicts.forEach(conflict => {
    // Match weapon in conflict's weapons array
    const match = conflict.weapons?.find(w =>
      w.name.toLowerCase().includes(weapon.toLowerCase().split(' ')[0]) ||
      weapon.toLowerCase().includes(w.name.toLowerCase().split(' ')[0])
    )
    if (match) {
      usage.push({ conflict, weapon: match })
    }
    // Match weapon in recent strikes
    const strikes = conflict.recentStrikes?.filter(s =>
      s.weapon.toLowerCase().includes(weapon.toLowerCase().split(' ')[0]) ||
      weapon.toLowerCase().includes(s.weapon.toLowerCase().split(' ')[0])
    ) || []
    strikes.forEach(s => {
      if (!usage.find(u => u.strike?.date === s.date && u.strike?.target === s.target)) {
        usage.push({ conflict, strike: s })
      }
    })
  })

  const lastStrike = usage.find(u => u.strike)?.strike
  const weaponData = usage.find(u => u.weapon)?.weapon
  const theater = usage.find(u => u.weapon)?.conflict?.name || usage.find(u => u.strike)?.conflict?.name

  return (
    <div className={`weapon-intel-card ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(!expanded)}>
      <div className="weapon-intel-header">
        <span className="weapon-intel-icon">{weaponData?.type?.includes('Intercept') ? '◇' : weaponData?.type?.includes('Missile') ? '▸' : weaponData?.type?.includes('Rocket') ? '▴' : weaponData?.type?.includes('Bomb') ? '◆' : '●'}</span>
        <span className="weapon-intel-name">{weapon}</span>
        {lastStrike && <span className="weapon-intel-recent-dot" title="Recent strike data" />}
      </div>
      {expanded && (
        <div className="weapon-intel-details">
          {weaponData && (
            <>
              <div className="weapon-detail-row">
                <span className="weapon-detail-label">TYPE</span>
                <span className="weapon-detail-value">{weaponData.type}</span>
              </div>
              <div className="weapon-detail-row">
                <span className="weapon-detail-label">USAGE</span>
                <span className="weapon-detail-value">{weaponData.usage}</span>
              </div>
              <div className="weapon-detail-row">
                <span className="weapon-detail-label">THEATER</span>
                <span className="weapon-detail-value">{theater}</span>
              </div>
              <div className="weapon-detail-row">
                <span className="weapon-detail-label">EST. DAILY USE</span>
                <span className="weapon-detail-value highlight">{weaponData.dailyUse}/day</span>
              </div>
            </>
          )}
          {lastStrike && (
            <div className="weapon-last-strike">
              <div className="weapon-strike-title">LAST CONFIRMED STRIKE</div>
              <div className="weapon-strike-date">{lastStrike.date}</div>
              <div className="weapon-strike-row">
                <span className="weapon-detail-label">TARGET</span>
                <span className="weapon-detail-value">{lastStrike.target}</span>
              </div>
              <div className="weapon-strike-row">
                <span className="weapon-detail-label">PLATFORM</span>
                <span className="weapon-detail-value">{lastStrike.aircraft}</span>
              </div>
              <div className="weapon-strike-row">
                <span className="weapon-detail-label">RESULT</span>
                <span className="weapon-detail-value result">{lastStrike.result}</span>
              </div>
            </div>
          )}
          {!weaponData && !lastStrike && (
            <div className="weapon-no-data">NO OSINT STRIKE DATA AVAILABLE</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function OrgDossier({ org, leaders, connections, allOrgs, onOrgSelect, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [conflicts, setConflicts] = useState([])

  // Load conflict data for weapon cross-referencing
  useEffect(() => {
    fetch('/data/conflicts.json').then(r => r.json()).then(setConflicts).catch(() => {})
  }, [])

  const tabs = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'leadership', label: 'KILL LIST' },
    { id: 'network', label: 'NETWORK' }
  ]

  return (
    <div className="org-dossier">
      <div className="dossier-header">
        <button className="dossier-close" onClick={onClose}>&#10005;</button>
        <div className="dossier-org-color" style={{ backgroundColor: org.color || '#FF4444' }} />
        <div className="dossier-title-section">
          <h2 className="dossier-org-name">{org.name}</h2>
          <div className="dossier-org-fullname">{org.fullName}</div>
        </div>
      </div>

      {/* Designation Badges — shows how allied nations have designated this org */}
      <div className="dossier-designations">
        <div className="desig-header">DESIGNATED BY</div>
        {org.usDesignation && (
          <div className="dossier-designation">
            <span className="desig-country desig-allied">US</span>
            <span className="desig-arrow">▸</span>
            <span className="desig-status">{org.usDesignation.status}</span>
            {org.usDesignation.date && <span className="desig-date">{org.usDesignation.date}</span>}
          </div>
        )}
        {org.israelDesignation && (
          <div className="dossier-designation">
            <span className="desig-country desig-allied">ISRAEL</span>
            <span className="desig-arrow">▸</span>
            <span className="desig-status">{org.israelDesignation.status}</span>
          </div>
        )}
        {org.euDesignation && (
          <div className="dossier-designation">
            <span className="desig-country desig-allied">EU</span>
            <span className="desig-arrow">▸</span>
            <span className="desig-status">{org.euDesignation.status}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="dossier-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`dossier-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'leadership' && (
              <span className="tab-count">{leaders.eliminated.length + leaders.active.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="dossier-content">
        {activeTab === 'overview' && (
          <div className="dossier-overview">
            <p className="dossier-description">{org.description}</p>

            <div className="dossier-info-grid">
              <div className="dossier-info-item">
                <span className="info-label">IDEOLOGY</span>
                <span className="info-value">{org.ideology}</span>
              </div>
              <div className="dossier-info-item">
                <span className="info-label">FOUNDED</span>
                <span className="info-value">{org.founded}</span>
              </div>
              <div className="dossier-info-item">
                <span className="info-label">LOCATION</span>
                <span className="info-value">{org.foundedLocation}</span>
              </div>
              <div className="dossier-info-item">
                <span className="info-label">EST. STRENGTH</span>
                <span className="info-value highlight">{org.estimatedStrength}</span>
              </div>
              <div className="dossier-info-item">
                <span className="info-label">TERRITORY</span>
                <span className="info-value">{org.territory}</span>
              </div>
              <div className="dossier-info-item">
                <span className="info-label">EST. BUDGET</span>
                <span className="info-value">{org.annualBudget}</span>
              </div>
              {org.stateSponsors?.length > 0 && (
                <div className="dossier-info-item full-width">
                  <span className="info-label">STATE SPONSORS</span>
                  <div className="info-tags">
                    {org.stateSponsors.map((s, i) => (
                      <span key={i} className="sponsor-tag">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="dossier-weapons-section">
              <div className="weapons-title">ARSENAL — CLICK FOR INTEL</div>
              <div className="weapons-intel-list">
                {org.primaryWeapons?.map((w, i) => (
                  <WeaponIntelCard key={i} weapon={w} conflicts={conflicts} orgName={org.name} />
                ))}
              </div>
            </div>

            {org.aliases?.length > 0 && (
              <div className="dossier-aliases">
                <div className="aliases-title">ALIASES</div>
                <div className="aliases-list">
                  {org.aliases.map((a, i) => (
                    <span key={i} className="alias-tag">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leadership' && (
          <KillList
            eliminated={leaders.eliminated}
            active={leaders.active}
            orgName={org.name}
          />
        )}

        {activeTab === 'network' && (
          <div className="dossier-network">
            <div className="network-section-title">CONNECTIONS</div>
            {connections.length === 0 ? (
              <div className="no-connections">No tracked connections for this organization</div>
            ) : (
              <div className="connection-list">
                {connections.map((conn, i) => {
                  const otherId = conn.source === org.id ? conn.target : conn.source
                  const otherOrg = allOrgs.find(o => o.id === otherId)
                  if (!otherOrg) return null
                  const isSource = conn.source === org.id
                  const typeColors = {
                    funding: '#FFB800',
                    command: '#FF4444',
                    affiliate: '#00AAFF',
                    training: '#44CC44',
                    coordination: '#FF6644',
                    membership: '#00AAFF',
                    influence: '#FFB800',
                    adversary: '#FF4444'
                  }
                  return (
                    <div
                      key={i}
                      className="connection-item"
                      onClick={() => onOrgSelect(otherOrg)}
                    >
                      <div className="conn-header">
                        <span className="conn-dot" style={{ backgroundColor: otherOrg.color }} />
                        <span className="conn-org-name">{otherOrg.name}</span>
                        <span className="conn-direction">{isSource ? '→' : '←'}</span>
                      </div>
                      <div className="conn-meta">
                        <span
                          className="conn-type-badge"
                          style={{
                            color: typeColors[conn.type] || '#00AAFF',
                            borderColor: (typeColors[conn.type] || '#00AAFF') + '44',
                            backgroundColor: (typeColors[conn.type] || '#00AAFF') + '11'
                          }}
                        >
                          {conn.type.toUpperCase()}
                        </span>
                        <span className="conn-label">{conn.label}</span>
                      </div>
                      <div className="conn-strength">
                        <div className="conn-strength-bar">
                          <div
                            className="conn-strength-fill"
                            style={{
                              width: `${conn.strength * 10}%`,
                              backgroundColor: typeColors[conn.type] || '#00AAFF'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
