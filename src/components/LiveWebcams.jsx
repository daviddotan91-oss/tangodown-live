import React, { useState, useMemo } from 'react'

const REGIONS = ['ALL', 'MIDDLE EAST', 'EUROPE', 'ASIA-PACIFIC', 'AMERICAS']

const WEBCAMS = [
  {
    id: 'jerusalem',
    name: 'Jerusalem — Western Wall',
    region: 'MIDDLE EAST',
    channel: 'UC6qrG3W8SMK0jior2olka3g',
    videoId: '77akujLn4k8',
    description: 'Western Wall Plaza — 24/7 EarthCam',
    lat: 31.77, lng: 35.23
  },
  {
    id: 'jerusalem2',
    name: 'Jerusalem — Panorama',
    region: 'MIDDLE EAST',
    channel: 'UCvcdHbNAQvbe2GuIDLhlwaw',
    videoId: 'EGfiC6zIpEw',
    description: 'Old City & Temple Mount panoramic view',
    lat: 31.78, lng: 35.22
  },
  {
    id: 'israel-multi',
    name: 'Israel — Multi-Cam',
    region: 'MIDDLE EAST',
    channel: 'UC98W74iwmWXnOMHq0lYeDIw',
    videoId: 'gmtlJ_m2r5A',
    description: 'EarthLive.TV — rotating Middle East cameras',
    lat: 32.08, lng: 34.78
  },
  {
    id: 'dubai',
    name: 'Dubai — Intel Cams',
    region: 'MIDDLE EAST',
    channel: 'UCper-NWj8xdXacSpFtF4Mgg',
    videoId: '4E-iFtUM2kk',
    description: 'Dubai / Middle East OSINT camera feed',
    lat: 25.20, lng: 55.27
  },
  {
    id: 'kyiv',
    name: 'Kyiv — Ukraine',
    region: 'EUROPE',
    channel: 'UC98W74iwmWXnOMHq0lYeDIw',
    videoId: 'R-qCsZ1obbc',
    description: 'Source Global News — Ukraine live feed',
    lat: 50.45, lng: 30.52
  },
  {
    id: 'london',
    name: 'London — City View',
    region: 'EUROPE',
    channel: 'UCV95t9tjZ1Dx4kOcC-XUyCQ',
    videoId: 'WKGK_hYnlGE',
    description: 'Experiencing London — 24/7 skyline',
    lat: 51.50, lng: -0.12
  },
  {
    id: 'tokyo',
    name: 'Tokyo — Shibuya',
    region: 'ASIA-PACIFIC',
    channel: 'UCoQBJMzcwmXrRSHBFAlTsIw',
    videoId: 'dfVK7ld38Ys',
    description: 'FNN Prime — Shibuya crossing 24/7',
    lat: 35.66, lng: 139.70
  },
  {
    id: 'seoul',
    name: 'Seoul — Han River',
    region: 'ASIA-PACIFIC',
    channel: 'UCQKQTgZJo3PlxA-9V1Z51XA',
    videoId: '-JhoMGoAfFc',
    description: 'Daily Seoul — Banpo Bridge live cam',
    lat: 37.50, lng: 127.02
  },
  {
    id: 'newyork',
    name: 'New York — Times Square',
    region: 'AMERICAS',
    channel: 'UC6qrG3W8SMK0jior2olka3g',
    videoId: 'rnXIjl_Rzy4',
    description: 'EarthCam — Times Square 24/7',
    lat: 40.76, lng: -73.99
  },
  {
    id: 'newyork2',
    name: 'New York — FOX 5',
    region: 'AMERICAS',
    channel: 'UCIjSUWHWp6KohfnR5OQTXnQ',
    videoId: 'VGnFLdQW39A',
    description: 'FOX 5 NY — city skyline live cam',
    lat: 40.75, lng: -73.98
  }
]

function getEmbedUrl(cam) {
  return `https://www.youtube.com/embed/${cam.videoId}?autoplay=1&mute=1&modestbranding=1&rel=0&playsinline=1`
}

