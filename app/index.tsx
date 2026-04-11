import { Redirect } from 'expo-router'
import { useAuth } from '@/lib/providers/AuthProvider'
import { View, Text, ActivityIndicator } from 'react-native'

export default function Index() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <View className="w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center mb-4">
          <Text className="text-white text-2xl font-bold">C</Text>
        </View>
        <ActivityIndicator size="small" color="#4f46e5" className="mt-4" />
      </View>
    )
  }

  if (session) {
    return <Redirect href="/(app)" />
  }

  return <Redirect href="/(auth)/login" />
}
