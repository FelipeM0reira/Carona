import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps
} from 'react-native'

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'

type ButtonProps = PressableProps & {
  title: string
  variant?: Variant
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const VARIANT_STYLES: Record<
  Variant,
  { container: string; text: string; loader: string }
> = {
  primary: {
    container: 'bg-primary-600 active:bg-primary-700',
    text: 'text-white font-semibold',
    loader: '#ffffff'
  },
  secondary: {
    container: 'bg-surface-100 active:bg-surface-200',
    text: 'text-gray-900 font-semibold',
    loader: '#1e293b'
  },
  outline: {
    container:
      'bg-transparent border-2 border-primary-600 active:bg-primary-50',
    text: 'text-primary-600 font-semibold',
    loader: '#4f46e5'
  },
  danger: {
    container: 'bg-danger-600 active:bg-danger-700',
    text: 'text-white font-semibold',
    loader: '#ffffff'
  },
  ghost: {
    container: 'bg-transparent active:bg-surface-100',
    text: 'text-primary-600 font-medium',
    loader: '#4f46e5'
  }
}

const SIZE_STYLES: Record<string, { container: string; text: string }> = {
  sm: { container: 'py-2.5 px-4', text: 'text-sm' },
  md: { container: 'py-3.5 px-6', text: 'text-base' },
  lg: { container: 'py-4 px-8', text: 'text-lg' }
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  size = 'md',
  fullWidth = true,
  disabled,
  ...props
}: ButtonProps) {
  const v = VARIANT_STYLES[variant]
  const s = SIZE_STYLES[size]
  const isDisabled = disabled || loading

  return (
    <Pressable
      className={`rounded-2xl items-center justify-center flex-row ${v.container} ${s.container} ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-60' : ''}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.loader} className="mr-2" />
      ) : null}
      <Text className={`${v.text} ${s.text}`}>{title}</Text>
    </Pressable>
  )
}
