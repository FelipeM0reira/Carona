import { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native'
import { Link, router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
  }>({})

  function validate() {
    const errors: typeof fieldErrors = {}
    if (!fullName.trim()) errors.fullName = 'Informe seu nome'
    if (!email.trim()) errors.email = 'Informe seu email'
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email inválido'
    if (!password) errors.password = 'Informe uma senha'
    else if (password.length < 6) errors.password = 'Mínimo 6 caracteres'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleRegister() {
    if (!validate()) return
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } }
      })
      if (error) {
        setError(error.message)
      } else {
        router.replace('/(app)')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function clearError(field: string) {
    setFieldErrors(p => ({ ...p, [field]: undefined }))
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-8 py-12"
        keyboardShouldPersistTaps="handled"
        className="md:max-w-md md:mx-auto md:w-full"
      >
        {/* Header */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">C</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900">Criar Conta</Text>
          <Text className="text-base text-gray-500 mt-1">
            Comece a compartilhar viagens
          </Text>
        </View>

        {error ? (
          <View className="bg-danger-50 border border-danger-500 rounded-xl px-4 py-3 mb-6">
            <Text className="text-danger-700 text-sm text-center">{error}</Text>
          </View>
        ) : null}

        <Input
          label="Nome completo"
          icon="👤"
          placeholder="João Silva"
          value={fullName}
          onChangeText={v => {
            setFullName(v)
            clearError('fullName')
          }}
          error={fieldErrors.fullName}
        />

        <Input
          label="Email"
          icon="✉"
          placeholder="seu@email.com"
          value={email}
          onChangeText={v => {
            setEmail(v)
            clearError('email')
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          error={fieldErrors.email}
        />

        <Input
          label="Senha"
          icon="🔒"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChangeText={v => {
            setPassword(v)
            clearError('password')
          }}
          secureTextEntry
          error={fieldErrors.password}
        />

        <View className="mt-2">
          <Button
            title={loading ? 'Cadastrando...' : 'Criar Conta'}
            onPress={handleRegister}
            loading={loading}
            size="lg"
          />
        </View>

        <Link href="/(auth)/login" asChild>
          <Pressable className="py-4 items-center mt-4">
            <Text className="text-gray-500 text-base">
              Já tem conta?{' '}
              <Text className="text-primary-600 font-semibold">Entrar</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
