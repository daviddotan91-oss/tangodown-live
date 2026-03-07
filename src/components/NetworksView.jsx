import React, { useState, useEffect, useMemo, useRef } from 'react'
import OrgDossier from './OrgDossier'

function NetworkGraph({ organizations, networks, onOrgSelect, selectedOrg }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [nodes, setNodes] = useState([])
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 700 })
  const animRef = useRef(null)
  const dragRef = useRef(null)

  // Resize canvas to fill container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setCanvasSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Initialize node positions
  useEffect(() => {
    if (!organizations.length) return
    const w = canvasSize.w
    const h = canvasSize.h
    const initial = organizations.map((org, i) => {
      // Position by cluster — spread across the full canvas
      const cluster = networks.clusters?.find(c => c.members.includes(org.id))
      let cx = w / 2, cy = h / 2
      if (cluster?.id === 'axis-of-resistance') { cx = w * 0.28; cy = h * 0.35 }
      else if (cluster?.id === 'aq-network') { cx = w * 0.72; cy = h * 0.3 }
      else if (cluster?.id === 'isis-network') { cx = w * 0.65; cy = h * 0.7 }
      else { cx = w * 0.15 + (i % 5) * (w * 0.16); cy = h * 0.6 + Math.floor(i / 5) * (h * 0.12) }

      const jitter = Math.min(w, h) * 0.06
      return {
        id: org.id,
        x: cx + (Math.random() - 0.5) * jitter,
        y: cy + (Math.random() - 0.5) * jitter,
        vx: 0, vy: 0,
        name: org.name,
        color: org.color || '#FF4444',
        radius: Math.min(30, Math.max(14, (org.estimatedStrength?.match(/[\d,]+/)?.[0]?.replace(/,/g, '') || 10000) / 8000 + 10))
      }
    })
    setNodes(initial)
  }, [organizations, networks, canvasSize])

  // Force simulation + draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !nodes.length) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    const connections = networks.connections || []

    let frameNodes = [...nodes.map(n => ({ ...n }))]
    let time = 0

    const draw = () => {
      time += 0.01
      ctx.clearRect(0, 0, w, h)

      // Draw connections
      connections.forEach(conn => {
        const src = frameNodes.find(n => n.id === conn.source)
        const tgt = frameNodes.find(n => n.id === conn.target)
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
          const t = (time * (1 + conn.strength * 0.1)) % 1
          const px = src.x + (tgt.x - src.x) * t
          const py = src.y + (tgt.y - src.y) * t
          ctx.beginPath()
          ctx.arc(px, py, 2, 0, Math.PI * 2)
          ctx.fillStyle = conn.type === 'funding' ? '#FFB800' : '#00AAFF'
          ctx.fill()
        }

        // Connection label at midpoint
        if (conn.label && conn.strength > 5) {
          const mx = (src.x + tgt.x) / 2
          const my = (src.y + tgt.y) / 2
          ctx.font = '8px "JetBrains Mono", monospace'
          ctx.fillStyle = 'rgba(96, 112, 128, 0.6)'
          ctx.textAlign = 'center'
          ctx.fillText(conn.label, mx, my - 4)
        }
      })

      // Draw nodes
      frameNodes.forEach(node => {
        const isSelected = selectedOrg?.id === node.id
        const pulse = Math.sin(time * 3 + node.x * 0.01) * 0.15 + 1

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
        ctx.fillStyle = node.color + (isSelected ? 'cc' : '66')
        ctx.fill()
        ctx.strokeStyle = isSelected ? '#ffffff' : node.color + 'aa'
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
        ctx.fillText(node.name.toUpperCase(), node.x, node.y + node.radius + 14)
      })

      // Cluster labels
      networks.clusters?.forEach(cluster => {
        const members = frameNodes.filter(n => cluster.members.includes(n.id))
        if (!members.length) return
        const cx = members.reduce((s, m) => s + m.x, 0) / members.length
        const cy = Math.min(...members.map(m => m.y)) - 40
        ctx.font = '8px "JetBrains Mono", monospace'
        ctx.fillStyle = cluster.color + '88'
        ctx.textAlign = 'center'
        ctx.fillText(cluster.name.toUpperCase(), cx, cy)
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [nodes, networks, selectedOrg])

  // Click detection
  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width)
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height)

    for (const node of nodes) {
      const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      if (dist < node.radius + 5) {
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
        width={canvasSize.w}
        height={canvasSize.h}
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
