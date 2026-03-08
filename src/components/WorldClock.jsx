import React, { useState, useEffect } from 'react'

const CLOCKS = [
  { city: 'DC', label: 'WASHINGTON', tz: 'America/New_York', flag: '🇺🇸' },
  { city: 'LON', label: 'LONDON', tz: 'Europe/London', flag: '🇬🇧' },
  { city: 'JLM', label: 'JERUSALEM', tz: 'Asia/Jerusalem', flag: '🇮🇱' },
  { city: 'MSK', label: 'MOSCOW', tz: 'Europe/Moscow', flag: '🇷🇺' },
  { city: 'BJS', label: 'BEIJING', tz: 'Asia/Shanghai', flag: '🇨🇳' },
  { city: 'TYO', label: 'TOKYO', tz: 'Asia/Tokyo', flag: '🇯🇵' },
]

function getTimeInTZ(tz) {
  const now = new Date()
  const opts = { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
  return now.toLocaleTimeString('en-GB', opts)
}

function getDayInTZ(tz) {
  const now = new Date()
  const opts = { timeZone: tz, weekday: 'short' }
  return now.toLocaleDateString('en-US', opts).toUpperCase()
}

export default function WorldClock() {
  const [times, setTimes] = useState({})

  useEffect(() => {
    const update = () => {
      const t = {}
      CLOCKS.forEach(c => {
        t[c.city] = { time: getTimeInTZ(c.tz), day: getDayInTZ(c.tz) }
      })
      setTimes(t)
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="world-clock-strip">
      <span className="world-clock-label">WORLD TIME</span>
      <div className="world-clock-items">
        {CLOCKS.map(c => {
          const t = times[c.city]
          return (
            <div key={c.city} className="world-clock-item">
              <span className="world-clock-city">{c.city}</span>
              <span className="world-clock-time">{t?.time || '--:--:--'}</span>
            </div>
          )
        })}
      </div>

      <style>{`
        .world-clock-strip {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 22px;
          background: rgba(10, 10, 15, 0.95);
          border-top: 1px solid var(--border-primary);
          border-bottom: 1px solid var(--border-primary);
          padding: 0 10px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .world-clock-label {
          font-family: var(--font-mono);
          font-size: 8px;
          letter-spacing: 2px;
          color: var(--text-muted);
          flex-shrink: 0;
          margin-right: 6px;
        }
        .world-clock-items {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          justify-content: space-around;
        }
        .world-clock-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 8px;
          position: relative;
        }
        .world-clock-item:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0;
          top: 2px;
          bottom: 2px;
          width: 1px;
          background: var(--border-primary);
        }
        .world-clock-city {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1px;
          color: var(--accent-gold);
          flex-shrink: 0;
        }
        .world-clock-time {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-primary);
          letter-spacing: 1px;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  )
}
