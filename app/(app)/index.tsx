import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable
} from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { TripCard } from '@/components/TripCard'
import type { Database } from '@/lib/supabase/database.types'

type Trip = Database['public']['Tables']['trips']['Row']

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  const loadTrips = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('status', 'active')
      .gt('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true })

    if (!error && data) setTrips(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

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
        data={trips}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Link href={`/(app)/trip/${item.id}` as never} asChild>
            <Pressable>
              <TripCard trip={item} />
            </Pressable>
          </Link>
        )}
        contentContainerClassName="p-4 gap-3"
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-gray-500 text-base">
              Nenhuma viagem disponível
            </Text>
          </View>
        }
      />

      <Link href="/(app)/trip/create" asChild>
        <Pressable className="absolute bottom-6 right-6 bg-primary-600 w-14 h-14 rounded-full items-center justify-center shadow-lg">
          <Text className="text-white text-2xl">+</Text>
        </Pressable>
      </Link>
    </View>
  )
}
