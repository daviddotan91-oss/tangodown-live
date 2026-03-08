import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Globe from './components/Globe'
import TopNav from './components/TopNav'
import BottomBar from './components/BottomBar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import NetworksView from './components/NetworksView'
import ReplayView from './components/ReplayView'
import IntelView from './components/IntelView'
import SearchOverlay from './components/SearchOverlay'
import ArsenalView from './components/ArsenalView'
import BroadcastView from './components/BroadcastView'
import BootSequence from './components/BootSequence'
import { HeadlineTicker, XFeedPanel } from './components/IntelFeed'
import { useConflictData } from './hooks/useConflictData'
import { useLiveFeed } from './hooks/useLiveFeed'
import { initAudio, playClick, playTabSwitch, playGlitch, playFlashTraffic, playImpact, toggleMute, isMuted, startAmbient } from './utils/soundManager'

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
  const [networks, setNetworks] = useState({ connections: [], clusters: [] })
  const [arsenal, setArsenal] = useState({ airDefense: [], uas: [], platforms: [], defenseTech: [] })
  const [broadcast, setBroadcast] = useState({ countries: [] })
  const [headlinesData, setHeadlinesData] = useState({ headlines: [], sources: {}, xAccounts: [] })
  const [xFeedOpen, setXFeedOpen] = useState(false)

  // Boot sequence state
  const [bootComplete, setBootComplete] = useState(false)
  const [audioInitialized, setAudioInitialized] = useState(false)

  // CRT Glitch transition state
  const [glitching, setGlitching] = useState(false)
  const prevViewRef = useRef('godseye')

  // Sound-enabled mute state (for UI button)
  const [soundMuted, setSoundMuted] = useState(false)

  // Initialize audio on first user interaction
  useEffect(() => {
    const initOnInteraction = () => {
      if (!audioInitialized) {
        initAudio()
        setAudioInitialized(true)
      }
    }
    window.addEventListener('click', initOnInteraction, { once: true })
    window.addEventListener('keydown', initOnInteraction, { once: true })
    return () => {
      window.removeEventListener('click', initOnInteraction)
      window.removeEventListener('keydown', initOnInteraction)
    }
  }, [audioInitialized])

  // View switch with CRT glitch
  const switchView = useCallback((newView) => {
    if (newView === activeView) return
    playGlitch()
    setGlitching(true)
    prevViewRef.current = activeView
    setTimeout(() => {
      setActiveView(newView)
      setTimeout(() => setGlitching(false), 100)
    }, 80)
  }, [activeView])

  // Load organizations, leaders, networks, and headlines
  useEffect(() => {
    Promise.all([
      fetch('/data/organizations.json').then(r => r.json()),
      fetch('/data/leaders.json').then(r => r.json()),
      fetch('/data/networks.json').then(r => r.json()),
      fetch('/data/arsenal.json').then(r => r.json()),
      fetch('/data/broadcast.json').then(r => r.json()),
      fetch('/data/headlines.json').then(r => r.json())
    ]).then(([orgs, ldrs, nets, ars, bcast, hdl]) => {
      setOrganizations(orgs)
      setLeaders(ldrs)
      setNetworks(nets)
      setArsenal(ars)
      setBroadcast(bcast)
      setHeadlinesData(hdl)
    }).catch(() => {})
  }, [])

  const filteredFeed = useMemo(() => {
    return getFilteredFeed(feedFilter)
  }, [getFilteredFeed, feedFilter])

  const handleIncidentClick = useCallback((incident) => {
    setSelectedIncident(incident)
    playClick()
  }, [])

  const handleConflictSelect = useCallback((conflict) => {
    setSelectedConflict(conflict)
    playClick()
    if (conflict?.center) {
      setFlyToTarget([...conflict.center])
    }
  }, [])

  const handleShipClick = useCallback((ship) => {
    playClick()
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
        case 'm':
        case 'M':
          setSoundMuted(toggleMute())
          break
        case 'x':
        case 'X':
          setXFeedOpen(prev => !prev)
          break
        default:
          switch (e.key.toLowerCase()) {
            case 'w': switchView('godseye'); break
            case 'n': switchView('networks'); break
            case 'r': switchView('replay'); break
            case 'i': switchView('intel'); break
            case 'a': switchView('arsenal'); break
            case 'b': switchView('broadcast'); break
            case 'f': setPanelsVisible(prev => !prev); break
          }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [switchView])

  // Calculate global stats
  const globalStats = useMemo(() => {
    const totalAircraft = conflicts.reduce((s, c) => s + (c.stats?.aircraftInTheater || 0), 0)
    const totalUAS = conflicts.reduce((s, c) => s + (c.stats?.uasInTheater || 0), 0)
    const totalPersonnel = conflicts.reduce((s, c) => s + (c.stats?.activePersonnel || 0), 0)
    const totalFronts = conflicts.reduce((s, c) => s + (c.fronts?.length || 0), 0)
    const criticalCount = conflicts.filter(c => c.intensity === 'CRITICAL').length
    const highCount = conflicts.filter(c => c.intensity === 'HIGH').length
    const defcon = criticalCount >= 3 ? 1 : criticalCount >= 2 ? 2 : criticalCount >= 1 ? 3 : highCount >= 2 ? 4 : 5
    return {
      incidents: feed.length,
      zones: conflicts.length,
      naval: naval.length,
      aircraft: totalAircraft,
      uas: totalUAS,
      personnel: totalPersonnel,
      fronts: totalFronts,
      defcon
    }
  }, [conflicts, naval, feed.length])

  // All incidents for globe (initial + simulated)
  const allIncidents = useMemo(() => {
    return feed.slice(0, 100)
  }, [feed])

  // Flash Traffic alert system — dramatic alerts for major simulated events
  const [flashTraffic, setFlashTraffic] = useState(null)
  const [flashBorderPulse, setFlashBorderPulse] = useState(false)
  const flashTimerRef = useRef(null)
  const lastFlashRef = useRef(0)

  useEffect(() => {
    const FLASH_TYPES = ['AIRSTRIKE', 'MISSILE LAUNCH', 'DRONE STRIKE', 'ASSASSINATION', 'SPECIAL OP']
    const interval = setInterval(() => {
      if (Date.now() - lastFlashRef.current < 40000) return // min 40s between flashes
      // Pick a recent high-impact incident
      const candidate = feed.find(inc =>
        FLASH_TYPES.includes(inc.type) &&
        inc.simulated &&
        Date.now() - new Date(inc.timestamp).getTime() < 15000
      )
      if (candidate) {
        lastFlashRef.current = Date.now()
        setFlashTraffic(candidate)
        playFlashTraffic()
        // Red border pulse on entire viewport
        setFlashBorderPulse(true)
        setTimeout(() => setFlashBorderPulse(false), 1500)
        // Auto-fly to location
        if (activeView === 'godseye' && candidate.lat && candidate.lng) {
          setFlyToTarget([candidate.lat, candidate.lng])
        }
        clearTimeout(flashTimerRef.current)
        flashTimerRef.current = setTimeout(() => setFlashTraffic(null), 8000)
      }
    }, 5000)
    return () => { clearInterval(interval); clearTimeout(flashTimerRef.current) }
  }, [feed, activeView])

  const handleFlashClick = useCallback(() => {
    if (!flashTraffic) return
    switchView('godseye')
    handleIncidentFlyTo(flashTraffic)
    setFlashTraffic(null)
  }, [flashTraffic, handleIncidentFlyTo, switchView])

  const handleBootComplete = useCallback(() => {
    setBootComplete(true)
    startAmbient()
  }, [])

  // Single cinematic boot sequence — covers BOTH loading and intro
  if (!bootComplete) {
    return <BootSequence onComplete={handleBootComplete} dataReady={!loading} />
  }

  return (
    <div className={`app ${glitching ? 'crt-glitch' : ''} ${flashBorderPulse ? 'flash-screen-shake' : ''}`}>
      {/* Global CRT Scanlines */}
      <div className="global-scanlines" />

      {/* Flash Traffic Red Border Pulse */}
      {flashBorderPulse && <div className="flash-border-pulse" />}

      {/* Mute indicator */}
      <button className="sound-toggle" onClick={() => setSoundMuted(toggleMute())} title="Toggle Sound (M)">
        {soundMuted ? '🔇' : '🔊'}
      </button>

      <TopNav
        activeView={activeView}
        setActiveView={switchView}
        stats={globalStats}
      />

      {/* Headline Ticker Bar */}
      {activeView === 'godseye' && (
        <HeadlineTicker
          headlines={headlinesData.headlines || []}
          sources={headlinesData.sources || {}}
        />
      )}

      {/* X Intel Feed Toggle Button */}
      {activeView === 'godseye' && (
        <button
          className={`xfeed-toggle-btn ${xFeedOpen ? 'active' : ''}`}
          onClick={() => { setXFeedOpen(prev => !prev); playClick() }}
          title="Toggle X Intel Feed (X)"
        >
          <span className="xfeed-toggle-x">𝕏</span>
          INTEL
        </button>
      )}

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
                  feed={feed}
                  leaders={leaders}
                  organizations={organizations}
                  networks={networks}
                />
                <RightPanel
                  feed={filteredFeed}
                  naval={naval}
                  conflicts={conflicts}
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

        {activeView === 'arsenal' && (
          <ArsenalView arsenal={arsenal} />
        )}

        {activeView === 'broadcast' && (
          <BroadcastView broadcast={broadcast} />
        )}
      </div>

      <BottomBar stats={globalStats} conflicts={conflicts} leaders={leaders} naval={naval} />

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        conflicts={conflicts}
        organizations={organizations}
        leaders={leaders}
        arsenal={arsenal}
        naval={naval}
        onResult={(result) => {
          if (result.type === 'conflict' || result.type === 'front') {
            switchView('godseye')
            if (result.data?.center) setFlyToTarget([...result.data.center])
            else if (result.data?.conflict?.center) setFlyToTarget([...result.data.conflict.center])
          } else if (result.type === 'organization' || result.type.startsWith('leader')) {
            switchView('networks')
          } else if (result.type === 'arsenal') {
            switchView('arsenal')
          } else if (result.type === 'naval') {
            switchView('godseye')
            if (result.data?.lat && result.data?.lng) setFlyToTarget([result.data.lat, result.data.lng])
          }
        }}
      />

      {/* Flash Traffic Alert — Full Width Dramatic */}
      {flashTraffic && (
        <>
          {/* Center screen flash text */}
          <div className="flash-traffic-center" onClick={handleFlashClick}>
            <div className="flash-traffic-center-label">FLASH TRAFFIC</div>
            <div className="flash-traffic-center-type" style={{ color: getEventColorInline(flashTraffic.type) }}>
              {flashTraffic.type}
            </div>
            <div className="flash-traffic-center-loc">{flashTraffic.location}</div>
          </div>
          {/* Bottom detail card */}
          <div className="flash-traffic" onClick={handleFlashClick}>
            <div className="flash-traffic-inner">
              <div className="flash-traffic-label">
                <span className="flash-traffic-icon" />
                FLASH TRAFFIC
              </div>
              <div className="flash-traffic-type" style={{ color: getEventColorInline(flashTraffic.type) }}>
                {flashTraffic.type}
              </div>
              <div className="flash-traffic-location">{flashTraffic.location}</div>
              <div className="flash-traffic-desc">{flashTraffic.description}</div>
              <div className="flash-traffic-action">CLICK TO LOCATE</div>
            </div>
          </div>
        </>
      )}

      {/* X Intel Feed Panel */}
      <XFeedPanel
        isOpen={xFeedOpen}
        onClose={() => setXFeedOpen(false)}
        xAccounts={headlinesData.xAccounts || []}
        headlines={headlinesData.headlines || []}
        sources={headlinesData.sources || {}}
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
