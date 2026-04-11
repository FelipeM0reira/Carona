import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase/database.types'

type SupabaseClient = typeof supabase

type TripInsert = Database['public']['Tables']['trips']['Insert']
type TripUpdate = Database['public']['Tables']['trips']['Update']
type TripRow = Database['public']['Tables']['trips']['Row']

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class RLSError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RLSError'
  }
}

function validateTripInput(input: Partial<TripInsert>) {
  if (!input.origin_name?.trim()) {
    throw new ValidationError('origin_name é obrigatório')
  }
  if (!input.destination_name?.trim()) {
    throw new ValidationError('destination_name é obrigatório')
  }
  if (!input.departure_time) {
    throw new ValidationError('departure_time é obrigatório')
  }
  if (input.total_seats == null || input.total_seats < 1) {
    throw new ValidationError('total_seats deve ser >= 1')
  }
  if (
    input.available_seats != null &&
    input.available_seats > input.total_seats
  ) {
    throw new ValidationError(
      'available_seats não pode ser maior que total_seats'
    )
  }
  if (input.price_per_seat == null || input.price_per_seat < 0) {
    throw new ValidationError('price_per_seat deve ser >= 0')
  }
}

export function createTripService(client: any = supabase) {
  return {
    async create(input: TripInsert) {
      validateTripInput(input)

      const { data, error } = await client
        .from('trips')
        .insert(input)
        .select()
        .single()

      if (error) {
        if (
          error.message.includes('row-level security') ||
          error.code === '42501'
        ) {
          throw new RLSError('Sem permissão para criar viagem')
        }
        throw new Error(error.message)
      }
      return data as TripRow
    },

    async list(filters?: { availableOnly?: boolean }) {
      let query = client
        .from('trips')
        .select('*')
        .eq('status', 'active')
        .order('departure_time', { ascending: true })

      if (filters?.availableOnly) {
        query = query.gt('available_seats', 0)
      }

      const { data, error } = await query

      if (error) throw new Error(error.message)
      return (data ?? []) as TripRow[]
    },

    async getById(id: string) {
      const { data, error } = await client
        .from('trips')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new Error(error.message)
      return data as TripRow
    },

    async update(id: string, input: TripUpdate, userId: string) {
      const { data, error } = await client
        .from('trips')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (
          error.message.includes('row-level security') ||
          error.code === '42501'
        ) {
          throw new RLSError('Sem permissão para editar esta viagem')
        }
        throw new Error(error.message)
      }
      return data as TripRow
    },

    async remove(id: string, userId: string) {
      const { error } = await client.from('trips').delete().eq('id', id)

      if (error) {
        if (
          error.message.includes('row-level security') ||
          error.code === '42501'
        ) {
          throw new RLSError('Sem permissão para deletar esta viagem')
        }
        throw new Error(error.message)
      }
    }
  }
}
