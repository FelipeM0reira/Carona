import { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { router } from 'expo-router'
import { createTripService } from '@/lib/services/trips'
import { useAuth } from '@/lib/providers/AuthProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'

const tripService = createTripService()

type FieldErrors = {
  originName?: string
  destinationName?: string
  departureTime?: string
  pricePerSeat?: string
  totalSeats?: string
}

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

  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function updateForm(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
    setFieldErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const errors: FieldErrors = {}
    if (!form.originName.trim())
      errors.originName = 'Informe a cidade de origem'
    if (!form.destinationName.trim())
      errors.destinationName = 'Informe a cidade de destino'
    if (!form.departureTime.trim()) {
      errors.departureTime = 'Informe data e hora'
    } else {
      const d = new Date(form.departureTime)
      if (isNaN(d.getTime())) errors.departureTime = 'Formato: 2026-04-15T08:00'
      else if (d < new Date()) errors.departureTime = 'Data deve ser no futuro'
    }
    const price = parseFloat(form.pricePerSeat)
    if (!form.pricePerSeat.trim()) errors.pricePerSeat = 'Informe o preço'
    else if (isNaN(price) || price < 0) errors.pricePerSeat = 'Preço inválido'
    const seats = parseInt(form.totalSeats, 10)
    if (!form.totalSeats.trim()) errors.totalSeats = 'Informe os assentos'
    else if (isNaN(seats) || seats < 1) errors.totalSeats = 'Mínimo 1 assento'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleCreate() {
    if (!user) return
    if (!validate()) return
    setError('')

    const luggage: string[] = []
    if (form.luggageP) luggage.push('P')
    if (form.luggageM) luggage.push('M')
    if (form.luggageG) luggage.push('G')

    const totalSeats = parseInt(form.totalSeats, 10)
    const parsedDate = new Date(form.departureTime)

    setLoading(true)
    try {
      await tripService.create({
        driver_id: user.id,
        origin_name: form.originName.trim(),
        origin_lat: parseFloat(form.originLat) || 0,
        origin_lng: parseFloat(form.originLng) || 0,
        destination_name: form.destinationName.trim(),
        destination_lat: parseFloat(form.destinationLat) || 0,
        destination_lng: parseFloat(form.destinationLng) || 0,
        departure_time: parsedDate.toISOString(),
        price_per_seat: parseFloat(form.pricePerSeat),
        total_seats: totalSeats,
        available_seats: totalSeats,
        luggage_policy: luggage
      })
      showToast('success', 'Viagem criada!', 'Sua viagem já está disponível')
      router.back()
    } catch (err) {
      console.error('Erro ao criar viagem:', err)
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const LUGGAGE_OPTIONS = [
    { key: 'luggageP' as const, size: 'P', label: 'Pequena', icon: '🎒' },
    { key: 'luggageM' as const, size: 'M', label: 'Média', icon: '💼' },
    { key: 'luggageG' as const, size: 'G', label: 'Grande', icon: '🧳' }
  ]

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="p-5 pb-10 md:max-w-2xl md:mx-auto md:w-full"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">Nova Viagem</Text>
          <Text className="text-sm text-gray-500 mt-1">
            Preencha os dados da sua carona
          </Text>
        </View>

        {/* Error banner */}
        {error ? (
          <View className="bg-danger-50 border border-danger-500 rounded-2xl px-4 py-3 mb-6">
            <Text className="text-danger-700 text-sm text-center">{error}</Text>
          </View>
        ) : null}

        {/* Route section */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-surface-100 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-4">
            📍 Rota
          </Text>

          <Input
            label="Cidade de Origem"
            placeholder="Ex: Campinas"
            value={form.originName}
            onChangeText={v => updateForm('originName', v)}
            error={fieldErrors.originName}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="Latitude"
                placeholder="-22.9068"
                value={form.originLat}
                onChangeText={v => updateForm('originLat', v)}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Input
                label="Longitude"
                placeholder="-47.0615"
                value={form.originLng}
                onChangeText={v => updateForm('originLng', v)}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Divider with arrow */}
          <View className="items-center my-2">
            <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
              <Text className="text-primary-600">↓</Text>
            </View>
          </View>

          <Input
            label="Cidade de Destino"
            placeholder="Ex: São Paulo"
            value={form.destinationName}
            onChangeText={v => updateForm('destinationName', v)}
            error={fieldErrors.destinationName}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="Latitude"
                placeholder="-23.5505"
                value={form.destinationLat}
                onChangeText={v => updateForm('destinationLat', v)}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Input
                label="Longitude"
                placeholder="-46.6333"
                value={form.destinationLng}
                onChangeText={v => updateForm('destinationLng', v)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Details section */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-surface-100 mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-4">
            📋 Detalhes
          </Text>

          <Input
            label="Data e Hora de Saída"
            icon="📅"
            placeholder="2026-04-15T08:00"
            value={form.departureTime}
            onChangeText={v => updateForm('departureTime', v)}
            error={fieldErrors.departureTime}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="Preço / Assento (R$)"
                icon="💰"
                placeholder="35.00"
                value={form.pricePerSeat}
                onChangeText={v => updateForm('pricePerSeat', v)}
                keyboardType="numeric"
                error={fieldErrors.pricePerSeat}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Total de Assentos"
                icon="💺"
                placeholder="4"
                value={form.totalSeats}
                onChangeText={v => updateForm('totalSeats', v)}
                keyboardType="numeric"
                error={fieldErrors.totalSeats}
              />
            </View>
          </View>
        </View>

        {/* Luggage section */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-surface-100 mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-4">
            🧳 Bagagem Aceita
          </Text>
          <View className="flex-row gap-3">
            {LUGGAGE_OPTIONS.map(({ key, label, icon }) => {
              const selected = form[key]
              return (
                <Pressable
                  key={key}
                  className={`flex-1 py-4 rounded-2xl items-center border-2 ${
                    selected
                      ? 'bg-primary-50 border-primary-500'
                      : 'bg-surface-50 border-surface-200'
                  }`}
                  onPress={() => updateForm(key, !selected)}
                >
                  <Text className="text-xl mb-1">{icon}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      selected ? 'text-primary-700' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Submit */}
        <Button
          title="Criar Viagem"
          onPress={handleCreate}
          loading={loading}
          size="lg"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
