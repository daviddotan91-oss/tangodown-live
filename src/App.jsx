import React, { useState, useCallback, useMemo, useEffect } from 'react'
import Globe from './components/Globe'
import TopNav from './components/TopNav'
import BottomBar from './components/BottomBar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import NetworksView from './components/NetworksView'
import ReplayView from './components/ReplayView'
import IntelView from './components/IntelView'
import SearchOverlay from './components/SearchOverlay'
import { useConflictData } from './hooks/useConflictData'
import { useLiveFeed } from './hooks/useLiveFeed'

export default function App() {
  const { conflicts, incidents, naval, loading } = useConflictData()
  const { feed, getFilteredFeed } = useLiveFeed(conflicts, incidents)
  const [activeView, setActiveView] = useState('godseye')
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [selectedConflict, setSelectedConflict] = useState(null)
  const [flyToTarget, setFlyToTarget] = useState(null)
  const [feedFilter, setFeedFilter] = useState({ type: null, force: null, conflictId: null })
  const [panelsVisible, setPanelsVisible] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [organizations, setOrganizations] = useState([])
  const [leaders, setLeaders] = useState({ eliminated: [], active: [] })

  // Load organizations and leaders for search
  useEffect(() => {
    Promise.all([
      fetch('/data/organizations.json').then(r => r.json()),
      fetch('/data/leaders.json').then(r => r.json())
    ]).then(([orgs, ldrs]) => {
      setOrganizations(orgs)
      setLeaders(ldrs)
    }).catch(() => {})
  }, [])

  const filteredFeed = useMemo(() => {
    return getFilteredFeed(feedFilter)
  }, [getFilteredFeed, feedFilter])

  const handleIncidentClick = useCallback((incident) => {
    setSelectedIncident(incident)
  }, [])

  const handleConflictSelect = useCallback((conflict) => {
    setSelectedConflict(conflict)
    if (conflict?.center) {
      setFlyToTarget([...conflict.center])
    }
  }, [])

  const handleShipClick = useCallback((ship) => {
    if (ship?.lat && ship?.lng) {
      setFlyToTarget([ship.lat, ship.lng])
    }
  }, [])

  const handleIncidentFlyTo = useCallback((incident) => {
    setSelectedIncident(incident)
    if (incident?.lat && incident?.lng) {
      setFlyToTarget([incident.lat, incident.lng])
    }
  }, [])

  const handleTourZone = useCallback((zone) => {
    setSelectedConflict(zone)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
      switch (e.key) {
        case '/': e.preventDefault(); setSearchOpen(true); break
        case '?': setSearchOpen(true); break
        case 'Escape':
          setSelectedIncident(null)
          setSearchOpen(false)
          break
        default:
          switch (e.key.toLowerCase()) {
            case 'w': setActiveView('godseye'); break
            case 'n': setActiveView('networks'); break
            case 'r': setActiveView('replay'); break
            case 'i': setActiveView('intel'); break
            case 'f': setPanelsVisible(prev => !prev); break
          }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Calculate global stats
  const globalStats = useMemo(() => {
    const totalAircraft = conflicts.reduce((s, c) => s + (c.stats?.aircraftInTheater || 0), 0)
    return {
      incidents: feed.length,
      zones: conflicts.length,
      naval: naval.length,
      aircraft: totalAircraft > 1000 ? `${(totalAircraft / 1000).toFixed(1)}K` : totalAircraft,
      threatLevel: 'ELEVATED'
    }
  }, [conflicts, naval, feed.length])

  // All incidents for globe (initial + simulated)
  const allIncidents = useMemo(() => {
    return feed.slice(0, 100)
  }, [feed])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-brand">TANGODOWN<span>.LIVE</span></div>
        <div className="loading-subtitle">INITIALIZING BATTLESPACE</div>
        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
        <div className="loading-status">CONNECTING TO OSINT FEEDS...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <TopNav
        activeView={activeView}
        setActiveView={setActiveView}
        stats={globalStats}
      />

      <div className="main-content">
        {activeView === 'godseye' && (
          <>
            <Globe
              conflicts={conflicts}
              incidents={allIncidents}
              feed={feed}
              naval={naval}
              flyToTarget={flyToTarget}
              onIncidentClick={handleIncidentFlyTo}
              selectedIncident={selectedIncident}
              onTourZone={handleTourZone}
            />

            {panelsVisible && (
              <>
                <LeftPanel
                  conflicts={conflicts}
                  onConflictSelect={handleConflictSelect}
                  selectedConflict={selectedConflict}
                />
                <RightPanel
                  feed={filteredFeed}
                  naval={naval}
                  onIncidentClick={handleIncidentClick}
                  onShipClick={handleShipClick}
                  feedFilter={feedFilter}
                  setFeedFilter={setFeedFilter}
                />
              </>
            )}

            {/* Selected Incident Detail Overlay */}
            {selectedIncident && (
              <div className="incident-detail-overlay">
                <div className="incident-detail-card">
                  <button className="incident-close" onClick={() => setSelectedIncident(null)}>&#10005;</button>
                  <div className="incident-detail-type" style={{ color: getEventColorInline(selectedIncident.type) }}>
                    {selectedIncident.type}
                  </div>
                  <div className="incident-detail-location">{selectedIncident.location}</div>
                  <div className="incident-detail-time">
                    {new Date(selectedIncident.timestamp).toUTCString()}
                  </div>
                  <div className="incident-detail-desc">{selectedIncident.description}</div>
                  <div className="incident-detail-meta">
                    <span className={`incident-force ${selectedIncident.force}`}>
                      {selectedIncident.force?.toUpperCase()}
                    </span>
                    <span className="incident-source">{selectedIncident.source || 'OSINT'}</span>
                    {selectedIncident.simulated && <span className="incident-sim-badge">SIMULATED</span>}
                  </div>
                  <div className="incident-detail-coords">
                    {selectedIncident.lat?.toFixed(4)}N, {selectedIncident.lng?.toFixed(4)}E
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeView === 'networks' && (
          <NetworksView />
        )}

        {activeView === 'replay' && (
          <ReplayView
            conflicts={conflicts}
            incidents={incidents}
            naval={naval}
          />
        )}

        {activeView === 'intel' && (
          <IntelView
            conflicts={conflicts}
            incidents={incidents}
            naval={naval}
          />
        )}
      </div>

      <BottomBar stats={globalStats} />

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        conflicts={conflicts}
        organizations={organizations}
        leaders={leaders}
        onResult={(result) => {
          if (result.type === 'conflict' || result.type === 'front') {
            setActiveView('godseye')
          } else if (result.type === 'organization' || result.type.startsWith('leader')) {
            setActiveView('networks')
          }
        }}
      />

      {/* Disclaimer */}
      <div className="disclaimer-footer">
        TangoDown.live aggregates publicly available defense and intelligence information for educational and analytical purposes. All data is sourced from open-source intelligence. No classified material is used or presented. Engagement simulations are based on verified conflict patterns and do not represent real-time military communications.
      </div>
    </div>
  )
}

function getEventColorInline(type) {
  const colors = {
    'AIRSTRIKE': '#FF4444',
    'NAVAL ENGAGEMENT': '#00AAFF',
    'GROUND OP': '#FF6644',
    'SPECIAL OP': '#FFB800',
    'DRONE STRIKE': '#FF8800',
    'MISSILE LAUNCH': '#FF2244',
    'INTERCEPT': '#44CC44',
    'IED/AMBUSH': '#FF6644',
    'ASSASSINATION': '#FF4444',
    'RAID': '#FFB800'
  }
  return colors[type] || '#FF4444'
}
