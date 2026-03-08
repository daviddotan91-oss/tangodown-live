import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'

const REGIONS = ['ALL', 'MIDDLE EAST', 'EUROPE', 'ASIA', 'AFRICA', 'AMERICAS', 'OCEANIA']

export default function BroadcastView({ broadcast = {} }) {
  const { countries = [] } = broadcast
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [activeTab, setActiveTab] = useState('news')
  const [playingVideo, setPlayingVideo] = useState(null)
  const [playingRadio, setPlayingRadio] = useState(null)
  const audioRef = useRef(null)

  // Auto-select Israel on mount
  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) {
      const israel = countries.find(c => c.code === 'IL' || c.name === 'Israel')
      setSelectedCountry(israel || countries[0])
    }
  }, [countries])

  // Filter countries by search + region
  const filtered = useMemo(() => {
    let list = countries
    if (regionFilter !== 'ALL') list = list.filter(c => (c.region || '').toUpperCase() === regionFilter)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(c => c.name.toLowerCase().includes(q))
    }
    return list
  }, [countries, search, regionFilter])

  // Group filtered by region
  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach(c => {
      const r = c.region || 'OTHER'
      ;(g[r] = g[r] || []).push(c)
    })
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const handleCountrySelect = useCallback((country) => {
    setSelectedCountry(country)
    setActiveTab('news')
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
  const newsItems = country?.news || []
  const radioItems = country?.radio || []

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
                const count = (c.news?.length || 0) + (c.radio?.length || 0)
                const active = selectedCountry?.id === c.id
                return (
                  <div key={c.id} className={`broadcast-country-row ${active ? 'broadcast-country-row--active' : ''}`}
                    onClick={() => handleCountrySelect(c)}>
                    <span className="broadcast-country-flag">{c.flag}</span>
                    <span className="broadcast-country-name">{c.name}</span>
                    <span className="broadcast-country-count">{count}</span>
                  </div>
                )
              })}
            </div>
          ))}
          {filtered.length === 0 && <div className="broadcast-empty-list">NO COUNTRIES MATCH FILTER</div>}
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="broadcast-main">
        {!country ? (
          <div className="broadcast-no-selection">
            <div className="broadcast-radar"><div className="broadcast-radar-sweep" /></div>
            <div className="broadcast-no-text">SELECT A COUNTRY TO MONITOR BROADCASTS</div>
          </div>
        ) : (
          <div className="broadcast-content">
            {/* Country header */}
            <div className="broadcast-country-header">
              <span className="broadcast-header-flag">{country.flag}</span>
              <div className="broadcast-header-info">
                <div className="broadcast-header-name">{country.name}</div>
                <div className="broadcast-header-region">{country.region}</div>
              </div>
              <div className="broadcast-header-stats">
                <div className="broadcast-header-stat"><span className="broadcast-stat-num">{newsItems.length}</span><span className="broadcast-stat-lbl">NEWS</span></div>
                <div className="broadcast-header-stat"><span className="broadcast-stat-num">{radioItems.length}</span><span className="broadcast-stat-lbl">RADIO</span></div>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="broadcast-tabs">
              <button className={`broadcast-tab ${activeTab === 'news' ? 'broadcast-tab--active' : ''}`}
                onClick={() => setActiveTab('news')}>
                <span className="broadcast-tab-icon">&#9656;</span> LIVE NEWS
              </button>
              <button className={`broadcast-tab ${activeTab === 'radio' ? 'broadcast-tab--active' : ''}`}
                onClick={() => setActiveTab('radio')}>
                <span className="broadcast-tab-icon">&#9836;</span> RADIO STATIONS
              </button>
            </div>

            {/* NEWS TAB */}
            {activeTab === 'news' && (
              <div className="broadcast-section">
                {newsItems.length === 0 ? (
                  <div className="broadcast-empty">NO NEWS CHANNELS AVAILABLE</div>
                ) : (
                  <div className="broadcast-news-grid">
                    {newsItems.map(item => {
                      const isPlaying = playingVideo === item.id
                      return (
                        <div key={item.id} className={`broadcast-news-card ${isPlaying ? 'broadcast-news-card--active' : ''}`}
                          onClick={() => setPlayingVideo(isPlaying ? null : item.id)}>
                          <div className="broadcast-news-top">
                            <div className="broadcast-news-info">
                              <div className="broadcast-news-name">{item.name}</div>
                              <div className="broadcast-news-meta">
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
      </div>

      {/* STYLES */}
      <style>{`
        .broadcast-view { display:flex; height:100%; overflow:hidden; background:var(--bg-primary); }

        /* SIDEBAR */
        .broadcast-sidebar { width:300px; min-width:300px; display:flex; flex-direction:column; border-right:1px solid var(--border-primary); background:var(--bg-secondary); }
        .broadcast-sidebar-header { padding:12px; border-bottom:1px solid var(--border-primary); flex-shrink:0; }
        .broadcast-search-wrap { position:relative; margin-bottom:10px; }
        .broadcast-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:14px; pointer-events:none; }
        .broadcast-search { width:100%; padding:8px 10px 8px 32px; background:var(--bg-primary); border:1px solid var(--border-primary); border-radius:3px; color:var(--text-primary); font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:1px; outline:none; box-sizing:border-box; transition:border-color .2s, box-shadow .2s; }
        .broadcast-search:focus { border-color:var(--accent-gold); box-shadow:0 0 8px rgba(255,184,0,.15); }
        .broadcast-search::placeholder { color:var(--text-muted); letter-spacing:1.5px; }
        .broadcast-regions { display:flex; flex-wrap:wrap; gap:4px; }
        .broadcast-region-btn { padding:3px 7px; background:none; border:1px solid var(--border-primary); border-radius:2px; color:var(--text-muted); font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:1px; cursor:pointer; transition:all .2s; }
        .broadcast-region-btn:hover { color:var(--text-secondary); border-color:var(--text-muted); }
        .broadcast-region-btn--active { color:var(--accent-gold); border-color:var(--accent-gold); background:rgba(255,184,0,.08); }

        /* COUNTRY LIST */
        .broadcast-country-list { flex:1; overflow-y:auto; padding:8px 0; }
        .broadcast-country-list::-webkit-scrollbar { width:6px; }
        .broadcast-country-list::-webkit-scrollbar-track { background:var(--bg-primary); }
        .broadcast-country-list::-webkit-scrollbar-thumb { background:var(--border-primary); border-radius:3px; }
        .broadcast-country-list::-webkit-scrollbar-thumb:hover { background:var(--text-muted); }
        .broadcast-country-group { margin-bottom:4px; }
        .broadcast-group-label { padding:6px 14px 4px; font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:2px; color:var(--text-muted); }
        .broadcast-country-row { display:flex; align-items:center; gap:8px; padding:7px 14px; cursor:pointer; transition:all .15s; }
        .broadcast-country-row:hover { background:var(--bg-hover); }
        .broadcast-country-row--active { background:rgba(255,184,0,.08); border-left:2px solid var(--accent-gold); }
        .broadcast-country-flag { font-size:16px; flex-shrink:0; }
        .broadcast-country-name { flex:1; font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .broadcast-country-row--active .broadcast-country-name { color:var(--accent-gold); }
        .broadcast-country-count { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-muted); background:var(--bg-primary); padding:1px 6px; border-radius:8px; min-width:20px; text-align:center; }
        .broadcast-empty-list { padding:24px; text-align:center; font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--text-muted); letter-spacing:1px; }

        /* MAIN AREA */
        .broadcast-main { flex:1; overflow-y:auto; }
        .broadcast-main::-webkit-scrollbar { width:6px; }
        .broadcast-main::-webkit-scrollbar-track { background:var(--bg-primary); }
        .broadcast-main::-webkit-scrollbar-thumb { background:var(--border-primary); border-radius:3px; }

        /* NO SELECTION */
        .broadcast-no-selection { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:24px; opacity:.6; }
        .broadcast-no-text { font-family:'Orbitron','JetBrains Mono',monospace; font-size:13px; letter-spacing:3px; color:var(--text-muted); }
        .broadcast-radar { width:80px; height:80px; border-radius:50%; border:1px solid var(--accent-gold-dim, rgba(255,184,0,.25)); position:relative; overflow:hidden; }
        .broadcast-radar::before { content:''; position:absolute; inset:0; border-radius:50%; border:1px solid var(--accent-gold-dim, rgba(255,184,0,.15)); }
        .broadcast-radar-sweep { position:absolute; top:50%; left:50%; width:50%; height:2px; background:linear-gradient(90deg,var(--accent-gold),transparent); transform-origin:left center; animation:broadcast-sweep 2.5s linear infinite; }
        @keyframes broadcast-sweep { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        /* COUNTRY HEADER */
        .broadcast-content { padding:20px; animation:broadcast-fadein .25s ease; }
        @keyframes broadcast-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .broadcast-country-header { display:flex; align-items:center; gap:16px; padding:16px 20px; background:var(--bg-card); border:1px solid var(--border-primary); border-radius:4px; margin-bottom:16px; }
        .broadcast-header-flag { font-size:36px; }
        .broadcast-header-info { flex:1; }
        .broadcast-header-name { font-family:'Orbitron',var(--font-display); font-size:22px; font-weight:700; color:var(--text-primary); letter-spacing:1px; }
        .broadcast-header-region { font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:2px; color:var(--text-muted); margin-top:4px; text-transform:uppercase; }
        .broadcast-header-stats { display:flex; gap:20px; }
        .broadcast-header-stat { display:flex; flex-direction:column; align-items:center; gap:2px; }
        .broadcast-stat-num { font-family:'Orbitron',var(--font-mono); font-size:20px; font-weight:700; color:var(--accent-gold); }
        .broadcast-stat-lbl { font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:2px; color:var(--text-muted); }

        /* TABS */
        .broadcast-tabs { display:flex; gap:2px; margin-bottom:16px; border-bottom:1px solid var(--border-primary); }
        .broadcast-tab { display:flex; align-items:center; gap:6px; padding:10px 20px; background:none; border:none; border-bottom:2px solid transparent; color:var(--text-muted); font-family:var(--font-display,'JetBrains Mono',monospace); font-size:11px; letter-spacing:1.5px; cursor:pointer; transition:all .2s; }
        .broadcast-tab:hover { color:var(--text-secondary); background:var(--bg-hover); }
        .broadcast-tab--active { color:var(--accent-gold); border-bottom-color:var(--accent-gold); }
        .broadcast-tab-icon { font-size:12px; }
        .broadcast-section { animation:broadcast-fadein .2s ease; }
        .broadcast-empty { padding:40px; text-align:center; font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--text-muted); letter-spacing:1.5px; }

        /* NEWS GRID */
        .broadcast-news-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:12px; }
        .broadcast-news-card { background:var(--bg-card); border:1px solid var(--border-primary); border-radius:4px; padding:16px; cursor:pointer; transition:all .2s; }
        .broadcast-news-card:hover { border-color:var(--accent-gold-dim); background:var(--bg-hover); }
        .broadcast-news-card--active { border-color:var(--accent-gold); box-shadow:0 0 20px rgba(255,184,0,.08); }
        .broadcast-news-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .broadcast-news-info { flex:1; min-width:0; }
        .broadcast-news-name { font-family:var(--font-display,'JetBrains Mono',monospace); font-size:14px; font-weight:700; color:var(--text-primary); letter-spacing:.5px; }
        .broadcast-news-meta { display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; }
        .broadcast-news-desc { font-size:11px; color:var(--text-secondary); margin-top:8px; line-height:1.5; }
        .broadcast-play-indicator { font-size:16px; color:var(--text-muted); flex-shrink:0; transition:color .2s; }
        .broadcast-news-card:hover .broadcast-play-indicator { color:var(--accent-gold); }
        .broadcast-news-card--active .broadcast-play-indicator { color:#FF4444; }

        /* BADGES */
        .broadcast-lang-badge { display:inline-block; padding:2px 8px; background:rgba(0,170,255,.1); color:#00AAFF; border:1px solid rgba(0,170,255,.25); border-radius:2px; font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:1px; font-weight:700; text-transform:uppercase; }
        .broadcast-type-badge { display:inline-block; padding:2px 8px; background:rgba(255,184,0,.1); color:var(--accent-gold); border:1px solid rgba(255,184,0,.25); border-radius:2px; font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:1px; font-weight:700; text-transform:uppercase; }

        /* VIDEO EMBED */
        .broadcast-video-wrap { margin-top:14px; position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:3px; border:1px solid var(--border-primary); background:#000; }
        .broadcast-iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:none; }

        /* RADIO LIST */
        .broadcast-radio-list { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
        .broadcast-radio-row { display:flex; align-items:center; gap:10px; padding:12px 16px; background:var(--bg-card); border:1px solid var(--border-primary); border-radius:4px; transition:all .2s; }
        .broadcast-radio-row:hover { border-color:var(--accent-gold-dim); }
        .broadcast-radio-row--active { border-color:var(--accent-gold); background:rgba(255,184,0,.04); }
        .broadcast-radio-btn { width:32px; height:32px; border-radius:50%; border:1px solid var(--border-primary); background:var(--bg-primary); color:var(--text-muted); font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; flex-shrink:0; }
        .broadcast-radio-btn:hover { border-color:var(--accent-gold); color:var(--accent-gold); }
        .broadcast-radio-row--active .broadcast-radio-btn { border-color:#FF4444; color:#FF4444; background:rgba(255,68,68,.08); }
        .broadcast-radio-info { flex:1; min-width:0; }
        .broadcast-radio-name { font-family:var(--font-display,'JetBrains Mono',monospace); font-size:13px; font-weight:700; color:var(--text-primary); letter-spacing:.5px; }
        .broadcast-radio-desc { font-size:10px; color:var(--text-secondary); margin-top:3px; line-height:1.4; }
        .broadcast-pulse { width:8px; height:8px; border-radius:50%; background:#44CC44; flex-shrink:0; animation:broadcast-pulse-anim 1.2s ease-in-out infinite; box-shadow:0 0 6px #44CC44; }
        @keyframes broadcast-pulse-anim { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }

        /* AUDIO PLAYER */
        .broadcast-audio { width:100%; height:36px; border-radius:4px; outline:none; filter:invert(1) hue-rotate(180deg) brightness(.85); }
      `}</style>
    </div>
  )
}
