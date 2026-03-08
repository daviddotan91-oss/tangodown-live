import React, { useState, useEffect, useRef, useMemo } from 'react'

export default function SearchOverlay({ isOpen, onClose, conflicts, organizations, leaders, arsenal, naval, onResult }) {
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setSelectedIdx(0)
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

    // Search arsenal — air defense, UAS, platforms, defense tech
    const arsenalSections = [
      { key: 'airDefense', typeLabel: 'AIR DEFENSE' },
      { key: 'uas', typeLabel: 'UAS' },
      { key: 'platforms', typeLabel: 'PLATFORM' },
      { key: 'defenseTech', typeLabel: 'DEFENSE TECH' },
    ]
    arsenalSections.forEach(({ key, typeLabel }) => {
      ;(arsenal?.[key] || []).forEach(item => {
        const searchStr = `${item.name} ${item.fullName || ''} ${item.operator || ''} ${item.manufacturer || ''}`.toLowerCase()
        if (searchStr.includes(q)) {
          matches.push({ type: 'arsenal', icon: '&#9670;', label: item.name, sublabel: `${typeLabel} — ${item.operator || item.manufacturer || ''}`, data: item })
        }
      })
    })

    // Search naval vessels
    ;(naval || []).forEach(ship => {
      const searchStr = `${ship.name} ${ship.class} ${ship.type} ${ship.operator}`.toLowerCase()
      if (searchStr.includes(q)) {
        matches.push({ type: 'naval', icon: '&#9674;', label: ship.name, sublabel: `${ship.type} — ${ship.theater}`, data: ship })
      }
    })

    return matches.slice(0, 20)
  }, [query, conflicts, organizations, leaders, arsenal, naval])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIdx(0)
  }, [results.length, query])

  const handleSelect = (result) => {
    onResult?.(result)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, results.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    }
    if (e.key === 'Enter' && results[selectedIdx]) {
      handleSelect(results[selectedIdx])
    }
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
                className={`search-result-item type-${r.type} ${i === selectedIdx ? 'search-result-selected' : ''}`}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setSelectedIdx(i)}
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
            <div className="search-hint">Try: "Hamas", "Nasrallah", "Ukraine", "Iron Dome", "Ford", "Arrow"</div>
            <div className="search-hint" style={{ marginTop: 4, opacity: 0.5 }}>↑↓ Navigate &nbsp; ↵ Select &nbsp; ESC Close</div>
          </div>
        )}
      </div>
    </div>
  )
}
