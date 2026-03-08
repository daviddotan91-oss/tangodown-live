import React, { useState, useEffect, useMemo } from 'react'
import InfoTooltip from './InfoTooltip'

const REGIONS = ['ALL', 'MIDDLE EAST', 'EUROPE', 'ASIA-PACIFIC', 'AMERICAS']

export default function LiveWebcams() {
  const [webcams, setWebcams] = useState([])
  const [collapsed, setCollapsed] = useState(false)
  const [activeRegion, setActiveRegion] = useState('ALL')
  const [expandedCam, setExpandedCam] = useState(null)

  useEffect(() => {
    fetch('/data/webcams.json')
      .then(r => r.json())
      .then(setWebcams)
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    if (activeRegion === 'ALL') return webcams
    return webcams.filter(w => w.region === activeRegion)
  }, [webcams, activeRegion])

  if (!webcams.length) return null

  const getEmbedUrl = (cam) => {
    if (cam.youtubeChannel) {
      return `https://www.youtube.com/embed/live_stream?channel=${cam.youtubeChannel}&autoplay=0&mute=1&modestbranding=1&rel=0`
    }
    return `https://www.youtube.com/embed/${cam.youtube}?autoplay=0&mute=1&modestbranding=1&rel=0`
  }

  return (
    <div className={`livecams-panel ${collapsed ? 'livecams-collapsed' : ''}`}>
      {/* Header */}
      <div className="livecams-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="livecams-header-left">
          <span className="livecams-live-dot" />
          <span className="livecams-title">LIVE CAMS</span>
          <span className="livecams-count">{filtered.length}</span>
          <InfoTooltip text="Live YouTube webcam feeds from conflict zones and strategic locations worldwide. Click any feed to expand." position="right" />
        </div>
        <button className="livecams-toggle">{collapsed ? '▶' : '▼'}</button>
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

          {/* Expanded single cam view */}
          {expandedCam && (
            <div className="livecams-expanded">
              <div className="livecams-expanded-header">
                <div className="livecams-expanded-info">
                  <span className="livecams-live-badge">LIVE</span>
                  <span className="livecams-expanded-name">{expandedCam.name}</span>
                  <span className="livecams-expanded-region">{expandedCam.region}</span>
                </div>
                <button className="livecams-expanded-close" onClick={() => setExpandedCam(null)}>✕ CLOSE</button>
              </div>
              <div className="livecams-expanded-video">
                <iframe
                  src={getEmbedUrl(expandedCam)}
                  title={expandedCam.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="livecams-expanded-desc">{expandedCam.description}</div>
              <div className="livecams-expanded-coords">
                {expandedCam.lat?.toFixed(2)}N, {expandedCam.lng?.toFixed(2)}E
              </div>
            </div>
          )}

          {/* 2x2 Grid */}
          {!expandedCam && (
            <div className="livecams-grid">
              {filtered.map(cam => (
                <div
                  key={cam.id}
                  className="livecams-card"
                  onClick={() => setExpandedCam(cam)}
                >
                  <div className="livecams-card-video">
                    <iframe
                      src={getEmbedUrl(cam)}
                      title={cam.name}
                      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                    <div className="livecams-card-overlay">
                      <span className="livecams-card-expand">EXPAND</span>
                    </div>
                  </div>
                  <div className="livecams-card-info">
                    <div className="livecams-card-top">
                      <span className="livecams-card-dot" />
                      <span className="livecams-card-name">{cam.name}</span>
                    </div>
                    <span className="livecams-card-region">{cam.region}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        .livecams-panel {
          position: absolute;
          bottom: 50px;
          left: 320px;
          width: 520px;
          max-height: 460px;
          background: rgba(10, 10, 15, 0.95);
          border: 1px solid var(--border-primary);
          border-radius: 4px;
          z-index: 30;
          backdrop-filter: blur(12px);
          overflow: hidden;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6);
          animation: livecams-fadein 0.3s ease;
        }
        .livecams-collapsed {
          max-height: 36px;
        }
        @keyframes livecams-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .livecams-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-primary);
          background: rgba(15, 15, 24, 0.9);
        }
        .livecams-header:hover {
          background: var(--bg-hover);
        }
        .livecams-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .livecams-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #FF4444;
          box-shadow: 0 0 8px #FF4444;
          animation: livecams-pulse 1.5s ease-in-out infinite;
        }
        @keyframes livecams-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .livecams-title {
          font-family: 'Orbitron', var(--font-display);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--text-primary);
        }
        .livecams-count {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--accent-gold);
          background: rgba(255, 184, 0, 0.1);
          border: 1px solid rgba(255, 184, 0, 0.2);
          padding: 1px 6px;
          border-radius: 8px;
        }
        .livecams-toggle {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 10px;
          cursor: pointer;
          padding: 2px 4px;
        }

        /* Region tabs */
        .livecams-regions {
          display: flex;
          gap: 2px;
          padding: 6px 8px;
          border-bottom: 1px solid var(--border-primary);
          overflow-x: auto;
        }
        .livecams-region-btn {
          padding: 3px 8px;
          background: none;
          border: 1px solid var(--border-primary);
          border-radius: 2px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 8px;
          letter-spacing: 1px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .livecams-region-btn:hover {
          color: var(--text-secondary);
          border-color: var(--text-muted);
        }
        .livecams-region-btn.active {
          color: #FF4444;
          border-color: #FF4444;
          background: rgba(255, 68, 68, 0.08);
        }

        /* Grid */
        .livecams-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          padding: 8px;
          max-height: 370px;
          overflow-y: auto;
        }
        .livecams-grid::-webkit-scrollbar { width: 3px; }
        .livecams-grid::-webkit-scrollbar-thumb { background: var(--border-primary); border-radius: 2px; }

        .livecams-card {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: 3px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }
        .livecams-card:hover {
          border-color: #FF4444;
          box-shadow: 0 0 12px rgba(255, 68, 68, 0.15);
        }
        .livecams-card:hover .livecams-card-overlay {
          opacity: 1;
        }

        .livecams-card-video {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          background: #000;
          overflow: hidden;
        }
        .livecams-card-video iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
          pointer-events: none;
        }
        .livecams-card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .livecams-card-expand {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 2px;
          color: #FF4444;
          border: 1px solid #FF4444;
          padding: 4px 12px;
          border-radius: 2px;
          background: rgba(255, 68, 68, 0.1);
        }

        .livecams-card-info {
          padding: 6px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .livecams-card-top {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .livecams-card-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #FF4444;
          box-shadow: 0 0 4px #FF4444;
          animation: livecams-pulse 1.5s ease-in-out infinite;
        }
        .livecams-card-name {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 0.5px;
        }
        .livecams-card-region {
          font-family: var(--font-mono);
          font-size: 7px;
          color: var(--text-muted);
          letter-spacing: 1px;
        }

        /* Expanded view */
        .livecams-expanded {
          padding: 8px;
        }
        .livecams-expanded-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .livecams-expanded-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .livecams-live-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #FF4444;
          background: rgba(255, 68, 68, 0.15);
          border: 1px solid rgba(255, 68, 68, 0.3);
          padding: 2px 8px;
          border-radius: 2px;
          animation: livecams-pulse 1.5s ease-in-out infinite;
        }
        .livecams-expanded-name {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 1px;
        }
        .livecams-expanded-region {
          font-family: var(--font-mono);
          font-size: 8px;
          color: var(--text-muted);
          letter-spacing: 1px;
        }
        .livecams-expanded-close {
          background: rgba(255, 68, 68, 0.08);
          border: 1px solid rgba(255, 68, 68, 0.2);
          border-radius: 2px;
          color: #FF4444;
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 1px;
          padding: 4px 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .livecams-expanded-close:hover {
          background: rgba(255, 68, 68, 0.15);
          border-color: #FF4444;
        }
        .livecams-expanded-video {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          background: #000;
          border-radius: 3px;
          overflow: hidden;
          border: 1px solid var(--border-primary);
        }
        .livecams-expanded-video iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
        .livecams-expanded-desc {
          margin-top: 6px;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }
        .livecams-expanded-coords {
          margin-top: 3px;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 1px;
        }

        @media (max-width: 1200px) {
          .livecams-panel {
            left: 10px;
            width: calc(100vw - 20px);
            max-width: 520px;
          }
        }
      `}</style>
    </div>
  )
}
