import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Sphere, Html } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import * as topojson from 'topojson-client'
import GlobeMarkers from './GlobeMarkers'
import ArcTraces from './ArcTraces'
import TacticalOverlay from './TacticalOverlay'
import { latLngToVector3 } from '../utils/geoUtils'

// Convert lng/lat to equirectangular canvas coordinates
function project(lng, lat, w, h) {
  const x = ((lng + 180) / 360) * w
  const y = ((90 - lat) / 180) * h
  return [x, y]
}

// Draw a GeoJSON polygon ring onto canvas
function drawRing(ctx, ring, w, h) {
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = project(ring[i][0], ring[i][1], w, h)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
}

// Build the earth texture from TopoJSON data
function buildEarthTexture(landGeoJSON, countriesGeoJSON) {
  const W = 4096
  const H = 2048
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Deep black ocean
  ctx.fillStyle = '#0A0A0F'
  ctx.fillRect(0, 0, W, H)

  // Subtle grid lines
  ctx.strokeStyle = '#1a1510'
  ctx.lineWidth = 0.5
  for (let i = 0; i < 36; i++) {
    ctx.beginPath()
    ctx.moveTo((i / 36) * W, 0)
    ctx.lineTo((i / 36) * W, H)
    ctx.stroke()
  }
  for (let i = 0; i < 18; i++) {
    ctx.beginPath()
    ctx.moveTo(0, (i / 18) * H)
    ctx.lineTo(W, (i / 18) * H)
    ctx.stroke()
  }

  // Draw land masses — fill
  ctx.fillStyle = '#141018'
  landGeoJSON.features.forEach(feature => {
    const geom = feature.geometry
    if (geom.type === 'Polygon') {
      ctx.beginPath()
      geom.coordinates.forEach(ring => drawRing(ctx, ring, W, H))
      ctx.fill()
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach(polygon => {
        ctx.beginPath()
        polygon.forEach(ring => drawRing(ctx, ring, W, H))
        ctx.fill()
      })
    }
  })

  // Draw coastline outlines — faint red/amber
  ctx.strokeStyle = '#FF444420'
  ctx.lineWidth = 1.2
  landGeoJSON.features.forEach(feature => {
    const geom = feature.geometry
    if (geom.type === 'Polygon') {
      geom.coordinates.forEach(ring => {
        ctx.beginPath()
        drawRing(ctx, ring, W, H)
        ctx.closePath()
        ctx.stroke()
      })
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          ctx.beginPath()
          drawRing(ctx, ring, W, H)
          ctx.closePath()
          ctx.stroke()
        })
      })
    }
  })

  // Brighter coastline glow pass
  ctx.strokeStyle = '#FF440010'
  ctx.lineWidth = 3
  landGeoJSON.features.forEach(feature => {
    const geom = feature.geometry
    if (geom.type === 'Polygon') {
      geom.coordinates.forEach(ring => {
        ctx.beginPath()
        drawRing(ctx, ring, W, H)
        ctx.closePath()
        ctx.stroke()
      })
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          ctx.beginPath()
          drawRing(ctx, ring, W, H)
          ctx.closePath()
          ctx.stroke()
        })
      })
    }
  })

  // Draw country borders
  if (countriesGeoJSON) {
    ctx.strokeStyle = '#FFB80010'
    ctx.lineWidth = 0.6
    countriesGeoJSON.features.forEach(feature => {
      const geom = feature.geometry
      if (geom.type === 'Polygon') {
        geom.coordinates.forEach(ring => {
          ctx.beginPath()
          drawRing(ctx, ring, W, H)
          ctx.closePath()
          ctx.stroke()
        })
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach(polygon => {
          polygon.forEach(ring => {
            ctx.beginPath()
            drawRing(ctx, ring, W, H)
            ctx.closePath()
            ctx.stroke()
          })
        })
      }
    })
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

function GlobeMesh({ conflicts, incidents, feed, naval, onIncidentClick, selectedIncident }) {
  const meshRef = useRef()
  const atmosphereRef = useRef()
  const cloudsRef = useRef()
  const [earthTexture, setEarthTexture] = useState(null)

  // Load TopoJSON and build texture with country borders
  useEffect(() => {
    Promise.all([
      import('world-atlas/land-50m.json'),
      import('world-atlas/countries-50m.json')
    ]).then(([landTopo, countrTopo]) => {
      const landData = landTopo.default || landTopo
      const countrData = countrTopo.default || countrTopo
      const land = topojson.feature(landData, landData.objects.land)
      const countries = topojson.feature(countrData, countrData.objects.countries)
      setEarthTexture(buildEarthTexture(land, countries))
    })
  }, [])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0003
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0005
    }
    if (atmosphereRef.current) {
      // Pulse atmosphere based on global threat level
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.05 + 1.0
      atmosphereRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group>
      {/* Main Globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        {earthTexture ? (
          <meshStandardMaterial
            map={earthTexture}
            roughness={0.85}
            metalness={0.1}
          />
        ) : (
          <meshStandardMaterial
            color="#060a12"
            roughness={0.85}
            metalness={0.1}
          />
        )}
      </mesh>

      {/* Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.005, 64, 64]} />
        <meshStandardMaterial
          transparent
          opacity={0.03}
          color="#2a1510"
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere Glow — red/amber */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1.08, 64, 64]} />
        <meshBasicMaterial
          color="#FF4444"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner Glow — warm */}
      <mesh>
        <sphereGeometry args={[1.15, 64, 64]} />
        <meshBasicMaterial
          color="#331a00"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Conflict zone hotspot glows */}
      {conflicts.map(conflict => {
        const pos = latLngToVector3(conflict.center[0], conflict.center[1], 1.001)
        const color = conflict.intensity === 'CRITICAL' ? '#FF2244' :
                      conflict.intensity === 'HIGH' ? '#FF6644' :
                      conflict.intensity === 'MEDIUM' ? '#FFAA44' : '#44AA88'
        return (
          <mesh key={conflict.id} position={pos}>
            <sphereGeometry args={[conflict.radius * 0.025, 16, 16]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.25}
              depthWrite={false}
            />
          </mesh>
        )
      })}

      {/* Incident Markers */}
      <GlobeMarkers
        incidents={incidents}
        onIncidentClick={onIncidentClick}
        selectedIncident={selectedIncident}
        globeRef={meshRef}
      />

      {/* Arc Traces — animated missile/strike paths */}
      <ArcTraces feed={feed} conflicts={conflicts} />

      {/* Tactical Overlay — zone rings, naval markers, theater links */}
      <TacticalOverlay conflicts={conflicts} naval={naval} />

      {/* Region Labels */}
      {conflicts.reduce((regions, c) => {
        if (!regions.find(r => r.region === c.region)) {
          regions.push({ region: c.region, center: c.center, count: conflicts.filter(x => x.region === c.region).reduce((s, x) => s + x.stats.dailyEngagements, 0) })
        }
        return regions
      }, []).map(region => {
        const pos = latLngToVector3(region.center[0], region.center[1], 1.12)
        return (
          <Html key={region.region} position={pos} center distanceFactor={3} zIndexRange={[10, 0]}>
            <div className="globe-region-label">
              <span className="region-name">{region.region}</span>
              <span className="region-count">{region.count}</span>
            </div>
          </Html>
        )
      })}
    </group>
  )
}

