import React, { useState, useEffect } from 'react'

export default function TopNav({ activeView, setActiveView, stats }) {
  const [utcTime, setUtcTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      const day = String(now.getUTCDate()).padStart(2, '0')
      const month = months[now.getUTCMonth()]
      const year = now.getUTCFullYear()
      const h = String(now.getUTCHours()).padStart(2, '0')
      const m = String(now.getUTCMinutes()).padStart(2, '0')
      const s = String(now.getUTCSeconds()).padStart(2, '0')
      setUtcTime(`${day} ${month} ${year} | ${h}:${m}:${s} UTC`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <div className="top-bar-brand">
          <div className="top-bar-title">TANGODOWN<span className="top-bar-tld">.LIVE</span></div>
          <div className="top-bar-subtitle">GLOBAL BATTLESPACE INTELLIGENCE</div>
        </div>
        <div className="top-bar-nav-btns">
          <button
            className={`top-bar-war-btn ${activeView === 'godseye' ? 'active' : ''}`}
            onClick={() => setActiveView('godseye')}
          >
            <span className={`top-bar-war-dot ${activeView === 'godseye' ? 'pulsing' : ''}`} />
            GOD'S EYE
          </button>
          <button
            className={`top-bar-nav-btn ${activeView === 'networks' ? 'active' : ''}`}
            onClick={() => setActiveView('networks')}
          >
            <span className="top-bar-nav-dot" />
            NETWORKS
          </button>
          <button
            className={`top-bar-nav-btn ${activeView === 'replay' ? 'active' : ''}`}
            onClick={() => setActiveView('replay')}
          >
            <span className="top-bar-nav-dot" />
            REPLAY
          </button>
          <button
            className={`top-bar-nav-btn ${activeView === 'intel' ? 'active' : ''}`}
            onClick={() => setActiveView('intel')}
          >
            <span className="top-bar-nav-dot" />
            INTEL
          </button>
        </div>
      </div>

      <div className="top-bar-stats">
        <div className="top-bar-stat">
          INCIDENTS: <span className="top-bar-stat-value">{stats.incidents || 0}</span>
        </div>
        <div className="top-bar-stat">
          ACTIVE ZONES: <span className="top-bar-stat-value">{stats.zones || 0}</span>
        </div>
        <div className="top-bar-stat">
          NAVAL ASSETS: <span className="top-bar-stat-value">{stats.naval || 0}</span>
        </div>
        <div className="top-bar-stat">
          AIRCRAFT: <span className="top-bar-stat-value">{stats.aircraft || '0'}</span>
        </div>
      </div>

      <div className="top-bar-right">
        {utcTime}
      </div>
    </div>
  )
}
