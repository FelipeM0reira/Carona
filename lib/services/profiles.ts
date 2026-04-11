import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase/database.types'
import { ValidationError, RLSError } from './trips'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

export function createProfileService(client: any = supabase) {
  return {
    async getById(id: string) {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw new Error(error.message)
      return data as ProfileRow
    },

    async update(id: string, input: ProfileUpdate) {
      const { data, error } = await client
        .from('profiles')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (
          error.message.includes('row-level security') ||
          error.code === '42501'
        ) {
          throw new RLSError('Sem permissão para editar este perfil')
        }
        throw new Error(error.message)
      }
      return data as ProfileRow
    }
  }
}
