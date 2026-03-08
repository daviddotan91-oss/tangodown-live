import React, { useState } from 'react'
import { getIntensityColor } from '../utils/dataUtils'

export default function ConflictZone({ conflict }) {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'fronts', label: 'FRONTS' },
    { id: 'operations', label: 'OPS' },
    { id: 'assets', label: 'ASSETS' }
  ]

  return (
    <div className="conflict-zone-detail">
      <div className="conflict-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`conflict-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="conflict-tab-content">
        {activeTab === 'overview' && (
          <div className="conflict-overview">
            <p className="conflict-description">{conflict.description}</p>
            <div className="conflict-parties">
              <div className="parties-label">BELLIGERENTS</div>
              {conflict.parties.map((party, i) => (
                <span key={i} className="party-tag">{party}</span>
              ))}
            </div>
            <div className="conflict-stats-detail">
              <div className="stat-row">
                <span>Active Personnel</span>
                <span className="stat-val">{(conflict.stats.activePersonnel / 1000).toFixed(0)}K</span>
              </div>
              <div className="stat-row">
                <span>Aircraft in Theater</span>
                <span className="stat-val">{conflict.stats.aircraftInTheater}</span>
              </div>
              <div className="stat-row">
                <span>UAS in Theater</span>
                <span className="stat-val">{conflict.stats.uasInTheater}</span>
              </div>
              <div className="stat-row">
                <span>Naval Assets</span>
                <span className="stat-val">{conflict.stats.navalAssets}</span>
              </div>
              <div className="stat-row">
                <span>Daily Engagements</span>
                <span className="stat-val highlight">{conflict.stats.dailyEngagements}</span>
              </div>
              <div className="stat-row">
                <span>Start Date</span>
                <span className="stat-val">{conflict.startDate}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fronts' && (
          <div className="conflict-fronts">
            {conflict.fronts.map((front, i) => (
              <div key={i} className="front-item">
                <div className="front-header">
                  <span
                    className="front-intensity-dot"
                    style={{ backgroundColor: getIntensityColor(front.intensity) }}
                  />
                  <span className="front-name">{front.name}</span>
                </div>
                <div className="front-meta">
                  <span className="front-type">{front.type.toUpperCase()}</span>
                  <span
                    className="front-intensity"
                    style={{ color: getIntensityColor(front.intensity) }}
                  >
                    {front.intensity}
                  </span>
                  <span className="front-uas">{front.uasPerDay} UAS/DAY</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="conflict-operations">
            {conflict.recentStrikes?.length > 0 ? (
              <div className="ops-strikes">
                <div className="ops-strikes-header">CONFIRMED OPERATIONS — {conflict.recentStrikes.length} RECENT</div>
                {conflict.recentStrikes.map((strike, i) => (
                  <div key={i} className="ops-strike-entry">
                    <div className="ops-strike-row1">
                      <span className="ops-strike-date">{strike.date}</span>
                      <span className="ops-strike-operator">{strike.operator}</span>
                      <span className="ops-strike-result" style={{
                        color: /destroy|eliminat|collaps|neutral|intercept/i.test(strike.result) ? '#44CC44' : '#FFB800'
                      }}>{strike.result}</span>
                    </div>
                    <div className="ops-strike-target">{strike.target}</div>
                    <div className="ops-strike-row3">
                      <span className="ops-strike-weapon">{strike.weapon}</span>
                      <span className="ops-strike-platform">{strike.aircraft}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ops-placeholder">
                <div className="ops-text">NO CONFIRMED OPERATIONS DATA</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="conflict-assets">
            {conflict.aircraft?.length > 0 && (
              <div className="asset-section">
                <div className="asset-section-title">AIRCRAFT ORDER OF BATTLE ({conflict.aircraft.reduce((s, a) => s + a.count, 0)} TOTAL)</div>
                {conflict.aircraft.map((ac, i) => (
                  <div key={i} className="asset-row">
                    <span className="asset-row-name">{ac.type}</span>
                    <span className="asset-row-role">{ac.role}</span>
                    <span className="asset-row-operator">{ac.operator}</span>
                    <span className="asset-row-count">x{ac.count}</span>
                  </div>
                ))}
              </div>
            )}
            {conflict.weapons?.length > 0 && (
              <div className="asset-section">
                <div className="asset-section-title">WEAPONS SYSTEMS ({conflict.weapons.length} TYPES)</div>
                {conflict.weapons.map((w, i) => (
                  <div key={i} className="asset-row">
                    <span className="asset-row-name">{w.name}</span>
                    <span className="asset-row-role">{w.type}</span>
                    <span className="asset-row-operator">{w.operator}</span>
                    <span className="asset-row-count">{w.dailyUse}/d</span>
                  </div>
                ))}
              </div>
            )}
            {!conflict.aircraft?.length && !conflict.weapons?.length && (
              <div className="asset-placeholder">NO DETAILED ORDER OF BATTLE AVAILABLE</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
