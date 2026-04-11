import { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  function validate() {
    const errors: typeof fieldErrors = {}
    if (!email.trim()) errors.email = 'Informe seu email'
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email inválido'
    if (!password) errors.password = 'Informe sua senha'
    else if (password.length < 6) errors.password = 'Mínimo 6 caracteres'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleLogin() {
    if (!validate()) return
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos')
        } else {
          setError(error.message)
        }
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
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
        {/* Logo */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">C</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900">Carona</Text>
          <Text className="text-base text-gray-500 mt-1">
            Viaje junto, gaste menos
          </Text>
        </View>

        {/* Error banner */}
        {error ? (
          <View className="bg-danger-50 border border-danger-500 rounded-xl px-4 py-3 mb-6">
            <Text className="text-danger-700 text-sm text-center">{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <Input
          label="Email"
          icon="✉"
          placeholder="seu@email.com"
          value={email}
          onChangeText={v => {
            setEmail(v)
            setFieldErrors(p => ({ ...p, email: undefined }))
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          error={fieldErrors.email}
        />

        <Input
          label="Senha"
          icon="🔒"
          placeholder="••••••••"
          value={password}
          onChangeText={v => {
            setPassword(v)
            setFieldErrors(p => ({ ...p, password: undefined }))
          }}
          secureTextEntry
          error={fieldErrors.password}
        />

        <View className="mt-2">
          <Button
            title={loading ? 'Entrando...' : 'Entrar'}
            onPress={handleLogin}
            loading={loading}
            size="lg"
          />
        </View>

        {/* Register link */}
        <Link href="/(auth)/register" asChild>
          <Pressable className="py-4 items-center mt-4">
            <Text className="text-gray-500 text-base">
              Não tem conta?{' '}
              <Text className="text-primary-600 font-semibold">
                Cadastre-se
              </Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
