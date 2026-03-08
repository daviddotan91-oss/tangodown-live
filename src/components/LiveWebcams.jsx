import React, { useState, useMemo } from 'react'

const REGIONS = ['ALL', 'MIDDLE EAST', 'EUROPE', 'ASIA-PACIFIC', 'AMERICAS']

const WEBCAMS = [
  {
    id: 'jerusalem',
    name: 'Jerusalem — Old City',
    region: 'MIDDLE EAST',
    url: 'https://www.skylinewebcams.com/en/webcam/israel/jerusalem-district/jerusalem/western-wall.html',
    source: 'SkylineWebcams',
    description: 'Western Wall Plaza — 24/7 live',
    lat: 31.77, lng: 35.23
  },
  {
    id: 'tel-aviv',
    name: 'Tel Aviv — Skyline',
    region: 'MIDDLE EAST',
    url: 'https://www.skylinewebcams.com/en/webcam/israel/tel-aviv-district/tel-aviv.html',
    source: 'SkylineWebcams',
    description: 'Tel Aviv beachfront panorama',
    lat: 32.08, lng: 34.78
  },
  {
    id: 'haifa',
    name: 'Haifa — Port',
    region: 'MIDDLE EAST',
    url: 'https://www.skylinewebcams.com/en/webcam/israel/haifa-district/haifa.html',
    source: 'SkylineWebcams',
    description: 'Haifa Bay — Israel\'s northern port city',
    lat: 32.79, lng: 34.99
  },
  {
    id: 'dubai',
    name: 'Dubai — Burj Khalifa',
    region: 'MIDDLE EAST',
    url: 'https://www.earthcam.com/world/unitedarabemirates/dubai/?cam=dubaiburj',
    source: 'EarthCam',
    description: 'Burj Khalifa and Dubai skyline',
    lat: 25.20, lng: 55.27
  },
  {
    id: 'kyiv',
    name: 'Kyiv — Maidan',
    region: 'EUROPE',
    url: 'https://www.skylinewebcams.com/en/webcam/ukraine/kyiv-city/kyiv/maidan-nezalezhnosti.html',
    source: 'SkylineWebcams',
    description: 'Independence Square — Ukraine\'s capital',
    lat: 50.45, lng: 30.52
  },
  {
    id: 'london',
    name: 'London — Thames',
    region: 'EUROPE',
    url: 'https://www.earthcam.com/world/england/london/?cam=abbeyroad2',
    source: 'EarthCam',
    description: 'Abbey Road — iconic London landmark',
    lat: 51.50, lng: -0.12
  },
  {
    id: 'tokyo',
    name: 'Tokyo — Shibuya',
    region: 'ASIA-PACIFIC',
    url: 'https://www.skylinewebcams.com/en/webcam/japan/kanto/tokyo/shibuya-crossing.html',
    source: 'SkylineWebcams',
    description: 'Shibuya Crossing — world\'s busiest intersection',
    lat: 35.66, lng: 139.70
  },
  {
    id: 'seoul',
    name: 'Seoul — City View',
    region: 'ASIA-PACIFIC',
    url: 'https://www.skylinewebcams.com/en/webcam/south-korea/seoul/seoul.html',
    source: 'SkylineWebcams',
    description: 'South Korea\'s capital — city panorama',
    lat: 37.50, lng: 127.02
  },
  {
    id: 'taipei',
    name: 'Taipei — Skyline',
    region: 'ASIA-PACIFIC',
    url: 'https://www.skylinewebcams.com/en/webcam/taiwan/taipei-city/taipei.html',
    source: 'SkylineWebcams',
    description: 'Taiwan — Taipei 101 panorama',
    lat: 25.03, lng: 121.56
  },
  {
    id: 'newyork',
    name: 'New York — Times Square',
    region: 'AMERICAS',
    url: 'https://www.earthcam.com/usa/newyork/timessquare/?cam=tsrobo1',
    source: 'EarthCam',
    description: 'Times Square — 24/7 live from Manhattan',
    lat: 40.76, lng: -73.99
  },
  {
    id: 'dc',
    name: 'Washington DC — Capitol',
    region: 'AMERICAS',
    url: 'https://www.earthcam.com/usa/dc/capitol/?cam=capitol_702',
    source: 'EarthCam',
    description: 'U.S. Capitol Building — live feed',
    lat: 38.89, lng: -77.01
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    region: 'AMERICAS',
    url: 'https://www.pancanal.com/eng/photo/camera-702.html',
    source: 'Panama Canal Authority',
    description: 'Miraflores Locks — strategic chokepoint',
    lat: 9.02, lng: -79.59
  }
]

