import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { feature } from 'topojson-client'

const REGIONS = ['ALL', 'MIDDLE EAST', 'EUROPE', 'ASIA', 'AFRICA', 'AMERICAS', 'OCEANIA']

/* ── Equirectangular projection ── */
function projectLatLng(lat, lng, bounds) {
  const x = bounds.x + ((lng - bounds.lonMin) / (bounds.lonMax - bounds.lonMin)) * bounds.w
  const y = bounds.y + ((bounds.latMax - lat) / (bounds.latMax - bounds.latMin)) * bounds.h
  return [x, y]
}

/* ══════════════════ 2D MAP CANVAS ══════════════════ */
function BroadcastMap({ countries, selectedCountry, onCountrySelect, geoData }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const sizeRef = useRef({ w: 900, h: 500 })
  const dprRef = useRef(window.devicePixelRatio || 1)
  const hoveredRef = useRef(null)
  const animRef = useRef(null)
  const timeRef = useRef(0)

  const mapBounds = useMemo(() => ({
    lonMin: -170, lonMax: 180, latMin: -60, latMax: 75,
  }), [])

  // Resize handler
  useEffect(() => {
    const sync = () => {
      if (!containerRef.current || !canvasRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = Math.floor(rect.width), h = Math.floor(rect.height)
      if (w > 0 && h > 0) {
        canvasRef.current.width = w * dpr
        canvasRef.current.height = h * dpr
        canvasRef.current.style.width = w + 'px'
        canvasRef.current.style.height = h + 'px'
        sizeRef.current = { w, h }
        dprRef.current = dpr
      }
    }
    sync()
    window.addEventListener('resize', sync)
    const ro = new ResizeObserver(sync)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => { window.removeEventListener('resize', sync); ro.disconnect() }
  }, [])

  // Draw loop
  useEffect(() => {
    const draw = () => {
      animRef.current = requestAnimationFrame(draw)
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const dpr = dprRef.current
      const { w, h } = sizeRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      timeRef.current += 0.016

      const pad = 20
      const bounds = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2, ...mapBounds }

      // Draw countries
      if (geoData?.features) {
        ctx.lineWidth = 0.5
        ctx.strokeStyle = '#2a221866'
        ctx.fillStyle = '#12121D'
        geoData.features.forEach(feat => {
          const geom = feat.geometry
          const drawPolygon = (coords) => {
            coords.forEach(ring => {
              ctx.beginPath()
              ring.forEach(([lng, lat], i) => {
                const [px, py] = projectLatLng(lat, lng, bounds)
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
              })
              ctx.closePath()
              ctx.fill()
              ctx.stroke()
            })
          }
          if (geom.type === 'Polygon') drawPolygon(geom.coordinates)
          else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(drawPolygon)
        })
      }

      // Draw grid
      ctx.strokeStyle = '#2a221822'
      ctx.lineWidth = 0.3
      for (let lng = -180; lng <= 180; lng += 30) {
        const [x1, y1] = projectLatLng(bounds.latMax - pad, lng, bounds)
        const [x2, y2] = projectLatLng(bounds.latMin + pad, lng, bounds)
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
      }
      for (let lat = -60; lat <= 80; lat += 20) {
        const [x1, y1] = projectLatLng(lat, bounds.lonMin, bounds)
        const [x2, y2] = projectLatLng(lat, bounds.lonMax, bounds)
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
      }

      // Draw country markers
      const t = timeRef.current
      countries.forEach(c => {
        if (!c.lat || !c.lng) return
        const [cx, cy] = projectLatLng(c.lat, c.lng, bounds)
        const isSelected = selectedCountry?.id === c.id
        const isHovered = hoveredRef.current === c.id
        const totalMedia = (c.news?.length || 0) + (c.radio?.length || 0)

        // Pulse ring for selected
        if (isSelected) {
          const pulseR = 12 + Math.sin(t * 3) * 4
          ctx.beginPath()
          ctx.arc(cx, cy, pulseR, 0, Math.PI * 2)
          ctx.strokeStyle = '#FFB80066'
          ctx.lineWidth = 1.5
          ctx.stroke()

          // Outer glow
          ctx.beginPath()
          ctx.arc(cx, cy, 18 + Math.sin(t * 2) * 3, 0, Math.PI * 2)
          ctx.strokeStyle = '#FFB80022'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Dot
        const r = isSelected ? 6 : isHovered ? 5 : 4
        const color = isSelected ? '#FFB800' : isHovered ? '#FF8800' : '#FF4444'
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = color + '88'
        ctx.lineWidth = 1
        ctx.stroke()

        // Glow
        ctx.beginPath()
        ctx.arc(cx, cy, r + 3, 0, Math.PI * 2)
        ctx.fillStyle = color + '18'
        ctx.fill()

        // Label
        if (isSelected || isHovered) {
          ctx.font = '700 10px "JetBrains Mono", monospace'
          ctx.fillStyle = color
          ctx.textAlign = 'center'
          ctx.fillText(c.name.toUpperCase(), cx, cy - 14)
          ctx.font = '9px "JetBrains Mono", monospace'
          ctx.fillStyle = '#8888A0'
          ctx.fillText(`${totalMedia} CHANNELS`, cx, cy - 4)
        } else if (totalMedia >= 4) {
          // Show code for countries with many channels
          ctx.font = '8px "JetBrains Mono", monospace'
          ctx.fillStyle = '#555570'
          ctx.textAlign = 'center'
          ctx.fillText(c.code, cx, cy - 8)
        }
      })
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [countries, selectedCountry, geoData, mapBounds])

  // Click handler
  const handleClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const { w, h } = sizeRef.current
    const pad = 20
    const bounds = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2, ...mapBounds }

    let closest = null, closestDist = 20
    countries.forEach(c => {
      if (!c.lat || !c.lng) return
      const [cx, cy] = projectLatLng(c.lat, c.lng, bounds)
      const d = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2)
      if (d < closestDist) { closest = c; closestDist = d }
    })
    if (closest) onCountrySelect(closest)
  }, [countries, mapBounds, onCountrySelect])

  // Hover handler
  const handleMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const { w, h } = sizeRef.current
    const pad = 20
    const bounds = { x: pad, y: pad, w: w - pad * 2, h: h - pad * 2, ...mapBounds }

    let found = null
    countries.forEach(c => {
      if (!c.lat || !c.lng) return
      const [cx, cy] = projectLatLng(c.lat, c.lng, bounds)
      if (Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2) < 18) found = c.id
    })
    hoveredRef.current = found
    canvasRef.current.style.cursor = found ? 'pointer' : 'default'
  }, [countries, mapBounds])

  return (
    <div ref={containerRef} className="broadcast-map-container">
      <canvas ref={canvasRef} onClick={handleClick} onMouseMove={handleMove} />
    </div>
  )
}

