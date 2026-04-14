import { Platform } from 'react-native'
import type { GeoPoint } from './checkin'

export class GeolocationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeolocationError'
  }
}

/**
 * PWA-ready geolocation service that uses the browser's Geolocation API
 * on web and falls back gracefully on native platforms.
 */
export async function getCurrentPosition(): Promise<GeoPoint> {
  if (Platform.OS === 'web') {
    return getWebPosition()
  }

  // On native, also use the standard navigator.geolocation (available in RN)
  return getWebPosition()
}

function getWebPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(
        new GeolocationError(
          'Geolocalização não disponível neste dispositivo/navegador.'
        )
      )
      return
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      error => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new GeolocationError(
                'Permissão de localização negada. Habilite nas configurações do navegador.'
              )
            )
            break
          case error.POSITION_UNAVAILABLE:
            reject(
              new GeolocationError('Localização indisponível. Verifique o GPS.')
            )
            break
          case error.TIMEOUT:
            reject(
              new GeolocationError(
                'Tempo esgotado ao obter localização. Tente novamente.'
              )
            )
            break
          default:
            reject(new GeolocationError('Erro ao obter localização.'))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    )
  })
}

/**
 * Watch position changes. Returns a cleanup function to stop watching.
 */
export function watchPosition(
  onUpdate: (point: GeoPoint) => void,
  onError?: (error: GeolocationError) => void
): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError?.(
      new GeolocationError('Geolocalização não disponível neste dispositivo.')
    )
    return () => {}
  }

  const watchId = navigator.geolocation.watchPosition(
    position => {
      onUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      })
    },
    error => {
      onError?.(new GeolocationError(error.message))
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3000
    }
  )

  return () => navigator.geolocation.clearWatch(watchId)
}
