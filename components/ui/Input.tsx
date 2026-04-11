import {
  View,
  Text,
  TextInput as RNTextInput,
  type TextInputProps
} from 'react-native'
import { forwardRef } from 'react'

type InputProps = TextInputProps & {
  label?: string
  error?: string
  icon?: string
}

export const Input = forwardRef<RNTextInput, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    const borderColor = error
      ? 'border-danger-500'
      : 'border-surface-200 focus:border-primary-500'

    return (
      <View className="mb-4">
        {label ? (
          <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">
            {label}
          </Text>
        ) : null}
        <View className="relative">
          {icon ? (
            <Text className="absolute left-4 top-3.5 text-gray-400 text-base z-10">
              {icon}
            </Text>
          ) : null}
          <RNTextInput
            ref={ref}
            className={`bg-surface-50 border ${borderColor} rounded-xl px-4 py-3.5 text-base text-gray-900 ${icon ? 'pl-11' : ''} ${className ?? ''}`}
            placeholderTextColor="#94a3b8"
            {...props}
          />
        </View>
        {error ? (
          <Text className="text-danger-500 text-xs mt-1 ml-1">{error}</Text>
        ) : null}
      </View>
    )
  }
)