/* ══════════════════ MAIN COMPONENT ══════════════════ */
export default function BroadcastView({ broadcast = {} }) {
  const { countries = [] } = broadcast
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [activeTab, setActiveTab] = useState('tv')
  const [playingVideo, setPlayingVideo] = useState(null)
  const [playingRadio, setPlayingRadio] = useState(null)
  const audioRef = useRef(null)
  const [geoData, setGeoData] = useState(null)

  // Load world geometry
  useEffect(() => {
    import('world-atlas/countries-110m.json').then(topo => {
      setGeoData(feature(topo, topo.objects.countries))
    }).catch(() => {})
  }, [])

  // Auto-select Israel
  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) {
      const israel = countries.find(c => c.code === 'IL')
      setSelectedCountry(israel || countries[0])
    }
  }, [countries])

  const filtered = useMemo(() => {
    let list = countries
    if (regionFilter !== 'ALL') list = list.filter(c => (c.region || '').toUpperCase() === regionFilter)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(c => c.name.toLowerCase().includes(q))
    }
    return list
  }, [countries, search, regionFilter])

  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach(c => { const r = c.region || 'OTHER'; (g[r] = g[r] || []).push(c) })
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const handleCountrySelect = useCallback((country) => {
    setSelectedCountry(country)
    setActiveTab('tv')
    setPlayingVideo(null)
    stopRadio()
  }, [])

  const stopRadio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    setPlayingRadio(null)
  }, [])

  const handlePlayRadio = useCallback((station) => {
    if (playingRadio?.id === station.id) { stopRadio(); return }
    stopRadio()
    setPlayingRadio(station)
    setTimeout(() => {
      if (audioRef.current) { audioRef.current.src = station.streamUrl; audioRef.current.play().catch(() => {}) }
    }, 50)
  }, [playingRadio, stopRadio])

  const country = selectedCountry
  // Split news items into TV and News categories
  const tvItems = useMemo(() => (country?.news || []), [country])
  const radioItems = useMemo(() => (country?.radio || []), [country])
  const tvCount = tvItems.length
  const radioCount = radioItems.length

  return (
    <div className="broadcast-view">
      {/* LEFT SIDEBAR */}
      <div className="broadcast-sidebar">
        <div className="broadcast-sidebar-header">
          <div className="broadcast-search-wrap">
            <span className="broadcast-search-icon">&#9906;</span>
            <input className="broadcast-search" type="text" placeholder="SEARCH COUNTRIES..." value={search}
              onChange={e => setSearch(e.target.value)} spellCheck={false} />
          </div>
          <div className="broadcast-regions">
            {REGIONS.map(r => (
              <button key={r} className={`broadcast-region-btn ${regionFilter === r ? 'broadcast-region-btn--active' : ''}`}
                onClick={() => setRegionFilter(r)}>{r}</button>
            ))}
          </div>
        </div>
        <div className="broadcast-country-list">
          {grouped.map(([region, list]) => (
            <div key={region} className="broadcast-country-group">
              <div className="broadcast-group-label">{region.toUpperCase()}</div>
              {list.map(c => {
                const active = selectedCountry?.id === c.id
                const tvN = c.news?.length || 0
                const radioN = c.radio?.length || 0
                return (
                  <div key={c.id} className={`broadcast-country-row ${active ? 'broadcast-country-row--active' : ''}`}
                    onClick={() => handleCountrySelect(c)}>
                    <span className="broadcast-country-code">{c.code}</span>
                    <span className="broadcast-country-name">{c.name}</span>
                    <span className="broadcast-country-badges">
                      {tvN > 0 && <span className="broadcast-mini-badge broadcast-mini-tv">{tvN} TV</span>}
                      {radioN > 0 && <span className="broadcast-mini-badge broadcast-mini-radio">{radioN} RADIO</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
          {filtered.length === 0 && <div className="broadcast-empty-list">NO COUNTRIES MATCH FILTER</div>}
        </div>
      </div>

      {/* CENTER: MAP + MEDIA PANEL */}
      <div className="broadcast-center">
        {/* MAP */}
        <BroadcastMap
          countries={countries}
          selectedCountry={selectedCountry}
          onCountrySelect={handleCountrySelect}
          geoData={geoData}
        />

        {/* MEDIA PANEL */}
        {country && (
          <div className="broadcast-media-panel">
            {/* Country header */}
            <div className="broadcast-country-header">
              <span className="broadcast-header-flag">{country.flag}</span>
              <div className="broadcast-header-info">
                <div className="broadcast-header-name">{country.name}</div>
                <div className="broadcast-header-region">{country.region}</div>
              </div>
              <div className="broadcast-header-stats">
                <div className="broadcast-header-stat">
                  <span className="broadcast-stat-num">{tvCount}</span>
                  <span className="broadcast-stat-lbl">TV</span>
                </div>
                <div className="broadcast-header-stat">
                  <span className="broadcast-stat-num">{radioCount}</span>
                  <span className="broadcast-stat-lbl">RADIO</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="broadcast-tabs">
              <button className={`broadcast-tab ${activeTab === 'tv' ? 'broadcast-tab--active' : ''}`}
                onClick={() => setActiveTab('tv')}>
                <span className="broadcast-tab-icon">📺</span> TV CHANNELS
                <span className="broadcast-tab-count">{tvCount}</span>
              </button>
              <button className={`broadcast-tab ${activeTab === 'radio' ? 'broadcast-tab--active' : ''}`}
                onClick={() => setActiveTab('radio')}>
                <span className="broadcast-tab-icon">📻</span> RADIO STATIONS
                <span className="broadcast-tab-count">{radioCount}</span>
              </button>
            </div>

            {/* TV TAB */}
            {activeTab === 'tv' && (
              <div className="broadcast-section">
                {tvItems.length === 0 ? (
                  <div className="broadcast-empty">NO TV CHANNELS AVAILABLE</div>
                ) : (
                  <div className="broadcast-news-grid">
                    {tvItems.map(item => {
                      const isPlaying = playingVideo === item.id
                      return (
                        <div key={item.id} className={`broadcast-news-card ${isPlaying ? 'broadcast-news-card--active' : ''}`}
                          onClick={() => setPlayingVideo(isPlaying ? null : item.id)}>
                          <div className="broadcast-news-top">
                            <div className="broadcast-news-info">
                              <div className="broadcast-news-name">{item.name}</div>
                              <div className="broadcast-news-meta">
                                <span className="broadcast-medium-badge broadcast-medium-tv">TV</span>
                                <span className="broadcast-lang-badge">{item.language}</span>
                                {item.type && <span className="broadcast-type-badge">{item.type}</span>}
                              </div>
                              {item.description && <div className="broadcast-news-desc">{item.description}</div>}
                            </div>
                            <div className="broadcast-play-indicator">{isPlaying ? '■' : '▶'}</div>
                          </div>
                          {isPlaying && (
                            <div className="broadcast-video-wrap" onClick={e => e.stopPropagation()}>
                              <iframe className="broadcast-iframe"
                                src={`https://www.youtube.com/embed/${item.youtubeId}?autoplay=1`}
                                allow="autoplay; encrypted-media" allowFullScreen title={item.name} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* RADIO TAB */}
            {activeTab === 'radio' && (
              <div className="broadcast-section">
                {radioItems.length === 0 ? (
                  <div className="broadcast-empty">NO RADIO STATIONS AVAILABLE</div>
                ) : (
                  <div className="broadcast-radio-list">
                    {radioItems.map(station => {
                      const isPlaying = playingRadio?.id === station.id
                      return (
                        <div key={station.id} className={`broadcast-radio-row ${isPlaying ? 'broadcast-radio-row--active' : ''}`}>
                          <button className="broadcast-radio-btn" onClick={() => handlePlayRadio(station)}>
                            {isPlaying ? '■' : '▶'}
                          </button>
                          {isPlaying && <span className="broadcast-pulse" />}
                          <div className="broadcast-radio-info">
                            <div className="broadcast-radio-name">{station.name}</div>
                            {station.description && <div className="broadcast-radio-desc">{station.description}</div>}
                          </div>
                          <span className="broadcast-medium-badge broadcast-medium-radio">RADIO</span>
                          <span className="broadcast-lang-badge">{station.language}</span>
                          {station.type && <span className="broadcast-type-badge">{station.type}</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
                <audio ref={audioRef} className="broadcast-audio" controls={!!playingRadio}
                  style={{ display: playingRadio ? 'block' : 'none' }} />
              </div>
            )}
          </div>
        )}

        {!country && (
          <div className="broadcast-no-selection">
            <div className="broadcast-radar"><div className="broadcast-radar-sweep" /></div>
            <div className="broadcast-no-text">SELECT A COUNTRY ON THE MAP</div>
          </div>
        )}
      </div>

      {/* STYLES */}
      <style>{`
        .broadcast-view { display:flex; height:100%; overflow:hidden; background:var(--bg-primary); }

        /* SIDEBAR */
        .broadcast-sidebar { width:260px; min-width:260px; display:flex; flex-direction:column; border-right:1px solid var(--border-primary); background:var(--bg-secondary); }
        .broadcast-sidebar-header { padding:10px; border-bottom:1px solid var(--border-primary); flex-shrink:0; }
        .broadcast-search-wrap { position:relative; margin-bottom:8px; }
        .broadcast-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:14px; pointer-events:none; }
        .broadcast-search { width:100%; padding:7px 10px 7px 30px; background:var(--bg-primary); border:1px solid var(--border-primary); border-radius:3px; color:var(--text-primary); font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:1px; outline:none; box-sizing:border-box; transition:border-color .2s; }
        .broadcast-search:focus { border-color:var(--accent-gold); box-shadow:0 0 8px rgba(255,184,0,.15); }
        .broadcast-search::placeholder { color:var(--text-muted); letter-spacing:1.5px; }
        .broadcast-regions { display:flex; flex-wrap:wrap; gap:3px; }
        .broadcast-region-btn { padding:2px 6px; background:none; border:1px solid var(--border-primary); border-radius:2px; color:var(--text-muted); font-family:'JetBrains Mono',monospace; font-size:8px; letter-spacing:1px; cursor:pointer; transition:all .2s; }
        .broadcast-region-btn:hover { color:var(--text-secondary); border-color:var(--text-muted); }
        .broadcast-region-btn--active { color:var(--accent-gold); border-color:var(--accent-gold); background:rgba(255,184,0,.08); }

        /* COUNTRY LIST */
        .broadcast-country-list { flex:1; overflow-y:auto; padding:6px 0; }
        .broadcast-country-list::-webkit-scrollbar { width:4px; }
        .broadcast-country-list::-webkit-scrollbar-track { background:var(--bg-primary); }
        .broadcast-country-list::-webkit-scrollbar-thumb { background:var(--border-primary); border-radius:3px; }
        .broadcast-country-group { margin-bottom:2px; }
        .broadcast-group-label { padding:6px 12px 3px; font-family:'JetBrains Mono',monospace; font-size:8px; letter-spacing:2px; color:var(--text-muted); }
        .broadcast-country-row { display:flex; align-items:center; gap:6px; padding:5px 12px; cursor:pointer; transition:all .15s; }
        .broadcast-country-row:hover { background:var(--bg-hover); }
        .broadcast-country-row--active { background:rgba(255,184,0,.08); border-left:2px solid var(--accent-gold); }
        .broadcast-country-code { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-muted); width:20px; flex-shrink:0; }
        .broadcast-country-row--active .broadcast-country-code { color:var(--accent-gold); }
        .broadcast-country-name { flex:1; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .broadcast-country-row--active .broadcast-country-name { color:var(--accent-gold); }
        .broadcast-country-badges { display:flex; gap:4px; flex-shrink:0; }
        .broadcast-mini-badge { font-family:'JetBrains Mono',monospace; font-size:8px; letter-spacing:.5px; padding:1px 5px; border-radius:2px; font-weight:700; }
        .broadcast-mini-tv { color:#00AAFF; background:rgba(0,170,255,.1); border:1px solid rgba(0,170,255,.2); }
        .broadcast-mini-radio { color:#44CC44; background:rgba(68,204,68,.1); border:1px solid rgba(68,204,68,.2); }
        .broadcast-empty-list { padding:24px; text-align:center; font-size:11px; color:var(--text-muted); letter-spacing:1px; }

        /* CENTER */
        .broadcast-center { flex:1; display:flex; flex-direction:column; overflow:hidden; }

        /* MAP */
        .broadcast-map-container { width:100%; height:45%; min-height:250px; border-bottom:1px solid var(--border-primary); position:relative; background:var(--bg-primary); flex-shrink:0; }
        .broadcast-map-container canvas { display:block; width:100%; height:100%; }

        /* MEDIA PANEL */
        .broadcast-media-panel { flex:1; overflow-y:auto; padding:16px; animation:broadcast-fadein .2s ease; }
        .broadcast-media-panel::-webkit-scrollbar { width:4px; }
        .broadcast-media-panel::-webkit-scrollbar-track { background:var(--bg-primary); }
        .broadcast-media-panel::-webkit-scrollbar-thumb { background:var(--border-primary); border-radius:3px; }

        /* NO SELECTION */
        .broadcast-no-selection { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; opacity:.6; }
        .broadcast-no-text { font-family:'Orbitron','JetBrains Mono',monospace; font-size:12px; letter-spacing:3px; color:var(--text-muted); }
        .broadcast-radar { width:60px; height:60px; border-radius:50%; border:1px solid rgba(255,184,0,.25); position:relative; overflow:hidden; }
        .broadcast-radar-sweep { position:absolute; top:50%; left:50%; width:50%; height:2px; background:linear-gradient(90deg,var(--accent-gold),transparent); transform-origin:left center; animation:broadcast-sweep 2.5s linear infinite; }
        @keyframes broadcast-sweep { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes broadcast-fadein { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

        /* COUNTRY HEADER */
        .broadcast-country-header { display:flex; align-items:center; gap:14px; padding:12px 16px; background:var(--bg-card); border:1px solid var(--border-primary); border-radius:4px; margin-bottom:12px; }
        .broadcast-header-flag { font-size:28px; }
        .broadcast-header-info { flex:1; }
        .broadcast-header-name { font-family:'Orbitron',var(--font-display); font-size:18px; font-weight:700; color:var(--text-primary); letter-spacing:1px; }
        .broadcast-header-region { font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:2px; color:var(--text-muted); margin-top:2px; text-transform:uppercase; }
        .broadcast-header-stats { display:flex; gap:16px; }
        .broadcast-header-stat { display:flex; flex-direction:column; align-items:center; gap:1px; }
        .broadcast-stat-num { font-family:'Orbitron',var(--font-mono); font-size:18px; font-weight:700; color:var(--accent-gold); }
        .broadcast-stat-lbl { font-family:'JetBrains Mono',monospace; font-size:8px; letter-spacing:2px; color:var(--text-muted); }

        /* TABS */
        .broadcast-tabs { display:flex; gap:2px; margin-bottom:12px; border-bottom:1px solid var(--border-primary); }
        .broadcast-tab { display:flex; align-items:center; gap:6px; padding:8px 16px; background:none; border:none; border-bottom:2px solid transparent; color:var(--text-muted); font-family:var(--font-display,'JetBrains Mono',monospace); font-size:11px; letter-spacing:1.5px; cursor:pointer; transition:all .2s; }
        .broadcast-tab:hover { color:var(--text-secondary); background:var(--bg-hover); }
        .broadcast-tab--active { color:var(--accent-gold); border-bottom-color:var(--accent-gold); }
        .broadcast-tab-icon { font-size:14px; }
        .broadcast-tab-count { font-size:9px; color:var(--text-muted); background:var(--bg-primary); padding:1px 5px; border-radius:6px; margin-left:4px; }
        .broadcast-tab--active .broadcast-tab-count { color:var(--accent-gold); }
        .broadcast-section { animation:broadcast-fadein .2s ease; }
        .broadcast-empty { padding:30px; text-align:center; font-size:11px; color:var(--text-muted); letter-spacing:1.5px; }

        /* MEDIUM BADGES (TV vs RADIO) */
        .broadcast-medium-badge { display:inline-block; padding:2px 8px; border-radius:2px; font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:1.5px; font-weight:800; }
        .broadcast-medium-tv { color:#00AAFF; background:rgba(0,170,255,.12); border:1px solid rgba(0,170,255,.3); }
        .broadcast-medium-radio { color:#44CC44; background:rgba(68,204,68,.12); border:1px solid rgba(68,204,68,.3); }

        /* NEWS GRID */
        .broadcast-news-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:10px; }
        .broadcast-news-card { background:var(--bg-card); border:1px solid var(--border-primary); border-radius:4px; padding:14px; cursor:pointer; transition:all .2s; }
        .broadcast-news-card:hover { border-color:rgba(0,170,255,.3); background:var(--bg-hover); }
        .broadcast-news-card--active { border-color:#00AAFF; box-shadow:0 0 16px rgba(0,170,255,.1); }
        .broadcast-news-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .broadcast-news-info { flex:1; min-width:0; }
        .broadcast-news-name { font-family:var(--font-display); font-size:13px; font-weight:700; color:var(--text-primary); letter-spacing:.5px; }
        .broadcast-news-meta { display:flex; gap:5px; margin-top:5px; flex-wrap:wrap; align-items:center; }
        .broadcast-news-desc { font-size:10px; color:var(--text-secondary); margin-top:6px; line-height:1.5; }
        .broadcast-play-indicator { font-size:16px; color:var(--text-muted); flex-shrink:0; transition:color .2s; }
        .broadcast-news-card:hover .broadcast-play-indicator { color:#00AAFF; }
        .broadcast-news-card--active .broadcast-play-indicator { color:#FF4444; }
        .broadcast-lang-badge { display:inline-block; padding:2px 7px; background:rgba(136,136,160,.1); color:#8888A0; border:1px solid rgba(136,136,160,.2); border-radius:2px; font-family:'JetBrains Mono',monospace; font-size:8px; letter-spacing:1px; font-weight:700; text-transform:uppercase; }
        .broadcast-type-badge { display:inline-block; padding:2px 7px; background:rgba(255,184,0,.08); color:var(--accent-gold); border:1px solid rgba(255,184,0,.2); border-radius:2px; font-family:'JetBrains Mono',monospace; font-size:8px; letter-spacing:1px; font-weight:700; text-transform:uppercase; }

        /* VIDEO EMBED */
        .broadcast-video-wrap { margin-top:12px; position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:3px; border:1px solid var(--border-primary); background:#000; }
        .broadcast-iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:none; }

        /* RADIO LIST */
        .broadcast-radio-list { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
        .broadcast-radio-row { display:flex; align-items:center; gap:10px; padding:10px 14px; background:var(--bg-card); border:1px solid var(--border-primary); border-radius:4px; transition:all .2s; }
        .broadcast-radio-row:hover { border-color:rgba(68,204,68,.3); }
        .broadcast-radio-row--active { border-color:#44CC44; background:rgba(68,204,68,.04); }
        .broadcast-radio-btn { width:30px; height:30px; border-radius:50%; border:1px solid var(--border-primary); background:var(--bg-primary); color:var(--text-muted); font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; flex-shrink:0; }
        .broadcast-radio-btn:hover { border-color:#44CC44; color:#44CC44; }
        .broadcast-radio-row--active .broadcast-radio-btn { border-color:#FF4444; color:#FF4444; background:rgba(255,68,68,.08); }
        .broadcast-radio-info { flex:1; min-width:0; }
        .broadcast-radio-name { font-family:var(--font-display); font-size:12px; font-weight:700; color:var(--text-primary); letter-spacing:.5px; }
        .broadcast-radio-desc { font-size:10px; color:var(--text-secondary); margin-top:2px; line-height:1.4; }
        .broadcast-pulse { width:8px; height:8px; border-radius:50%; background:#44CC44; flex-shrink:0; animation:broadcast-pulse-anim 1.2s ease-in-out infinite; box-shadow:0 0 6px #44CC44; }
        @keyframes broadcast-pulse-anim { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
        .broadcast-audio { width:100%; height:32px; border-radius:4px; outline:none; filter:invert(1) hue-rotate(180deg) brightness(.85); }
      `}</style>
    </div>
  )
}
