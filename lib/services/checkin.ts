export interface GeoPoint {
  lat: number
  lng: number
}

export class CheckInError extends Error {
  public distance: number
  constructor(message: string, distance: number) {
    super(message)
    this.name = 'CheckInError'
    this.distance = distance
  }
}

const EARTH_RADIUS_METERS = 6_371_000
const MAX_CHECKIN_DISTANCE_METERS = 50

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Calculates the distance in meters between two geographic points
 * using the Haversine formula.
 */
export function calculateDistance(pointA: GeoPoint, pointB: GeoPoint): number {
  const dLat = toRadians(pointB.lat - pointA.lat)
  const dLng = toRadians(pointB.lng - pointA.lng)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(pointA.lat)) *
      Math.cos(toRadians(pointB.lat)) *
      Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

/**
 * Validates whether a passenger can check-in based on their proximity
 * to the trip's pickup point. Check-in is blocked if distance > 50m.
 */
export function validateCheckIn(
  userLocation: GeoPoint,
  pickupPoint: GeoPoint
): { success: boolean; distance: number } {
  if (
    userLocation.lat < -90 ||
    userLocation.lat > 90 ||
    userLocation.lng < -180 ||
    userLocation.lng > 180
  ) {
    throw new CheckInError('Coordenadas do usuário inválidas', -1)
  }

  if (
    pickupPoint.lat < -90 ||
    pickupPoint.lat > 90 ||
    pickupPoint.lng < -180 ||
    pickupPoint.lng > 180
  ) {
    throw new CheckInError('Coordenadas do ponto de encontro inválidas', -1)
  }

  const distance = calculateDistance(userLocation, pickupPoint)
  const rounded = Math.round(distance * 100) / 100

  if (distance > MAX_CHECKIN_DISTANCE_METERS) {
    throw new CheckInError(
      `Você está a ${rounded}m do ponto de encontro. Aproxime-se para realizar o check-in (máx. ${MAX_CHECKIN_DISTANCE_METERS}m).`,
      rounded
    )
  }

  return { success: true, distance: rounded }
}
