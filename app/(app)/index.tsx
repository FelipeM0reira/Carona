import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native'
import { Link } from 'expo-router'
import { createTripService } from '@/lib/services/trips'
import { TripCard } from '@/components/TripCard'
import { TripCardSkeleton } from '@/components/ui/Skeleton'
import type { Database } from '@/lib/supabase/database.types'

type Trip = Database['public']['Tables']['trips']['Row']

const tripService = createTripService()

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadTrips = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const data = await tripService.list({ availableOnly: true })
      setTrips(data)
    } catch (err) {
      console.error('Erro ao carregar viagens:', err)
      setError('Não foi possível carregar as viagens')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  return (
    <View className="flex-1 bg-surface-50">
      {/* Header */}
      <View className="bg-white px-5 pt-3 pb-4 border-b border-surface-100">
        <Text className="text-2xl font-bold text-gray-900">Viagens</Text>
        <Text className="text-sm text-gray-500 mt-0.5">
          {trips.length > 0
            ? `${trips.length} viagens disponíveis`
            : 'Encontre sua próxima carona'}
        </Text>
      </View>

      {/* Error state */}
      {error && !loading ? (
        <View className="mx-5 mt-4 bg-danger-50 border border-danger-500 rounded-2xl px-4 py-3">
          <Text className="text-danger-700 text-sm text-center">{error}</Text>
          <Pressable onPress={() => loadTrips()} className="mt-2">
            <Text className="text-primary-600 font-semibold text-sm text-center">
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Loading skeleton */}
      {loading ? (
        <View className="p-5 gap-4 md:max-w-2xl md:mx-auto md:w-full">
          <TripCardSkeleton />
          <TripCardSkeleton />
          <TripCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Link href={`/(app)/trip/${item.id}` as never} asChild>
              <Pressable className="active:opacity-80">
                <TripCard trip={item} />
              </Pressable>
            </Link>
          )}
          contentContainerClassName="p-5 gap-4 md:max-w-2xl md:mx-auto md:w-full"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadTrips(true)}
              tintColor="#4f46e5"
              colors={['#4f46e5']}
            />
          }
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-4xl mb-4">🚗</Text>
              <Text className="text-gray-900 font-semibold text-lg mb-1">
                Nenhuma viagem disponível
              </Text>
              <Text className="text-gray-500 text-sm text-center px-8">
                Crie uma viagem ou volte mais tarde para encontrar caronas
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Link href="/(app)/trip/create" asChild>
        <Pressable className="absolute bottom-6 right-6 bg-primary-600 w-14 h-14 rounded-2xl items-center justify-center shadow-lg active:bg-primary-700">
          <Text className="text-white text-2xl font-light">+</Text>
        </Pressable>
      </Link>
    </View>
  )
}
