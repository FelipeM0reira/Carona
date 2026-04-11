import '../global.css'
import { Slot } from 'expo-router'
import { AuthProvider } from '@/lib/providers/AuthProvider'
import { StatusBar } from 'expo-status-bar'
import { ToastContainer } from '@/components/ui/Toast'
import { View } from 'react-native'

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <View className="flex-1">
        <Slot />
        <ToastContainer />
      </View>
    </AuthProvider>
  )
}
