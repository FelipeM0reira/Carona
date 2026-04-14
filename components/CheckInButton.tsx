import { useState, useEffect, useCallback } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { Button } from '@/components/ui/Button'
import {
  validateCheckIn,
  calculateDistance,
  CheckInError,
  type GeoPoint
} from '@/lib/services/checkin'
import {
  getCurrentPosition,
  watchPosition,
  GeolocationError
} from '@/lib/services/geolocation'

interface CheckInButtonProps {
  pickupPoint: GeoPoint
  onCheckInSuccess: () => void
  disabled?: boolean
}

export function CheckInButton({
  pickupPoint,
  onCheckInSuccess,
  disabled = false
}: CheckInButtonProps) {
  const [loading, setLoading] = useState(false)
  const [distance, setDistance] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [watching, setWatching] = useState(false)

  // Watch user position to show live distance feedback
  useEffect(() => {
    const stopWatching = watchPosition(
      position => {
        const dist = calculateDistance(position, pickupPoint)
        setDistance(Math.round(dist))
        setWatching(true)
        setError(null)
      },
      err => {
        setError(err.message)
        setWatching(false)
      }
    )

    return stopWatching
  }, [pickupPoint.lat, pickupPoint.lng])

  const handleCheckIn = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const userLocation = await getCurrentPosition()
      validateCheckIn(userLocation, pickupPoint)
      onCheckInSuccess()
    } catch (err) {
      if (err instanceof CheckInError) {
        setError(err.message)
        setDistance(err.distance)
      } else if (err instanceof GeolocationError) {
        setError(err.message)
      } else {
        setError('Erro inesperado ao realizar check-in.')
      }
    } finally {
      setLoading(false)
    }
  }, [pickupPoint, onCheckInSuccess])

  const isWithinRange = distance !== null && distance <= 50
  const distanceColor = isWithinRange ? 'text-green-600' : 'text-orange-500'

  return (
    <View className="w-full">
      {/* Distance feedback */}
      {watching && distance !== null && (
        <View className="flex-row items-center justify-center mb-3 p-3 bg-surface-50 rounded-xl">
          <Text className="text-sm text-gray-500 mr-1">Distância:</Text>
          <Text className={`text-sm font-bold ${distanceColor}`}>
            {distance < 1000
              ? `${distance}m`
              : `${(distance / 1000).toFixed(1)}km`}
          </Text>
          {isWithinRange && (
            <Text className="text-green-600 text-xs ml-2">✓ No raio</Text>
          )}
        </View>
      )}

      {/* Error message */}
      {error && (
        <View className="mb-3 p-3 bg-danger-50 rounded-xl">
          <Text className="text-danger-600 text-sm">{error}</Text>
        </View>
      )}

      {/* Check-in button */}
      <Button
        title={
          loading
            ? 'Verificando localização...'
            : isWithinRange
              ? 'Realizar Check-in ✓'
              : 'Realizar Check-in'
        }
        variant={isWithinRange ? 'primary' : 'outline'}
        loading={loading}
        disabled={disabled}
        onPress={handleCheckIn}
      />

      {/* Helper text */}
      {!isWithinRange && !error && (
        <Text className="text-xs text-gray-400 text-center mt-2">
          Aproxime-se do ponto de encontro (máx. 50m)
        </Text>
      )}
    </View>
  )
}
