import { useEffect, useRef } from 'react'
import { Animated, Text, Pressable, View } from 'react-native'

type ToastType = 'success' | 'error' | 'warning' | 'info'

type ToastData = {
  id: string
  type: ToastType
  title: string
  message?: string
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i'
}

const STYLES: Record<ToastType, { bg: string; icon: string; border: string }> =
  {
    success: {
      bg: 'bg-success-50',
      icon: 'bg-success-500',
      border: 'border-success-500'
    },
    error: {
      bg: 'bg-danger-50',
      icon: 'bg-danger-500',
      border: 'border-danger-500'
    },
    warning: {
      bg: 'bg-warning-50',
      icon: 'bg-warning-500',
      border: 'border-warning-500'
    },
    info: {
      bg: 'bg-primary-50',
      icon: 'bg-primary-500',
      border: 'border-primary-500'
    }
  }

function ToastItem({
  toast,
  onDismiss
}: {
  toast: ToastData
  onDismiss: () => void
}) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-20)).current
  const style = STYLES[toast.type]

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start()

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => onDismiss())
    }, 3500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable onPress={onDismiss}>
        <View
          className={`flex-row items-center ${style.bg} border-l-4 ${style.border} rounded-xl px-4 py-3 mb-2 shadow-sm`}
        >
          <View
            className={`w-7 h-7 rounded-full ${style.icon} items-center justify-center mr-3`}
          >
            <Text className="text-white font-bold text-sm">
              {ICONS[toast.type]}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-gray-900 text-sm">
              {toast.title}
            </Text>
            {toast.message ? (
              <Text className="text-gray-600 text-xs mt-0.5">
                {toast.message}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

// Simple global toast state
let _toasts: ToastData[] = []
let _setToasts: ((t: ToastData[]) => void) | null = null

export function showToast(type: ToastType, title: string, message?: string) {
  const toast: ToastData = { id: Date.now().toString(), type, title, message }
  _toasts = [..._toasts, toast]
  _setToasts?.([..._toasts])
}

import { useState } from 'react'

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([])
  _setToasts = setToasts

  if (toasts.length === 0) return null

  return (
    <View
      className="absolute top-12 left-4 right-4 z-50"
      style={{ pointerEvents: 'box-none' }}
    >
      {toasts.map(t => (
        <ToastItem
          key={t.id}
          toast={t}
          onDismiss={() => {
            _toasts = _toasts.filter(x => x.id !== t.id)
            setToasts([..._toasts])
          }}
        />
      ))}
    </View>
  )
}
