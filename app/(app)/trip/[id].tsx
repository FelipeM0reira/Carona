import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/providers/AuthProvider'
import type { Database } from '@/lib/supabase/database.types'

type Trip = Database['public']['Tables']['trips']['Row']

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single()

      setTrip(data)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleBook(luggageSize: 'P' | 'M' | 'G' | null) {
    if (!user || !trip) return

    if (luggageSize && !trip.luggage_policy.includes(luggageSize)) {
      Alert.alert('Erro', 'Tamanho de bagagem não disponível nesta viagem.')
      return
    }

    setBooking(true)
    const { error } = await supabase.from('bookings').insert({
      trip_id: trip.id,
      passenger_id: user.id,
      luggage_size: luggageSize
    })

    if (error) {
      Alert.alert('Erro', error.message)
    } else {
      Alert.alert('Sucesso', 'Reserva solicitada!', [
        { text: 'OK', onPress: () => router.push('/(app)/bookings') }
      ])
    }
    setBooking(false)
  }

  if (loading || !trip) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  const isDriver = user?.id === trip.driver_id
  const date = new Date(trip.departure_time)

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6">
      <Text className="text-2xl font-bold text-gray-900 mb-6">
        Detalhes da Viagem
      </Text>

      <View className="mb-6">
        <Text className="text-sm text-gray-500 mb-1">Origem</Text>
        <Text className="text-lg font-semibold">{trip.origin_name}</Text>
      </View>

      <View className="mb-6">
        <Text className="text-sm text-gray-500 mb-1">Destino</Text>
        <Text className="text-lg font-semibold">{trip.destination_name}</Text>
      </View>

      <View className="mb-6">
        <Text className="text-sm text-gray-500 mb-1">Data e Horário</Text>
        <Text className="text-lg">
          {date.toLocaleDateString('pt-BR')} às{' '}
          {date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>

      <View className="flex-row gap-4 mb-6">
        <View className="flex-1 bg-gray-50 rounded-lg p-4">
          <Text className="text-sm text-gray-500">Preço/Assento</Text>
          <Text className="text-xl font-bold text-primary-600">
            R$ {Number(trip.price_per_seat).toFixed(2)}
          </Text>
        </View>
        <View className="flex-1 bg-gray-50 rounded-lg p-4">
          <Text className="text-sm text-gray-500">Assentos</Text>
          <Text className="text-xl font-bold">
            {trip.available_seats}/{trip.total_seats}
          </Text>
        </View>
      </View>

      {trip.luggage_policy.length > 0 && (
        <View className="mb-6">
          <Text className="text-sm text-gray-500 mb-2">Bagagem Aceita</Text>
          <View className="flex-row gap-2">
            {trip.luggage_policy.map(size => (
              <View key={size} className="bg-primary-50 px-3 py-1 rounded-full">
                <Text className="text-primary-700 font-medium">
                  {size === 'P' ? 'Pequena' : size === 'M' ? 'Média' : 'Grande'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!isDriver && trip.available_seats > 0 && (
        <Pressable
          className="bg-primary-600 rounded-lg py-4 items-center mt-4"
          onPress={() => handleBook(null)}
          disabled={booking}
        >
          <Text className="text-white font-semibold text-base">
            {booking ? 'Reservando...' : 'Reservar Lugar'}
          </Text>
        </Pressable>
      )}

      {trip.available_seats === 0 && (
        <View className="bg-red-50 rounded-lg py-4 items-center mt-4">
          <Text className="text-red-600 font-semibold">Viagem Lotada</Text>
        </View>
      )}
    </ScrollView>
  )
}
