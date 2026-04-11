import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { createProfileService } from '@/lib/services/profiles'
import { useAuth } from '@/lib/providers/AuthProvider'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ProfileSkeleton } from '@/components/ui/Skeleton'
import { showToast } from '@/components/ui/Toast'
import type { Database } from '@/lib/supabase/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

const profileService = createProfileService()

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ username: '', bio: '', phone: '' })

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const data = await profileService.getById(user.id)
        setProfile(data)
        setForm({
          username: data.username ?? '',
          bio: data.bio ?? '',
          phone: data.phone ?? ''
        })
      } catch (err) {
        console.error('Erro ao carregar perfil:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await profileService.update(user.id, {
        username: form.username || null,
        bio: form.bio || null,
        phone: form.phone || null
      })
      showToast('success', 'Perfil atualizado!', 'Suas alterações foram salvas')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      showToast('error', 'Erro ao salvar', msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ScrollView className="flex-1 bg-surface-50">
        <ProfileSkeleton />
      </ScrollView>
    )
  }

  const isDriver = profile?.role === 'driver' || profile?.role === 'both'
  const isPassenger = profile?.role === 'passenger' || profile?.role === 'both'

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="pb-10 md:max-w-2xl md:mx-auto md:w-full"
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar header */}
        <View className="bg-primary-600 pt-8 pb-12 items-center rounded-b-3xl">
          <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-3">
            <Text className="text-3xl">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text className="text-white text-xl font-bold">
            {profile?.full_name ?? 'Sem nome'}
          </Text>
          <Text className="text-primary-200 text-sm mt-0.5">{user?.email}</Text>

          {/* Role badges */}
          <View className="flex-row gap-2 mt-3">
            <View
              className={`px-3 py-1.5 rounded-full ${isDriver ? 'bg-white/20' : 'bg-white/10'}`}
            >
              <Text
                className={`text-xs font-medium ${isDriver ? 'text-white' : 'text-primary-300'}`}
              >
                🚗 Motorista
              </Text>
            </View>
            <View
              className={`px-3 py-1.5 rounded-full ${isPassenger ? 'bg-white/20' : 'bg-white/10'}`}
            >
              <Text
                className={`text-xs font-medium ${isPassenger ? 'text-white' : 'text-primary-300'}`}
              >
                👤 Passageiro
              </Text>
            </View>
          </View>
        </View>

        {/* Form card */}
        <View className="mx-5 -mt-6 bg-white rounded-2xl p-5 shadow-sm border border-surface-100 mb-4">
          <Input
            label="Nome de Usuário"
            icon="@"
            placeholder="usuario"
            value={form.username}
            onChangeText={v => setForm(p => ({ ...p, username: v }))}
            autoCapitalize="none"
          />

          <Input
            label="Bio"
            placeholder="Fale um pouco sobre você..."
            value={form.bio}
            onChangeText={v => setForm(p => ({ ...p, bio: v }))}
            multiline
            numberOfLines={3}
          />

          <Input
            label="Telefone"
            icon="📱"
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChangeText={v => setForm(p => ({ ...p, phone: v }))}
            keyboardType="phone-pad"
          />

          <Button title="Salvar Perfil" onPress={handleSave} loading={saving} />
        </View>

        {/* Sign out */}
        <View className="mx-5">
          <Button title="Sair da Conta" variant="danger" onPress={signOut} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
