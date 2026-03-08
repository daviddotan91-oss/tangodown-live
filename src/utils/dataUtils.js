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
    'AIRSTRIKE': '#FF4444',
    'NAVAL ENGAGEMENT': '#00AAFF',
    'GROUND OP': '#FF6644',
    'SPECIAL OP': '#FFB800',
    'DRONE STRIKE': '#FF8800',
    'MISSILE LAUNCH': '#FF2244',
    'INTERCEPT': '#44CC44',
    'IED/AMBUSH': '#FF6644',
    'ASSASSINATION': '#FF4444',
    'RAID': '#FFB800'
  }
  return colors[type] || '#FF4444'
}

export function getIntensityColor(intensity) {
  const colors = {
    'CRITICAL': '#FF2244',
    'HIGH': '#FF6644',
    'MEDIUM': '#FFAA44',
    'LOW': '#44AA88'
  }
  return colors[intensity] || '#FF4444'
}

// Generate simulated incident from templates
export function generateSimulatedIncident(conflicts, existingIncidents) {
  // Weighted type selection — rarer types have lower probability
  const weighted = [
    { type: 'AIRSTRIKE', w: 20 },
    { type: 'DRONE STRIKE', w: 22 },
    { type: 'GROUND OP', w: 15 },
    { type: 'MISSILE LAUNCH', w: 12 },
    { type: 'INTERCEPT', w: 12 },
    { type: 'NAVAL ENGAGEMENT', w: 8 },
    { type: 'IED/AMBUSH', w: 5 },
    { type: 'RAID', w: 3 },
    { type: 'SPECIAL OP', w: 2 },
    { type: 'ASSASSINATION', w: 1 },
  ]
  const totalW = weighted.reduce((s, w) => s + w.w, 0)
  let r = Math.random() * totalW
  let type = 'AIRSTRIKE'
  for (const entry of weighted) {
    r -= entry.w
    if (r <= 0) { type = entry.type; break }
  }

  // Include MEDIUM intensity zones occasionally (30% chance)
  const activeConflicts = conflicts.filter(c =>
    c.intensity === 'CRITICAL' || c.intensity === 'HIGH' || (c.intensity === 'MEDIUM' && Math.random() < 0.3)
  )
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
    ],
    'SPECIAL OP': [
      `Covert operation conducted behind enemy lines near ${front.name}.`,
      `Special operations forces extracted high-value intelligence from ${front.name} sector.`,
      `Joint special operations task force completed classified objective in ${front.name}.`
    ],
    'ASSASSINATION': [
      `High-value target eliminated via precision strike in ${front.name} area.`,
      `Targeted killing of senior militant commander confirmed near ${front.name}.`,
      `Intelligence-led operation neutralized key operative in ${front.name} sector.`
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
