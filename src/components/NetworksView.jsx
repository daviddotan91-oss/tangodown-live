import React, { useState, useEffect, useMemo, useRef } from 'react'
import OrgDossier from './OrgDossier'

function simulateForces(nodes, connections, size, damping = 1.0) {
  const { w, h } = size
  const pad = 60

  // Repulsion between all nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]
      let dx = b.x - a.x, dy = b.y - a.y
      let dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dist = 1 }
      const minDist = (a.radius + b.radius) * 3.5
      if (dist < minDist) {
        const force = ((minDist - dist) / minDist) * 2.5 * damping
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx -= fx; a.vy -= fy
        b.vx += fx; b.vy += fy
      }
    }
  }

  // Attraction along connections (keep connected nodes closer)
  connections.forEach(conn => {
    if (conn.type === 'adversary') return
    const src = nodes.find(n => n.id === conn.source)
    const tgt = nodes.find(n => n.id === conn.target)
    if (!src || !tgt) return
    const dx = tgt.x - src.x, dy = tgt.y - src.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const idealDist = 180
    if (dist > idealDist) {
      const force = ((dist - idealDist) / dist) * 0.15 * damping
      src.vx += dx * force; src.vy += dy * force
      tgt.vx -= dx * force; tgt.vy -= dy * force
    }
  })

  // Apply velocity with damping + keep in bounds
  nodes.forEach(n => {
    n.vx *= 0.85
    n.vy *= 0.85
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
  const sizeRef = useRef({ w: 1200, h: 700 })

  // Resize canvas to fill container
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

  // Initialize nodes + run force sim + draw loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !organizations.length) return
    const ctx = canvas.getContext('2d')
    const connections = networks.connections || []
    const clusters = networks.clusters || []

    // Build cluster centers — spread them well apart
    const clusterPositions = {
      'axis-of-resistance': { fx: 0.25, fy: 0.35 },
      'aq-network': { fx: 0.75, fy: 0.28 },
      'isis-network': { fx: 0.60, fy: 0.72 },
    }

    // Init nodes
    const w = sizeRef.current.w
    const h = sizeRef.current.h
    let unclusteredIdx = 0
    const unclusteredPositions = [
      { fx: 0.12, fy: 0.75 }, { fx: 0.88, fy: 0.65 },
      { fx: 0.45, fy: 0.85 }, { fx: 0.15, fy: 0.50 },
      { fx: 0.85, fy: 0.45 }, { fx: 0.50, fy: 0.15 },
      { fx: 0.30, fy: 0.80 }, { fx: 0.70, fy: 0.85 },
    ]

    nodesRef.current = organizations.map((org) => {
      const cluster = clusters.find(c => c.members.includes(org.id))
      const cp = cluster ? clusterPositions[cluster.id] : null
      let cx, cy
      if (cp) {
        // Spread members within cluster using a circle layout
        const memberIdx = cluster.members.indexOf(org.id)
        const total = cluster.members.length
        const angle = (memberIdx / total) * Math.PI * 2 - Math.PI / 2
        const spread = Math.min(w, h) * 0.12
        cx = cp.fx * w + Math.cos(angle) * spread
        cy = cp.fy * h + Math.sin(angle) * spread
      } else {
        const up = unclusteredPositions[unclusteredIdx % unclusteredPositions.length]
        cx = up.fx * w
        cy = up.fy * h
        unclusteredIdx++
      }

      return {
        id: org.id,
        x: cx, y: cy,
        vx: 0, vy: 0,
        name: org.name,
        color: org.color || '#FF4444',
        radius: Math.min(28, Math.max(12, (org.estimatedStrength?.match(/[\d,]+/)?.[0]?.replace(/,/g, '') || 10000) / 8000 + 10)),
        clusterId: cluster?.id || null,
      }
    })

    // Run force simulation for initial settling (100 ticks)
    for (let tick = 0; tick < 120; tick++) {
      simulateForces(nodesRef.current, connections, sizeRef.current)
    }

    timeRef.current = 0

    const draw = () => {
      const w = sizeRef.current.w
      const h = sizeRef.current.h
      timeRef.current += 0.008

      // Gentle ongoing forces (very damped)
      simulateForces(nodesRef.current, connections, sizeRef.current, 0.02)

      ctx.clearRect(0, 0, w, h)

      // Draw connections
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
          ctx.strokeStyle = 'rgba(255, 45, 45, 0.25)'
        } else {
          ctx.setLineDash([])
          const alpha = Math.min(0.5, conn.strength / 15)
          const flowColor = conn.type === 'funding' ? '#FFB800' :
            conn.type === 'command' ? '#FF4444' :
            conn.type === 'affiliate' ? '#00AAFF' :
            conn.type === 'training' ? '#44CC44' : '#00AAFF'
          ctx.strokeStyle = flowColor + Math.round(alpha * 255).toString(16).padStart(2, '0')
        }
        ctx.lineWidth = Math.max(1, conn.strength / 4)
        ctx.stroke()
        ctx.setLineDash([])

        // Animated flow particle
        if (!isAdversary && conn.strength > 4) {
          const t = (timeRef.current * (1 + conn.strength * 0.1)) % 1
          const px = src.x + (tgt.x - src.x) * t
          const py = src.y + (tgt.y - src.y) * t
          ctx.beginPath()
          ctx.arc(px, py, 2, 0, Math.PI * 2)
          ctx.fillStyle = conn.type === 'funding' ? '#FFB800' : '#00AAFF'
          ctx.fill()
        }
      })

      // Draw nodes
      nodesRef.current.forEach(node => {
        const isSelected = selectedOrg?.id === node.id
        const pulse = Math.sin(timeRef.current * 3 + node.x * 0.01) * 0.1 + 1

        // Outer glow
        if (isSelected) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2)
          ctx.fillStyle = node.color + '15'
          ctx.fill()
        }

        // Node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2)
        ctx.fillStyle = node.color + (isSelected ? 'cc' : '55')
        ctx.fill()
        ctx.strokeStyle = isSelected ? '#ffffff' : node.color + '99'
        ctx.lineWidth = isSelected ? 2 : 1
        ctx.stroke()

        // Inner dot
        ctx.beginPath()
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()

        // Label
        ctx.font = `${isSelected ? '11' : '9'}px "Orbitron", monospace`
        ctx.fillStyle = isSelected ? '#ffffff' : '#8899aa'
        ctx.textAlign = 'center'
        ctx.fillText(node.name.toUpperCase(), node.x, node.y + node.radius + 16)
      })

      // Cluster labels
      clusters.forEach(cluster => {
        const members = nodesRef.current.filter(n => cluster.members.includes(n.id))
        if (!members.length) return
        const cx = members.reduce((s, m) => s + m.x, 0) / members.length
        const cy = Math.min(...members.map(m => m.y)) - 45
        ctx.font = '10px "JetBrains Mono", monospace'
        ctx.fillStyle = (cluster.color || '#888888') + '88'
        ctx.textAlign = 'center'
        ctx.fillText(cluster.name.toUpperCase(), cx, cy)
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [organizations, networks, selectedOrg])

  // Click detection
  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width)
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height)

    for (const node of nodesRef.current) {
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      if (dist < node.radius + 8) {
        const org = organizations.find(o => o.id === node.id)
        if (org) onOrgSelect(org)
        return
      }
    }
  }

  return (
    <div className="network-graph-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={1200}
        height={700}
        className="network-graph-canvas"
        onClick={handleClick}
      />
      <div className="network-legend">
        <div className="network-legend-title">CONNECTION TYPES</div>
        <div className="legend-item"><span className="legend-line" style={{ background: '#FFB800' }} />FUNDING</div>
        <div className="legend-item"><span className="legend-line" style={{ background: '#FF4444' }} />COMMAND</div>
        <div className="legend-item"><span className="legend-line" style={{ background: '#00AAFF' }} />AFFILIATE</div>
        <div className="legend-item"><span className="legend-line" style={{ background: '#44CC44' }} />TRAINING</div>
        <div className="legend-item"><span className="legend-line dashed" style={{ background: '#FF4444' }} />ADVERSARY</div>
      </div>
    </div>
  )
}

