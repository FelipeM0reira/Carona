import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/providers/AuthProvider'
import { BookingCardSkeleton } from '@/components/ui/Skeleton'

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

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; label: string; icon: string }
> = {
  pending: {
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    label: 'Pendente',
    icon: '⏳'
  },
  confirmed: {
    bg: 'bg-success-50',
    text: 'text-success-700',
    label: 'Confirmada',
    icon: '✓'
  },
  rejected: {
    bg: 'bg-danger-50',
    text: 'text-danger-700',
    label: 'Rejeitada',
    icon: '✕'
  },
  cancelled: {
    bg: 'bg-surface-100',
    text: 'text-gray-600',
    label: 'Cancelada',
    icon: '—'
  }
}

export default function BookingsScreen() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<BookingWithTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadBookings = useCallback(
    async (isRefresh = false) => {
      if (!user) return
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      try {
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
      } catch (err) {
        console.error('Erro ao carregar reservas:', err)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [user]
  )

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  if (loading) {
    return (
      <View className="flex-1 bg-surface-50 p-5 gap-4 md:max-w-2xl md:mx-auto md:w-full">
        <BookingCardSkeleton />
        <BookingCardSkeleton />
        <BookingCardSkeleton />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-surface-50">
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        contentContainerClassName="p-5 gap-4 md:max-w-2xl md:mx-auto md:w-full"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBookings(true)}
            tintColor="#4f46e5"
            colors={['#4f46e5']}
          />
        }
        renderItem={({ item }) => {
          const date = new Date(item.trips.departure_time)
          const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.cancelled

          return (
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-surface-100">
              {/* Header row */}
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="items-center mr-3">
                    <View className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                    <View className="w-0.5 h-4 bg-surface-200 my-0.5" />
                    <View className="w-2.5 h-2.5 rounded-full border-2 border-primary-500" />
                  </View>
                  <View>
                    <Text className="font-semibold text-gray-900">
                      {item.trips.origin_name}
                    </Text>
                    <Text className="font-semibold text-gray-900 mt-1">
                      {item.trips.destination_name}
                    </Text>
                  </View>
                </View>
                <View className={`px-3 py-1.5 rounded-full ${config.bg}`}>
                  <Text className={`text-xs font-semibold ${config.text}`}>
                    {config.icon} {config.label}
                  </Text>
                </View>
              </View>

              {/* Details */}
              <View className="flex-row items-center justify-between pt-3 border-t border-surface-100">
                <Text className="text-sm text-gray-500">
                  📅 {date.toLocaleDateString('pt-BR')} às{' '}
                  {date.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                <Text className="text-base font-bold text-primary-600">
                  R$ {Number(item.trips.price_per_seat).toFixed(0)}
                </Text>
              </View>

              {/* Luggage info */}
              {item.luggage_size && (
                <View className="mt-2">
                  <Text className="text-xs text-gray-400">
                    🧳 Bagagem:{' '}
                    {item.luggage_size === 'P'
                      ? 'Pequena'
                      : item.luggage_size === 'M'
                        ? 'Média'
                        : 'Grande'}
                  </Text>
                </View>
              )}
            </View>
          )
        }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-4xl mb-4">📋</Text>
            <Text className="text-gray-900 font-semibold text-lg mb-1">
              Nenhuma reserva ainda
            </Text>
            <Text className="text-gray-500 text-sm text-center px-8">
              Reserve uma viagem para vê-la aqui
            </Text>
          </View>
        }
      />
    </View>
  )
}
