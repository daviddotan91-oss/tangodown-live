import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import OrgDossier from './OrgDossier'

function simulateForces(nodes, connections, size, damping = 1.0) {
  const { w, h } = size
  const pad = 50

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      let dx = b.x - a.x, dy = b.y - a.y
      let dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dist = 1 }
      const minDist = (a.radius + b.radius) * 4
      if (dist < minDist) {
        const force = ((minDist - dist) / minDist) * 3 * damping
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx -= fx; a.vy -= fy
        b.vx += fx; b.vy += fy
      }
    }
  }

  connections.forEach(conn => {
    if (conn.type === 'adversary') return
    const src = nodes.find(n => n.id === conn.source)
    const tgt = nodes.find(n => n.id === conn.target)
    if (!src || !tgt) return
    const dx = tgt.x - src.x, dy = tgt.y - src.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const idealDist = 160
    if (dist > idealDist) {
      const force = ((dist - idealDist) / dist) * 0.12 * damping
      src.vx += dx * force; src.vy += dy * force
      tgt.vx -= dx * force; tgt.vy -= dy * force
    }
  })

  nodes.forEach(n => {
    n.vx *= 0.82
    n.vy *= 0.82
    n.x += n.vx
    n.y += n.vy
    n.x = Math.max(pad, Math.min(w - pad, n.x))
    n.y = Math.max(pad, Math.min(h - pad, n.y))
  })
}

function NetworkGraph({ organizations, networks, onOrgSelect, selectedOrg }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const nodesRef = useRef([])
  const animRef = useRef(null)
  const timeRef = useRef(0)
  const sizeRef = useRef({ w: 900, h: 600 })

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current || !canvasRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const w = Math.floor(rect.width)
      const h = Math.floor(rect.height)
      if (w > 0 && h > 0) {
        canvasRef.current.width = w
        canvasRef.current.height = h
        sizeRef.current = { w, h }
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !organizations.length) return
    const ctx = canvas.getContext('2d')
    const connections = networks.connections || []
    const clusters = networks.clusters || []

    const clusterPositions = {
      'axis-of-resistance': { fx: 0.28, fy: 0.38 },
      'aq-network': { fx: 0.75, fy: 0.30 },
      'isis-network': { fx: 0.62, fy: 0.72 },
    }
    const unclusteredPositions = [
      { fx: 0.12, fy: 0.72 }, { fx: 0.90, fy: 0.68 },
      { fx: 0.48, fy: 0.88 }, { fx: 0.15, fy: 0.45 },
      { fx: 0.88, fy: 0.42 }, { fx: 0.50, fy: 0.12 },
    ]

    const w = sizeRef.current.w
    const h = sizeRef.current.h
    let ucIdx = 0

    nodesRef.current = organizations.map((org) => {
      const cluster = clusters.find(c => c.members.includes(org.id))
      const cp = cluster ? clusterPositions[cluster.id] : null
      let cx, cy
      if (cp) {
        const memberIdx = cluster.members.indexOf(org.id)
        const total = cluster.members.length
        const angle = (memberIdx / total) * Math.PI * 2 - Math.PI / 2
        const spread = Math.min(w, h) * 0.13
        cx = cp.fx * w + Math.cos(angle) * spread
        cy = cp.fy * h + Math.sin(angle) * spread
      } else {
        const up = unclusteredPositions[ucIdx % unclusteredPositions.length]
        cx = up.fx * w; cy = up.fy * h
        ucIdx++
      }
      return {
        id: org.id, x: cx, y: cy, vx: 0, vy: 0,
        name: org.name, color: org.color || '#FF4444',
        radius: Math.min(24, Math.max(10, (org.estimatedStrength?.match(/[\d,]+/)?.[0]?.replace(/,/g, '') || 10000) / 10000 + 8)),
        clusterId: cluster?.id || null,
      }
    })

    for (let tick = 0; tick < 150; tick++) {
      simulateForces(nodesRef.current, connections, sizeRef.current)
    }

    timeRef.current = 0

    const draw = () => {
      const cw = sizeRef.current.w
      const ch = sizeRef.current.h
      timeRef.current += 0.006

      simulateForces(nodesRef.current, connections, sizeRef.current, 0.015)

      ctx.clearRect(0, 0, cw, ch)

      // Subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.015)'
      ctx.lineWidth = 0.5
      for (let x = 0; x < cw; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke() }
      for (let y = 0; y < ch; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke() }

      // Connections
      connections.forEach(conn => {
        const src = nodesRef.current.find(n => n.id === conn.source)
        const tgt = nodesRef.current.find(n => n.id === conn.target)
        if (!src || !tgt) return
        const isAdversary = conn.type === 'adversary'

        ctx.beginPath()
        ctx.moveTo(src.x, src.y)
        ctx.lineTo(tgt.x, tgt.y)

        if (isAdversary) {
          ctx.setLineDash([4, 4])
          ctx.strokeStyle = 'rgba(255, 45, 45, 0.2)'
          ctx.lineWidth = 1
        } else {
          ctx.setLineDash([])
          const alpha = Math.min(0.45, conn.strength / 18)
          const flowColor = conn.type === 'funding' ? '#FFB800' :
            conn.type === 'command' ? '#FF4444' :
            conn.type === 'affiliate' ? '#00AAFF' :
            conn.type === 'training' ? '#44CC44' : '#00AAFF'
          ctx.strokeStyle = flowColor + Math.round(alpha * 255).toString(16).padStart(2, '0')
          ctx.lineWidth = Math.max(0.8, conn.strength / 5)
        }
        ctx.stroke()
        ctx.setLineDash([])

        // Flow particle
        if (!isAdversary && conn.strength > 4) {
          const t = (timeRef.current * (1 + conn.strength * 0.08)) % 1
          const px = src.x + (tgt.x - src.x) * t
          const py = src.y + (tgt.y - src.y) * t
          ctx.beginPath()
          ctx.arc(px, py, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = conn.type === 'funding' ? '#FFB800' : '#00AAFF'
          ctx.globalAlpha = 0.6
          ctx.fill()
          ctx.globalAlpha = 1
        }
      })

      // Nodes
      nodesRef.current.forEach(node => {
        const isSel = selectedOrg?.id === node.id
        const pulse = Math.sin(timeRef.current * 2.5 + node.x * 0.005) * 0.08 + 1

        // Glow
        if (isSel) {
          const grad = ctx.createRadialGradient(node.x, node.y, node.radius, node.x, node.y, node.radius * 3)
          grad.addColorStop(0, node.color + '30')
          grad.addColorStop(1, 'transparent')
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        }

        // Circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2)
        ctx.fillStyle = node.color + (isSel ? '88' : '44')
        ctx.fill()
        ctx.strokeStyle = isSel ? '#ffffff' : node.color + '88'
        ctx.lineWidth = isSel ? 1.5 : 0.8
        ctx.stroke()

        // Inner dot
        ctx.beginPath()
        ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()

        // Label
        ctx.font = isSel ? '600 10px "JetBrains Mono", monospace' : '400 9px "JetBrains Mono", monospace'
        ctx.fillStyle = isSel ? '#ffffff' : 'rgba(160,170,185,0.8)'
        ctx.textAlign = 'center'
        ctx.fillText(node.name.toUpperCase(), node.x, node.y + node.radius + 14)
      })

      // Cluster labels
      clusters.forEach(cluster => {
        const members = nodesRef.current.filter(n => cluster.members.includes(n.id))
        if (!members.length) return
        const cx = members.reduce((s, m) => s + m.x, 0) / members.length
        const cy = Math.min(...members.map(m => m.y)) - 35
        ctx.font = '500 8px "JetBrains Mono", monospace'
        ctx.fillStyle = (cluster.color || '#666') + '66'
        ctx.textAlign = 'center'
        ctx.letterSpacing = '2px'
        ctx.fillText(cluster.name.toUpperCase(), cx, cy)
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [organizations, networks, selectedOrg])

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width)
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height)
    for (const node of nodesRef.current) {
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      if (dist < node.radius + 10) {
        const org = organizations.find(o => o.id === node.id)
        if (org) onOrgSelect(org)
        return
      }
    }
  }

  return (
    <div className="net-graph-wrap" ref={containerRef}>
      <canvas ref={canvasRef} width={900} height={600} className="net-graph-canvas" onClick={handleClick} />
      <div className="net-legend">
        <div className="net-legend-row"><span className="net-legend-line" style={{ background: '#FFB800' }} /><span>FUNDING</span></div>
        <div className="net-legend-row"><span className="net-legend-line" style={{ background: '#FF4444' }} /><span>COMMAND</span></div>
        <div className="net-legend-row"><span className="net-legend-line" style={{ background: '#00AAFF' }} /><span>AFFILIATE</span></div>
        <div className="net-legend-row"><span className="net-legend-line" style={{ background: '#44CC44' }} /><span>TRAINING</span></div>
        <div className="net-legend-row"><span className="net-legend-line net-legend-dashed" /><span>ADVERSARY</span></div>
      </div>
    </div>
  )
}