export default function LiveWebcams() {
  const [collapsed, setCollapsed] = useState(true)
  const [activeRegion, setActiveRegion] = useState('ALL')
  const [activeCam, setActiveCam] = useState(null)
  const [expanded, setExpanded] = useState(false)

  const filtered = useMemo(() => {
    if (activeRegion === 'ALL') return WEBCAMS
    return WEBCAMS.filter(w => w.region === activeRegion)
  }, [activeRegion])

  const handleCamClick = (cam) => {
    if (activeCam?.id === cam.id) {
      setActiveCam(null)
    } else {
      setActiveCam(cam)
      setExpanded(false)
    }
  }

  const handleExpand = (e) => {
    e.stopPropagation()
    setExpanded(true)
  }

  const handleCloseExpanded = () => {
    setExpanded(false)
  }

  const handleCloseAll = () => {
    setExpanded(false)
    setActiveCam(null)
  }

  return (
    <>
      {/* Expanded fullscreen overlay */}
      {expanded && activeCam && (
        <div className="livecams-fullscreen" onClick={handleCloseExpanded}>
          <div className="livecams-fullscreen-inner" onClick={e => e.stopPropagation()}>
            <div className="livecams-fullscreen-header">
              <div className="livecams-fullscreen-info">
                <span className="livecams-fs-dot" />
                <span className="livecams-fs-badge">LIVE</span>
                <span className="livecams-fs-name">{activeCam.name}</span>
                <span className="livecams-fs-region">{activeCam.region}</span>
              </div>
              <div className="livecams-fullscreen-actions">
                <span className="livecams-fs-coords">
                  {activeCam.lat.toFixed(2)}N, {activeCam.lng > 0 ? activeCam.lng.toFixed(2) + 'E' : Math.abs(activeCam.lng).toFixed(2) + 'W'}
                </span>
                <button className="livecams-fs-close" onClick={handleCloseExpanded}>MINIMIZE</button>
                <button className="livecams-fs-close livecams-fs-close-x" onClick={handleCloseAll}>✕</button>
              </div>
            </div>
            <div className="livecams-fullscreen-video">
              <iframe
                src={getEmbedUrl(activeCam)}
                title={activeCam.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="livecams-fullscreen-desc">{activeCam.description}</div>
          </div>
        </div>
      )}

      {/* Panel */}
      <div className={`livecams-panel ${collapsed ? 'livecams-collapsed' : ''}`}>
        {/* Header */}
        <div className="livecams-header" onClick={() => setCollapsed(!collapsed)}>
          <div className="livecams-header-left">
            <span className="livecams-live-dot" />
            <span className="livecams-title">LIVE CAMS</span>
            <span className="livecams-count">{WEBCAMS.length}</span>
          </div>
          <button className="livecams-toggle">{collapsed ? '◀' : '▼'}</button>
        </div>

        {!collapsed && (
          <>
            {/* Region Tabs */}
            <div className="livecams-regions">
              {REGIONS.map(r => (
                <button
                  key={r}
                  className={`livecams-region-btn ${activeRegion === r ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setActiveRegion(r) }}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Inline player for active cam (small) */}
            {activeCam && !expanded && (
              <div className="livecams-inline-player">
                <div className="livecams-inline-header">
                  <div className="livecams-inline-info">
                    <span className="livecams-card-dot" />
                    <span className="livecams-inline-name">{activeCam.name}</span>
                  </div>
                  <div className="livecams-inline-actions">
                    <button className="livecams-expand-btn" onClick={handleExpand}>EXPAND ⤢</button>
                    <button className="livecams-inline-close" onClick={handleCloseAll}>✕</button>
                  </div>
                </div>
                <div className="livecams-inline-video">
                  <iframe
                    src={getEmbedUrl(activeCam)}
                    title={activeCam.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Cam list */}
            <div className="livecams-grid">
              {filtered.map(cam => (
                <div
                  key={cam.id}
                  className={`livecams-card ${activeCam?.id === cam.id ? 'livecams-card-active' : ''}`}
                  onClick={() => handleCamClick(cam)}
                >
                  <div className="livecams-card-top">
                    <span className="livecams-card-dot" />
                    <span className="livecams-card-name">{cam.name}</span>
                  </div>
                  <div className="livecams-card-bottom">
                    <span className="livecams-card-desc">{cam.description}</span>
                    <span className="livecams-card-watch">
                      {activeCam?.id === cam.id ? 'VIEWING' : 'WATCH'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <style>{`
          .livecams-panel {
            position: fixed;
            bottom: 50px;
            left: 348px;
            width: 300px;
            max-height: 520px;
            background: rgba(10, 10, 15, 0.95);
            border: 1px solid var(--border-primary);
            border-radius: 4px;
            z-index: 91;
            backdrop-filter: blur(12px);
            overflow: hidden;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6);
            animation: livecams-fadein 0.3s ease;
          }
          .livecams-collapsed {
            max-height: 34px;
            width: auto;
            min-width: 160px;
          }
          @keyframes livecams-fadein {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .livecams-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 7px 10px;
            cursor: pointer;
            border-bottom: 1px solid var(--border-primary);
            background: rgba(15, 15, 24, 0.9);
          }
          .livecams-header:hover { background: var(--bg-hover); }
          .livecams-header-left {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .livecams-live-dot {
            width: 7px; height: 7px; border-radius: 50%;
            background: #FF4444; box-shadow: 0 0 8px #FF4444;
            animation: livecams-pulse 1.5s ease-in-out infinite;
          }
          @keyframes livecams-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .livecams-title {
            font-family: 'Orbitron', var(--font-display);
            font-size: 10px; font-weight: 700;
            letter-spacing: 2px; color: var(--text-primary);
          }
          .livecams-count {
            font-family: var(--font-mono); font-size: 8px;
            color: var(--accent-gold);
            background: rgba(255, 184, 0, 0.1);
            border: 1px solid rgba(255, 184, 0, 0.2);
            padding: 1px 5px; border-radius: 8px;
          }
          .livecams-toggle {
            background: none; border: none;
            color: var(--text-muted); font-size: 9px;
            cursor: pointer; padding: 2px 4px;
          }

          /* Region tabs */
          .livecams-regions {
            display: flex; gap: 2px;
            padding: 5px 6px;
            border-bottom: 1px solid var(--border-primary);
            overflow-x: auto;
          }
          .livecams-region-btn {
            padding: 2px 6px; background: none;
            border: 1px solid var(--border-primary);
            border-radius: 2px; color: var(--text-muted);
            font-family: var(--font-mono); font-size: 7px;
            letter-spacing: 1px; cursor: pointer;
            white-space: nowrap; transition: all 0.2s;
          }
          .livecams-region-btn:hover {
            color: var(--text-secondary);
            border-color: var(--text-muted);
          }
          .livecams-region-btn.active {
            color: #FF4444; border-color: #FF4444;
            background: rgba(255, 68, 68, 0.08);
          }

          /* Inline player (small, in-panel) */
          .livecams-inline-player {
            border-bottom: 1px solid var(--border-primary);
            background: rgba(0, 0, 0, 0.4);
          }
          .livecams-inline-header {
            display: flex; align-items: center;
            justify-content: space-between;
            padding: 5px 8px;
          }
          .livecams-inline-info {
            display: flex; align-items: center; gap: 6px;
          }
          .livecams-inline-name {
            font-family: var(--font-mono); font-size: 9px;
            font-weight: 700; color: var(--text-primary);
            letter-spacing: 0.5px;
          }
          .livecams-inline-actions {
            display: flex; align-items: center; gap: 4px;
          }
          .livecams-expand-btn {
            background: rgba(255, 68, 68, 0.08);
            border: 1px solid rgba(255, 68, 68, 0.25);
            border-radius: 2px; color: #FF4444;
            font-family: var(--font-mono); font-size: 8px;
            font-weight: 700; letter-spacing: 1px;
            padding: 3px 8px; cursor: pointer;
            transition: all 0.2s;
          }
          .livecams-expand-btn:hover {
            background: rgba(255, 68, 68, 0.15);
            border-color: #FF4444;
            box-shadow: 0 0 8px rgba(255, 68, 68, 0.2);
          }
          .livecams-inline-close {
            background: none; border: 1px solid var(--border-primary);
            border-radius: 2px; color: var(--text-muted);
            font-size: 10px; cursor: pointer;
            padding: 2px 6px; transition: all 0.2s;
          }
          .livecams-inline-close:hover {
            color: #FF4444; border-color: #FF4444;
          }
          .livecams-inline-video {
            position: relative; width: 100%;
            padding-bottom: 56.25%; background: #000;
          }
          .livecams-inline-video iframe {
            position: absolute; top: 0; left: 0;
            width: 100%; height: 100%; border: none;
          }

          /* Cam card list */
          .livecams-grid {
            display: flex; flex-direction: column;
            gap: 1px; max-height: 240px;
            overflow-y: auto; padding: 4px;
          }
          .livecams-grid::-webkit-scrollbar { width: 3px; }
          .livecams-grid::-webkit-scrollbar-thumb {
            background: var(--border-primary); border-radius: 2px;
          }

          .livecams-card {
            display: block; background: var(--bg-card);
            border: 1px solid var(--border-primary);
            border-radius: 3px; padding: 6px 8px;
            cursor: pointer; transition: all 0.2s;
          }
          .livecams-card:hover {
            border-color: rgba(255, 68, 68, 0.4);
            background: rgba(255, 68, 68, 0.03);
          }
          .livecams-card-active {
            border-color: #FF4444 !important;
            background: rgba(255, 68, 68, 0.06) !important;
            box-shadow: 0 0 8px rgba(255, 68, 68, 0.1);
          }
          .livecams-card:hover .livecams-card-watch {
            color: #FF4444; border-color: rgba(255, 68, 68, 0.4);
          }

          .livecams-card-top {
            display: flex; align-items: center;
            gap: 6px; margin-bottom: 2px;
          }
          .livecams-card-dot {
            width: 5px; height: 5px; border-radius: 50%;
            background: #FF4444; box-shadow: 0 0 4px #FF4444;
            animation: livecams-pulse 1.5s ease-in-out infinite;
            flex-shrink: 0;
          }
          .livecams-card-name {
            font-family: var(--font-mono); font-size: 9px;
            font-weight: 700; color: var(--text-primary);
            letter-spacing: 0.5px;
          }
          .livecams-card-bottom {
            display: flex; align-items: center;
            justify-content: space-between;
            padding-left: 11px;
          }
          .livecams-card-desc {
            font-family: var(--font-mono); font-size: 7px;
            color: var(--text-muted); letter-spacing: 0.3px;
          }
          .livecams-card-watch {
            font-family: var(--font-mono); font-size: 7px;
            font-weight: 700; letter-spacing: 1px;
            color: var(--text-muted);
            border: 1px solid var(--border-primary);
            padding: 1px 5px; border-radius: 2px;
            transition: all 0.2s; white-space: nowrap;
            flex-shrink: 0;
          }
          .livecams-card-active .livecams-card-watch {
            color: #FF4444; border-color: #FF4444;
            background: rgba(255, 68, 68, 0.1);
          }

          /* ===== Fullscreen expanded overlay ===== */
          .livecams-fullscreen {
            position: fixed; top: 0; left: 0;
            width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.85);
            z-index: 500;
            display: flex; align-items: center;
            justify-content: center;
            backdrop-filter: blur(8px);
            animation: livecams-fs-in 0.25s ease;
          }
          @keyframes livecams-fs-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .livecams-fullscreen-inner {
            width: 80vw; max-width: 1100px;
            background: rgba(10, 10, 15, 0.98);
            border: 1px solid #FF4444;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 0 60px rgba(255, 68, 68, 0.15),
                        0 0 120px rgba(0, 0, 0, 0.8);
          }
          .livecams-fullscreen-header {
            display: flex; align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            background: rgba(15, 15, 24, 0.95);
            border-bottom: 1px solid var(--border-primary);
          }
          .livecams-fullscreen-info {
            display: flex; align-items: center; gap: 10px;
          }
          .livecams-fs-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: #FF4444; box-shadow: 0 0 10px #FF4444;
            animation: livecams-pulse 1.5s ease-in-out infinite;
          }
          .livecams-fs-badge {
            font-family: var(--font-mono); font-size: 9px;
            font-weight: 700; letter-spacing: 1px;
            color: #FF4444;
            background: rgba(255, 68, 68, 0.12);
            border: 1px solid rgba(255, 68, 68, 0.3);
            padding: 2px 8px; border-radius: 2px;
            animation: livecams-pulse 1.5s ease-in-out infinite;
          }
          .livecams-fs-name {
            font-family: var(--font-display);
            font-size: 14px; font-weight: 700;
            color: var(--text-primary); letter-spacing: 1px;
          }
          .livecams-fs-region {
            font-family: var(--font-mono); font-size: 9px;
            color: var(--text-muted); letter-spacing: 1px;
          }
          .livecams-fullscreen-actions {
            display: flex; align-items: center; gap: 10px;
          }
          .livecams-fs-coords {
            font-family: var(--font-mono); font-size: 9px;
            color: var(--text-muted); letter-spacing: 1px;
          }
          .livecams-fs-close {
            background: rgba(255, 68, 68, 0.08);
            border: 1px solid rgba(255, 68, 68, 0.25);
            border-radius: 3px; color: #FF4444;
            font-family: var(--font-mono); font-size: 9px;
            font-weight: 700; letter-spacing: 1px;
            padding: 5px 12px; cursor: pointer;
            transition: all 0.2s;
          }
          .livecams-fs-close:hover {
            background: rgba(255, 68, 68, 0.15);
            border-color: #FF4444;
            box-shadow: 0 0 10px rgba(255, 68, 68, 0.2);
          }
          .livecams-fs-close-x {
            font-size: 14px; padding: 3px 10px;
          }
          .livecams-fullscreen-video {
            position: relative; width: 100%;
            padding-bottom: 56.25%; background: #000;
          }
          .livecams-fullscreen-video iframe {
            position: absolute; top: 0; left: 0;
            width: 100%; height: 100%; border: none;
          }
          .livecams-fullscreen-desc {
            padding: 8px 16px;
            font-family: var(--font-mono); font-size: 10px;
            color: var(--text-muted); letter-spacing: 0.5px;
            border-top: 1px solid var(--border-primary);
            background: rgba(15, 15, 24, 0.9);
          }

          @media (max-width: 1200px) {
            .livecams-panel {
              left: 10px; bottom: 50px; width: 270px;
            }
            .livecams-fullscreen-inner {
              width: 94vw;
            }
          }
          @media (max-width: 900px) {
            .livecams-panel { display: none; }
            .livecams-fullscreen-inner { width: 98vw; }
          }
        `}</style>
      </div>
    </>
  )
}
