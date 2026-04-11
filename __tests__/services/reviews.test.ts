import { createReviewService } from '@/lib/services/reviews'
import { ValidationError, RLSError } from '@/lib/services/trips'
import { createMockSupabaseClient } from '../mocks/supabase'

describe('ReviewService', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>
  let reviewService: ReturnType<typeof createReviewService>

  beforeEach(() => {
    mockClient = createMockSupabaseClient()
    reviewService = createReviewService(mockClient as any)
  })

  const validReview = {
    booking_id: 'booking-1',
    reviewer_id: 'user-123',
    reviewee_id: 'user-456',
    rating: 5,
    comment: 'Excelente motorista!'
  }

  // ==========================================
  // CREATE - Validations
  // ==========================================

  describe('create', () => {
    it('deve rejeitar rating < 1', async () => {
      await expect(
        reviewService.create({ ...validReview, rating: 0 })
      ).rejects.toThrow(ValidationError)
      await expect(
        reviewService.create({ ...validReview, rating: 0 })
      ).rejects.toThrow('rating deve ser entre 1 e 5')
    })

    it('deve rejeitar rating > 5', async () => {
      await expect(
        reviewService.create({ ...validReview, rating: 6 })
      ).rejects.toThrow('rating deve ser entre 1 e 5')
    })

    it('deve rejeitar rating decimal', async () => {
      await expect(
        reviewService.create({ ...validReview, rating: 3.5 })
      ).rejects.toThrow('rating deve ser um número inteiro')
    })

    it('deve aceitar rating 1 (limite inferior)', async () => {
      const expected = { id: 'review-1', ...validReview, rating: 1 }
      mockClient._setMockData(expected)

      const result = await reviewService.create({ ...validReview, rating: 1 })
      expect(result.rating).toBe(1)
    })

    it('deve aceitar rating 5 (limite superior)', async () => {
      const expected = { id: 'review-1', ...validReview }
      mockClient._setMockData(expected)

      const result = await reviewService.create(validReview)
      expect(result.rating).toBe(5)
    })

    it('deve rejeitar review sem booking_id', async () => {
      await expect(
        reviewService.create({ ...validReview, booking_id: '' })
      ).rejects.toThrow('booking_id é obrigatório')
    })

    it('deve rejeitar review sem reviewer_id', async () => {
      await expect(
        reviewService.create({ ...validReview, reviewer_id: '' })
      ).rejects.toThrow('reviewer_id é obrigatório')
    })

    it('deve rejeitar review sem reviewee_id', async () => {
      await expect(
        reviewService.create({ ...validReview, reviewee_id: '' })
      ).rejects.toThrow('reviewee_id é obrigatório')
    })

    it('deve criar review com dados válidos', async () => {
      const expected = {
        id: 'review-1',
        ...validReview,
        created_at: '2026-04-10T00:00:00Z'
      }
      mockClient._setMockData(expected)

      const result = await reviewService.create(validReview)

      expect(result).toEqual(expected)
      expect(mockClient.from).toHaveBeenCalledWith('reviews')
      expect(mockClient._builder.insert).toHaveBeenCalledWith(validReview)
    })

    it('deve lançar RLSError quando sem permissão', async () => {
      mockClient._setMockError(
        'new row violates row-level security policy',
        '42501'
      )

      await expect(reviewService.create(validReview)).rejects.toThrow(RLSError)
    })
  })

  // ==========================================
  // READ - List by user
  // ==========================================

  describe('listByUser', () => {
    it('deve listar reviews recebidas pelo usuário', async () => {
      const reviews = [
        { id: 'r1', ...validReview },
        { id: 'r2', ...validReview, rating: 4 }
      ]
      mockClient._setMockData(reviews)

      const result = await reviewService.listByUser('user-456')

      expect(mockClient.from).toHaveBeenCalledWith('reviews')
      expect(mockClient._builder.eq).toHaveBeenCalledWith(
        'reviewee_id',
        'user-456'
      )
    })
  })
})
