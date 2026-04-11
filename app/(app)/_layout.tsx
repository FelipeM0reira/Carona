import { Tabs, Redirect } from 'expo-router'
import { useAuth } from '@/lib/providers/AuthProvider'
import { Text } from 'react-native'

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text className={`text-lg ${focused ? 'opacity-100' : 'opacity-50'}`}>
      {icon}
    </Text>
  )
}

export default function AppLayout() {
  const { session, loading } = useAuth()

  if (!loading && !session) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          borderTopColor: '#f1f5f9',
          backgroundColor: '#ffffff',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600'
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          shadowColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9'
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: '#0f172a'
        },
        headerShown: true
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Viagens',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon icon="🚗" focused={focused} />
        }}
      />
      <Tabs.Screen name="trip" options={{ href: null }} />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />
        }}
      />
    </Tabs>
  )
}