export default function LiveWebcams() {
  const [collapsed, setCollapsed] = useState(true)
  const [activeRegion, setActiveRegion] = useState('ALL')

  const filtered = useMemo(() => {
    if (activeRegion === 'ALL') return WEBCAMS
    return WEBCAMS.filter(w => w.region === activeRegion)
  }, [activeRegion])

  return (
    <div className={`livecams-panel ${collapsed ? 'livecams-collapsed' : ''}`}>
      {/* Header */}
      <div className="livecams-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="livecams-header-left">
          <span className="livecams-live-dot" />
          <span className="livecams-title">LIVE CAMS</span>
          <span className="livecams-count">{filtered.length}</span>
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

          {/* Cam Cards Grid */}
          <div className="livecams-grid">
            {filtered.map(cam => (
              <a
                key={cam.id}
                className="livecams-card"
                href={cam.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="livecams-card-top">
                  <span className="livecams-card-dot" />
                  <span className="livecams-card-name">{cam.name}</span>
                </div>
                <div className="livecams-card-desc">{cam.description}</div>
                <div className="livecams-card-bottom">
                  <span className="livecams-card-source">{cam.source}</span>
                  <span className="livecams-card-coords">
                    {cam.lat.toFixed(1)}N {cam.lng > 0 ? cam.lng.toFixed(1) + 'E' : Math.abs(cam.lng).toFixed(1) + 'W'}
                  </span>
                  <span className="livecams-card-watch">WATCH LIVE ↗</span>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      <style>{`
        .livecams-panel {
          position: fixed;
          bottom: 50px;
          left: 348px;
          width: 280px;
          max-height: 420px;
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
        .livecams-header:hover {
          background: var(--bg-hover);
        }
        .livecams-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .livecams-live-dot {
          width: 7px;
          height: 7px;
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
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--text-primary);
        }
        .livecams-count {
          font-family: var(--font-mono);
          font-size: 8px;
          color: var(--accent-gold);
          background: rgba(255, 184, 0, 0.1);
          border: 1px solid rgba(255, 184, 0, 0.2);
          padding: 1px 5px;
          border-radius: 8px;
        }
        .livecams-toggle {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 9px;
          cursor: pointer;
          padding: 2px 4px;
        }

        /* Region tabs */
        .livecams-regions {
          display: flex;
          gap: 2px;
          padding: 5px 6px;
          border-bottom: 1px solid var(--border-primary);
          overflow-x: auto;
        }
        .livecams-region-btn {
          padding: 2px 6px;
          background: none;
          border: 1px solid var(--border-primary);
          border-radius: 2px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 7px;
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
          display: flex;
          flex-direction: column;
          gap: 1px;
          max-height: 340px;
          overflow-y: auto;
          padding: 4px;
        }
        .livecams-grid::-webkit-scrollbar { width: 3px; }
        .livecams-grid::-webkit-scrollbar-thumb { background: var(--border-primary); border-radius: 2px; }

        .livecams-card {
          display: block;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: 3px;
          padding: 7px 9px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }
        .livecams-card:hover {
          border-color: #FF4444;
          box-shadow: 0 0 10px rgba(255, 68, 68, 0.12);
          background: rgba(255, 68, 68, 0.04);
        }
        .livecams-card:hover .livecams-card-watch {
          color: #FF4444;
          border-color: #FF4444;
          background: rgba(255, 68, 68, 0.12);
        }

        .livecams-card-top {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
        }
        .livecams-card-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #FF4444;
          box-shadow: 0 0 4px #FF4444;
          animation: livecams-pulse 1.5s ease-in-out infinite;
          flex-shrink: 0;
        }
        .livecams-card-name {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 0.5px;
        }
        .livecams-card-desc {
          font-family: var(--font-mono);
          font-size: 8px;
          color: var(--text-muted);
          letter-spacing: 0.3px;
          margin-bottom: 4px;
          padding-left: 11px;
        }
        .livecams-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding-left: 11px;
        }
        .livecams-card-source {
          font-family: var(--font-mono);
          font-size: 7px;
          color: var(--accent-gold);
          letter-spacing: 0.5px;
          opacity: 0.7;
        }
        .livecams-card-coords {
          font-family: var(--font-mono);
          font-size: 7px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
          opacity: 0.5;
        }
        .livecams-card-watch {
          font-family: var(--font-mono);
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--text-muted);
          border: 1px solid var(--border-primary);
          padding: 2px 6px;
          border-radius: 2px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        @media (max-width: 1200px) {
          .livecams-panel {
            left: 10px;
            bottom: 50px;
            width: 260px;
          }
        }
        @media (max-width: 900px) {
          .livecams-panel {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
