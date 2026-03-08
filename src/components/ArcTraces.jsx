import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { latLngToVector3, greatCirclePoints } from '../utils/geoUtils'
import { getEventColor } from '../utils/dataUtils'
import { playImpact } from '../utils/soundManager'

function ArcTrace({ origin, destination, color, altitude, onComplete }) {
  const lineRef = useRef()
  const glowLineRef = useRef()
  const headRef = useRef()
  const headGlowRef = useRef()
  const progressRef = useRef(0)
  const completedRef = useRef(false)

  const vectors = useMemo(() => {
    const pts = greatCirclePoints(origin[0], origin[1], destination[0], destination[1], 80, altitude)
    return pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))
  }, [origin, destination, altitude])

  const lineObj = useMemo(() => {
    const positions = new Float32Array(vectors.length * 3)
    vectors.forEach((v, i) => {
      positions[i * 3] = v.x
      positions[i * 3 + 1] = v.y
      positions[i * 3 + 2] = v.z
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setDrawRange(0, 0)
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 })
    return new THREE.Line(geo, mat)
  }, [vectors, color])

  const glowObj = useMemo(() => {
    const positions = new Float32Array(vectors.length * 3)
    vectors.forEach((v, i) => {
      positions[i * 3] = v.x
      positions[i * 3 + 1] = v.y
      positions[i * 3 + 2] = v.z
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setDrawRange(0, 0)
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 })
    return new THREE.Line(geo, mat)
  }, [vectors, color])

  useFrame((state, delta) => {
    if (completedRef.current) return
    progressRef.current += delta * 0.8

    const t = Math.min(progressRef.current, 1)
    const drawCount = Math.floor(t * vectors.length)

    // Reveal trail progressively
    lineObj.geometry.setDrawRange(0, drawCount)
    glowObj.geometry.setDrawRange(0, drawCount)

    // Fade trail after completion
    if (t > 0.85) {
      const fade = 1 - (t - 0.85) / 0.35
      lineObj.material.opacity = 0.8 * Math.max(0, fade)
      glowObj.material.opacity = 0.25 * Math.max(0, fade)
    }

    // Move glowing head along path
    if (headRef.current) {
      if (t < 1) {
        const idx = Math.min(drawCount, vectors.length - 1)
        headRef.current.position.copy(vectors[idx])
        headRef.current.visible = true
        if (headGlowRef.current) {
          headGlowRef.current.position.copy(vectors[idx])
          headGlowRef.current.visible = true
          // Pulse the glow
          const pulse = Math.sin(state.clock.elapsedTime * 15) * 0.3 + 0.7
          headGlowRef.current.material.opacity = 0.3 * pulse
        }
      } else {
        headRef.current.visible = false
        if (headGlowRef.current) headGlowRef.current.visible = false
      }
    }

    if (t >= 1.2 && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  })

  return (
    <group>
      <primitive object={lineObj} ref={lineRef} />
      <primitive object={glowObj} ref={glowLineRef} />
      {/* Bright head */}
      <mesh ref={headRef} visible={false}>
        <sphereGeometry args={[0.007, 6, 6]} />
        <meshBasicMaterial color={color} transparent opacity={1} depthWrite={false} />
      </mesh>
      {/* Head glow — bright enough for bloom to catch */}
      <mesh ref={headGlowRef} visible={false}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} />
      </mesh>
    </group>
  )
}

