import React, { useState, useEffect } from 'react'

export default function TopNav({ activeView, setActiveView, stats }) {
  const [utcTime, setUtcTime] = useState('')
  const [utcDate, setUtcDate] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const h = String(now.getUTCHours()).padStart(2, '0')
      const m = String(now.getUTCMinutes()).padStart(2, '0')
      const s = String(now.getUTCSeconds()).padStart(2, '0')
      setUtcTime(`${h}:${m}:${s}`)
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      setUtcDate(`${now.getUTCDate()} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <nav className="top-nav">
      <div className="top-nav-left">
        <div className="brand">
          <span className="brand-name">TANGODOWN</span>
          <span className="brand-tld">.LIVE</span>
        </div>
        <span className="brand-subtitle">GLOBAL BATTLESPACE INTELLIGENCE</span>
      </div>

      <div className="top-nav-center">
        <button
          className={`nav-btn ${activeView === 'godseye' ? 'active' : ''}`}
          onClick={() => setActiveView('godseye')}
        >
          <span className="nav-btn-icon">&#9678;</span>
          GOD'S EYE
          {activeView === 'godseye' && <span className="nav-badge-red" />}
        </button>
        <button
          className={`nav-btn ${activeView === 'networks' ? 'active' : ''}`}
          onClick={() => setActiveView('networks')}
        >
          <span className="nav-btn-icon">&#9733;</span>
          NETWORKS
        </button>
        <button
          className={`nav-btn ${activeView === 'replay' ? 'active' : ''}`}
          onClick={() => setActiveView('replay')}
        >
          <span className="nav-btn-icon">&#9654;</span>
          REPLAY
        </button>
        <button
          className={`nav-btn ${activeView === 'intel' ? 'active' : ''}`}
          onClick={() => setActiveView('intel')}
        >
          <span className="nav-btn-icon">&#9881;</span>
          INTEL
        </button>
      </div>

      <div className="top-nav-right">
        <div className="nav-stats">
          <div className="nav-stat">
            <span className="nav-stat-label">INCIDENTS</span>
            <span className="nav-stat-value">{stats.incidents || 0}</span>
          </div>
          <div className="nav-stat">
            <span className="nav-stat-label">ZONES</span>
            <span className="nav-stat-value">{stats.zones || 0}</span>
          </div>
          <div className="nav-stat">
            <span className="nav-stat-label">NAVAL</span>
            <span className="nav-stat-value">{stats.naval || 0}</span>
          </div>
          <div className="nav-stat">
            <span className="nav-stat-label">AIRCRAFT</span>
            <span className="nav-stat-value">{stats.aircraft || '0'}</span>
          </div>
        </div>
        <div className="nav-clock">
          <div className="clock-time">{utcTime}</div>
          <div className="clock-date">{utcDate}</div>
          <div className="clock-label">UTC</div>
        </div>
      </div>
    </nav>
  )
}
