import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable
} from 'react-native'
import { Input } from '@/components/ui/Input'
import { createChatService } from '@/lib/services/chat'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  trip_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface TripChatProps {
  tripId: string
  currentUserId: string
}

export function TripChat({ tripId, currentUserId }: TripChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const flatListRef = useRef<FlatList>(null)
  const chatService = useRef(createChatService(supabase)).current

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await chatService.getMessages(tripId)
        setMessages(data as Message[])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadMessages()
  }, [tripId])

  // Subscribe to real-time messages
  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(tripId, newMsg => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMsg.id)) return prev
        return [...prev, newMsg as Message]
      })
      // Scroll to bottom on new message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    })

    return unsubscribe
  }, [tripId])

  const handleSend = useCallback(async () => {
    const content = newMessage.trim()
    if (!content || sending) return

    setSending(true)
    setError(null)

    try {
      const sent = await chatService.sendMessage({
        trip_id: tripId,
        sender_id: currentUserId,
        content
      })
      setMessages(prev => {
        if (prev.some(m => m.id === (sent as Message).id)) return prev
        return [...prev, sent as Message]
      })
      setNewMessage('')
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }, [newMessage, sending, tripId, currentUserId])

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isOwnMessage = item.sender_id === currentUserId
      return (
        <View
          className={`mb-2 max-w-[80%] ${isOwnMessage ? 'self-end' : 'self-start'}`}
        >
          {!isOwnMessage && item.sender?.full_name && (
            <Text className="text-xs text-gray-400 mb-0.5 ml-1">
              {item.sender.full_name}
            </Text>
          )}
          <View
            className={`px-4 py-2.5 rounded-2xl ${
              isOwnMessage
                ? 'bg-primary-600 rounded-br-sm'
                : 'bg-surface-100 rounded-bl-sm'
            }`}
          >
            <Text
              className={`text-sm ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}
            >
              {item.content}
            </Text>
          </View>
          <Text
            className={`text-[10px] text-gray-400 mt-0.5 ${isOwnMessage ? 'text-right mr-1' : 'ml-1'}`}
          >
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      )
    },
    [currentUserId]
  )

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400">Carregando mensagens...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-gray-400 text-sm">
              Nenhuma mensagem ainda. Inicie a conversa!
            </Text>
          </View>
        }
      />

      {/* Error banner */}
      {error && (
        <View className="px-4 py-2 bg-danger-50">
          <Text className="text-danger-600 text-xs">{error}</Text>
        </View>
      )}

      {/* Input area */}
      <View className="flex-row items-center px-4 py-3 border-t border-surface-200 bg-white">
        <View className="flex-1 mr-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChangeText={setNewMessage}
            maxLength={1000}
            multiline
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
        </View>
        <Pressable
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            newMessage.trim() && !sending ? 'bg-primary-600' : 'bg-surface-200'
          }`}
        >
          <Text
            className={`text-lg ${
              newMessage.trim() && !sending ? 'text-white' : 'text-gray-400'
            }`}
          >
            ↑
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
