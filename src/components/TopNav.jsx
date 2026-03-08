import React, { useState, useEffect } from 'react'

const DEFCON_COLORS = { 1: '#FF0000', 2: '#FF4444', 3: '#FF8800', 4: '#FFB800', 5: '#44CC44' }

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

  const defconColor = DEFCON_COLORS[stats.defcon] || '#FF4444'
  const fmtK = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
  const fmtM = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : fmtK(n)

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
            LION'S EYE
            <kbd className="top-bar-key">W</kbd>
          </button>
          <button
            className={`top-bar-nav-btn ${activeView === 'networks' ? 'active' : ''}`}
            onClick={() => setActiveView('networks')}
          >
            <span className="top-bar-nav-dot" />
            NETWORKS
            <kbd className="top-bar-key">N</kbd>
          </button>
          <button
            className={`top-bar-nav-btn ${activeView === 'replay' ? 'active' : ''}`}
            onClick={() => setActiveView('replay')}
          >
            <span className="top-bar-nav-dot" />
            REPLAY
            <kbd className="top-bar-key">R</kbd>
          </button>
          <button
            className={`top-bar-nav-btn ${activeView === 'intel' ? 'active' : ''}`}
            onClick={() => setActiveView('intel')}
          >
            <span className="top-bar-nav-dot" />
            INTEL
            <kbd className="top-bar-key">I</kbd>
          </button>
          <button
            className={`top-bar-nav-btn ${activeView === 'arsenal' ? 'active' : ''}`}
            onClick={() => setActiveView('arsenal')}
          >
            <span className="top-bar-nav-dot" />
            ARSENAL
            <kbd className="top-bar-key">A</kbd>
          </button>
          <button
            className={`top-bar-nav-btn ${activeView === 'broadcast' ? 'active' : ''}`}
            onClick={() => setActiveView('broadcast')}
          >
            <span className="top-bar-nav-dot" />
            BROADCAST
            <kbd className="top-bar-key">B</kbd>
          </button>
        </div>
        <span className="top-bar-defcon" style={{ color: defconColor, borderColor: defconColor + '66' }}>
          DEFCON {stats.defcon}
        </span>
      </div>

      <div className="top-bar-right">
        <div className="top-bar-stats">
          <div className="top-bar-stat">
            <span className="top-bar-stat-value">{fmtM(stats.personnel || 0)}</span> PERS
          </div>
          <div className="top-bar-stat">
            <span className="top-bar-stat-value">{fmtK(stats.aircraft || 0)}</span> AIR
          </div>
          <div className="top-bar-stat">
            <span className="top-bar-stat-value">{fmtK(stats.uas || 0)}</span> UAS
          </div>
          <div className="top-bar-stat">
            <span className="top-bar-stat-value">{stats.fronts || 0}</span> FRONTS
          </div>
        </div>
        <span className="top-bar-divider">|</span>
        {utcTime}
      </div>
    </div>
  )
}
