// Mock the supabase client module so services don't pull in react-native
jest.mock('@/lib/supabase', () => ({
  supabase: {}
}))

// Suppress console warnings during tests
jest.spyOn(console, 'warn').mockImplementation(() => {})