function OrgGrid({ organizations, onOrgSelect, selectedOrg }) {
  return (
    <div className="org-grid">
      {organizations.map(org => (
        <div
          key={org.id}
          className={`org-grid-card ${selectedOrg?.id === org.id ? 'selected' : ''}`}
          onClick={() => onOrgSelect(org)}
          style={{ borderLeftColor: org.color || '#FF4444' }}
        >
          <div className="org-grid-name">{org.name}</div>
          <div className="org-grid-fullname">{org.fullName}</div>
          <div className="org-grid-meta">
            <span className="org-grid-ideology">{org.ideology?.split(',')[0]}</span>
            <span className="org-grid-strength">{org.estimatedStrength?.split('(')[0]?.trim()}</span>
          </div>
          <div className="org-grid-designations">
            {org.usDesignation?.status?.includes('Terrorist') && (
              <span className="designation-badge us">US FTO</span>
            )}
            {org.euDesignation?.status?.includes('Terrorist') && (
              <span className="designation-badge eu">EU</span>
            )}
            {org.israelDesignation?.status?.includes('Terrorist') && (
              <span className="designation-badge il">IL</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function NetworksView() {
  const [organizations, setOrganizations] = useState([])
  const [leaders, setLeaders] = useState({ eliminated: [], active: [] })
  const [networks, setNetworks] = useState({ connections: [], clusters: [] })
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [viewMode, setViewMode] = useState('graph') // graph | grid
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
      {/* Networks Header */}
      <div className="networks-header">
        <div className="networks-title-section">
          <h1 className="networks-title">INTELLIGENCE DATABASE</h1>
          <span className="networks-subtitle">DESIGNATED ORGANIZATIONS & NETWORKS</span>
        </div>
        <div className="networks-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => setViewMode('graph')}
          >
            NETWORK MAP
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            DOSSIERS
          </button>
        </div>
        <div className="networks-stats">
          <div className="net-stat">
            <span className="net-stat-value">{organizations.length}</span>
            <span className="net-stat-label">ORGANIZATIONS</span>
          </div>
          <div className="net-stat">
            <span className="net-stat-value">{leaders.eliminated.length}</span>
            <span className="net-stat-label">ELIMINATED</span>
          </div>
          <div className="net-stat">
            <span className="net-stat-value">{leaders.active.length}</span>
            <span className="net-stat-label">AT LARGE</span>
          </div>
        </div>
      </div>

      <div className="networks-body">
        {/* Left: Graph or Grid */}
        <div className="networks-main">
          {viewMode === 'graph' ? (
            <NetworkGraph
              organizations={organizations}
              networks={networks}
              onOrgSelect={setSelectedOrg}
              selectedOrg={selectedOrg}
            />
          ) : (
            <OrgGrid
              organizations={organizations}
              onOrgSelect={setSelectedOrg}
              selectedOrg={selectedOrg}
            />
          )}
        </div>

        {/* Right: Dossier Panel */}
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
              <div className="dossier-empty-icon">&#9733;</div>
              <div className="dossier-empty-text">SELECT AN ORGANIZATION</div>
              <div className="dossier-empty-sub">Click a node or card to view full dossier</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