function OrgListSidebar({ organizations, networks, leaders, selectedOrg, onOrgSelect }) {
  const clusters = networks.clusters || []

  const getCluster = (orgId) => clusters.find(c => c.members.includes(orgId))

  const getDesignations = (org) => {
    const badges = []
    if (org.usDesignation?.status?.includes('Terrorist')) badges.push('US FTO')
    if (org.euDesignation?.status?.includes('Terrorist')) badges.push('EU')
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
                    <span className="net-elim-count">☠ {elimCount}</span>
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

export default function NetworksView() {
  const [organizations, setOrganizations] = useState([])
  const [leaders, setLeaders] = useState({ eliminated: [], active: [] })
  const [networks, setNetworks] = useState({ connections: [], clusters: [] })
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/data/organizations.json').then(r => r.json()),
      fetch('/data/leaders.json').then(r => r.json()),
      fetch('/data/networks.json').then(r => r.json())
    ]).then(([orgs, ldrs, nets]) => {
      setOrganizations(orgs)
      setLeaders(ldrs)
      setNetworks(nets)
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
      {/* Left sidebar — org list */}
      <OrgListSidebar
        organizations={organizations}
        networks={networks}
        leaders={leaders}
        selectedOrg={selectedOrg}
        onOrgSelect={setSelectedOrg}
      />

      {/* Center — graph */}
      <div className="net-center">
        <NetworkGraph
          organizations={organizations}
          networks={networks}
          onOrgSelect={setSelectedOrg}
          selectedOrg={selectedOrg}
        />
      </div>

      {/* Right — dossier */}
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
            <div className="dossier-empty-icon">⬡</div>
            <div className="dossier-empty-text">SELECT AN ORGANIZATION</div>
            <div className="dossier-empty-sub">Click a node or list item to view intel</div>
          </div>
        )}
      </div>
    </div>
  )
}
