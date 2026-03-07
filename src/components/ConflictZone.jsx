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
            <div className="ops-placeholder">
              <div className="ops-icon">&#9654;</div>
              <div className="ops-text">OPERATIONAL DATA</div>
              <div className="ops-subtext">Phase 2 — Replay Engine</div>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="conflict-assets">
            <div className="asset-section">
              <div className="asset-section-title">AIRCRAFT ({conflict.stats.aircraftInTheater})</div>
              <div className="asset-placeholder">Detailed order of battle — Phase 2</div>
            </div>
            <div className="asset-section">
              <div className="asset-section-title">NAVAL ({conflict.stats.navalAssets})</div>
              <div className="asset-placeholder">Fleet composition data — Phase 2</div>
            </div>
            <div className="asset-section">
              <div className="asset-section-title">UAS ({conflict.stats.uasInTheater})</div>
              <div className="asset-placeholder">Drone inventory — Phase 2</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
