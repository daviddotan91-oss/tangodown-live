import React, { useState, useEffect, useRef, useMemo } from 'react'

export default function SearchOverlay({ isOpen, onClose, conflicts, organizations, leaders, onResult }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
    }
  }, [isOpen])

  const results = useMemo(() => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    const matches = []

    // Search conflicts
    conflicts?.forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)) {
        matches.push({ type: 'conflict', icon: '&#9678;', label: c.name, sublabel: `${c.region} — ${c.intensity}`, data: c })
      }
      c.fronts?.forEach(f => {
        if (f.name.toLowerCase().includes(q)) {
          matches.push({ type: 'front', icon: '&#9654;', label: f.name, sublabel: `${c.name} — ${f.intensity}`, data: { ...f, conflict: c } })
        }
      })
    })

    // Search organizations
    organizations?.forEach(o => {
      if (o.name.toLowerCase().includes(q) || o.fullName?.toLowerCase().includes(q) || o.aliases?.some(a => a.toLowerCase().includes(q))) {
        matches.push({ type: 'organization', icon: '&#9733;', label: o.name, sublabel: o.fullName, data: o })
      }
    })

    // Search leaders
    leaders?.eliminated?.forEach(l => {
      if (l.name.toLowerCase().includes(q) || l.title?.toLowerCase().includes(q)) {
        matches.push({ type: 'leader-eliminated', icon: '&#10006;', label: l.name, sublabel: `ELIMINATED — ${l.dateEliminated}`, data: l })
      }
    })
    leaders?.active?.forEach(l => {
      if (l.name.toLowerCase().includes(q) || l.title?.toLowerCase().includes(q)) {
        matches.push({ type: 'leader-active', icon: '&#9888;', label: l.name, sublabel: `ACTIVE — ${l.title}`, data: l })
      }
    })

    return matches.slice(0, 15)
  }, [query, conflicts, organizations, leaders])

  const handleSelect = (result) => {
    onResult?.(result)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
  }

  if (!isOpen) return null

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-container" onClick={e => e.stopPropagation()}>
        <div className="search-input-row">
          <span className="search-icon">/</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search operations, organizations, leaders, weapons, locations..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="search-close" onClick={onClose}>ESC</button>
        </div>

        {results.length > 0 && (
          <div className="search-results">
            {results.map((r, i) => (
              <div
                key={i}
                className={`search-result-item type-${r.type}`}
                onClick={() => handleSelect(r)}
              >
                <span className="result-icon" dangerouslySetInnerHTML={{ __html: r.icon }} />
                <div className="result-content">
                  <div className="result-label">{r.label}</div>
                  <div className="result-sublabel">{r.sublabel}</div>
                </div>
                <span className="result-type">{r.type.replace('-', ' ').toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="search-no-results">
            NO RESULTS FOR "{query.toUpperCase()}"
          </div>
        )}

        {query.length < 2 && (
          <div className="search-hints">
            <div className="search-hint">Try: "Hamas", "Nasrallah", "Ukraine", "Iron Dome", "Red Sea"</div>
          </div>
        )}
      </div>
    </div>
  )
}
