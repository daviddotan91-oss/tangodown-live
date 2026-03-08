import React, { useState, useMemo, useCallback } from 'react'
import InfoTooltip from './InfoTooltip'

/* ═══════════════════════════════════════════════════════
   HEADLINE TICKER — scrolling news bar below TopNav
   ═══════════════════════════════════════════════════════ */
export function HeadlineTicker({ headlines = [], sources = {} }) {
  if (!headlines.length) return null

  const priorityColor = (p) => {
    switch (p) {
      case 'CRITICAL': return '#FF4444'
      case 'HIGH': return '#FF8800'
      default: return '#FFB800'
    }
  }

  // Triple for seamless loop
  const items = [...headlines, ...headlines, ...headlines]

  return (
    <div className="headline-ticker">
      <div className="headline-ticker-label">
        <span className="headline-ticker-dot" />
        BREAKING
      </div>
      <div className="headline-ticker-track">
        <div className="headline-ticker-scroll">
          {items.map((h, i) => {
            const src = sources[h.source]
            return (
              <span key={`${h.id}-${i}`} className="headline-ticker-item">
                <span className="headline-ticker-priority" style={{ color: priorityColor(h.priority) }}>
                  {h.priority === 'CRITICAL' ? '!!' : '!'}
                </span>
                {src && <span className="headline-ticker-source">{src.name}</span>}
                <span className="headline-ticker-text">{h.text}</span>
                <span className="headline-ticker-sep">///</span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   X INTEL PANEL — headlines + X account cards
   Native styled, no external Twitter dependency
   ═══════════════════════════════════════════════════════ */

const CATEGORY_ORDER = ['ISRAEL', 'USA', 'NEWS']
const CATEGORY_LABELS = { ISRAEL: 'ISRAEL', USA: 'UNITED STATES', NEWS: 'NEWS & COMMENTARY' }
const CATEGORY_COLORS = { ISRAEL: '#0066CC', USA: '#FF4444', NEWS: '#FFB800' }
const CATEGORY_ICONS = { ISRAEL: '🇮🇱', USA: '🇺🇸', NEWS: '📡' }

export function XFeedPanel({ isOpen, onClose, xAccounts = [], headlines = [], sources = {} }) {
  const [activeCategory, setActiveCategory] = useState('ISRAEL')

  // Deduplicated accounts by category
  const accountsByCategory = useMemo(() => {
    const groups = {}
    const seen = {}
    xAccounts.forEach(acc => {
      const cat = acc.category || 'NEWS'
      if (!groups[cat]) groups[cat] = []
      const key = `${cat}-${acc.handle}`
      if (!seen[key]) {
        seen[key] = true
        groups[cat].push(acc)
      }
    })
    return groups
  }, [xAccounts])

  const currentAccounts = accountsByCategory[activeCategory] || []

  const handleCategoryChange = useCallback((cat) => {
    setActiveCategory(cat)
  }, [])

  // Headlines for current category
  const categoryHeadlines = useMemo(() => {
    return headlines.filter(h => h.category === activeCategory)
  }, [headlines, activeCategory])

  // All headlines for "all" view
  const allHeadlines = useMemo(() => {
    return [...headlines].sort((a, b) => {
      const p = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 }
      return (p[a.priority] || 3) - (p[b.priority] || 3)
    })
  }, [headlines])

  if (!isOpen) return null

  return (
    <div className="xfeed-panel">
      {/* Header */}
      <div className="xfeed-header">
        <div className="xfeed-title">
          <span className="xfeed-x-logo">𝕏</span>
          INTEL FEED<InfoTooltip text="Curated headlines from verified defense and intelligence sources, plus 𝕏 accounts tracking conflicts in real-time." position="left" />
        </div>
        <div className="xfeed-header-actions">
          <kbd className="xfeed-hotkey">X</kbd>
          <button className="xfeed-close" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="xfeed-categories">
        {CATEGORY_ORDER.map(cat => (
          <button
            key={cat}
            className={`xfeed-cat-btn ${activeCategory === cat ? 'active' : ''}`}
            style={activeCategory === cat ? { color: CATEGORY_COLORS[cat], borderBottomColor: CATEGORY_COLORS[cat] } : {}}
            onClick={() => handleCategoryChange(cat)}
          >
            <span className="xfeed-cat-icon">{CATEGORY_ICONS[cat]}</span>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="xfeed-scroll-area">
        {/* Headlines Section */}
        <div className="xfeed-headlines">
          <div className="xfeed-section-label">
            TOP HEADLINES
            <span className="xfeed-section-count">{categoryHeadlines.length}</span>
          </div>
          {categoryHeadlines.map(h => {
            const src = sources[h.source]
            return (
              <div key={h.id} className={`xfeed-headline-row xfeed-priority-${h.priority?.toLowerCase()}`}>
                <span className="xfeed-headline-dot" style={{
                  backgroundColor: h.priority === 'CRITICAL' ? '#FF4444' : h.priority === 'HIGH' ? '#FF8800' : '#FFB800'
                }} />
                <div className="xfeed-headline-content">
                  <div className="xfeed-headline-top">
                    {src && <span className="xfeed-headline-source">{src.name}</span>}
                    <span className="xfeed-headline-priority-badge" style={{
                      color: h.priority === 'CRITICAL' ? '#FF4444' : h.priority === 'HIGH' ? '#FF8800' : '#FFB800',
                      borderColor: h.priority === 'CRITICAL' ? '#FF444444' : h.priority === 'HIGH' ? '#FF880044' : '#FFB80044'
                    }}>{h.priority}</span>
                  </div>
                  <span className="xfeed-headline-text">{h.text}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* X Accounts Section */}
        <div className="xfeed-accounts">
          <div className="xfeed-section-label">
            𝕏 ACCOUNTS — {CATEGORY_LABELS[activeCategory]}
            <span className="xfeed-section-count">{currentAccounts.length}</span>
          </div>
          <div className="xfeed-account-list">
            {currentAccounts.map(acc => (
              <a
                key={acc.handle}
                href={`https://x.com/${acc.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="xfeed-account-card"
              >
                <div className="xfeed-account-avatar">
                  {acc.name.charAt(0)}
                </div>
                <div className="xfeed-account-info">
                  <div className="xfeed-account-name">{acc.name}</div>
                  <div className="xfeed-account-handle-text">@{acc.handle}</div>
                  {acc.desc && <div className="xfeed-account-desc">{acc.desc}</div>}
                </div>
                <div className="xfeed-account-arrow">↗</div>
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="xfeed-quicklinks">
          <div className="xfeed-section-label">QUICK LINKS</div>
          <div className="xfeed-link-grid">
            <a href="https://x.com/search?q=Israel%20IDF&src=typed_query&f=live" target="_blank" rel="noopener noreferrer" className="xfeed-quick-link">
              <span className="xfeed-link-icon">🔍</span>
              IDF Live Search
            </a>
            <a href="https://x.com/search?q=%22Iron%20Dome%22%20OR%20%22Iron%20Swords%22&src=typed_query&f=live" target="_blank" rel="noopener noreferrer" className="xfeed-quick-link">
              <span className="xfeed-link-icon">🛡</span>
              Iron Dome / Swords
            </a>
            <a href="https://x.com/search?q=Trump%20military%20OR%20defense&src=typed_query&f=live" target="_blank" rel="noopener noreferrer" className="xfeed-quick-link">
              <span className="xfeed-link-icon">🇺🇸</span>
              Trump Defense
            </a>
            <a href="https://x.com/search?q=OSINT%20strike%20OR%20airstrike&src=typed_query&f=live" target="_blank" rel="noopener noreferrer" className="xfeed-quick-link">
              <span className="xfeed-link-icon">📡</span>
              OSINT Strikes
            </a>
            <a href="https://x.com/search?q=Houthi%20OR%20%22Red%20Sea%22%20attack&src=typed_query&f=live" target="_blank" rel="noopener noreferrer" className="xfeed-quick-link">
              <span className="xfeed-link-icon">🚢</span>
              Red Sea / Houthis
            </a>
            <a href="https://x.com/search?q=Ukraine%20frontline%20OR%20Bakhmut&src=typed_query&f=live" target="_blank" rel="noopener noreferrer" className="xfeed-quick-link">
              <span className="xfeed-link-icon">⚔</span>
              Ukraine Front
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
