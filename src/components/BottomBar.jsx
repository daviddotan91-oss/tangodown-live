import React, { useState, useEffect } from 'react'

export default function BottomBar({ stats }) {
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const interval = setInterval(() => {
      setUptime(Math.floor((performance.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="status-bar">
      <div className="status-bar-section">
        <span className="status-bar-dot status-bar-dot-green" />
        <span>SYSTEM NOMINAL</span>
      </div>
      <div className="status-bar-section">
        <span className="status-bar-active-label">GOD'S EYE ACTIVE</span>
        <span className="status-bar-divider">|</span>
        <span>{stats.zones || 0} ACTIVE CONFLICTS</span>
        <span className="status-bar-divider">|</span>
        <span>{stats.incidents || 0} ENGAGEMENTS/DAY</span>
        <span className="status-bar-divider">|</span>
        <span>{stats.naval || 0} NAVAL ASSETS TRACKED</span>
        <span className="status-bar-divider">|</span>
        <span className="status-bar-tdl">TANGODOWN.LIVE</span>
      </div>
      <div className="status-bar-section">
        <span>SESSION: {formatUptime(uptime)}</span>
        <span className="status-bar-dot status-bar-dot-green" />
      </div>
    </div>
  )
}
