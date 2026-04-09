import { Redirect } from 'expo-router'
import { useAuth } from '@/lib/providers/AuthProvider'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (session) {
    return <Redirect href="/(app)" />
  }

  return <Redirect href="/(auth)/login" />
}
