import '../global.css'
import { Slot } from 'expo-router'
import { AuthProvider } from '@/lib/providers/AuthProvider'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Slot />
    </AuthProvider>
  )
}
