import { View, Text } from 'react-native'
import type { Database } from '@/lib/supabase/database.types'

type Trip = Database['public']['Tables']['trips']['Row']

const LUGGAGE_LABELS: Record<string, string> = {
  P: 'P',
  M: 'M',
  G: 'G'
}

export function TripCard({ trip }: { trip: Trip }) {
  const date = new Date(trip.departure_time)
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  })
  const formattedTime = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const seatsLow = trip.available_seats <= 2 && trip.available_seats > 0

  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm border border-surface-100">
      {/* Route with timeline */}
      <View className="flex-row mb-4">
        {/* Timeline dots */}
        <View className="items-center mr-4 pt-1">
          <View className="w-3 h-3 rounded-full bg-primary-500" />
          <View className="w-0.5 flex-1 bg-surface-200 my-1" />
          <View className="w-3 h-3 rounded-full border-2 border-primary-500 bg-white" />
        </View>
        {/* Cities */}
        <View
          className="flex-1 justify-between py-0.5"
          style={{ minHeight: 56 }}
        >
          <View>
            <Text className="text-xs text-gray-400 uppercase tracking-wider">
              Origem
            </Text>
            <Text className="text-base font-semibold text-gray-900">
              {trip.origin_name}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-gray-400 uppercase tracking-wider">
              Destino
            </Text>
            <Text className="text-base font-semibold text-gray-900">
              {trip.destination_name}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer info */}
      <View className="flex-row items-center justify-between pt-3 border-t border-surface-100">
        {/* Date/time */}
        <View className="flex-row items-center">
          <Text className="text-sm text-gray-500">📅 {formattedDate}</Text>
          <Text className="text-gray-300 mx-1.5">•</Text>
          <Text className="text-sm text-gray-500">🕐 {formattedTime}</Text>
        </View>

        {/* Seats */}
        <View
          className={`px-2.5 py-1 rounded-full ${seatsLow ? 'bg-warning-50' : 'bg-surface-50'}`}
        >
          <Text
            className={`text-xs font-semibold ${seatsLow ? 'text-warning-700' : 'text-gray-600'}`}
          >
            {trip.available_seats === 0
              ? 'Lotado'
              : `${trip.available_seats}/${trip.total_seats} vagas`}
          </Text>
        </View>

        {/* Price */}
        <Text className="text-lg font-bold text-primary-600">
          R$ {Number(trip.price_per_seat).toFixed(0)}
        </Text>
      </View>

      {/* Luggage tags */}
      {trip.luggage_policy.length > 0 && (
        <View className="flex-row gap-1.5 mt-3">
          {trip.luggage_policy.map(size => (
            <View key={size} className="bg-primary-50 px-2.5 py-1 rounded-full">
              <Text className="text-primary-700 text-xs font-medium">
                🧳 {LUGGAGE_LABELS[size] ?? size}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
