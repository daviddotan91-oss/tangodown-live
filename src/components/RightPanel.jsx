import React, { useRef, useEffect, useState, useMemo } from 'react'
import { getEventColor } from '../utils/dataUtils'

const FEED_TYPES = ['AIRSTRIKE', 'DRONE STRIKE', 'NAVAL ENGAGEMENT', 'GROUND OP', 'MISSILE LAUNCH', 'INTERCEPT', 'IED/AMBUSH', 'RAID']

function relativeTime(timestamp) {
  const diff = Math.max(0, Date.now() - new Date(timestamp).getTime())
  if (diff < 1000) return 'NOW'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return `${Math.floor(diff / 86400000)}d`
}

function FeedEntry({ incident, onClick }) {
  const color = getEventColor(incident.type)
  const time = relativeTime(incident.timestamp)
  const forceColor = incident.force === 'allied' ? '#44CC44' : incident.force === 'hostile' ? '#FF4444' : '#666'

  return (
    <div className="war-feed-item" onClick={() => onClick?.(incident)}>
      <span className="war-feed-relative">{time}</span>
      <span className="war-feed-force-dot" style={{ backgroundColor: forceColor }} />
      <span className="war-feed-action" style={{ color }}>{incident.type}</span>
      <span className="war-feed-loc">{incident.location}</span>
    </div>
  )
}

export default function RightPanel({ feed, naval, conflicts = [], onIncidentClick, onShipClick, feedFilter, setFeedFilter }) {
  const feedRef = useRef(null)
  const [showFilters, setShowFilters] = useState(false)
  const [, setTick] = useState(0)

  // Refresh relative timestamps
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [feed.length])

  const activeFilterCount = [feedFilter?.type, feedFilter?.force].filter(Boolean).length

  const toggleTypeFilter = (type) => {
    setFeedFilter?.(prev => ({ ...prev, type: prev.type === type ? null : type }))
  }
  const toggleForceFilter = (force) => {
    setFeedFilter?.(prev => ({ ...prev, force: prev.force === force ? null : force }))
  }
  const clearFilters = () => {
    setFeedFilter?.({ type: null, force: null, conflictId: null })
  }

  // Naval grouped by theater
  const navalByTheater = useMemo(() => {
    const groups = {}
    naval.forEach(ship => {
      const theater = ship.theater || 'UNASSIGNED'
      if (!groups[theater]) groups[theater] = []
      groups[theater].push(ship)
    })
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
  }, [naval])

  return (
    <div className="war-panel-right">
      {/* Feed Header */}
      <div className="war-header">
        <div className="war-header-title">LIVE ENGAGEMENT FEED</div>
        <div className="war-header-actions">
          <span className="war-feed-live-dot" /> LIVE
          <button
            className={`feed-filter-toggle ${showFilters ? 'active' : ''} ${activeFilterCount > 0 ? 'has-filters' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            FILTER {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="feed-filter-bar">
          <div className="feed-filter-section">
            <div className="feed-filter-label">FORCE</div>
            <div className="feed-filter-btns">
              <button className={`feed-filter-btn allied ${feedFilter?.force === 'allied' ? 'active' : ''}`} onClick={() => toggleForceFilter('allied')}>ALLIED</button>
              <button className={`feed-filter-btn hostile ${feedFilter?.force === 'hostile' ? 'active' : ''}`} onClick={() => toggleForceFilter('hostile')}>HOSTILE</button>
            </div>
          </div>
          <div className="feed-filter-section">
            <div className="feed-filter-label">TYPE</div>
            <div className="feed-filter-btns">
              {FEED_TYPES.map(type => (
                <button
                  key={type}
                  className={`feed-filter-btn ${feedFilter?.type === type ? 'active' : ''}`}
                  style={feedFilter?.type === type ? { color: getEventColor(type), borderColor: getEventColor(type) + '88' } : {}}
                  onClick={() => toggleTypeFilter(type)}
                >{type}</button>
              ))}
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button className="feed-filter-clear" onClick={clearFilters}>CLEAR ALL</button>
          )}
        </div>
      )}

      {/* Feed */}
      <div className="war-feed-list" ref={feedRef}>
        {feed.slice(0, 50).map(incident => (
          <FeedEntry key={incident.id} incident={incident} onClick={onIncidentClick} />
        ))}
        {feed.length === 0 && <div className="war-feed-empty">NO EVENTS MATCH CURRENT FILTERS</div>}
      </div>

      {/* Fleet Command */}
      <div className="fleet-command">
        <div className="war-panel-title">FLEET COMMAND — {naval.length} VESSELS</div>
        {navalByTheater.map(([theater, ships]) => (
          <div key={theater} className="fleet-theater">
            <div className="fleet-theater-label">{theater.toUpperCase()}</div>
            {ships.slice(0, 5).map(ship => (
              <div key={ship.id} className="fleet-ship" onClick={() => onShipClick?.(ship)}>
                <span className={`fleet-ship-icon ${ship.force}`}>
                  {ship.type?.includes('Carrier') ? '◈' : ship.type?.includes('Submarine') ? '◇' : '◆'}
                </span>
                <div className="fleet-ship-info">
                  <span className="fleet-ship-name">{ship.name}</span>
                  <span className="fleet-ship-type">{ship.type || ship.class}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
