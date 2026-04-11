import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

function Pulse({ className }: { className?: string }) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true
        })
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [])

  return (
    <Animated.View style={{ opacity }}>
      <View className={`bg-surface-200 rounded-lg ${className ?? ''}`} />
    </Animated.View>
  )
}

export function TripCardSkeleton() {
  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm border border-surface-100">
      <View className="flex-row items-center mb-4">
        <Pulse className="w-10 h-10 rounded-full mr-3" />
        <View className="flex-1">
          <Pulse className="h-4 w-24 mb-2" />
          <Pulse className="h-3 w-16" />
        </View>
      </View>
      <View className="flex-row items-center mb-4">
        <View className="items-center mr-4">
          <Pulse className="w-3 h-3 rounded-full" />
          <Pulse className="w-0.5 h-8 my-1" />
          <Pulse className="w-3 h-3 rounded-full" />
        </View>
        <View className="flex-1">
          <Pulse className="h-4 w-32 mb-4" />
          <Pulse className="h-4 w-28" />
        </View>
      </View>
      <View className="flex-row justify-between pt-3 border-t border-surface-100">
        <Pulse className="h-4 w-20" />
        <Pulse className="h-4 w-16" />
        <Pulse className="h-5 w-20" />
      </View>
    </View>
  )
}

export function ProfileSkeleton() {
  return (
    <View className="p-6">
      <View className="items-center mb-8">
        <Pulse className="w-24 h-24 rounded-full mb-4" />
        <Pulse className="h-6 w-40 mb-2" />
        <Pulse className="h-4 w-48" />
      </View>
      <Pulse className="h-4 w-28 mb-2" />
      <Pulse className="h-12 w-full mb-5 rounded-xl" />
      <Pulse className="h-4 w-20 mb-2" />
      <Pulse className="h-12 w-full mb-5 rounded-xl" />
      <Pulse className="h-4 w-24 mb-2" />
      <Pulse className="h-12 w-full mb-5 rounded-xl" />
    </View>
  )
}

export function TripDetailSkeleton() {
  return (
    <View className="p-6">
      <View className="mb-6">
        <Pulse className="h-8 w-48 mb-6" />
        <View className="flex-row items-center mb-6">
          <View className="items-center mr-4">
            <Pulse className="w-4 h-4 rounded-full" />
            <Pulse className="w-0.5 h-16 my-1" />
            <Pulse className="w-4 h-4 rounded-full" />
          </View>
          <View className="flex-1">
            <Pulse className="h-5 w-36 mb-8" />
            <Pulse className="h-5 w-32" />
          </View>
        </View>
      </View>
      <View className="flex-row gap-3 mb-6">
        <Pulse className="flex-1 h-20 rounded-2xl" />
        <Pulse className="flex-1 h-20 rounded-2xl" />
      </View>
      <Pulse className="h-4 w-28 mb-3" />
      <View className="flex-row gap-2 mb-6">
        <Pulse className="h-8 w-20 rounded-full" />
        <Pulse className="h-8 w-20 rounded-full" />
      </View>
      <Pulse className="h-14 w-full rounded-2xl" />
    </View>
  )
}

export function BookingCardSkeleton() {
  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm border border-surface-100">
      <View className="flex-row justify-between mb-3">
        <Pulse className="h-5 w-40" />
        <Pulse className="h-5 w-20 rounded-full" />
      </View>
      <Pulse className="h-4 w-48 mb-2" />
      <Pulse className="h-4 w-24" />
    </View>
  )
}
