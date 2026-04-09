import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/providers/AuthProvider'

type BookingWithTrip = {
  id: string
  status: string
  luggage_size: string | null
  created_at: string
  trips: {
    origin_name: string
    destination_name: string
    departure_time: string
    price_per_seat: number
  }
}

export default function BookingsScreen() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<BookingWithTrip[]>([])
  const [loading, setLoading] = useState(true)

  const loadBookings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select(
        `
        id, status, luggage_size, created_at,
        trips:trip_id (origin_name, destination_name, departure_time, price_per_seat)
      `
      )
      .eq('passenger_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setBookings(data as unknown as BookingWithTrip[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmada',
    rejected: 'Rejeitada',
    cancelled: 'Cancelada'
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        contentContainerClassName="p-4 gap-3"
        renderItem={({ item }) => {
          const date = new Date(item.trips.departure_time)
          return (
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-semibold text-gray-900">
                  {item.trips.origin_name} → {item.trips.destination_name}
                </Text>
                <View
                  className={`px-2 py-0.5 rounded-full ${statusColors[item.status] ?? ''}`}
                >
                  <Text className="text-xs font-medium">
                    {statusLabels[item.status] ?? item.status}
                  </Text>
                </View>
              </View>
              <Text className="text-sm text-gray-500">
                {date.toLocaleDateString('pt-BR')} às{' '}
                {date.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              <Text className="text-sm font-semibold text-primary-600 mt-1">
                R$ {Number(item.trips.price_per_seat).toFixed(2)}
              </Text>
            </View>
          )
        }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-gray-500 text-base">
              Nenhuma reserva ainda
            </Text>
          </View>
        }
      />
    </View>
  )
}
