import { useState, useEffect } from 'react'
import { loadJSON } from '../utils/dataUtils'

export function useConflictData() {
  const [conflicts, setConflicts] = useState([])
  const [incidents, setIncidents] = useState([])
  const [naval, setNaval] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      loadJSON('/data/conflicts.json'),
      loadJSON('/data/incidents.json'),
      loadJSON('/data/naval.json')
    ]).then(([c, i, n]) => {
      setConflicts(c)
      setIncidents(i)
      setNaval(n)
      setLoading(false)
    }).catch(err => {
      console.error('Failed to load data:', err)
      setLoading(false)
    })
  }, [])

  return { conflicts, incidents, naval, loading }
}
