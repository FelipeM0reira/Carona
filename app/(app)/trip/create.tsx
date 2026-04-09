import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/providers/AuthProvider'

export default function CreateTripScreen() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    originName: '',
    originLat: '',
    originLng: '',
    destinationName: '',
    destinationLat: '',
    destinationLng: '',
    departureTime: '',
    pricePerSeat: '',
    totalSeats: '',
    luggageP: false,
    luggageM: false,
    luggageG: false
  })

  function updateForm(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleCreate() {
    if (!user) return

    const luggage: string[] = []
    if (form.luggageP) luggage.push('P')
    if (form.luggageM) luggage.push('M')
    if (form.luggageG) luggage.push('G')

    const totalSeats = parseInt(form.totalSeats, 10)
    if (isNaN(totalSeats) || totalSeats < 1) {
      Alert.alert('Erro', 'Número de assentos inválido.')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('trips').insert({
      driver_id: user.id,
      origin_name: form.originName,
      origin_lat: parseFloat(form.originLat),
      origin_lng: parseFloat(form.originLng),
      destination_name: form.destinationName,
      destination_lat: parseFloat(form.destinationLat),
      destination_lng: parseFloat(form.destinationLng),
      departure_time: new Date(form.departureTime).toISOString(),
      price_per_seat: parseFloat(form.pricePerSeat),
      total_seats: totalSeats,
      available_seats: totalSeats,
      luggage_policy: luggage
    })

    if (error) {
      Alert.alert('Erro', error.message)
    } else {
      Alert.alert('Sucesso', 'Viagem criada!', [
        { text: 'OK', onPress: () => router.back() }
      ])
    }
    setLoading(false)
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Nova Viagem</Text>

      <Text className="text-sm font-medium text-gray-700 mb-1">
        Cidade de Origem
      </Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="Ex: Campinas"
        value={form.originName}
        onChangeText={v => updateForm('originName', v)}
      />

      <View className="flex-row gap-2 mb-4">
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Lat Origem
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="-22.9068"
            value={form.originLat}
            onChangeText={v => updateForm('originLat', v)}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Lng Origem
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="-47.0615"
            value={form.originLng}
            onChangeText={v => updateForm('originLng', v)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text className="text-sm font-medium text-gray-700 mb-1">
        Cidade de Destino
      </Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="Ex: São Paulo"
        value={form.destinationName}
        onChangeText={v => updateForm('destinationName', v)}
      />

      <View className="flex-row gap-2 mb-4">
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Lat Destino
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="-23.5505"
            value={form.destinationLat}
            onChangeText={v => updateForm('destinationLat', v)}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Lng Destino
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="-46.6333"
            value={form.destinationLng}
            onChangeText={v => updateForm('destinationLng', v)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text className="text-sm font-medium text-gray-700 mb-1">
        Data e Hora de Saída
      </Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="2026-04-15T08:00"
        value={form.departureTime}
        onChangeText={v => updateForm('departureTime', v)}
      />

      <View className="flex-row gap-2 mb-4">
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Preço/Assento (R$)
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="35.00"
            value={form.pricePerSeat}
            onChangeText={v => updateForm('pricePerSeat', v)}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Total de Assentos
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3"
            placeholder="4"
            value={form.totalSeats}
            onChangeText={v => updateForm('totalSeats', v)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text className="text-sm font-medium text-gray-700 mb-2">
        Bagagem Aceita
      </Text>
      <View className="flex-row gap-3 mb-6">
        {(['P', 'M', 'G'] as const).map(size => {
          const key = `luggage${size}` as 'luggageP' | 'luggageM' | 'luggageG'
          const selected = form[key]
          return (
            <Pressable
              key={size}
              className={`flex-1 py-3 rounded-lg items-center border ${
                selected
                  ? 'bg-primary-600 border-primary-600'
                  : 'bg-white border-gray-300'
              }`}
              onPress={() => updateForm(key, !selected)}
            >
              <Text
                className={
                  selected ? 'text-white font-semibold' : 'text-gray-700'
                }
              >
                {size === 'P' ? 'Pequena' : size === 'M' ? 'Média' : 'Grande'}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <Pressable
        className="bg-primary-600 rounded-lg py-4 items-center"
        onPress={handleCreate}
        disabled={loading}
      >
        <Text className="text-white font-semibold text-base">
          {loading ? 'Criando...' : 'Criar Viagem'}
        </Text>
      </Pressable>
    </ScrollView>
  )
}
