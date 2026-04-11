import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { createTripService } from '@/lib/services/trips'
import { createBookingService } from '@/lib/services/bookings'
import { useAuth } from '@/lib/providers/AuthProvider'
import { TripDetailSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import type { Database } from '@/lib/supabase/database.types'

type Trip = Database['public']['Tables']['trips']['Row']

const tripService = createTripService()
const bookingService = createBookingService()

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [selectedLuggage, setSelectedLuggage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await tripService.getById(id)
        setTrip(data)
      } catch (err) {
        console.error('Erro ao carregar viagem:', err)
        setError('Não foi possível carregar a viagem')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleBook() {
    if (!user || !trip) return

    if (selectedLuggage && !trip.luggage_policy.includes(selectedLuggage)) {
      showToast(
        'error',
        'Bagagem indisponível',
        'Este tamanho não é aceito nesta viagem'
      )
      return
    }

    setBooking(true)
    try {
      await bookingService.create({
        trip_id: trip.id,
        passenger_id: user.id,
        luggage_size: selectedLuggage
      })
      showToast('success', 'Reserva solicitada!', 'Acompanhe na aba Reservas')
      router.push('/(app)/bookings')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      showToast('error', 'Ops!', msg)
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <ScrollView className="flex-1 bg-surface-50">
        <TripDetailSkeleton />
      </ScrollView>
    )
  }

  if (error || !trip) {
    return (
      <View className="flex-1 bg-surface-50 items-center justify-center px-8">
        <Text className="text-4xl mb-4">😕</Text>
        <Text className="text-gray-900 font-semibold text-lg mb-1">
          Viagem não encontrada
        </Text>
        <Text className="text-gray-500 text-sm text-center mb-6">{error}</Text>
        <Button
          title="Voltar"
          variant="outline"
          onPress={() => router.back()}
          fullWidth={false}
        />
      </View>
    )
  }

  const isDriver = user?.id === trip.driver_id
  const date = new Date(trip.departure_time)
  const seatsLow = trip.available_seats <= 2 && trip.available_seats > 0

  return (
    <ScrollView
      className="flex-1 bg-surface-50"
      contentContainerClassName="pb-10 md:max-w-2xl md:mx-auto md:w-full"
    >
      {/* Route Header */}
      <View className="bg-primary-600 px-6 pt-6 pb-8 rounded-b-3xl">
        <View className="flex-row items-center mb-6">
          <View className="items-center mr-5">
            <View className="w-3.5 h-3.5 rounded-full bg-white" />
            <View className="w-0.5 h-12 bg-primary-300 my-1" />
            <View className="w-3.5 h-3.5 rounded-full border-2 border-white" />
          </View>
          <View className="flex-1 justify-between" style={{ minHeight: 60 }}>
            <View>
              <Text className="text-primary-200 text-xs uppercase tracking-wider">
                Origem
              </Text>
              <Text className="text-white text-lg font-bold">
                {trip.origin_name}
              </Text>
            </View>
            <View>
              <Text className="text-primary-200 text-xs uppercase tracking-wider">
                Destino
              </Text>
              <Text className="text-white text-lg font-bold">
                {trip.destination_name}
              </Text>
            </View>
          </View>
        </View>

        {/* Date/time chip */}
        <View className="bg-white/20 self-start px-4 py-2 rounded-full">
          <Text className="text-white font-medium text-sm">
            📅 {date.toLocaleDateString('pt-BR')} às{' '}
            {date.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>

      {/* Stats cards */}
      <View className="flex-row gap-3 px-5 -mt-4">
        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-surface-100 items-center">
          <Text className="text-gray-400 text-xs uppercase tracking-wider mb-1">
            Preço
          </Text>
          <Text className="text-2xl font-bold text-primary-600">
            R$ {Number(trip.price_per_seat).toFixed(0)}
          </Text>
          <Text className="text-gray-400 text-xs">por assento</Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-surface-100 items-center">
          <Text className="text-gray-400 text-xs uppercase tracking-wider mb-1">
            Assentos
          </Text>
          <Text
            className={`text-2xl font-bold ${seatsLow ? 'text-warning-600' : trip.available_seats === 0 ? 'text-danger-600' : 'text-gray-900'}`}
          >
            {trip.available_seats}/{trip.total_seats}
          </Text>
          <Text
            className={`text-xs ${seatsLow ? 'text-warning-600' : 'text-gray-400'}`}
          >
            {trip.available_seats === 0
              ? 'lotado'
              : seatsLow
                ? 'últimas vagas!'
                : 'disponíveis'}
          </Text>
        </View>
      </View>

      {/* Luggage policy */}
      {trip.luggage_policy.length > 0 && (
        <View className="mx-5 mt-4 bg-white rounded-2xl p-5 shadow-sm border border-surface-100">
          <Text className="text-sm font-semibold text-gray-900 mb-3">
            🧳 Bagagem Aceita
          </Text>
          <View className="flex-row gap-2">
            {trip.luggage_policy.map(size => {
              const isSelected = selectedLuggage === size
              return (
                <Pressable
                  key={size}
                  onPress={() => setSelectedLuggage(isSelected ? null : size)}
                  className={`flex-1 py-3 rounded-xl items-center border-2 ${
                    isSelected
                      ? 'bg-primary-50 border-primary-500'
                      : 'bg-surface-50 border-surface-200'
                  }`}
                >
                  <Text className="text-lg mb-0.5">
                    {size === 'P' ? '🎒' : size === 'M' ? '💼' : '🧳'}
                  </Text>
                  <Text
                    className={`text-xs font-medium ${isSelected ? 'text-primary-700' : 'text-gray-500'}`}
                  >
                    {size === 'P'
                      ? 'Pequena'
                      : size === 'M'
                        ? 'Média'
                        : 'Grande'}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      )}

      {/* Action button */}
      <View className="px-5 mt-6">
        {!isDriver && trip.available_seats > 0 ? (
          <Button
            title={booking ? 'Reservando...' : 'Reservar Lugar'}
            onPress={handleBook}
            loading={booking}
            size="lg"
          />
        ) : trip.available_seats === 0 ? (
          <View className="bg-danger-50 rounded-2xl py-4 items-center border border-danger-500">
            <Text className="text-danger-700 font-semibold text-base">
              😕 Viagem Lotada
            </Text>
            <Text className="text-danger-600 text-sm mt-1">
              Todas as vagas já foram preenchidas
            </Text>
          </View>
        ) : isDriver ? (
          <View className="bg-primary-50 rounded-2xl py-4 items-center border border-primary-200">
            <Text className="text-primary-700 font-semibold text-base">
              🚗 Você é o motorista
            </Text>
            <Text className="text-primary-600 text-sm mt-1">
              Esta é a sua viagem
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
}
