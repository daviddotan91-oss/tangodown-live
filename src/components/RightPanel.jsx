import React, { useRef, useEffect } from 'react'
import { getEventColor, formatUTC } from '../utils/dataUtils'

function FeedEntry({ incident, onClick }) {
  const color = getEventColor(incident.type)
  const time = formatUTC(incident.timestamp)
  const theater = incident.conflictId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''

  return (
    <div className="war-feed-item" onClick={() => onClick?.(incident)}>
      <span className="war-feed-ts">{time}</span>
      <span className="war-feed-action" style={{ color }}>{incident.type}</span>
      <span className="war-feed-loc">{incident.location}</span>
      <span className="war-feed-zone">{theater}</span>
    </div>
  )
}

export default function RightPanel({ feed, naval, onIncidentClick, onShipClick }) {
  const feedRef = useRef(null)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0
    }
  }, [feed.length])

  return (
    <div className="war-panel-right">
      {/* Feed Header */}
      <div className="war-header">
        <div className="war-header-title">
          LIVE ENGAGEMENT FEED
        </div>
        <div className="war-header-sub">
          <span className="war-feed-live-dot" /> SIMULATED
        </div>
      </div>

      {/* Feed List */}
      <div className="war-feed-list" ref={feedRef}>
        {feed.slice(0, 50).map((incident) => (
          <FeedEntry
            key={incident.id}
            incident={incident}
            onClick={onIncidentClick}
          />
        ))}
      </div>

      {/* Naval Tracker */}
      <div className="war-naval">
        <div className="war-panel-title">
          NAVAL TRACKER — {naval.length} VESSELS
        </div>
        <div className="war-naval-list">
          {naval.slice(0, 15).map(ship => (
            <div
              key={ship.id}
              className="war-naval-row"
              onClick={() => onShipClick?.(ship)}
            >
              <span className="war-naval-icon">
                {ship.force === 'hostile' ? '▼' : '●'}
              </span>
              <div className="war-naval-info">
                <span className="war-naval-name">{ship.name}</span>
                <span className="war-naval-meta">{ship.theater}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
