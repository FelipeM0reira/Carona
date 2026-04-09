import { Tabs, Redirect } from 'expo-router'
import { useAuth } from '@/lib/providers/AuthProvider'

export default function AppLayout() {
  const { session, loading } = useAuth()

  if (!loading && !session) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        headerShown: true
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Viagens', tabBarLabel: 'Viagens' }}
      />
      <Tabs.Screen name="trip" options={{ href: null }} />
      <Tabs.Screen
        name="bookings"
        options={{ title: 'Reservas', tabBarLabel: 'Reservas' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarLabel: 'Perfil' }}
      />
    </Tabs>
  )
}
