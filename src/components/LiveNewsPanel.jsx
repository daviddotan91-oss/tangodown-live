import React, { useState } from 'react'
import InfoTooltip from './InfoTooltip'

const NEWS_SOURCES = [
  {
    id: 'aljazeera',
    name: 'AL JAZEERA',
    label: 'AJ',
    color: '#D4A843',
    channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg',
    description: 'Al Jazeera English — 24/7 international news from Doha'
  },
  {
    id: 'skynews',
    name: 'SKY NEWS',
    label: 'SKY',
    color: '#E03C31',
    channelId: 'UCoMdktPbSTixAyNGwb-UYkQ',
    description: 'Sky News — 24/7 UK & international breaking news'
  },
  {
    id: 'france24',
    name: 'FRANCE 24',
    label: 'F24',
    color: '#00A5E5',
    channelId: 'UCQfwfsi5VrQ8yKZ-UWmAEFg',
    description: 'France 24 English — International news from Paris'
  },
  {
    id: 'dw',
    name: 'DW NEWS',
    label: 'DW',
    color: '#0070B8',
    channelId: 'UCknLrEdhRCp1aegoMqRaCZg',
    description: 'Deutsche Welle — German international broadcaster'
  },
  {
    id: 'i24',
    name: 'i24NEWS',
    label: 'i24',
    color: '#FF6B35',
    channelId: 'UCVNLAerX8MdR7CXpBqrifAg',
    description: 'i24NEWS English — Israeli international news channel'
  }
]

export default function LiveNewsPanel() {
  const [activeSource, setActiveSource] = useState(NEWS_SOURCES[0])
  const [collapsed, setCollapsed] = useState(true)

  const embedUrl = `https://www.youtube.com/embed/live_stream?channel=${activeSource.channelId}&autoplay=0&mute=1&modestbranding=1&rel=0`

  return (
    <div className={`livenews-panel ${collapsed ? 'livenews-collapsed' : ''}`}>
      {/* Header */}
      <div className="livenews-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="livenews-header-left">
          <span className="livenews-live-dot" />
          <span className="livenews-title">LIVE NEWS</span>
          <InfoTooltip text="Live 24/7 news broadcast feeds from international outlets. Switch between sources using the tabs below." position="left" />
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

          {/* Video */}
          <div className="livenews-video">
            <iframe
              key={activeSource.id}
              src={embedUrl}
              title={activeSource.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Info */}
          <div className="livenews-info">
            <span className="livenews-source-name" style={{ color: activeSource.color }}>{activeSource.name}</span>
            <span className="livenews-source-desc">{activeSource.description}</span>
          </div>
        </>
      )}

      <style>{`
        .livenews-panel {
          position: absolute;
          bottom: 50px;
          right: 320px;
          width: 380px;
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

        .livenews-video {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          background: #000;
        }
        .livenews-video iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .livenews-info {
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .livenews-source-name {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .livenews-source-desc {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }

        @media (max-width: 1200px) {
          .livenews-panel {
            right: 10px;
            width: calc(100vw - 20px);
            max-width: 380px;
          }
        }
      `}</style>
    </div>
  )
}
