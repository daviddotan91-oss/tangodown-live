import React, { useState, useMemo } from 'react'
import InfoTooltip from './InfoTooltip'

const TABS = [
  { id: 'airdefense', label: 'AIR DEFENSE', icon: '◇', tip: 'Surface-to-air missile systems, CIWS, and interceptor networks — Iron Dome, Patriot, S-400, and more.' },
  { id: 'uas', label: 'UAS / DRONES', icon: '△', tip: 'Unmanned aerial systems catalog — reconnaissance, strike, loitering munitions, and FPV platforms from all nations.' },
  { id: 'platforms', label: 'WEAPONS PLATFORMS', icon: '▸', tip: 'Combat aircraft, armored vehicles, missile systems, and anti-tank guided weapons in active service.' },
  { id: 'defensetech', label: 'DEFENSE TECH', icon: '⬡', tip: 'Defense technology companies and their products — from AI-guided systems to directed energy weapons.' },
]

const TYPE_COLORS = {
  'SHORT-RANGE': '#44CC44', 'MEDIUM': '#FFB800', 'LONG-RANGE': '#00AAFF', 'BMD': '#FF4444',
  'MALE': '#00AAFF', 'HALE': '#FFB800', 'LOITERING': '#FF6644', 'MICRO': '#44CC44', 'FPV': '#FF4444',
  'FIGHTER': '#00AAFF', 'BOMBER': '#FF4444', 'IFV/MBT': '#44CC44', 'MISSILE SYSTEM': '#FFB800', 'ATGM': '#FF6644',
}

function CircularProgress({ rate, size = 52 }) {
  const r = (size - 6) / 2, c = 2 * Math.PI * r, pct = (rate || 0) / 100
  const color = pct >= 0.9 ? '#44CC44' : pct >= 0.7 ? '#FFB800' : '#FF4444'
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1a28" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="11" fontFamily="'JetBrains Mono', monospace" fontWeight="700">
        {rate}%
      </text>
    </svg>
  )
}

function TypeBadge({ type }) {
  const bg = (TYPE_COLORS[type] || '#8888A0') + '22'
  const color = TYPE_COLORS[type] || '#8888A0'
  return <span className="arsenal-type-badge" style={{ color, background: bg, borderColor: color + '44' }}>{type}</span>
}

function StatusDot({ status }) {
  const color = status === 'ACTIVE' || status === 'OPERATIONAL' ? '#44CC44' : status === 'DEPLOYED' ? '#00AAFF' : '#FFB800'
  return <span className="arsenal-status-dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
}

