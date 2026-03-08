import { useState, useEffect, useRef } from 'react'
import { loadJSON } from '../utils/dataUtils'

export function useConflictData() {
  const [conflicts, setConflicts] = useState([])
  const [incidents, setIncidents] = useState([])
  const [naval, setNaval] = useState([])
  const [loading, setLoading] = useState(true)
  const navalBaseRef = useRef([])

  useEffect(() => {
    Promise.all([
      loadJSON('/data/conflicts.json'),
      loadJSON('/data/incidents.json'),
      loadJSON('/data/naval.json')
    ]).then(([c, i, n]) => {
      setConflicts(c)
      setIncidents(i)
      navalBaseRef.current = n.map(ship => ({ ...ship, baseLat: ship.lat, baseLng: ship.lng }))
      setNaval(navalBaseRef.current)
      setLoading(false)
    }).catch(err => {
      console.error('Failed to load data:', err)
      setLoading(false)
    })
  }, [])

  // Naval drift — ships drift slowly around their base position
  useEffect(() => {
    if (navalBaseRef.current.length === 0) return
    const interval = setInterval(() => {
      setNaval(navalBaseRef.current.map(ship => {
        const t = Date.now() / 1000
        // Each ship gets a unique drift pattern based on id hash
        const seed = ship.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
        const driftLat = Math.sin(t * 0.01 + seed) * 0.08 + Math.cos(t * 0.007 + seed * 2) * 0.04
        const driftLng = Math.cos(t * 0.012 + seed * 3) * 0.1 + Math.sin(t * 0.008 + seed) * 0.05
        return { ...ship, lat: ship.baseLat + driftLat, lng: ship.baseLng + driftLng }
      }))
    }, 10000) // update every 10 seconds
    return () => clearInterval(interval)
  }, [loading])

  return { conflicts, incidents, naval, loading }
}
