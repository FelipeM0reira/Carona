import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/providers/AuthProvider'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ username: '', bio: '', phone: '' })

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
        setForm({
          username: data.username ?? '',
          bio: data.bio ?? '',
          phone: data.phone ?? ''
        })
      }
      setLoading(false)
    }
    load()
  }, [user])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        username: form.username || null,
        bio: form.bio || null,
        phone: form.phone || null
      })
      .eq('id', user.id)

    if (error) {
      Alert.alert('Erro', error.message)
    } else {
      Alert.alert('Sucesso', 'Perfil atualizado!')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Carregando...</Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-6">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        {profile?.full_name ?? 'Perfil'}
      </Text>
      <Text className="text-sm text-gray-500 mb-6">{user?.email}</Text>

      <Text className="text-sm font-medium text-gray-700 mb-1">
        Nome de Usuário
      </Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="@usuario"
        value={form.username}
        onChangeText={v => setForm(p => ({ ...p, username: v }))}
        autoCapitalize="none"
      />

      <Text className="text-sm font-medium text-gray-700 mb-1">Bio</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="Fale um pouco sobre você"
        value={form.bio}
        onChangeText={v => setForm(p => ({ ...p, bio: v }))}
        multiline
        numberOfLines={3}
      />

      <Text className="text-sm font-medium text-gray-700 mb-1">Telefone</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
        placeholder="(11) 99999-9999"
        value={form.phone}
        onChangeText={v => setForm(p => ({ ...p, phone: v }))}
        keyboardType="phone-pad"
      />

      <View className="flex-row gap-2 mb-6">
        <View
          className={`px-3 py-1 rounded-full ${
            profile?.role === 'driver' || profile?.role === 'both'
              ? 'bg-primary-100'
              : 'bg-gray-100'
          }`}
        >
          <Text
            className={
              profile?.role === 'driver' || profile?.role === 'both'
                ? 'text-primary-700 font-medium'
                : 'text-gray-500'
            }
          >
            Motorista
          </Text>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${
            profile?.role === 'passenger' || profile?.role === 'both'
              ? 'bg-primary-100'
              : 'bg-gray-100'
          }`}
        >
          <Text
            className={
              profile?.role === 'passenger' || profile?.role === 'both'
                ? 'text-primary-700 font-medium'
                : 'text-gray-500'
            }
          >
            Passageiro
          </Text>
        </View>
      </View>

      <Pressable
        className="bg-primary-600 rounded-lg py-4 items-center mb-4"
        onPress={handleSave}
        disabled={saving}
      >
        <Text className="text-white font-semibold text-base">
          {saving ? 'Salvando...' : 'Salvar Perfil'}
        </Text>
      </Pressable>

      <Pressable
        className="border border-red-300 rounded-lg py-4 items-center"
        onPress={signOut}
      >
        <Text className="text-red-600 font-semibold text-base">Sair</Text>
      </Pressable>
    </ScrollView>
  )
}