function ImpactFlash({ lat, lng, color, onComplete }) {
  const groupRef = useRef()
  const ringRef = useRef()
  const ring2Ref = useRef()
  const flashRef = useRef()
  const progressRef = useRef(0)
  const completedRef = useRef(false)
  const pos = useMemo(() => latLngToVector3(lat, lng, 1.007), [lat, lng])

  // Orient the rings to face outward from globe center
  const quaternion = useMemo(() => {
    const dir = new THREE.Vector3(pos[0], pos[1], pos[2]).normalize()
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
    return q
  }, [pos])

  useFrame((state, delta) => {
    if (completedRef.current) return
    progressRef.current += delta * 1.2

    const t = progressRef.current

    // Primary expanding ring
    if (ringRef.current) {
      const scale = 1 + t * 5
      ringRef.current.scale.setScalar(scale)
      ringRef.current.material.opacity = Math.max(0, 0.9 - t * 0.9)
    }

    // Secondary ring (delayed, slower)
    if (ring2Ref.current) {
      const t2 = Math.max(0, t - 0.15)
      const scale = 1 + t2 * 3.5
      ring2Ref.current.scale.setScalar(scale)
      ring2Ref.current.material.opacity = Math.max(0, 0.5 - t2 * 0.6)
    }

    // Central flash
    if (flashRef.current) {
      flashRef.current.material.opacity = Math.max(0, 1 - t * 1.5)
      const s = 1 + t * 0.8
      flashRef.current.scale.setScalar(s)
    }

    if (t >= 1.1 && !completedRef.current) {
      completedRef.current = true
      onComplete?.()
    }
  })

  return (
    <group ref={groupRef} position={pos} quaternion={quaternion}>
      {/* Central flash — white-hot for bloom */}
      <mesh ref={flashRef}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color={'#ffffff'} transparent opacity={1} depthWrite={false} />
      </mesh>
      {/* Primary ring */}
      <mesh ref={ringRef} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.008, 0.013, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Secondary ring */}
      <mesh ref={ring2Ref} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.012, 0.016, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

export default function ArcTraces({ feed, conflicts }) {
  const [arcs, setArcs] = useState([])
  const [impacts, setImpacts] = useState([])
  const lastFeedIdRef = useRef(null)
  const impactTimers = useRef([])

  // Detect new feed entries and spawn arcs
  useEffect(() => {
    if (feed.length === 0) return
    const newest = feed[0]
    if (newest.id === lastFeedIdRef.current) return
    lastFeedIdRef.current = newest.id

    const conflict = conflicts.find(c => c.id === newest.conflictId)
    if (!conflict) return

    // Pick origin: another front in the same conflict, or offset from conflict center
    const otherFronts = conflict.fronts.filter(f => f.name !== newest.location)
    let origin
    if (otherFronts.length > 0) {
      const pick = otherFronts[Math.floor(Math.random() * otherFronts.length)]
      origin = [
        pick.center[0] + (Math.random() - 0.5) * 0.3,
        pick.center[1] + (Math.random() - 0.5) * 0.3
      ]
    } else {
      origin = [
        conflict.center[0] + (Math.random() - 0.5) * 1.5,
        conflict.center[1] + (Math.random() - 0.5) * 1.5
      ]
    }

    // For INTERCEPT type, swap origin/dest (incoming threat being intercepted)
    const isIntercept = newest.type === 'INTERCEPT'
    const arcOrigin = isIntercept ? [newest.lat, newest.lng] : origin
    const arcDest = isIntercept ? origin : [newest.lat, newest.lng]

    const color = getEventColor(newest.type)
    const arcId = `arc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    // Arc altitude proportional to distance
    const dlat = Math.abs(arcOrigin[0] - arcDest[0])
    const dlng = Math.abs(arcOrigin[1] - arcDest[1])
    const dist = Math.sqrt(dlat * dlat + dlng * dlng)
    const altitude = Math.min(0.25, Math.max(0.04, dist * 0.025))

    setArcs(prev => [...prev.slice(-12), { id: arcId, origin: arcOrigin, destination: arcDest, color, altitude }])

    // Schedule impact flash when arc lands (~1.25s at speed 0.8)
    const timer = setTimeout(() => {
      setImpacts(prev => [...prev.slice(-8), {
        id: `impact-${arcId}`,
        lat: arcDest[0],
        lng: arcDest[1],
        color
      }])
      playImpact()
    }, 1250)
    impactTimers.current.push(timer)

    return () => {
      impactTimers.current.forEach(clearTimeout)
    }
  }, [feed, conflicts])

  const removeArc = useCallback((id) => {
    setArcs(prev => prev.filter(a => a.id !== id))
  }, [])

  const removeImpact = useCallback((id) => {
    setImpacts(prev => prev.filter(i => i.id !== id))
  }, [])

  return (
    <group>
      {arcs.map(arc => (
        <ArcTrace
          key={arc.id}
          origin={arc.origin}
          destination={arc.destination}
          color={arc.color}
          altitude={arc.altitude}
          onComplete={() => removeArc(arc.id)}
        />
      ))}
      {impacts.map(impact => (
        <ImpactFlash
          key={impact.id}
          lat={impact.lat}
          lng={impact.lng}
          color={impact.color}
          onComplete={() => removeImpact(impact.id)}
        />
      ))}
    </group>
  )
}
