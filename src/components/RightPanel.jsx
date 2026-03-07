import React, { useState, useRef, useEffect } from 'react'
import { getEventColor, formatUTC } from '../utils/dataUtils'

function LiveIndicator() {
  return (
    <div className="live-indicator">
      <span className="live-dot" />
      <span className="live-text">LIVE</span>
    </div>
  )
}

function FeedEntry({ incident, onClick, isNew }) {
  const color = getEventColor(incident.type)
  const time = formatUTC(incident.timestamp)

  return (
    <div
      className={`feed-entry ${isNew ? 'feed-entry-new' : ''}`}
      onClick={() => onClick?.(incident)}
    >
      <div className="feed-entry-time">{time}</div>
      <div className="feed-entry-content">
        <div className="feed-entry-header">
          <span className="feed-event-badge" style={{ backgroundColor: color + '22', color, borderColor: color + '44' }}>
            {incident.type}
          </span>
          <span className="feed-conflict-tag">{incident.conflictId?.replace(/-/g, ' ').toUpperCase()}</span>
        </div>
        <div className="feed-entry-location">{incident.location}</div>
        <div className="feed-entry-description">{incident.description}</div>
        <div className="feed-entry-footer">
          <span className={`feed-force-tag ${incident.force}`}>
            {incident.force === 'allied' ? 'ALLIED' : 'HOSTILE'}
          </span>
          <span className="feed-source-tag">
            {incident.simulated ? 'SIMULATED' : incident.source || 'OSINT'}
          </span>
        </div>
      </div>
    </div>
  )
}

function NavalTracker({ naval, onShipClick }) {
  return (
    <div className="naval-tracker">
      <div className="naval-tracker-header">
        <span className="naval-icon">&#9875;</span>
        NAVAL TRACKER
        <span className="naval-count">{naval.length}</span>
      </div>
      <div className="naval-tracker-list">
        {naval.slice(0, 10).map(ship => (
          <div
            key={ship.id}
            className={`naval-item ${ship.force}`}
            onClick={() => onShipClick?.(ship)}
          >
            <div className="naval-item-header">
              <span className={`naval-force-dot ${ship.force}`} />
              <span className="naval-ship-name">{ship.name}</span>
              <span className="naval-flag">{ship.flag}</span>
            </div>
            <div className="naval-item-meta">
              <span className="naval-ship-class">{ship.class}</span>
              <span className="naval-ship-theater">{ship.theater}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RightPanel({ feed, naval, onIncidentClick, onShipClick, feedFilter, setFeedFilter }) {
  const feedRef = useRef(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const prevFeedLength = useRef(feed.length)

  // Track new entries
  useEffect(() => {
    if (autoScroll && feedRef.current && feed.length > prevFeedLength.current) {
      feedRef.current.scrollTop = 0
    }
    prevFeedLength.current = feed.length
  }, [feed.length, autoScroll])

  const eventTypes = ['ALL', 'AIRSTRIKE', 'DRONE STRIKE', 'GROUND OP', 'MISSILE LAUNCH', 'INTERCEPT', 'NAVAL ENGAGEMENT', 'SPECIAL OP', 'IED/AMBUSH', 'RAID']

  return (
    <div className="right-panel">
      <div className="panel-header">
        <span className="panel-header-icon">&#9632;</span>
        ENGAGEMENT FEED
        <LiveIndicator />
      </div>

      {/* Feed Filters */}
      <div className="feed-filters">
        <select
          className="feed-filter-select"
          value={feedFilter.type || 'ALL'}
          onChange={(e) => setFeedFilter(prev => ({ ...prev, type: e.target.value === 'ALL' ? null : e.target.value }))}
        >
          {eventTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          className="feed-filter-select"
          value={feedFilter.force || 'ALL'}
          onChange={(e) => setFeedFilter(prev => ({ ...prev, force: e.target.value === 'ALL' ? null : e.target.value }))}
        >
          <option value="ALL">ALL FORCES</option>
          <option value="allied">ALLIED</option>
          <option value="hostile">HOSTILE</option>
        </select>
      </div>

      {/* Feed List */}
      <div className="feed-list" ref={feedRef}>
        {feed.slice(0, 50).map((incident, i) => (
          <FeedEntry
            key={incident.id}
            incident={incident}
            onClick={onIncidentClick}
            isNew={i === 0}
          />
        ))}
      </div>

      {/* Naval Tracker */}
      <NavalTracker naval={naval} onShipClick={onShipClick} />
    </div>
  )
}
