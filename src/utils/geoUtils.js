// Convert lat/lng to 3D sphere position
export function latLngToVector3(lat, lng, radius = 1.0) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return [x, y, z]
}

// Great circle interpolation between two points
export function greatCirclePoints(lat1, lng1, lat2, lng2, numPoints = 50, altitude = 0) {
  const points = []
  const phi1 = lat1 * Math.PI / 180
  const phi2 = lat2 * Math.PI / 180
  const lam1 = lng1 * Math.PI / 180
  const lam2 = lng2 * Math.PI / 180

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints
    const d = Math.acos(
      Math.sin(phi1) * Math.sin(phi2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.cos(lam2 - lam1)
    )

    let lat, lng
    if (d < 0.0001) {
      lat = lat1
      lng = lng1
    } else {
      const A = Math.sin((1 - f) * d) / Math.sin(d)
      const B = Math.sin(f * d) / Math.sin(d)
      const x = A * Math.cos(phi1) * Math.cos(lam1) + B * Math.cos(phi2) * Math.cos(lam2)
      const y = A * Math.cos(phi1) * Math.sin(lam1) + B * Math.cos(phi2) * Math.sin(lam2)
      const z = A * Math.sin(phi1) + B * Math.sin(phi2)
      lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI
      lng = Math.atan2(y, x) * 180 / Math.PI
    }

    // Add arc altitude (parabolic)
    const arcHeight = altitude * Math.sin(f * Math.PI)
    const r = 1.0 + arcHeight
    points.push(latLngToVector3(lat, lng, r))
  }
  return points
}

// Distance between two lat/lng points in km
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Generate circle points on sphere surface
export function circleOnSphere(lat, lng, radiusDeg, segments = 64) {
  const points = []
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const cLat = lat + radiusDeg * Math.cos(angle)
    const cLng = lng + radiusDeg * Math.sin(angle) / Math.cos(lat * Math.PI / 180)
    points.push(latLngToVector3(cLat, cLng, 1.001))
  }
  return points
}