/* ── AIR DEFENSE ── */
function AirDefenseTab({ items, selected, onSelect }) {
  const totalInterceptions = useMemo(() => items.reduce((s, i) => s + (i.interceptions || 0), 0), [items])
  return (
    <div className="arsenal-tab-content">
      <div className="arsenal-tab-header">
        <div className="arsenal-stat"><span className="arsenal-stat-value">{items.length}</span><span className="arsenal-stat-label">SYSTEMS TRACKED</span></div>
        <div className="arsenal-stat"><span className="arsenal-stat-value" style={{ color: '#44CC44' }}>{totalInterceptions.toLocaleString()}</span><span className="arsenal-stat-label">TOTAL INTERCEPTIONS</span></div>
      </div>
      <div className="arsenal-grid">
        {items.map((sys, i) => (
          <div key={i} className={`arsenal-card ${selected === i ? 'arsenal-card--expanded' : ''}`} onClick={() => onSelect(selected === i ? null : i)}>
            <div className="arsenal-card-top">
              <div className="arsenal-card-info">
                <div className="arsenal-card-name">{sys.name}</div>
                <div className="arsenal-card-sub">{sys.operator}</div>
                <TypeBadge type={sys.type} />
              </div>
              <CircularProgress rate={sys.interceptRate} />
            </div>
            <div className="arsenal-card-meta">
              <span><span className="arsenal-meta-label">RANGE</span> {sys.range}</span>
              <span><span className="arsenal-meta-label">THEATER</span> {sys.theater}</span>
              <span><StatusDot status={sys.status} /> {sys.status}</span>
            </div>
            {selected === i && sys.details && (
              <div className="arsenal-card-details">
                {sys.details.map((d, j) => (
                  <div key={j} className="arsenal-detail-row">
                    <span className="arsenal-meta-label">{d.label}</span><span>{d.value}</span>
                  </div>
                ))}
                {sys.interceptions > 0 && (
                  <div className="arsenal-detail-row">
                    <span className="arsenal-meta-label">CONFIRMED INTERCEPTS</span>
                    <span style={{ color: '#44CC44' }}>{sys.interceptions.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── UAS / DRONES ── */
function UASTab({ items, selected, onSelect }) {
  const combatProven = items.filter(d => d.combatProven).length
  const allied = items.filter(d => d.allegiance === 'allied')
  const hostile = items.filter(d => d.allegiance === 'hostile')
  const renderGroup = (group, label, accentColor) => (
    <div className="arsenal-group">
      <div className="arsenal-group-label" style={{ color: accentColor }}>{label} — {group.length} PLATFORMS</div>
      <div className="arsenal-grid">
        {group.map((drone, i) => {
          const key = `${drone.name}-${i}`
          const isOpen = selected === key
          return (
            <div key={key} className={`arsenal-card ${isOpen ? 'arsenal-card--expanded' : ''}`}
              style={{ borderColor: accentColor + '33' }} onClick={() => onSelect(isOpen ? null : key)}>
              <div className="arsenal-card-top">
                <div className="arsenal-card-info">
                  <div className="arsenal-card-name" style={{ color: accentColor }}>{drone.name}</div>
                  <div className="arsenal-card-sub">{drone.manufacturer}</div>
                  <TypeBadge type={drone.type} />
                  {drone.combatProven && <span className="arsenal-combat-badge">COMBAT PROVEN</span>}
                </div>
              </div>
              <div className="arsenal-card-meta">
                <span><span className="arsenal-meta-label">ENDURANCE</span> {drone.endurance}</span>
                <span><span className="arsenal-meta-label">CEILING</span> {drone.ceiling}</span>
                <span><span className="arsenal-meta-label">PAYLOAD</span> {drone.payload}</span>
              </div>
              {isOpen && drone.operators && (
                <div className="arsenal-card-details">
                  <div className="arsenal-detail-row"><span className="arsenal-meta-label">OPERATORS</span><span>{drone.operators.join(', ')}</span></div>
                  {drone.specs && Object.entries(drone.specs).map(([k, v]) => (
                    <div key={k} className="arsenal-detail-row"><span className="arsenal-meta-label">{k.toUpperCase()}</span><span>{v}</span></div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
  return (
    <div className="arsenal-tab-content">
      <div className="arsenal-tab-header">
        <div className="arsenal-stat"><span className="arsenal-stat-value">{items.length}</span><span className="arsenal-stat-label">PLATFORMS INDEXED</span></div>
        <div className="arsenal-stat"><span className="arsenal-stat-value" style={{ color: '#FFB800' }}>{combatProven}</span><span className="arsenal-stat-label">COMBAT PROVEN</span></div>
      </div>
      {allied.length > 0 && renderGroup(allied, '◆ ALLIED SYSTEMS', '#00AAFF')}
      {hostile.length > 0 && renderGroup(hostile, '◆ HOSTILE SYSTEMS', '#FF4444')}
      {items.filter(d => !d.allegiance).length > 0 && renderGroup(items.filter(d => !d.allegiance), '◆ UNCLASSIFIED', '#8888A0')}
    </div>
  )
}

/* ── WEAPONS PLATFORMS ── */
function PlatformsTab({ items, selected, onSelect }) {
  const groups = useMemo(() => {
    const g = {}
    items.forEach(p => { const t = p.category || 'OTHER'; (g[t] = g[t] || []).push(p) })
    return Object.entries(g)
  }, [items])
  return (
    <div className="arsenal-tab-content">
      <div className="arsenal-tab-header">
        <div className="arsenal-stat"><span className="arsenal-stat-value">{items.length}</span><span className="arsenal-stat-label">PLATFORMS CATALOGED</span></div>
      </div>
      {groups.map(([cat, list]) => (
        <div key={cat} className="arsenal-group">
          <div className="arsenal-group-label">{cat} — {list.length}</div>
          <div className="arsenal-grid">
            {list.map((p, i) => {
              const key = `${cat}-${i}`
              const isOpen = selected === key
              return (
                <div key={key} className={`arsenal-card ${isOpen ? 'arsenal-card--expanded' : ''}`} onClick={() => onSelect(isOpen ? null : key)}>
                  <div className="arsenal-card-top">
                    <div className="arsenal-card-info">
                      <div className="arsenal-card-name">{p.name}</div>
                      <div className="arsenal-card-sub">{p.manufacturer}</div>
                      <TypeBadge type={p.category} />
                    </div>
                  </div>
                  <div className="arsenal-card-meta">
                    <span><span className="arsenal-meta-label">OPERATOR</span> {p.operator}</span>
                    {p.quantity && <span><span className="arsenal-meta-label">QTY</span> {p.quantity}</span>}
                    {p.theater && <span><span className="arsenal-meta-label">THEATER</span> {p.theater}</span>}
                  </div>
                  {isOpen && (
                    <div className="arsenal-card-details">
                      {p.speed && <div className="arsenal-detail-row"><span className="arsenal-meta-label">SPEED</span><span>{p.speed}</span></div>}
                      {p.range && <div className="arsenal-detail-row"><span className="arsenal-meta-label">RANGE</span><span>{p.range}</span></div>}
                      {p.armament && <div className="arsenal-detail-row"><span className="arsenal-meta-label">ARMAMENT</span><span>{p.armament}</span></div>}
                      {p.combatDeployments && <div className="arsenal-detail-row"><span className="arsenal-meta-label">COMBAT DEPLOYMENTS</span><span style={{ color: '#FF4444' }}>{p.combatDeployments}</span></div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── DEFENSE TECH ── */
function DefenseTechTab({ items }) {
  const sorted = useMemo(() => {
    const priority = ['palantir', 'anduril']
    return [...items].sort((a, b) => {
      const ai = priority.indexOf((a.name || '').toLowerCase())
      const bi = priority.indexOf((b.name || '').toLowerCase())
      if (ai >= 0 && bi >= 0) return ai - bi
      if (ai >= 0) return -1
      if (bi >= 0) return 1
      return 0
    })
  }, [items])

  return (
    <div className="arsenal-tab-content">
      <div className="arsenal-tab-header">
        <div className="arsenal-stat"><span className="arsenal-stat-value">{items.length}</span><span className="arsenal-stat-label">COMPANIES TRACKED</span></div>
      </div>
      <div className="arsenal-tech-grid">
        {sorted.map((co, i) => (
          <div key={i} className="arsenal-tech-card">
            <div className="arsenal-tech-header">
              <div className="arsenal-tech-logo">{(co.name || '?')[0]}</div>
              <div className="arsenal-tech-title">
                <div className="arsenal-tech-name">{co.name}</div>
                <div className="arsenal-tech-meta-row">
                  {co.ceo && <span><span className="arsenal-meta-label">CEO</span> {co.ceo}</span>}
                  {co.hq && <span><span className="arsenal-meta-label">HQ</span> {co.hq}</span>}
                  {co.marketCap && <span><span className="arsenal-meta-label">MKT CAP</span> <span style={{ color: '#44CC44' }}>{co.marketCap}</span></span>}
                </div>
              </div>
            </div>
            {co.description && <div className="arsenal-tech-desc">{co.description}</div>}
            {co.contracts && (
              <div className="arsenal-tech-contracts">
                <span className="arsenal-meta-label">ACTIVE CONTRACTS</span>
                <span style={{ color: '#FFB800', fontWeight: 700 }}>{co.contracts}</span>
              </div>
            )}
            {co.products && co.products.length > 0 && (
              <div className="arsenal-tech-products">
                <div className="arsenal-tech-products-label">PRODUCTS & CAPABILITIES</div>
                {co.products.map((prod, j) => (
                  <div key={j} className="arsenal-product">
                    <div className="arsenal-product-header">
                      <span className="arsenal-product-name">{prod.name}</span>
                      {prod.type && <TypeBadge type={prod.type} />}
                    </div>
                    {prod.description && <div className="arsenal-product-desc">{prod.description}</div>}
                    {prod.deployedBy && prod.deployedBy.length > 0 && (
                      <div className="arsenal-product-deployed">
                        <span className="arsenal-meta-label">DEPLOYED BY</span>
                        {prod.deployedBy.map((d, k) => <span key={k} className="arsenal-deployed-tag">{d}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */
export default function ArsenalView({ arsenal = {} }) {
  const [activeTab, setActiveTab] = useState('airdefense')
  const [selectedItem, setSelectedItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { airDefense = [], uas = [], platforms = [], defenseTech = [] } = arsenal

  const handleTabChange = (id) => { setActiveTab(id); setSelectedItem(null) }

  // Filter items by search query across name, operator, manufacturer, theater
  const filterItems = (items) => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase().trim()
    return items.filter(item =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.operator || '').toLowerCase().includes(q) ||
      (item.manufacturer || '').toLowerCase().includes(q) ||
      (item.theater || '').toLowerCase().includes(q) ||
      (item.type || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    )
  }

  const filteredAirDefense = useMemo(() => filterItems(airDefense), [airDefense, searchQuery])
  const filteredUAS = useMemo(() => filterItems(uas), [uas, searchQuery])
  const filteredPlatforms = useMemo(() => filterItems(platforms), [platforms, searchQuery])
  const filteredDefenseTech = useMemo(() => {
    if (!searchQuery.trim()) return defenseTech
    const q = searchQuery.toLowerCase().trim()
    return defenseTech.filter(co =>
      (co.name || '').toLowerCase().includes(q) ||
      (co.hq || '').toLowerCase().includes(q) ||
      (co.ceo || '').toLowerCase().includes(q) ||
      (co.description || '').toLowerCase().includes(q)
    )
  }, [defenseTech, searchQuery])

  // Total match count for search feedback
  const totalResults = filteredAirDefense.length + filteredUAS.length + filteredPlatforms.length + filteredDefenseTech.length
  const totalItems = airDefense.length + uas.length + platforms.length + defenseTech.length

  return (
    <div className="arsenal-view">
      {/* Search bar */}
      <div className="arsenal-search-bar">
        <span className="arsenal-search-icon">&#9906;</span>
        <input
          className="arsenal-search-input"
          type="text"
          placeholder="SEARCH ARSENAL — NAME, OPERATOR, TYPE..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          spellCheck={false}
        />
        {searchQuery && (
          <span className="arsenal-search-count">
            {totalResults}/{totalItems}
          </span>
        )}
        {searchQuery && (
          <button className="arsenal-search-clear" onClick={() => setSearchQuery('')}>&#10005;</button>
        )}
      </div>

      {/* Tab bar */}
      <div className="arsenal-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`arsenal-tab ${activeTab === t.id ? 'arsenal-tab--active' : ''}`}
            onClick={() => handleTabChange(t.id)}>
            <span className="arsenal-tab-icon">{t.icon}</span>
            <span className="arsenal-tab-label">{t.label}</span>
            <InfoTooltip text={t.tip} position="bottom" />
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="arsenal-content">
        {activeTab === 'airdefense' && <AirDefenseTab items={filteredAirDefense} selected={selectedItem} onSelect={setSelectedItem} />}
        {activeTab === 'uas' && <UASTab items={filteredUAS} selected={selectedItem} onSelect={setSelectedItem} />}
        {activeTab === 'platforms' && <PlatformsTab items={filteredPlatforms} selected={selectedItem} onSelect={setSelectedItem} />}
        {activeTab === 'defensetech' && <DefenseTechTab items={filteredDefenseTech} />}
      </div>

      {/* Styles */}
      <style>{`
        .arsenal-view { display:flex; flex-direction:column; height:100%; overflow:hidden; background:var(--bg-primary); }
        .arsenal-search-bar { display:flex; align-items:center; gap:8px; padding:10px 16px; background:var(--bg-secondary); border-bottom:1px solid var(--border-primary); flex-shrink:0; }
        .arsenal-search-icon { color:var(--text-muted); font-size:14px; flex-shrink:0; }
        .arsenal-search-input { flex:1; padding:7px 10px; background:var(--bg-primary); border:1px solid var(--border-primary); border-radius:3px; color:var(--text-primary); font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:1px; outline:none; transition:border-color .2s; }
        .arsenal-search-input:focus { border-color:var(--accent-gold); box-shadow:0 0 8px rgba(255,184,0,.15); }
        .arsenal-search-input::placeholder { color:var(--text-muted); letter-spacing:1.5px; }
        .arsenal-search-count { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--accent-gold); letter-spacing:1px; white-space:nowrap; }
        .arsenal-search-clear { width:22px; height:22px; border:1px solid var(--border-primary); border-radius:3px; background:var(--bg-primary); color:var(--text-muted); font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; flex-shrink:0; }
        .arsenal-search-clear:hover { border-color:#FF4444; color:#FF4444; }
        .arsenal-tabs { display:flex; gap:2px; padding:12px 16px 0; border-bottom:1px solid var(--border-primary); background:var(--bg-secondary); flex-shrink:0; }
        .arsenal-tab { display:flex; align-items:center; gap:6px; padding:10px 18px; background:none; border:none; border-bottom:2px solid transparent; color:var(--text-muted); font-family:var(--font-display); font-size:11px; letter-spacing:1.5px; cursor:pointer; transition:all .2s; text-transform:uppercase; white-space:nowrap; }
        .arsenal-tab:hover { color:var(--text-secondary); background:var(--bg-hover); }
        .arsenal-tab--active { color:var(--accent-gold); border-bottom-color:var(--accent-gold); }
        .arsenal-tab-icon { font-size:13px; }
        .arsenal-content { flex:1; overflow-y:auto; padding:0; }
        .arsenal-tab-content { padding:20px; }
        .arsenal-tab-header { display:flex; gap:32px; padding:16px 20px; margin-bottom:20px; background:var(--bg-card); border:1px solid var(--border-primary); border-radius:4px; }
        .arsenal-stat { display:flex; flex-direction:column; gap:4px; }
        .arsenal-stat-value { font-family:'Orbitron',var(--font-mono); font-size:26px; font-weight:700; color:var(--text-primary); }
        .arsenal-stat-label { font-family:var(--font-display); font-size:10px; letter-spacing:2px; color:var(--text-muted); }
        .arsenal-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:12px; }
        .arsenal-card { background:var(--bg-card); border:1px solid var(--border-primary); border-radius:4px; padding:16px; cursor:pointer; transition:all .2s; }
        .arsenal-card:hover { border-color:var(--accent-gold-dim); background:var(--bg-hover); }
        .arsenal-card--expanded { border-color:var(--accent-gold); box-shadow:0 0 20px rgba(255,184,0,.08); }
        .arsenal-card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .arsenal-card-info { display:flex; flex-direction:column; gap:4px; min-width:0; }
        .arsenal-card-name { font-family:var(--font-display); font-size:14px; font-weight:700; color:var(--text-primary); letter-spacing:.5px; }
        .arsenal-card-sub { font-size:11px; color:var(--text-secondary); }
        .arsenal-type-badge { display:inline-block; padding:2px 8px; border:1px solid; border-radius:2px; font-family:var(--font-display); font-size:9px; letter-spacing:1.5px; font-weight:700; margin-top:4px; }
        .arsenal-combat-badge { display:inline-block; padding:2px 8px; background:#FFB80018; color:#FFB800; border:1px solid #FFB80044; border-radius:2px; font-family:var(--font-display); font-size:9px; letter-spacing:1px; font-weight:700; margin-top:4px; }
        .arsenal-card-meta { display:flex; flex-wrap:wrap; gap:12px; margin-top:12px; padding-top:10px; border-top:1px solid var(--border-primary); font-size:11px; color:var(--text-secondary); align-items:center; }
        .arsenal-meta-label { font-size:9px; letter-spacing:1.5px; color:var(--text-muted); margin-right:4px; }
        .arsenal-status-dot { display:inline-block; width:6px; height:6px; border-radius:50%; margin-right:4px; vertical-align:middle; }
        .arsenal-card-details { margin-top:12px; padding-top:12px; border-top:1px solid var(--border-primary); display:flex; flex-direction:column; gap:6px; animation:arsenal-fadein .2s ease; }
        .arsenal-detail-row { display:flex; justify-content:space-between; font-size:11px; color:var(--text-secondary); }
        .arsenal-group { margin-bottom:24px; }
        .arsenal-group-label { font-family:var(--font-display); font-size:12px; letter-spacing:2px; font-weight:700; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--border-primary); }
        /* Defense Tech */
        .arsenal-tech-grid { display:flex; flex-direction:column; gap:16px; }
        .arsenal-tech-card { background:var(--bg-card); border:1px solid var(--border-primary); border-radius:4px; padding:24px; transition:border-color .2s; }
        .arsenal-tech-card:hover { border-color:var(--accent-gold-dim); }
        .arsenal-tech-header { display:flex; gap:16px; align-items:center; margin-bottom:16px; }
        .arsenal-tech-logo { width:48px; height:48px; border-radius:4px; background:linear-gradient(135deg,var(--accent-gold),#FF6644); display:flex; align-items:center; justify-content:center; font-family:'Orbitron',var(--font-mono); font-size:24px; font-weight:900; color:var(--bg-primary); flex-shrink:0; }
        .arsenal-tech-name { font-family:'Orbitron',var(--font-display); font-size:18px; font-weight:700; color:var(--text-primary); letter-spacing:1px; }
        .arsenal-tech-meta-row { display:flex; flex-wrap:wrap; gap:16px; margin-top:4px; font-size:11px; color:var(--text-secondary); }
        .arsenal-tech-desc { font-size:12px; line-height:1.6; color:var(--text-secondary); margin-bottom:16px; padding:12px; background:var(--bg-secondary); border-radius:3px; border-left:2px solid var(--accent-gold-dim); }
        .arsenal-tech-contracts { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-secondary); border-radius:3px; margin-bottom:16px; font-size:13px; }
        .arsenal-tech-products { border-top:1px solid var(--border-primary); padding-top:16px; }
        .arsenal-tech-products-label { font-family:var(--font-display); font-size:10px; letter-spacing:2px; color:var(--text-muted); margin-bottom:12px; }
        .arsenal-product { padding:12px; background:var(--bg-secondary); border:1px solid var(--border-primary); border-radius:3px; margin-bottom:8px; }
        .arsenal-product-header { display:flex; align-items:center; gap:10px; }
        .arsenal-product-name { font-family:var(--font-display); font-size:13px; font-weight:700; color:var(--text-primary); }
        .arsenal-product-desc { font-size:11px; color:var(--text-secondary); margin-top:6px; line-height:1.5; }
        .arsenal-product-deployed { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:8px; font-size:10px; }
        .arsenal-deployed-tag { padding:2px 8px; background:var(--intel-blue-ghost); color:var(--intel-blue); border:1px solid var(--intel-blue-dim); border-radius:2px; font-family:var(--font-display); font-size:9px; letter-spacing:.5px; }
        @keyframes arsenal-fadein { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}
