import React, { useState } from 'react'
import InfoTooltip from './InfoTooltip'

const NEWS_SOURCES = [
  {
    id: 'aljazeera',
    name: 'AL JAZEERA',
    label: 'AJ',
    color: '#D4A843',
    channelUrl: 'https://www.youtube.com/@aboralibrohim/live',
    description: 'Al Jazeera English — 24/7 international news from Doha'
  },
  {
    id: 'skynews',
    name: 'SKY NEWS',
    label: 'SKY',
    color: '#E03C31',
    channelUrl: 'https://www.youtube.com/@SkyNews/live',
    description: 'Sky News — 24/7 UK & international breaking news'
  },
  {
    id: 'france24',
    name: 'FRANCE 24',
    label: 'F24',
    color: '#00A5E5',
    channelUrl: 'https://www.youtube.com/@FRANCE24English/live',
    description: 'France 24 English — International news from Paris'
  },
  {
    id: 'dw',
    name: 'DW NEWS',
    label: 'DW',
    color: '#0070B8',
    channelUrl: 'https://www.youtube.com/@daboradwari/live',
    description: 'Deutsche Welle — German international broadcaster'
  },
  {
    id: 'i24',
    name: 'i24NEWS',
    label: 'i24',
    color: '#FF6B35',
    channelUrl: 'https://www.youtube.com/@i24NEWSEnglish/live',
    description: 'i24NEWS English — Israeli international news channel'
  }
]

export default function LiveNewsPanel() {
  const [activeSource, setActiveSource] = useState(NEWS_SOURCES[0])
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className={`livenews-panel ${collapsed ? 'livenews-collapsed' : ''}`}>
      {/* Header */}
      <div className="livenews-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="livenews-header-left">
          <span className="livenews-live-dot" />
          <span className="livenews-title">LIVE NEWS</span>
          <InfoTooltip text="Live 24/7 news broadcast feeds from international outlets. Click to open live stream on YouTube." position="left" />
        </div>
        <button className="livenews-toggle">{collapsed ? '▶' : '▼'}</button>
      </div>

      {!collapsed && (
        <>
          {/* Source Tabs */}
          <div className="livenews-tabs">
            {NEWS_SOURCES.map(src => (
              <button
                key={src.id}
                className={`livenews-tab ${activeSource.id === src.id ? 'active' : ''}`}
                style={activeSource.id === src.id ? {
                  color: src.color,
                  borderBottomColor: src.color,
                  background: src.color + '10'
                } : {}}
                onClick={() => setActiveSource(src)}
              >
                {src.label}
              </button>
            ))}
          </div>

          {/* Watch Button */}
          <div className="livenews-body">
            <div className="livenews-source-header">
              <span className="livenews-live-badge">LIVE</span>
              <span className="livenews-source-name" style={{ color: activeSource.color }}>{activeSource.name}</span>
            </div>
            <div className="livenews-source-desc">{activeSource.description}</div>

            <a
              href={activeSource.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="livenews-watch-btn"
              style={{ '--news-color': activeSource.color }}
            >
              <span className="livenews-watch-icon">▶</span>
              WATCH LIVE ON YOUTUBE
            </a>

            <div className="livenews-all-sources">
              <span className="livenews-all-label">ALL SOURCES</span>
              {NEWS_SOURCES.map(src => (
                <a
                  key={src.id}
                  href={src.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="livenews-source-link"
                  style={{ color: src.color }}
                >
                  <span className="livenews-link-dot" style={{ background: src.color }} />
                  {src.name}
                  <span className="livenews-link-arrow">↗</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        .livenews-panel {
          position: absolute;
          bottom: 50px;
          right: 320px;
          width: 300px;
          background: rgba(10, 10, 15, 0.95);
          border: 1px solid var(--border-primary);
          border-radius: 4px;
          z-index: 30;
          backdrop-filter: blur(12px);
          overflow: hidden;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6);
          animation: livenews-fadein 0.3s ease;
        }
        .livenews-collapsed {
          width: auto;
          min-width: 140px;
        }
        @keyframes livenews-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .livenews-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-primary);
          background: rgba(15, 15, 24, 0.9);
        }
        .livenews-header:hover {
          background: var(--bg-hover);
        }
        .livenews-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .livenews-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #FF4444;
          box-shadow: 0 0 8px #FF4444;
          animation: livenews-pulse 1.5s ease-in-out infinite;
        }
        @keyframes livenews-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .livenews-title {
          font-family: 'Orbitron', var(--font-display);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--text-primary);
        }
        .livenews-toggle {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 10px;
          cursor: pointer;
          padding: 2px 4px;
        }

        .livenews-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-primary);
        }
        .livenews-tab {
          flex: 1;
          padding: 6px 4px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        .livenews-tab:hover {
          color: var(--text-secondary);
          background: var(--bg-hover);
        }
        .livenews-tab.active {
          border-bottom-width: 2px;
        }

        .livenews-body {
          padding: 12px;
        }
        .livenews-source-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .livenews-live-badge {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #FF4444;
          background: rgba(255, 68, 68, 0.12);
          border: 1px solid rgba(255, 68, 68, 0.3);
          padding: 2px 6px;
          border-radius: 2px;
          animation: livenews-pulse 1.5s ease-in-out infinite;
        }
        .livenews-source-name {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .livenews-source-desc {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .livenews-watch-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 10px 16px;
          background: color-mix(in srgb, var(--news-color, #FF4444) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--news-color, #FF4444) 40%, transparent);
          border-radius: 4px;
          color: var(--news-color, #FF4444);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
        }
        .livenews-watch-btn:hover {
          background: color-mix(in srgb, var(--news-color, #FF4444) 20%, transparent);
          box-shadow: 0 0 16px color-mix(in srgb, var(--news-color, #FF4444) 25%, transparent);
          transform: scale(1.01);
        }
        .livenews-watch-icon {
          font-size: 14px;
        }

        .livenews-all-sources {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid var(--border-primary);
        }
        .livenews-all-label {
          display: block;
          font-family: var(--font-mono);
          font-size: 8px;
          letter-spacing: 2px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .livenews-source-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 6px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-decoration: none;
          border-radius: 3px;
          transition: all 0.2s;
        }
        .livenews-source-link:hover {
          background: var(--bg-hover);
        }
        .livenews-link-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .livenews-link-arrow {
          margin-left: auto;
          opacity: 0.4;
          font-size: 11px;
        }
        .livenews-source-link:hover .livenews-link-arrow {
          opacity: 1;
        }

        @media (max-width: 1200px) {
          .livenews-panel {
            right: 10px;
            width: calc(100vw - 20px);
            max-width: 300px;
          }
        }
      `}</style>
    </div>
  )
}
