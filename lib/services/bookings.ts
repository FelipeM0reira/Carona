import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase/database.types'
import { ValidationError, RLSError } from './trips'

type SupabaseClient = typeof supabase

type BookingInsert = Database['public']['Tables']['bookings']['Insert']
type BookingUpdate = Database['public']['Tables']['bookings']['Update']
type BookingRow = Database['public']['Tables']['bookings']['Row']

function validateBookingInput(input: Partial<BookingInsert>) {
  if (!input.trip_id?.trim()) {
    throw new ValidationError('trip_id é obrigatório')
  }
  if (!input.passenger_id?.trim()) {
    throw new ValidationError('passenger_id é obrigatório')
  }
  if (
    input.luggage_size != null &&
    !['P', 'M', 'G'].includes(input.luggage_size)
  ) {
    throw new ValidationError('luggage_size deve ser P, M ou G')
  }
}

export function createBookingService(client: any = supabase) {
  return {
    async create(input: BookingInsert) {
      validateBookingInput(input)

      const { data, error } = await client
        .from('bookings')
        .insert(input)
        .select()
        .single()

      if (error) {
        if (
          error.message.includes('row-level security') ||
          error.code === '42501'
        ) {
          throw new RLSError('Sem permissão para criar reserva')
        }
        throw new Error(error.message)
      }
      return data as BookingRow
    },

    async listByPassenger(passengerId: string) {
      const { data, error } = await client
        .from('bookings')
        .select('*, trips(*)')
        .eq('passenger_id', passengerId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data ?? []
    },

    async updateStatus(id: string, status: BookingRow['status']) {
      const { data, error } = await client
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (
          error.message.includes('row-level security') ||
          error.code === '42501'
        ) {
          throw new RLSError('Sem permissão para alterar esta reserva')
        }
        throw new Error(error.message)
      }
      return data as BookingRow
    }
  }
}
