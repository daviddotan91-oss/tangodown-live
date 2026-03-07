import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { feature } from 'topojson-client'
import OrgDossier from './OrgDossier'

/* ──────────────────────────────────────────────
   Equirectangular projection helpers
   ────────────────────────────────────────────── */
function project(lat, lng, bounds) {
  // bounds: { x, y, w, h, lonMin, lonMax, latMin, latMax }
  const x = bounds.x + ((lng - bounds.lonMin) / (bounds.lonMax - bounds.lonMin)) * bounds.w
  const y = bounds.y + ((bounds.latMax - lat) / (bounds.latMax - bounds.latMin)) * bounds.h
  return [x, y]
}

function projectGeoCoords(coords, bounds) {
  return coords.map(ring =>
    ring.map(([lng, lat]) => project(lat, lng, bounds))
  )
}

/* ──────────────────────────────────────────────
   Tactical Flat Map — center panel
   ────────────────────────────────────────────── */
function TacticalMap({ organizations, networks, onOrgSelect, selectedOrg, geoData }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const animRef = useRef(null)
  const timeRef = useRef(0)
  const sizeRef = useRef({ w: 900, h: 600 })
  const dprRef = useRef(window.devicePixelRatio || 1)
  const hoveredRef = useRef(null)
  const nodesRef = useRef([])

  // Viewport / map bounds — focus on Africa + Middle East + South/Central Asia
  const mapBounds = useMemo(() => ({
    lonMin: -25, lonMax: 80,
    latMin: -10, latMax: 52,
  }), [])

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current || !canvasRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const w = Math.floor(rect.width)
      const h = Math.floor(rect.height)
      if (w > 0 && h > 0) {
        canvasRef.current.width = w * dpr
        canvasRef.current.height = h * dpr
        canvasRef.current.style.width = w + 'px'
        canvasRef.current.style.height = h + 'px'
        sizeRef.current = { w, h }
        dprRef.current = dpr
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Build node positions from org territory coords
  useEffect(() => {
    if (!organizations.length) return
    const cw = sizeRef.current.w
    const ch = sizeRef.current.h
    const pad = 30
    const bounds = {
      x: pad, y: pad, w: cw - pad * 2, h: ch - pad * 2,
      ...mapBounds
    }
    const rawNodes = organizations.map(org => {
      const coords = org.territoryCoords?.[0] || [20, 40]
      const [px, py] = project(coords[0], coords[1], bounds)
      return {
        id: org.id,
        name: org.name,
        color: org.color || '#FF4444',
        x: px, y: py,
        lat: coords[0], lng: coords[1],
        radius: 8,
      }
    })
    // De-overlap nodes that share same or very close coords
    for (let i = 0; i < rawNodes.length; i++) {
      for (let j = i + 1; j < rawNodes.length; j++) {
        const a = rawNodes[i], b = rawNodes[j]
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 28) {
          const angle = (j * 2.2) + i * 0.5
          const offset = 20
          b.x += Math.cos(angle) * offset
          b.y += Math.sin(angle) * offset
          a.x -= Math.cos(angle) * offset * 0.5
          a.y -= Math.sin(angle) * offset * 0.5
        }
      }
    }
    nodesRef.current = rawNodes
  }, [organizations, mapBounds])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !organizations.length || !geoData) return
    const ctx = canvas.getContext('2d')
    const connections = networks.connections || []
    const clusters = networks.clusters || []

    const typeColors = {
      funding: '#FFB800',
      command: '#FF4444',
      affiliate: '#00AAFF',
      training: '#44CC44',
      coordination: '#FF6644',
      influence: '#FFB800',
      membership: '#00AAFF',
      adversary: '#FF2244',
    }

    timeRef.current = 0

    const draw = () => {
      const dpr = dprRef.current
      const cw = sizeRef.current.w
      const ch = sizeRef.current.h
      const pad = 30
      timeRef.current += 0.004

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cw, ch)

      const bounds = {
        x: pad, y: pad, w: cw - pad * 2, h: ch - pad * 2,
        ...mapBounds
      }

      // ── Background grid ──
      ctx.strokeStyle = 'rgba(255,255,255,0.02)'
      ctx.lineWidth = 0.5
      // Longitude lines
      for (let lon = Math.ceil(mapBounds.lonMin / 10) * 10; lon <= mapBounds.lonMax; lon += 10) {
        const [x] = project(0, lon, bounds)
        ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, ch - pad); ctx.stroke()
      }
      // Latitude lines
      for (let lat = Math.ceil(mapBounds.latMin / 10) * 10; lat <= mapBounds.latMax; lat += 10) {
        const [, y] = project(lat, 0, bounds)
        ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(cw - pad, y); ctx.stroke()
      }

      // ── Country polygons ──
      if (geoData?.features) {
        geoData.features.forEach(feat => {
          const geom = feat.geometry
          if (!geom) return
          const polys = geom.type === 'Polygon' ? [geom.coordinates] :
                        geom.type === 'MultiPolygon' ? geom.coordinates : []
          polys.forEach(polygon => {
            const projected = projectGeoCoords(polygon, bounds)
            projected.forEach(ring => {
              if (ring.length < 3) return
              ctx.beginPath()
              ctx.moveTo(ring[0][0], ring[0][1])
              for (let i = 1; i < ring.length; i++) {
                ctx.lineTo(ring[i][0], ring[i][1])
              }
              ctx.closePath()
              ctx.fillStyle = '#0e1018'
              ctx.fill()
              ctx.strokeStyle = 'rgba(255,255,255,0.06)'
              ctx.lineWidth = 0.5
              ctx.stroke()
            })
          })
        })
      }

      // ── Scan line ──
      const scanY = (timeRef.current * 25) % ch
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40)
      scanGrad.addColorStop(0, 'transparent')
      scanGrad.addColorStop(0.5, 'rgba(255,68,68,0.018)')
      scanGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 40, cw, 80)

      // ── Cluster territory zones ──
      clusters.forEach(cluster => {
        const members = nodesRef.current.filter(n => cluster.members.includes(n.id))
        if (members.length < 2) return
        const cx = members.reduce((s, m) => s + m.x, 0) / members.length
        const cy = members.reduce((s, m) => s + m.y, 0) / members.length
        // Draw soft zone
        const maxDist = Math.max(60, ...members.map(m =>
          Math.sqrt((m.x - cx) ** 2 + (m.y - cy) ** 2)
        )) + 50
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxDist)
        const zoneColor = cluster.color || '#444'
        grad.addColorStop(0, zoneColor + '12')
        grad.addColorStop(0.7, zoneColor + '08')
        grad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(cx, cy, maxDist, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      })

      // ── Connection arcs ──
      connections.forEach(conn => {
        const src = nodesRef.current.find(n => n.id === conn.source)
        const tgt = nodesRef.current.find(n => n.id === conn.target)
        if (!src || !tgt) return
        const isAdversary = conn.type === 'adversary'
        const isHighlighted = selectedOrg && (conn.source === selectedOrg.id || conn.target === selectedOrg.id)
        const dimmed = selectedOrg && !isHighlighted

        const dx = tgt.x - src.x
        const dy = tgt.y - src.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        // Arc curve offset — perpendicular
        const curveFactor = Math.min(dist * 0.2, 60)
        const nx = -dy / (dist || 1) * curveFactor
        const ny = dx / (dist || 1) * curveFactor
        const cpx = (src.x + tgt.x) / 2 + nx
        const cpy = (src.y + tgt.y) / 2 + ny

        // Line glow (highlighted)
        if (isHighlighted && !isAdversary) {
          ctx.beginPath()
          ctx.moveTo(src.x, src.y)
          ctx.quadraticCurveTo(cpx, cpy, tgt.x, tgt.y)
          ctx.strokeStyle = (typeColors[conn.type] || '#00AAFF') + '15'
          ctx.lineWidth = 8
          ctx.stroke()
        }

        // Main line
        ctx.beginPath()
        ctx.moveTo(src.x, src.y)
        ctx.quadraticCurveTo(cpx, cpy, tgt.x, tgt.y)
        if (isAdversary) {
          ctx.setLineDash([5, 4])
          ctx.strokeStyle = dimmed ? 'rgba(255,34,68,0.05)' : isHighlighted ? 'rgba(255,34,68,0.5)' : 'rgba(255,34,68,0.12)'
          ctx.lineWidth = isHighlighted ? 1.5 : 0.8
        } else {
          ctx.setLineDash([])
          const alpha = dimmed ? 0.06 : isHighlighted ? 0.65 : Math.min(0.35, conn.strength / 18)
          const color = typeColors[conn.type] || '#00AAFF'
          ctx.strokeStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0')
          ctx.lineWidth = isHighlighted ? Math.max(2, conn.strength / 4) : Math.max(0.8, conn.strength / 6)
        }
        ctx.stroke()
        ctx.setLineDash([])

        // Flow particles
        if (!isAdversary && !dimmed && (conn.strength > 3 || isHighlighted)) {
          const count = isHighlighted ? 3 : 1
          for (let p = 0; p < count; p++) {
            const t = ((timeRef.current * (0.6 + conn.strength * 0.05)) + p / count) % 1
            const t1 = 1 - t
            const px = t1 * t1 * src.x + 2 * t1 * t * cpx + t * t * tgt.x
            const py = t1 * t1 * src.y + 2 * t1 * t * cpy + t * t * tgt.y
            const color = typeColors[conn.type] || '#00AAFF'
            const size = isHighlighted ? 3 : 2

            // Glow
            const pGrad = ctx.createRadialGradient(px, py, 0, px, py, size * 5)
            pGrad.addColorStop(0, color + '55')
            pGrad.addColorStop(1, 'transparent')
            ctx.beginPath()
            ctx.arc(px, py, size * 5, 0, Math.PI * 2)
            ctx.fillStyle = pGrad
            ctx.fill()

            ctx.beginPath()
            ctx.arc(px, py, size, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.globalAlpha = isHighlighted ? 0.95 : 0.7
            ctx.fill()
            ctx.globalAlpha = 1
          }
        }
      })

      // ── Organization nodes ──
      const hovered = hoveredRef.current
      nodesRef.current.forEach(node => {
        const isSel = selectedOrg?.id === node.id
        const isHov = hovered === node.id
        const isConnected = selectedOrg && connections.some(c =>
          (c.source === selectedOrg.id && c.target === node.id) ||
          (c.target === selectedOrg.id && c.source === node.id)
        )
        const isActive = isSel || isHov || isConnected || !selectedOrg
        const dimAlpha = isActive ? 1 : 0.2

        const pulse = Math.sin(timeRef.current * 3 + node.x * 0.02) * 0.15 + 1
        const r = node.radius * (isSel ? 1.4 : isHov ? 1.2 : 1) * pulse

        ctx.globalAlpha = dimAlpha

        // Outer threat ring (large, soft)
        if (isSel || isHov) {
          const ringR = r * 5
          const ringGrad = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, ringR)
          ringGrad.addColorStop(0, node.color + '28')
          ringGrad.addColorStop(0.5, node.color + '0a')
          ringGrad.addColorStop(1, 'transparent')
          ctx.beginPath()
          ctx.arc(node.x, node.y, ringR, 0, Math.PI * 2)
          ctx.fillStyle = ringGrad
          ctx.fill()
        }

        // Animated radar ring on selected
        if (isSel) {
          const radarT = (timeRef.current * 1.5) % 1
          const radarR = r + radarT * 35
          ctx.beginPath()
          ctx.arc(node.x, node.y, radarR, 0, Math.PI * 2)
          ctx.strokeStyle = node.color + Math.round((1 - radarT) * 60).toString(16).padStart(2, '0')
          ctx.lineWidth = 1.5 * (1 - radarT)
          ctx.stroke()
        }

        // Diamond/hex marker shape
        ctx.beginPath()
        // Use diamond for better tactical look
        const dr = r
        ctx.moveTo(node.x, node.y - dr)
        ctx.lineTo(node.x + dr * 0.8, node.y)
        ctx.lineTo(node.x, node.y + dr)
        ctx.lineTo(node.x - dr * 0.8, node.y)
        ctx.closePath()

        // Fill
        const bodyGrad = ctx.createRadialGradient(node.x, node.y - r * 0.3, 0, node.x, node.y, r * 1.2)
        bodyGrad.addColorStop(0, node.color + (isSel ? 'dd' : '99'))
        bodyGrad.addColorStop(1, node.color + (isSel ? '55' : '22'))
        ctx.fillStyle = bodyGrad
        ctx.fill()

        // Border
        ctx.strokeStyle = isSel ? '#ffffffcc' : isHov ? '#ffffff88' : node.color + '88'
        ctx.lineWidth = isSel ? 2 : 1
        ctx.stroke()

        // Center dot
        ctx.beginPath()
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()

        // Label
        const label = node.name.toUpperCase()
        const fontSize = isSel ? 10 : isHov ? 9.5 : 8.5
        ctx.font = `${isSel ? 700 : 500} ${fontSize}px "JetBrains Mono", monospace`
        const tw = ctx.measureText(label).width
        const labelY = node.y + r + 14
        const labelX = node.x

        // Label bg pill
        const px2 = 5, py2 = 3
        ctx.fillStyle = 'rgba(8,8,14,0.82)'
        ctx.beginPath()
        ctx.roundRect(labelX - tw / 2 - px2, labelY - fontSize + 1 - py2, tw + px2 * 2, fontSize + py2 * 2, 3)
        ctx.fill()
        if (isSel) {
          ctx.strokeStyle = node.color + '44'
          ctx.lineWidth = 0.5
          ctx.stroke()
        }

        ctx.fillStyle = isSel ? '#ffffff' : isHov ? '#ccccdd' : 'rgba(140,150,170,0.85)'
        ctx.textAlign = 'center'
        ctx.fillText(label, labelX, labelY + 1)

        ctx.globalAlpha = 1
      })

      // ── Cluster labels ──
      clusters.forEach(cluster => {
        const members = nodesRef.current.filter(n => cluster.members.includes(n.id))
        if (members.length < 2) return
        const cx = members.reduce((s, m) => s + m.x, 0) / members.length
        const topY = Math.min(...members.map(m => m.y))
        const labelY = topY - 35
        const label = cluster.name.toUpperCase()
        ctx.font = '600 8px "JetBrains Mono", monospace'
        const tw = ctx.measureText(label).width

        // Bg
        ctx.fillStyle = 'rgba(8,8,14,0.7)'
        ctx.beginPath()
        ctx.roundRect(cx - tw / 2 - 10, labelY - 8, tw + 20, 16, 3)
        ctx.fill()
        ctx.strokeStyle = (cluster.color || '#666') + '33'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.fillStyle = (cluster.color || '#888') + 'bb'
        ctx.textAlign = 'center'
        ctx.fillText(label, cx, labelY + 3)
      })

      // ── Coordinate labels on edges ──
      ctx.font = '400 7px "JetBrains Mono", monospace'
      ctx.fillStyle = 'rgba(100,110,130,0.3)'
      ctx.textAlign = 'center'
      for (let lon = Math.ceil(mapBounds.lonMin / 20) * 20; lon <= mapBounds.lonMax; lon += 20) {
        const [x] = project(mapBounds.latMin, lon, bounds)
        ctx.fillText(`${Math.abs(lon)}${lon >= 0 ? 'E' : 'W'}`, x, ch - pad + 12)
      }
      ctx.textAlign = 'right'
      for (let lat = Math.ceil(mapBounds.latMin / 20) * 20; lat <= mapBounds.latMax; lat += 20) {
        const [, y] = project(lat, mapBounds.lonMin, bounds)
        ctx.fillText(`${Math.abs(lat)}${lat >= 0 ? 'N' : 'S'}`, pad - 6, y + 3)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [organizations, networks, selectedOrg, geoData, mapBounds])

  const getNodeAtPos = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    for (const node of nodesRef.current) {
      const dist = Math.sqrt((mx - node.x) ** 2 + (my - node.y) ** 2)
      if (dist < node.radius + 14) return node
    }
    return null
  }, [])

  const handleClick = useCallback((e) => {
    const node = getNodeAtPos(e)
    if (node) {
      const org = organizations.find(o => o.id === node.id)
      if (org) onOrgSelect(org)
    }
  }, [organizations, onOrgSelect, getNodeAtPos])

  const handleMouseMove = useCallback((e) => {
    const node = getNodeAtPos(e)
    hoveredRef.current = node?.id || null
    canvasRef.current.style.cursor = node ? 'pointer' : 'default'
  }, [getNodeAtPos])

  return (
    <div className="net-graph-wrap" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="net-graph-canvas"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />
      <div className="net-legend">
        <div className="net-legend-title">LINK TYPES</div>
        <div className="net-legend-row"><span className="net-legend-line" style={{ background: '#FFB800' }} /><span>FUNDING</span></div>
        <div className="net-legend-row"><span className="net-legend-line" style={{ background: '#FF4444' }} /><span>COMMAND</span></div>
        <div className="net-legend-row"><span className="net-legend-line" style={{ background: '#00AAFF' }} /><span>AFFILIATE</span></div>
        <div className="net-legend-row"><span className="net-legend-line" style={{ background: '#44CC44' }} /><span>TRAINING</span></div>
        <div className="net-legend-row"><span className="net-legend-line net-legend-dashed" /><span>ADVERSARY</span></div>
      </div>
      <div className="net-map-label">
        <span className="net-map-label-dot" />
        GEOSPATIAL NETWORK OVERLAY
      </div>
      {selectedOrg && (
        <div className="net-graph-selected-label">
          <span className="net-graph-sel-dot" style={{ background: selectedOrg.color }} />
          {selectedOrg.name.toUpperCase()}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────
   Left sidebar — org list
   ────────────────────────────────────────────── */
function OrgListSidebar({ organizations, networks, leaders, selectedOrg, onOrgSelect }) {
  const clusters = networks.clusters || []

  const getCluster = (orgId) => clusters.find(c => c.members.includes(orgId))

  const getDesignations = (org) => {
    const badges = []
    if (org.usDesignation?.status?.includes('Terrorist')) badges.push('US FTO')
    if (org.euDesignation?.status?.includes('Terrorist') || org.euDesignation?.status?.includes('Designated')) badges.push('EU')
    if (org.israelDesignation?.status?.includes('Terrorist')) badges.push('IL')
    return badges
  }

  const sorted = useMemo(() => {
    const order = ['axis-of-resistance', 'aq-network', 'isis-network', null]
    return [...organizations].sort((a, b) => {
      const ca = getCluster(a.id)?.id || null
      const cb = getCluster(b.id)?.id || null
      return order.indexOf(ca) - order.indexOf(cb)
    })
  }, [organizations, clusters])

  let lastCluster = undefined

  return (
    <div className="net-sidebar">
      <div className="net-sidebar-header">
        <div className="net-sidebar-title">THREAT ORGANIZATIONS</div>
        <div className="net-sidebar-count">{organizations.length}</div>
      </div>
      <div className="net-sidebar-list">
        {sorted.map(org => {
          const cluster = getCluster(org.id)
          const showClusterHeader = cluster?.id !== lastCluster
          lastCluster = cluster?.id || null
          const desigs = getDesignations(org)
          const isSel = selectedOrg?.id === org.id
          const elimCount = leaders.eliminated?.filter(l => l.orgId === org.id).length || 0

          return (
            <React.Fragment key={org.id}>
              {showClusterHeader && (
                <div className="net-cluster-label" style={{ color: cluster?.color || '#555' }}>
                  <span className="net-cluster-line" style={{ background: cluster?.color || '#555' }} />
                  {cluster?.name?.toUpperCase() || 'INDEPENDENT'}
                </div>
              )}
              <div
                className={`net-org-row ${isSel ? 'selected' : ''}`}
                onClick={() => onOrgSelect(org)}
              >
                <div className="net-org-dot" style={{ backgroundColor: org.color || '#FF4444' }} />
                <div className="net-org-info">
                  <div className="net-org-name">{org.name}</div>
                  <div className="net-org-sub">{org.ideology?.split(',')[0]}</div>
                </div>
                <div className="net-org-badges">
                  {desigs.map(d => (
                    <span key={d} className={`net-desig ${d.toLowerCase().replace(' ', '-')}`}>{d}</span>
                  ))}
                  {elimCount > 0 && (
                    <span className="net-elim-count">{elimCount}</span>
                  )}
                </div>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Main networks view
   ────────────────────────────────────────────── */
export default function NetworksView() {
  const [organizations, setOrganizations] = useState([])
  const [leaders, setLeaders] = useState({ eliminated: [], active: [] })
  const [networks, setNetworks] = useState({ connections: [], clusters: [] })
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [geoData, setGeoData] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/data/organizations.json').then(r => r.json()),
      fetch('/data/leaders.json').then(r => r.json()),
      fetch('/data/networks.json').then(r => r.json()),
      import('world-atlas/countries-110m.json').then(m => m.default || m)
    ]).then(([orgs, ldrs, nets, worldTopo]) => {
      setOrganizations(orgs)
      setLeaders(ldrs)
      setNetworks(nets)
      const countries = feature(worldTopo, worldTopo.objects.countries)
      setGeoData(countries)
      setLoading(false)
    })
  }, [])

  const orgLeaders = useMemo(() => {
    if (!selectedOrg) return { eliminated: [], active: [] }
    return {
      eliminated: leaders.eliminated.filter(l => l.orgId === selectedOrg.id),
      active: leaders.active.filter(l => l.orgId === selectedOrg.id)
    }
  }, [selectedOrg, leaders])

  const orgConnections = useMemo(() => {
    if (!selectedOrg) return []
    return networks.connections?.filter(c => c.source === selectedOrg.id || c.target === selectedOrg.id) || []
  }, [selectedOrg, networks])

  if (loading) {
    return (
      <div className="networks-loading">
        <div className="loading-subtitle">LOADING INTELLIGENCE DATABASE...</div>
      </div>
    )
  }

  return (
    <div className="networks-view">
      <OrgListSidebar
        organizations={organizations}
        networks={networks}
        leaders={leaders}
        selectedOrg={selectedOrg}
        onOrgSelect={setSelectedOrg}
      />

      <div className="net-center">
        <TacticalMap
          organizations={organizations}
          networks={networks}
          onOrgSelect={setSelectedOrg}
          selectedOrg={selectedOrg}
          geoData={geoData}
        />
      </div>

      <div className={`networks-dossier-panel ${selectedOrg ? 'open' : ''}`}>
        {selectedOrg ? (
          <OrgDossier
            org={selectedOrg}
            leaders={orgLeaders}
            connections={orgConnections}
            allOrgs={organizations}
            onOrgSelect={setSelectedOrg}
            onClose={() => setSelectedOrg(null)}
          />
        ) : (
          <div className="dossier-empty">
            <div className="dossier-empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <polygon points="24,4 44,16 44,32 24,44 4,32 4,16" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
                <polygon points="24,12 36,19 36,29 24,36 12,29 12,19" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.15" />
              </svg>
            </div>
            <div className="dossier-empty-text">SELECT AN ORGANIZATION</div>
            <div className="dossier-empty-sub">Click a node or list item to view intel dossier</div>
          </div>
        )}
      </div>
    </div>
  )
}
