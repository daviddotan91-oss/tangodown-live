import { useState, useEffect, useRef, useCallback } from 'react'
import { generateSimulatedIncident } from '../utils/dataUtils'
import { playIncidentBeep } from '../utils/soundManager'

export function useLiveFeed(conflicts, initialIncidents) {
  const [feed, setFeed] = useState([])
  const intervalRef = useRef(null)
  const conflictsRef = useRef(conflicts)

  useEffect(() => {
    conflictsRef.current = conflicts
  }, [conflicts])

  // Initialize with existing incidents
  useEffect(() => {
    if (initialIncidents.length > 0 && feed.length === 0) {
      setFeed(initialIncidents.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)))
    }
  }, [initialIncidents])

  // Generate new simulated incidents
  useEffect(() => {
    if (conflictsRef.current.length === 0) return

    intervalRef.current = setInterval(() => {
      const newIncident = generateSimulatedIncident(conflictsRef.current)
      if (newIncident) {
        setFeed(prev => [newIncident, ...prev].slice(0, 200))
        playIncidentBeep()
      }
    }, 3000 + Math.random() * 2000) // 3-5 seconds

    return () => clearInterval(intervalRef.current)
  }, [conflicts.length])

  const getFilteredFeed = useCallback((filters = {}) => {
    let filtered = feed
    if (filters.conflictId) {
      filtered = filtered.filter(f => f.conflictId === filters.conflictId)
    }
    if (filters.type) {
      filtered = filtered.filter(f => f.type === filters.type)
    }
    if (filters.force) {
      filtered = filtered.filter(f => f.force === filters.force)
    }
    return filtered
  }, [feed])

  return { feed, getFilteredFeed }
}
