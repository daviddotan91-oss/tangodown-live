import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { latLngToVector3 } from '../utils/geoUtils'
import { getEventColor } from '../utils/dataUtils'

function PulseMarker({ lat, lng, type, force, onClick, isSelected }) {
  const meshRef = useRef()
  const ringRef = useRef()
  const pos = useMemo(() => latLngToVector3(lat, lng, 1.005), [lat, lng])
  const color = getEventColor(type)
  const baseSize = type === 'SPECIAL OP' ? 0.006 : 0.01

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3 + lat * 10) * 0.3 + 0.7
      meshRef.current.material.opacity = pulse * (isSelected ? 1 : 0.8)
    }
    if (ringRef.current) {
      const scale = (Math.sin(state.clock.elapsedTime * 2 + lng * 5) * 0.5 + 1.5) * (isSelected ? 2 : 1)
      ringRef.current.scale.setScalar(scale)
      ringRef.current.material.opacity = Math.max(0, 0.5 - (scale - 1) * 0.5)
    }
  })

  return (
    <group position={pos} onClick={(e) => { e.stopPropagation(); onClick?.() }}>
      {/* Core dot */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[baseSize, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>

      {/* Pulse ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[baseSize * 1.5, baseSize * 2, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Glow */}
      <mesh>
        <sphereGeometry args={[baseSize * 3, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export default function GlobeMarkers({ incidents, onIncidentClick, selectedIncident }) {
  // Only show most recent 100 incidents on globe
  const visibleIncidents = useMemo(() => {
    return incidents.slice(0, 100)
  }, [incidents])

  return (
    <group>
      {visibleIncidents.map(incident => (
        <PulseMarker
          key={incident.id}
          lat={incident.lat}
          lng={incident.lng}
          type={incident.type}
          force={incident.force}
          isSelected={selectedIncident?.id === incident.id}
          onClick={() => onIncidentClick?.(incident)}
        />
      ))}
    </group>
  )
}
