import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { latLngToVector3, circleOnSphere } from '../utils/geoUtils'
import { getIntensityColor } from '../utils/dataUtils'

// Pulsing conflict zone perimeter ring
function ZoneRing({ center, radius, intensity, index }) {
  const lineRef = useRef()
  const glowRef = useRef()
  const color = getIntensityColor(intensity)

  const lineObj = useMemo(() => {
    const pts = circleOnSphere(center[0], center[1], radius * 0.8, 96)
    const positions = new Float32Array(pts.length * 3)
    pts.forEach((p, i) => {
      positions[i * 3] = p[0]
      positions[i * 3 + 1] = p[1]
      positions[i * 3 + 2] = p[2]
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 })
    return new THREE.Line(geo, mat)
  }, [center, radius, color])

  // Inner ring
  const innerObj = useMemo(() => {
    const pts = circleOnSphere(center[0], center[1], radius * 0.5, 72)
    const positions = new Float32Array(pts.length * 3)
    pts.forEach((p, i) => {
      positions[i * 3] = p[0]
      positions[i * 3 + 1] = p[1]
      positions[i * 3 + 2] = p[2]
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.15 })
    return new THREE.Line(geo, mat)
  }, [center, radius, color])

  useFrame((state) => {
    // Pulse the outer ring opacity
    const pulse = Math.sin(state.clock.elapsedTime * 1.5 + index * 1.2) * 0.15 + 0.35
    if (lineObj.material) lineObj.material.opacity = pulse
  })

  return (
    <group>
      <primitive object={lineObj} ref={lineRef} />
      <primitive object={innerObj} ref={glowRef} />
    </group>
  )
}

// Scanning sweep line that rotates around a conflict zone
function ZoneSweep({ center, radius, intensity, index }) {
  const groupRef = useRef()
  const color = getIntensityColor(intensity)

  // Create a radial line from center outward
  const lineObj = useMemo(() => {
    const centerPos = latLngToVector3(center[0], center[1], 1.002)
    const edgePos = latLngToVector3(
      center[0] + radius * 0.8,
      center[1],
      1.002
    )
    const positions = new Float32Array(6)
    positions[0] = centerPos[0]; positions[1] = centerPos[1]; positions[2] = centerPos[2]
    positions[3] = edgePos[0]; positions[4] = edgePos[1]; positions[5] = edgePos[2]
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.2 })
    return new THREE.Line(geo, mat)
  }, [center, radius, color])

  // Rotate around the center point
  useFrame((state) => {
    if (groupRef.current) {
      // Use the center as a pivot - rotate in the local plane
      const t = state.clock.elapsedTime * 0.3 + index * 2.0
      // Create rotation around the normal at this point on the sphere
      const normal = new THREE.Vector3(...latLngToVector3(center[0], center[1], 1))
        .normalize()
      const q = new THREE.Quaternion()
      q.setFromAxisAngle(normal, t)
      groupRef.current.quaternion.copy(q)
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={lineObj} />
    </group>
  )
}

// Naval asset marker — diamond shape with type-specific sizing
function NavalMarker({ ship, index }) {
  const meshRef = useRef()
  const pulseRef = useRef()
  const pos = useMemo(() => latLngToVector3(ship.lat, ship.lng, 1.006), [ship.lat, ship.lng])

  const isHostile = ship.force === 'hostile'
  const color = isHostile ? '#FF4444' : '#44CC44'

  // Size based on ship type
  const size = ship.type?.includes('Carrier') ? 0.012 :
    ship.type?.includes('Submarine') ? 0.007 :
    0.008

  // Orient to face outward from globe
  const quaternion = useMemo(() => {
    const dir = new THREE.Vector3(pos[0], pos[1], pos[2]).normalize()
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
    return q
  }, [pos])

  useFrame((state) => {
    if (pulseRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2 + index * 0.7) * 0.3 + 0.7
      pulseRef.current.material.opacity = 0.15 * pulse
    }
  })

  return (
    <group position={pos} quaternion={quaternion}>
      {/* Diamond marker (rotated square) */}
      <mesh ref={meshRef} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Outline */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[size * 0.7, size * 0.72, 4]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Ping pulse */}
      <mesh ref={pulseRef}>
        <ringGeometry args={[size * 1.5, size * 2, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// Thin line connecting a naval asset to its theater's nearest conflict zone
function TheaterLink({ ship, conflicts }) {
  const lineObj = useMemo(() => {
    // Find closest conflict in same general theater
    let closest = null
    let minDist = Infinity
    conflicts.forEach(c => {
      const dlat = c.center[0] - ship.lat
      const dlng = c.center[1] - ship.lng
      const d = Math.sqrt(dlat * dlat + dlng * dlng)
      if (d < minDist) {
        minDist = d
        closest = c
      }
    })
    if (!closest || minDist > 30) return null

    const from = latLngToVector3(ship.lat, ship.lng, 1.004)
    const to = latLngToVector3(closest.center[0], closest.center[1], 1.004)

    // Create a subtle curved line
    const mid = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2,
      (from[2] + to[2]) / 2
    ]
    // Push midpoint outward slightly for curve
    const midVec = new THREE.Vector3(mid[0], mid[1], mid[2])
    midVec.normalize().multiplyScalar(1.01)

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(from[0], from[1], from[2]),
      midVec,
      new THREE.Vector3(to[0], to[1], to[2])
    )
    const pts = curve.getPoints(30)
    const positions = new Float32Array(pts.length * 3)
    pts.forEach((p, i) => {
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const isHostile = ship.force === 'hostile'
    const mat = new THREE.LineBasicMaterial({
      color: isHostile ? '#FF4444' : '#44CC44',
      transparent: true,
      opacity: 0.08
    })
    return new THREE.Line(geo, mat)
  }, [ship, conflicts])

  if (!lineObj) return null
  return <primitive object={lineObj} />
}

export default function TacticalOverlay({ conflicts, naval }) {
  return (
    <group>
      {/* Conflict zone perimeter rings */}
      {conflicts.map((conflict, i) => (
        <ZoneRing
          key={`ring-${conflict.id}`}
          center={conflict.center}
          radius={conflict.radius}
          intensity={conflict.intensity}
          index={i}
        />
      ))}

      {/* Radar sweep per CRITICAL/HIGH zone */}
      {conflicts
        .filter(c => c.intensity === 'CRITICAL' || c.intensity === 'HIGH')
        .map((conflict, i) => (
          <ZoneSweep
            key={`sweep-${conflict.id}`}
            center={conflict.center}
            radius={conflict.radius}
            intensity={conflict.intensity}
            index={i}
          />
        ))}

      {/* Naval asset markers */}
      {naval.map((ship, i) => (
        <NavalMarker key={ship.id} ship={ship} index={i} />
      ))}

      {/* Theater links from ships to nearest conflict */}
      {naval.map(ship => (
        <TheaterLink key={`link-${ship.id}`} ship={ship} conflicts={conflicts} />
      ))}
    </group>
  )
}
