import React, { useState, useEffect, useMemo } from 'react'

export default function BottomBar({ stats, conflicts = [], leaders = {}, naval = [] }) {
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

  const intelFacts = useMemo(() => {
    if (!conflicts.length) return []
    const facts = []

    const totalPersonnel = conflicts.reduce((s, c) => s + (c.stats?.activePersonnel || 0), 0)
    facts.push(`${(totalPersonnel / 1000000).toFixed(1)}M ACTIVE PERSONNEL DEPLOYED ACROSS ${conflicts.length} THEATERS`)

    const totalAircraft = conflicts.reduce((s, c) => s + (c.stats?.aircraftInTheater || 0), 0)
    facts.push(`${totalAircraft.toLocaleString()} AIRCRAFT IN THEATER GLOBALLY`)

    const totalUAS = conflicts.reduce((s, c) => s + (c.stats?.uasInTheater || 0), 0)
    facts.push(`${totalUAS.toLocaleString()} UNMANNED AERIAL SYSTEMS DEPLOYED`)

    const totalEng = conflicts.reduce((s, c) => s + (c.stats?.dailyEngagements || 0), 0)
    facts.push(`${totalEng.toLocaleString()} DAILY ENGAGEMENTS ACROSS ALL CONFLICT ZONES`)

    const totalFronts = conflicts.reduce((s, c) => s + (c.fronts?.length || 0), 0)
    facts.push(`${totalFronts} ACTIVE BATTLEFRONTS UNDER SURVEILLANCE`)

    const allWeapons = conflicts.flatMap(c => c.weapons || [])
    const sorted = [...allWeapons].sort((a, b) => (b.dailyUse || 0) - (a.dailyUse || 0))
    if (sorted[0]) facts.push(`HIGHEST TEMPO WEAPON: ${sorted[0].name.toUpperCase()} — ${sorted[0].dailyUse} DEPLOYMENTS/DAY`)

    const elim = leaders.eliminated?.length || 0
    const active = leaders.active?.length || 0
    if (elim) facts.push(`${elim} HIGH VALUE TARGETS NEUTRALIZED — ${active} HVTs ACTIVE`)

    const alliedShips = naval.filter(s => s.force === 'allied').length
    const hostileShips = naval.filter(s => s.force === 'hostile').length
    if (naval.length) facts.push(`${naval.length} NAVAL VESSELS TRACKED: ${alliedShips} ALLIED / ${hostileShips} ADVERSARY`)

    const critZones = conflicts.filter(c => c.intensity === 'CRITICAL')
    if (critZones.length) facts.push(`CRITICAL INTENSITY: ${critZones.map(c => c.name.toUpperCase()).join(' // ')}`)

    const ukraine = conflicts.find(c => c.id === 'ukraine-russia')
    if (ukraine) facts.push(`UKRAINE FRONT: ${ukraine.stats.uasInTheater.toLocaleString()} UAS IN THEATER — ${ukraine.fronts?.length} ACTIVE FRONTS — ${ukraine.stats.dailyEngagements} ENGAGEMENTS/DAY`)

    const israel = conflicts.find(c => c.id === 'israel-palestine')
    if (israel) facts.push(`ISRAEL-PALESTINE: ${israel.stats.aircraftInTheater} AIRCRAFT — ${israel.fronts?.length} FRONTS — ${israel.stats.activePersonnel.toLocaleString()} PERSONNEL`)

    const redSea = conflicts.find(c => c.id === 'red-sea-houthi')
    if (redSea) facts.push(`RED SEA: OPERATION PROSPERITY GUARDIAN — ${redSea.stats.navalAssets} NAVAL ASSETS — ${redSea.stats.dailyEngagements} INTERCEPTS/DAY`)

    // Total strikes across all theaters
    const totalStrikes = conflicts.reduce((s, c) => s + (c.recentStrikes?.length || 0), 0)
    if (totalStrikes) facts.push(`${totalStrikes} CONFIRMED STRIKES DOCUMENTED ACROSS ALL THEATERS`)

    facts.push(`IRAN ANNUAL PROXY FUNDING: $1.0-1.5B+ ACROSS HEZBOLLAH / HAMAS / HOUTHIS / PIJ / KATA'IB HEZBOLLAH`)

    return facts
  }, [conflicts, leaders, naval])

  return (
    <div className="status-bar">
      <div className="status-bar-section status-bar-edge">
        <span className="status-bar-dot status-bar-dot-green" />
        <span>NOMINAL</span>
      </div>
      <div className="intel-ticker">
        <div className="intel-ticker-content">
          {intelFacts.map((f, i) => (
            <span key={i} className="intel-ticker-fact"><span className="intel-ticker-sep">///</span> {f} </span>
          ))}
          {intelFacts.map((f, i) => (
            <span key={`dup-${i}`} className="intel-ticker-fact"><span className="intel-ticker-sep">///</span> {f} </span>
          ))}
        </div>
      </div>
      <div className="status-bar-section status-bar-edge">
        <span>{formatUptime(uptime)}</span>
        <span className="status-bar-dot status-bar-dot-green" />
      </div>
    </div>
  )
}
