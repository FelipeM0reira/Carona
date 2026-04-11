import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase/database.types'
import { ValidationError, RLSError } from './trips'

type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
type ReviewRow = Database['public']['Tables']['reviews']['Row']

function validateReviewInput(input: Partial<ReviewInsert>) {
  if (!input.booking_id?.trim()) {
    throw new ValidationError('booking_id é obrigatório')
  }
  if (!input.reviewer_id?.trim()) {
    throw new ValidationError('reviewer_id é obrigatório')
  }
  if (!input.reviewee_id?.trim()) {
    throw new ValidationError('reviewee_id é obrigatório')
  }
  if (input.rating == null || input.rating < 1 || input.rating > 5) {
    throw new ValidationError('rating deve ser entre 1 e 5')
  }
  if (!Number.isInteger(input.rating)) {
    throw new ValidationError('rating deve ser um número inteiro')
  }
}

export function createReviewService(client: any = supabase) {
  return {
    async create(input: ReviewInsert) {
      validateReviewInput(input)

      const { data, error } = await client
        .from('reviews')
        .insert(input)
        .select()
        .single()

      if (error) {
        if (
          error.message.includes('row-level security') ||
          error.code === '42501'
        ) {
          throw new RLSError('Sem permissão para criar avaliação')
        }
        throw new Error(error.message)
      }
      return data as ReviewRow
    },

    async listByUser(userId: string) {
      const { data, error } = await client
        .from('reviews')
        .select('*')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data ?? []
    }
  }
}