// Camera controller — handles fly-to targets and auto-tour
function CameraController({ flyToTarget, conflicts, onTourZone }) {
  const { camera } = useThree()
  const controlsRef = useRef()
  const idleTimerRef = useRef(0)
  const tourIndexRef = useRef(0)
  const tourActiveRef = useRef(false)
  const flyingRef = useRef(false)
  const targetPosRef = useRef(new THREE.Vector3())
  const targetLookRef = useRef(new THREE.Vector3(0, 0, 0))
  const lastInteraction = useRef(Date.now())

  // Sort conflicts by intensity for tour priority
  const tourOrder = useMemo(() => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return [...conflicts].sort((a, b) => (order[a.intensity] ?? 4) - (order[b.intensity] ?? 4))
  }, [conflicts])

  // Compute camera position to look at a lat/lng from outside the globe
  const getCameraPosition = useCallback((lat, lng, distance = 2.2) => {
    const pos = latLngToVector3(lat, lng, distance)
    return new THREE.Vector3(pos[0], pos[1], pos[2])
  }, [])

  // Handle explicit fly-to requests
  useEffect(() => {
    if (!flyToTarget) return
    const target = getCameraPosition(flyToTarget[0], flyToTarget[1], 2.0)
    targetPosRef.current.copy(target)
    targetLookRef.current.set(0, 0, 0)
    flyingRef.current = true
    tourActiveRef.current = false
    lastInteraction.current = Date.now()
  }, [flyToTarget, getCameraPosition])

  // Detect user interaction to pause tour
  useEffect(() => {
    const onInteract = () => {
      lastInteraction.current = Date.now()
      tourActiveRef.current = false
    }
    window.addEventListener('pointerdown', onInteract)
    window.addEventListener('wheel', onInteract)
    return () => {
      window.removeEventListener('pointerdown', onInteract)
      window.removeEventListener('wheel', onInteract)
    }
  }, [])

  useFrame((state, delta) => {
    const now = Date.now()
    const idleSeconds = (now - lastInteraction.current) / 1000

    // Start auto-tour after 12 seconds of idle
    if (!tourActiveRef.current && !flyingRef.current && idleSeconds > 12 && tourOrder.length > 0) {
      tourActiveRef.current = true
      idleTimerRef.current = 0
      // Pick next zone
      const zone = tourOrder[tourIndexRef.current % tourOrder.length]
      const target = getCameraPosition(zone.center[0], zone.center[1], 2.2)
      targetPosRef.current.copy(target)
      flyingRef.current = true
      onTourZone?.(zone)
    }

    // Cycle to next zone every 8 seconds during tour
    if (tourActiveRef.current) {
      idleTimerRef.current += delta
      if (idleTimerRef.current > 8) {
        idleTimerRef.current = 0
        tourIndexRef.current++
        const zone = tourOrder[tourIndexRef.current % tourOrder.length]
        const target = getCameraPosition(zone.center[0], zone.center[1], 2.2)
        targetPosRef.current.copy(target)
        flyingRef.current = true
        onTourZone?.(zone)
      }
    }

    // Smooth camera interpolation
    if (flyingRef.current) {
      camera.position.lerp(targetPosRef.current, delta * 1.2)
      const dist = camera.position.distanceTo(targetPosRef.current)
      if (dist < 0.02) {
        flyingRef.current = false
      }
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={1.5}
      maxDistance={4}
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      autoRotate={false}
    />
  )
}

function Scene({ conflicts, incidents, feed, naval, flyToTarget, onIncidentClick, selectedIncident, onTourZone }) {
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[5, 3, 5]} intensity={0.5} color="#aa8866" />
      <pointLight position={[-5, -3, -5]} intensity={0.15} color="#1a0a00" />

      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      <GlobeMesh
        conflicts={conflicts}
        incidents={incidents}
        feed={feed}
        naval={naval}
        onIncidentClick={onIncidentClick}
        selectedIncident={selectedIncident}
      />

      <CameraController
        flyToTarget={flyToTarget}
        conflicts={conflicts}
        onTourZone={onTourZone}
      />

      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.85}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
    </>
  )
}

class GlobeErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    console.error('Globe render error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF4444', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', flexDirection: 'column', gap: '8px' }}>
          <span>GLOBE RENDER ERROR</span>
          <button onClick={() => this.setState({ hasError: false })} style={{ background: '#12121D', border: '1px solid #FFB80044', color: '#FFB800', padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px' }}>
            RETRY
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Globe({ conflicts, incidents, feed, naval, flyToTarget, onIncidentClick, selectedIncident, onTourZone }) {
  return (
    <div className="globe-container">
      <GlobeErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 2.5], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <Scene
            conflicts={conflicts}
            incidents={incidents}
            feed={feed}
            naval={naval}
            flyToTarget={flyToTarget}
            onIncidentClick={onIncidentClick}
            selectedIncident={selectedIncident}
            onTourZone={onTourZone}
          />
        </Canvas>
      </GlobeErrorBoundary>

      {/* CRT Overlay */}
      <div className="crt-overlay" />

      {/* Radar Sweep */}
      <div className="radar-sweep" />
    </div>
  )
}
