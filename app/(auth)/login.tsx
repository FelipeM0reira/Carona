import { useState } from 'react'
import { View, Text, TextInput, Pressable, Alert } from 'react-native'
import { Link } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    })
    if (error) {
      setError(error.message)
      console.error('Login error:', error.message)
    }
    setLoading(false)
  }

  return (
    <View className="flex-1 justify-center px-8 bg-white">
      <Text className="text-3xl font-bold text-center mb-8 text-primary-600">
        Carona
      </Text>

      {error ? (
        <Text className="text-red-500 text-center mb-4">{error}</Text>
      ) : null}

      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        className="bg-primary-600 rounded-lg py-4 items-center mb-4"
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-white font-semibold text-base">
          {loading ? 'Entrando...' : 'Entrar'}
        </Text>
      </Pressable>

      <Link href="/(auth)/register" asChild>
        <Pressable className="py-2 items-center">
          <Text className="text-primary-600 text-base">
            Não tem conta? Cadastre-se
          </Text>
        </Pressable>
      </Link>
    </View>
  )
}
