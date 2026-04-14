import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase/database.types'

type MessageRow = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']

export function createChatService(client: any = supabase) {
  return {
    /**
     * Fetch messages for a trip, ordered by creation time.
     */
    async getMessages(tripId: string, limit = 50): Promise<MessageRow[]> {
      const { data, error } = await client
        .from('messages')
        .select('*, sender:profiles(id, full_name, avatar_url)')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) throw new Error(error.message)
      return data ?? []
    },

    /**
     * Send a message to a trip chat.
     */
    async sendMessage(input: MessageInsert): Promise<MessageRow> {
      if (!input.content?.trim()) {
        throw new Error('Mensagem não pode ser vazia')
      }
      if (input.content.length > 1000) {
        throw new Error('Mensagem deve ter no máximo 1000 caracteres')
      }

      const { data, error } = await client
        .from('messages')
        .insert({
          trip_id: input.trip_id,
          sender_id: input.sender_id,
          content: input.content.trim()
        })
        .select('*, sender:profiles(id, full_name, avatar_url)')
        .single()

      if (error) {
        if (
          error.message.includes('row-level security') ||
          error.code === '42501'
        ) {
          throw new Error(
            'Sem permissão para enviar mensagens nesta viagem. Você precisa ter uma reserva confirmada.'
          )
        }
        throw new Error(error.message)
      }

      return data as MessageRow
    },

    /**
     * Subscribe to real-time messages for a trip.
     * Returns an unsubscribe function.
     */
    subscribeToMessages(
      tripId: string,
      onMessage: (message: MessageRow) => void
    ): () => void {
      const channel = client
        .channel(`trip-chat-${tripId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `trip_id=eq.${tripId}`
          },
          (payload: { new: MessageRow }) => {
            onMessage(payload.new)
          }
        )
        .subscribe()

      return () => {
        client.removeChannel(channel)
      }
    }
  }
}
