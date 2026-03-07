const cache = {}

export async function loadJSON(path) {
  if (cache[path]) return cache[path]
  const res = await fetch(path)
  const data = await res.json()
  cache[path] = data
  return data
}

export function formatUTC(date) {
  const d = new Date(date)
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  const s = String(d.getUTCSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}Z`
}

export function formatDate(date) {
  const d = new Date(date)
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function getEventColor(type) {
  const colors = {
    'AIRSTRIKE': '#ff2d2d',
    'NAVAL ENGAGEMENT': '#00c8ff',
    'GROUND OP': '#ff8800',
    'SPECIAL OP': '#ffffff',
    'DRONE STRIKE': '#00c8ff',
    'MISSILE LAUNCH': '#ffd700',
    'INTERCEPT': '#00ff88',
    'IED/AMBUSH': '#ff8800',
    'ASSASSINATION': '#ff2d2d',
    'RAID': '#ff8800'
  }
  return colors[type] || '#00c8ff'
}

export function getIntensityColor(intensity) {
  const colors = {
    'CRITICAL': '#ff2d2d',
    'HIGH': '#ff8800',
    'MEDIUM': '#ffd700',
    'LOW': '#00ff88'
  }
  return colors[intensity] || '#00c8ff'
}

// Generate simulated incident from templates
export function generateSimulatedIncident(conflicts, existingIncidents) {
  const types = ['AIRSTRIKE', 'DRONE STRIKE', 'GROUND OP', 'MISSILE LAUNCH', 'INTERCEPT', 'NAVAL ENGAGEMENT', 'IED/AMBUSH', 'RAID']
  const type = types[Math.floor(Math.random() * types.length)]

  const activeConflicts = conflicts.filter(c => c.intensity === 'CRITICAL' || c.intensity === 'HIGH')
  const conflict = activeConflicts[Math.floor(Math.random() * activeConflicts.length)]
  if (!conflict) return null

  const front = conflict.fronts[Math.floor(Math.random() * conflict.fronts.length)]
  const jitterLat = (Math.random() - 0.5) * 0.5
  const jitterLng = (Math.random() - 0.5) * 0.5

  const templates = {
    'AIRSTRIKE': [
      `Precision airstrike on military infrastructure in ${front.name} area.`,
      `Air force conducted strikes on fortified positions near ${front.name}.`,
      `Multiple airstrikes reported targeting weapons storage facilities.`
    ],
    'DRONE STRIKE': [
      `FPV drone engaged armored vehicle near ${front.name}.`,
      `UAS strike on logistics convoy. Damage assessment pending.`,
      `Reconnaissance drone identified and struck command post.`
    ],
    'GROUND OP': [
      `Infantry assault on defensive positions near ${front.name}.`,
      `Mechanized forces advanced along ${front.name} axis.`,
      `Counter-offensive operation launched in ${front.name} sector.`
    ],
    'MISSILE LAUNCH': [
      `Ballistic missile launch detected from ${front.name} area.`,
      `Multiple rocket launch system fired toward forward positions.`,
      `Cruise missile strike on infrastructure targets.`
    ],
    'INTERCEPT': [
      `Air defense system intercepted incoming projectile over ${front.name}.`,
      `Multiple incoming threats neutralized by defense battery.`,
      `Successful intercept of aerial threat. No casualties reported.`
    ],
    'NAVAL ENGAGEMENT': [
      `Naval vessels engaged hostile craft in ${conflict.name} theater.`,
      `Anti-ship missile intercepted by naval defense systems.`,
      `Maritime patrol engaged suspicious vessel near exclusion zone.`
    ],
    'IED/AMBUSH': [
      `IED detonated against patrol near ${front.name}. Casualties reported.`,
      `Ambush on supply convoy. Security forces returned fire.`,
      `Improvised explosive device discovered and neutralized.`
    ],
    'RAID': [
      `Special forces conducted raid on militant hideout in ${front.name}.`,
      `Counter-terrorism operation — suspects detained, weapons seized.`,
      `Targeted raid on weapons manufacturing site.`
    ]
  }

  const descs = templates[type] || templates['AIRSTRIKE']
  const desc = descs[Math.floor(Math.random() * descs.length)]

  return {
    id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    timestamp: new Date().toISOString(),
    location: front.name,
    lat: front.center[0] + jitterLat,
    lng: front.center[1] + jitterLng,
    conflictId: conflict.id,
    description: desc,
    force: Math.random() > 0.4 ? 'allied' : 'hostile',
    source: 'SIMULATED',
    simulated: true
  }
}
