import { createProfileService } from '@/lib/services/profiles'
import { RLSError } from '@/lib/services/trips'
import { createMockSupabaseClient } from '../mocks/supabase'

describe('ProfileService', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>
  let profileService: ReturnType<typeof createProfileService>

  beforeEach(() => {
    mockClient = createMockSupabaseClient()
    profileService = createProfileService(mockClient as any)
  })

  const mockProfile = {
    id: 'user-123',
    username: 'felipe',
    full_name: 'Felipe Moreira',
    avatar_url: null,
    bio: 'Motorista experiente',
    role: 'driver' as const,
    phone: '11999999999',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }

  // ==========================================
  // READ
  // ==========================================

  describe('getById', () => {
    it('deve retornar o perfil pelo id', async () => {
      mockClient._setMockData(mockProfile)

      const result = await profileService.getById('user-123')

      expect(result).toEqual(mockProfile)
      expect(mockClient.from).toHaveBeenCalledWith('profiles')
      expect(mockClient._builder.eq).toHaveBeenCalledWith('id', 'user-123')
    })

    it('deve lançar erro quando perfil não existe', async () => {
      mockClient._setMockError('Row not found')

      await expect(profileService.getById('not-found')).rejects.toThrow(
        'Row not found'
      )
    })
  })

  // ==========================================
  // UPDATE + RLS
  // ==========================================

  describe('update', () => {
    it('deve atualizar o próprio perfil', async () => {
      const updated = { ...mockProfile, bio: 'Nova bio' }
      mockClient._setMockData(updated)

      const result = await profileService.update('user-123', {
        bio: 'Nova bio'
      })

      expect(result.bio).toBe('Nova bio')
      expect(mockClient._builder.update).toHaveBeenCalledWith({
        bio: 'Nova bio'
      })
      expect(mockClient._builder.eq).toHaveBeenCalledWith('id', 'user-123')
    })

    it('deve lançar RLSError ao tentar editar perfil de outro', async () => {
      mockClient._setMockError(
        'new row violates row-level security policy',
        '42501'
      )

      await expect(
        profileService.update('other-user', { bio: 'Hack' })
      ).rejects.toThrow(RLSError)
      await expect(
        profileService.update('other-user', { bio: 'Hack' })
      ).rejects.toThrow('Sem permissão para editar este perfil')
    })
  })
})
