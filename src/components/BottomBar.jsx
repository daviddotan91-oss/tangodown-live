import React, { useState, useEffect } from 'react'

export default function BottomBar({ stats }) {
  const [scrollPos, setScrollPos] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollPos(prev => prev - 1)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  const tickerItems = [
    'GOD\'S EYE ACTIVE',
    `ACTIVE CONFLICTS: ${stats.zones || 0}`,
    `ENGAGEMENTS TODAY: ${stats.incidents || 0}`,
    `NAVAL ASSETS TRACKED: ${stats.naval || 0}`,
    `AIRCRAFT IN THEATER: ${stats.aircraft || '0'}`,
    'OPEN SOURCE INTELLIGENCE',
    'TANGODOWN.LIVE',
    'ALL DATA SOURCED FROM OSINT',
    'ENGAGEMENT FEED: SIMULATED',
    `GLOBAL THREAT LEVEL: ${stats.threatLevel || 'ELEVATED'}`,
  ]

  const tickerText = tickerItems.join('  ///  ')
  const doubledText = `${tickerText}  ///  ${tickerText}`

  return (
    <div className="bottom-bar">
      <div className="bottom-bar-left">
        <span className="osint-badge">OSINT</span>
        <span className="system-status">SYS NOMINAL</span>
      </div>

      <div className="bottom-bar-ticker">
        <div
          className="ticker-content"
          style={{ transform: `translateX(${scrollPos}px)` }}
        >
          {doubledText}
        </div>
      </div>

      <div className="bottom-bar-right">
        <span className="classification-badge">UNCLASSIFIED</span>
        <span className="version-tag">v1.0.0</span>
      </div>
    </div>
  )
}
