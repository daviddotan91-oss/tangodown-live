import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { feature } from 'topojson-client'
import GlobeMarkers from './GlobeMarkers'
import ArcTraces from './ArcTraces'
import TacticalOverlay from './TacticalOverlay'
import { latLngToVector3 } from '../utils/geoUtils'
import { getIntensityColor } from '../utils/dataUtils'

const GLOBE_RADIUS = 1

function latLngToVec3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function geoToLines(coordinates, radius) {
  const points = []
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lng1, lat1] = coordinates[i]
    const [lng2, lat2] = coordinates[i + 1]
    points.push(
      latLngToVec3(lat1, lng1, radius),
      latLngToVec3(lat2, lng2, radius)
    )
  }
  return points
}

// Filled country polygons — warm dark landmass
function CountryFills() {
  const [geos, setGeos] = useState([])

  useEffect(() => {
    import('world-atlas/countries-110m.json').then(worldTopo => {
      const data = worldTopo.default || worldTopo
      const countries = feature(data, data.objects.countries)
      const geometries = []
      countries.features.forEach(feat => {
        const geom = feat.geometry
        const rings = []
        if (geom.type === 'Polygon') rings.push(geom.coordinates[0])
        else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(p => rings.push(p[0]))

        rings.forEach(ring => {
          if (ring.length < 4) return
          const r = GLOBE_RADIUS + 0.001
          const pts = ring.map(([lng, lat]) => latLngToVec3(lat, lng, r))
          let cx = 0, cy = 0, cz = 0
          pts.forEach(p => { cx += p.x; cy += p.y; cz += p.z })
          cx /= pts.length; cy /= pts.length; cz /= pts.length
          const centerLen = Math.sqrt(cx * cx + cy * cy + cz * cz)
          cx = cx / centerLen * r; cy = cy / centerLen * r; cz = cz / centerLen * r

          const vertices = [cx, cy, cz]
          pts.forEach(p => vertices.push(p.x, p.y, p.z))
          const indices = []
          for (let i = 1; i < pts.length; i++) {
            indices.push(0, i, i + 1 <= pts.length ? i + 1 : 1)
          }
          const geo = new THREE.BufferGeometry()
          geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
          geo.setIndex(indices)
          geo.computeVertexNormals()
          geometries.push(geo)
        })
      })
      setGeos(geometries)
    })
  }, [])

  return (
    <group>
      {geos.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshBasicMaterial
            color="#2a1e10"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// Country boundary lines
function CountryBoundaries() {
  const [geometry, setGeometry] = useState(null)

  useEffect(() => {
    import('world-atlas/countries-110m.json').then(worldTopo => {
      const data = worldTopo.default || worldTopo
      const countries = feature(data, data.objects.countries)
      const points = []
      const r = GLOBE_RADIUS + 0.0015
      countries.features.forEach(feat => {
        const geom = feat.geometry
        if (geom.type === 'Polygon') {
          geom.coordinates.forEach(ring => points.push(...geoToLines(ring, r)))
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach(polygon =>
            polygon.forEach(ring => points.push(...geoToLines(ring, r)))
          )
        }
      })
      setGeometry(new THREE.BufferGeometry().setFromPoints(points))
    })
  }, [])

  if (!geometry) return null
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#6a5a30" transparent opacity={0.25} />
    </lineSegments>
  )
}

// Coordinate grid
function Graticule() {
  const geometry = useMemo(() => {
    const points = []
    const r = GLOBE_RADIUS + 0.001
    for (let lat = -80; lat <= 80; lat += 30) {
      for (let lng = -180; lng < 180; lng += 3) {
        points.push(latLngToVec3(lat, lng, r), latLngToVec3(lat, lng + 3, r))
      }
    }
    for (let lng = -180; lng < 180; lng += 30) {
      for (let lat = -80; lat < 80; lat += 3) {
        points.push(latLngToVec3(lat, lng, r), latLngToVec3(lat + 3, lng, r))
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#2a2010" transparent opacity={0.1} />
    </lineSegments>
  )
}

// Hotspot glow clusters
function HotspotGlow({ incidents }) {
  const hotspots = useMemo(() => {
    const cells = {}
    const cellSize = 8
    incidents.forEach(inc => {
      if (!inc.lat || !inc.lng) return
      const key = `${Math.round(inc.lat / cellSize) * cellSize},${Math.round(inc.lng / cellSize) * cellSize}`
      if (!cells[key]) cells[key] = { lat: 0, lng: 0, count: 0 }
      cells[key].lat += inc.lat
      cells[key].lng += inc.lng
      cells[key].count += 1
    })
    return Object.values(cells)
      .filter(c => c.count >= 2)
      .map(c => ({
        lat: c.lat / c.count,
        lng: c.lng / c.count,
        intensity: Math.min(c.count / 12, 1),
      }))
  }, [incidents])

  const groupRef = useRef()

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      if (child.material) {
        const base = hotspots[i]?.intensity || 0.1
        child.material.opacity = base * 0.12 + 0.02 * Math.sin(clock.elapsedTime * 0.8 + i)
      }
    })
  })

  return (
    <group ref={groupRef}>
      {hotspots.map((h, i) => {
        const pos = latLngToVec3(h.lat, h.lng, GLOBE_RADIUS + 0.002)
        const normal = pos.clone().normalize()
        const q = new THREE.Quaternion()
        q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
        const size = 0.04 + h.intensity * 0.1
        return (
          <mesh key={i} position={pos} quaternion={q}>
            <circleGeometry args={[size, 24]} />
            <meshBasicMaterial
              color={h.intensity > 0.5 ? '#FF4444' : '#FFB800'}
              transparent
              opacity={h.intensity * 0.12}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// Atmosphere shader — Overwatch style
function Atmosphere({ threatLevel = 0 }) {
  const shaderRef = useRef()

  const uniforms = useMemo(() => ({
    glowColor: { value: new THREE.Color('#FFB800') },
    viewVector: { value: new THREE.Vector3(0, 0, 1) },
    intensity: { value: 0.4 },
  }), [])

  useFrame(({ camera }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.viewVector.value.copy(camera.position)
      const t = Math.min(threatLevel, 1)
      const color = shaderRef.current.uniforms.glowColor.value
      color.setRGB(1.0, 0.72 - t * 0.45, 0.0)
      shaderRef.current.uniforms.intensity.value = 0.4 + t * 0.25
    }
  })

  const vertexShader = `
    varying float vIntensity;
    uniform vec3 viewVector;
    void main() {
      vec3 vNormal = normalize(normalMatrix * normal);
      vec3 vNormel = normalize(normalMatrix * viewVector);
      vIntensity = pow(0.7 - dot(vNormal, vNormel), 2.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform vec3 glowColor;
    uniform float intensity;
    varying float vIntensity;
    void main() {
      vec3 glow = glowColor * vIntensity;
      gl_FragColor = vec4(glow, vIntensity * intensity);
    }
  `

  return (
    <mesh scale={[1.12, 1.12, 1.12]}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

function InnerGlow() {
  return (
    <mesh scale={[1.03, 1.03, 1.03]}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <meshBasicMaterial color="#FFB800" transparent opacity={0.04} side={THREE.BackSide} />
    </mesh>
  )
}

// Day/night terminator shadow
function DayNightTerminator() {
  const shaderRef = useRef()

  const uniforms = useMemo(() => ({
    sunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
  }), [])

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      const t = clock.elapsedTime * 0.05
      shaderRef.current.uniforms.sunDirection.value.set(
        Math.cos(t), 0.3, Math.sin(t)
      ).normalize()
    }
  })

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform vec3 sunDirection;
    varying vec3 vNormal;
    void main() {
      float intensity = dot(normalize(vNormal), sunDirection);
      float shadow = smoothstep(-0.15, 0.15, intensity);
      float nightOpacity = (1.0 - shadow) * 0.25;
      gl_FragColor = vec4(0.0, 0.0, 0.02, nightOpacity);
    }
  `

  return (
    <mesh scale={[1.002, 1.002, 1.002]}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

// Radar sweep shader
function RadarSweep() {
  const shaderRef = useRef()

  const uniforms = useMemo(() => ({
    time: { value: 0 },
  }), [])

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.time.value = clock.elapsedTime
    }
  })

  const vertexShader = `
    varying vec3 vPos;
    void main() {
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform float time;
    varying vec3 vPos;
    void main() {
      float angle = atan(vPos.x, vPos.z);
      float sweep = mod(time * 0.5, 6.28318);
      float diff = mod(angle - sweep + 6.28318, 6.28318);
      float intensity = smoothstep(0.6, 0.0, diff) * 0.12;
      gl_FragColor = vec4(1.0, 0.72, 0.0, intensity);
    }
  `

  return (
    <mesh scale={[1.003, 1.003, 1.003]}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

// Orbit ring
function OrbitRing() {
  const ref = useRef()

  const geometry = useMemo(() => {
    const points = []
    const r = GLOBE_RADIUS * 1.25
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = 1.2 + Math.sin(clock.elapsedTime * 0.1) * 0.05
      ref.current.rotation.z = 0.3 + Math.cos(clock.elapsedTime * 0.08) * 0.03
    }
  })

  return (
    <group ref={ref} rotation={[1.2, 0, 0.3]}>
      <line geometry={geometry}>
        <lineBasicMaterial color="#FFB800" transparent opacity={0.06} />
      </line>
    </group>
  )
}

// Floating data particles
function DataParticles() {
  const count = 200
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    let seed = 42
    const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647 }
    for (let i = 0; i < count; i++) {
      const r = GLOBE_RADIUS * (1.15 + rand() * 0.6)
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(2 * rand() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi)
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return pos
  }, [])

  const ref = useRef()

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.02
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.01) * 0.1
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FFB800"
        size={0.004}
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// Base glow under globe
function BaseGlow() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -GLOBE_RADIUS - 0.01, 0]}>
      <circleGeometry args={[0.6, 32]} />
      <meshBasicMaterial color="#FFB800" transparent opacity={0.04} depthWrite={false} />
    </mesh>
  )
}

// Compass N/S/E/W markers
function CompassMarkers() {
  const markers = useMemo(() => [
    { label: 'N', lat: 85, lng: 0 },
    { label: 'S', lat: -85, lng: 0 },
    { label: 'E', lat: 0, lng: 90 },
    { label: 'W', lat: 0, lng: -90 },
  ], [])

  return (
    <group>
      {markers.map(m => (
        <Html
          key={m.label}
          position={latLngToVec3(m.lat, m.lng, GLOBE_RADIUS + 0.05)}
          center
          distanceFactor={3}
          occlude={false}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '8px',
            fontWeight: 700,
            color: 'rgba(255, 184, 0, 0.25)',
            letterSpacing: '0.15em',
            textShadow: '0 0 4px rgba(255, 184, 0, 0.15)',
          }}>
            {m.label}
          </div>
        </Html>
      ))}
    </group>
  )
}

// Region labels with incident counts
const REGION_LABELS = [
  { label: 'EUROPE', lat: 52, lng: 10 },
  { label: 'MIDDLE EAST', lat: 25, lng: 46 },
  { label: 'EAST ASIA', lat: 38, lng: 115 },
  { label: 'NORTH AMERICA', lat: 48, lng: -100 },
  { label: 'SOUTH AMERICA', lat: -15, lng: -58 },
  { label: 'AFRICA', lat: 2, lng: 22 },
  { label: 'SOUTH ASIA', lat: 18, lng: 78 },
  { label: 'OCEANIA', lat: -28, lng: 135 },
]

function RegionLabels({ conflicts }) {
  const counts = useMemo(() => {
    const c = {}
    REGION_LABELS.forEach(r => {
      c[r.label] = conflicts.filter(conf => {
        const regionMap = {
          'EUROPE': 'Europe', 'MIDDLE EAST': 'Middle East',
          'EAST ASIA': 'East Asia', 'NORTH AMERICA': 'North America',
          'SOUTH AMERICA': 'South America', 'AFRICA': 'Africa',
          'SOUTH ASIA': 'South Asia', 'OCEANIA': 'Oceania',
        }
        return conf.region === regionMap[r.label]
      }).reduce((s, x) => s + (x.stats?.dailyEngagements || 0), 0)
    })
    return c
  }, [conflicts])

  return (
    <group>
      {REGION_LABELS.map(r => {
        const pos = latLngToVec3(r.lat, r.lng, GLOBE_RADIUS + 0.04)
        const count = counts[r.label] || 0
        if (count === 0) return null
        return (
          <Html key={r.label} position={pos} center distanceFactor={3.5} occlude={false} zIndexRange={[0, 5]} style={{ pointerEvents: 'none' }}>
            <div className="region-label">
              <span className="region-label-name">{r.label}</span>
              <span className="region-label-count">{count}</span>
            </div>
          </Html>
        )
      })}
    </group>
  )
}

// Fighter jet & ship SVG silhouettes on the globe
function WarAssets({ conflicts }) {
  const FRIENDLY_OPS = ['US', 'Ukraine', 'Israel', 'South Korea', 'Taiwan', 'France', 'UK', 'Philippines']

  // Generate aircraft positions near conflict fronts
  const [aircraftPositions, setAircraftPositions] = useState([])

  useEffect(() => {
    const generate = () => {
      const result = []
      conflicts.forEach(conflict => {
        if (!conflict.fronts) return
        const count = conflict.intensity === 'CRITICAL' ? 3 : conflict.intensity === 'HIGH' ? 2 : 1
        for (let i = 0; i < count; i++) {
          const front = conflict.fronts[Math.floor(Math.random() * conflict.fronts.length)]
          if (!front?.center) continue
          const isFriendly = Math.random() > 0.4
          result.push({
            id: `${conflict.id}-ac-${i}`,
            lat: front.center[0] + (Math.random() - 0.5) * 2,
            lng: front.center[1] + (Math.random() - 0.5) * 2,
            isFriendly,
            type: isFriendly ? 'F-35' : 'Su-35',
          })
        }
      })
      return result
    }
    setAircraftPositions(generate())
    const interval = setInterval(() => setAircraftPositions(generate()), 12000)
    return () => clearInterval(interval)
  }, [conflicts])

  return (
    <group>
      {/* Aircraft — fighter jet silhouette SVGs */}
      {aircraftPositions.map(ac => {
        const pos = latLngToVec3(ac.lat, ac.lng, GLOBE_RADIUS + 0.012)
        const col = ac.isFriendly ? '#00FF88' : '#FF4444'
        const fill = ac.isFriendly ? 'rgba(0,255,136,0.25)' : 'rgba(255,68,68,0.25)'
        return (
          <Html key={ac.id} position={pos} center distanceFactor={3.2} occlude={false} zIndexRange={[10, 20]}>
            <div className={`war-globe-aircraft ${ac.isFriendly ? 'friendly' : 'hostile'}`} title={`${ac.type}`}>
              <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                <path d="M16 2 L17.5 10 L27 14 L26 16 L17.5 15 L18 24 L22 27 L21 29 L16 26 L11 29 L10 27 L14 24 L14.5 15 L6 16 L5 14 L14.5 10 Z"
                  fill={fill} stroke={col} strokeWidth="1" strokeLinejoin="round" />
              </svg>
            </div>
          </Html>
        )
      })}
    </group>
  )
}

// Camera controller
function CameraController({ flyToTarget, conflicts, onTourZone }) {
  const { camera } = useThree()
  const controlsRef = useRef()
  const idleTimerRef = useRef(0)
  const tourIndexRef = useRef(0)
  const tourActiveRef = useRef(false)
  const flyingRef = useRef(false)
  const targetPosRef = useRef(new THREE.Vector3())
  const lastInteraction = useRef(Date.now())

  const tourOrder = useMemo(() => {
    const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return [...conflicts].sort((a, b) => (order[a.intensity] ?? 4) - (order[b.intensity] ?? 4))
  }, [conflicts])

  const getCameraPosition = useCallback((lat, lng, distance = 2.2) => {
    const pos = latLngToVector3(lat, lng, distance)
    return new THREE.Vector3(pos[0], pos[1], pos[2])
  }, [])

  useEffect(() => {
    if (!flyToTarget) return
    const target = getCameraPosition(flyToTarget[0], flyToTarget[1], 2.0)
    targetPosRef.current.copy(target)
    flyingRef.current = true
    tourActiveRef.current = false
    lastInteraction.current = Date.now()
  }, [flyToTarget, getCameraPosition])

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

    if (!tourActiveRef.current && !flyingRef.current && idleSeconds > 12 && tourOrder.length > 0) {
      tourActiveRef.current = true
      idleTimerRef.current = 0
      const zone = tourOrder[tourIndexRef.current % tourOrder.length]
      const target = getCameraPosition(zone.center[0], zone.center[1], 2.2)
      targetPosRef.current.copy(target)
      flyingRef.current = true
      onTourZone?.(zone)
    }

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

    if (flyingRef.current) {
      camera.position.lerp(targetPosRef.current, delta * 1.2)
      if (camera.position.distanceTo(targetPosRef.current) < 0.02) {
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
    />
  )
}

function GlobeScene({ conflicts, incidents, feed, naval, flyToTarget, onIncidentClick, selectedIncident, onTourZone }) {
  const threatLevel = useMemo(() => Math.min(incidents.length / 100, 1), [incidents])

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 3, 5]} intensity={0.5} />

      <Stars radius={100} depth={60} count={1500} factor={3} saturation={0} fade speed={0.5} />

      <group name="globe-group">
        {/* Base sphere */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
          <meshPhongMaterial
            color="#100a05"
            emissive="#0a0805"
            emissiveIntensity={0.5}
            shininess={5}
          />
        </mesh>

        <CountryFills />
        <Graticule />
        <CountryBoundaries />
        <Atmosphere threatLevel={threatLevel} />
        <InnerGlow />
        <DayNightTerminator />
        <RadarSweep />
        <OrbitRing />
        <DataParticles />
        <BaseGlow />
        <CompassMarkers />

        <HotspotGlow incidents={incidents} />
        <RegionLabels conflicts={conflicts} />

        {/* Incident Markers */}
        <GlobeMarkers
          incidents={incidents}
          onIncidentClick={onIncidentClick}
          selectedIncident={selectedIncident}
        />

        {/* Arc Traces */}
        <ArcTraces feed={feed} conflicts={conflicts} />

        {/* Tactical Overlay */}
        <TacticalOverlay conflicts={conflicts} naval={naval} />

        {/* Fighter jet silhouettes */}
        <WarAssets conflicts={conflicts} />
      </group>

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
          camera={{ position: [0, 1, 5], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          style={{ background: 'transparent' }}
        >
          <GlobeScene
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

      {/* War scanlines overlay */}
      <div className="war-scanlines" />
      {/* Vignette overlay */}
      <div className="war-vignette" />
    </div>
  )
}
