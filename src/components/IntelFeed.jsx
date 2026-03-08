import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'

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

  // Double the headlines for seamless scroll loop
  const items = [...headlines, ...headlines]

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
   X INTEL PANEL — embedded X/Twitter feeds
   ═══════════════════════════════════════════════════════ */

const CATEGORY_ORDER = ['ISRAEL', 'USA', 'NEWS']
const CATEGORY_LABELS = { ISRAEL: 'ISRAEL', USA: 'UNITED STATES', NEWS: 'NEWS & COMMENTARY' }
const CATEGORY_COLORS = { ISRAEL: '#0066CC', USA: '#FF4444', NEWS: '#FFB800' }

export function XFeedPanel({ isOpen, onClose, xAccounts = [], headlines = [], sources = {} }) {
  const [activeCategory, setActiveCategory] = useState('ISRAEL')
  const [selectedAccount, setSelectedAccount] = useState(null)
  const embedRef = useRef(null)

  // Filter accounts by category, deduplicate by handle
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

  // Load Twitter widget script
  useEffect(() => {
    if (!isOpen) return
    if (!document.getElementById('twitter-wjs')) {
      const script = document.createElement('script')
      script.id = 'twitter-wjs'
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      document.head.appendChild(script)
    }
  }, [isOpen])

  // Render selected account's timeline
  useEffect(() => {
    if (!selectedAccount || !embedRef.current || !isOpen) return
    embedRef.current.innerHTML = ''
    if (window.twttr?.widgets) {
      window.twttr.widgets.createTimeline(
        { sourceType: 'profile', screenName: selectedAccount.handle },
        embedRef.current,
        {
          theme: 'dark',
          chrome: 'noheader nofooter noborders transparent',
          width: '100%',
          height: 500,
          tweetLimit: 10
        }
      )
    } else {
      // Fallback: create an anchor that Twitter JS will pick up
      const a = document.createElement('a')
      a.className = 'twitter-timeline'
      a.setAttribute('data-theme', 'dark')
      a.setAttribute('data-chrome', 'noheader nofooter noborders transparent')
      a.setAttribute('data-tweet-limit', '10')
      a.href = `https://x.com/${selectedAccount.handle}`
      a.textContent = `Posts by @${selectedAccount.handle}`
      embedRef.current.appendChild(a)
      // Retry when script loads
      const check = setInterval(() => {
        if (window.twttr?.widgets) {
          window.twttr.widgets.load(embedRef.current)
          clearInterval(check)
        }
      }, 500)
      setTimeout(() => clearInterval(check), 10000)
    }
  }, [selectedAccount, isOpen])

  // Auto-select first account
  useEffect(() => {
    if (currentAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(currentAccounts[0])
    }
  }, [currentAccounts])

  // Change account when switching categories
  const handleCategoryChange = useCallback((cat) => {
    setActiveCategory(cat)
    const accts = accountsByCategory[cat] || []
    if (accts.length) setSelectedAccount(accts[0])
  }, [accountsByCategory])

  // Headlines for current category
  const categoryHeadlines = useMemo(() => {
    return headlines.filter(h => h.category === activeCategory).slice(0, 6)
  }, [headlines, activeCategory])

  if (!isOpen) return null

  return (
    <div className="xfeed-panel">
      <div className="xfeed-header">
        <div className="xfeed-title">
          <span className="xfeed-x-logo">𝕏</span>
          INTEL FEED
        </div>
        <button className="xfeed-close" onClick={onClose}>✕</button>
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
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Headlines Section */}
      {categoryHeadlines.length > 0 && (
        <div className="xfeed-headlines">
          <div className="xfeed-section-label">TOP HEADLINES</div>
          {categoryHeadlines.map(h => {
            const src = sources[h.source]
            return (
              <div key={h.id} className="xfeed-headline-row">
                <span className="xfeed-headline-dot" style={{
                  backgroundColor: h.priority === 'CRITICAL' ? '#FF4444' : h.priority === 'HIGH' ? '#FF8800' : '#FFB800'
                }} />
                <div className="xfeed-headline-content">
                  {src && <span className="xfeed-headline-source">{src.name}</span>}
                  <span className="xfeed-headline-text">{h.text}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* X Account Selector */}
      <div className="xfeed-accounts">
        <div className="xfeed-section-label">X / TWITTER FEEDS</div>
        <div className="xfeed-account-grid">
          {currentAccounts.map(acc => (
            <button
              key={acc.handle}
              className={`xfeed-account-btn ${selectedAccount?.handle === acc.handle ? 'active' : ''}`}
              onClick={() => setSelectedAccount(acc)}
            >
              <span className="xfeed-account-at">@</span>
              <span className="xfeed-account-handle">{acc.handle}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Timeline */}
      {selectedAccount && (
        <div className="xfeed-embed-section">
          <div className="xfeed-embed-header">
            <span className="xfeed-embed-x">𝕏</span>
            <span className="xfeed-embed-name">{selectedAccount.name}</span>
            <a
              href={`https://x.com/${selectedAccount.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="xfeed-open-x"
            >
              OPEN ON X ↗
            </a>
          </div>
          <div className="xfeed-embed-wrap" ref={embedRef}>
            <div className="xfeed-embed-loading">
              <div className="xfeed-loading-spinner" />
              LOADING @{selectedAccount.handle}...
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
