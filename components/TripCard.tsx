import { View, Text } from 'react-native'
import type { Database } from '@/lib/supabase/database.types'

type Trip = Database['public']['Tables']['trips']['Row']

export function TripCard({ trip }: { trip: Trip }) {
  const date = new Date(trip.departure_time)
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-xs text-gray-500 uppercase tracking-wide">
            Origem
          </Text>
          <Text className="text-base font-semibold text-gray-900">
            {trip.origin_name}
          </Text>
        </View>
        <Text className="text-gray-400 mx-2 mt-4">→</Text>
        <View className="flex-1">
          <Text className="text-xs text-gray-500 uppercase tracking-wide">
            Destino
          </Text>
          <Text className="text-base font-semibold text-gray-900">
            {trip.destination_name}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
        <Text className="text-sm text-gray-600">{formattedDate}</Text>
        <View className="flex-row items-center gap-3">
          <Text className="text-sm text-gray-600">
            {trip.available_seats}/{trip.total_seats} assentos
          </Text>
          <Text className="text-base font-bold text-primary-600">
            R$ {Number(trip.price_per_seat).toFixed(2)}
          </Text>
        </View>
      </View>

      {trip.luggage_policy.length > 0 && (
        <View className="flex-row gap-1 mt-2">
          {trip.luggage_policy.map(size => (
            <View key={size} className="bg-gray-100 px-2 py-0.5 rounded">
              <Text className="text-xs text-gray-600">
                {size === 'P' ? 'Pequena' : size === 'M' ? 'Média' : 'Grande'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
