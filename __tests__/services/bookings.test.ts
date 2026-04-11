import { createBookingService } from '@/lib/services/bookings'
import { ValidationError, RLSError } from '@/lib/services/trips'
import { createMockSupabaseClient } from '../mocks/supabase'

describe('BookingService', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>
  let bookingService: ReturnType<typeof createBookingService>

  beforeEach(() => {
    mockClient = createMockSupabaseClient()
    bookingService = createBookingService(mockClient as any)
  })

  const validBooking = {
    trip_id: 'trip-123',
    passenger_id: 'user-456',
    luggage_size: 'M' as const
  }

  // ==========================================
  // CREATE - Validations
  // ==========================================

  describe('create', () => {
    it('deve rejeitar reserva sem trip_id', async () => {
      await expect(
        bookingService.create({ ...validBooking, trip_id: '' })
      ).rejects.toThrow(ValidationError)
      await expect(
        bookingService.create({ ...validBooking, trip_id: '' })
      ).rejects.toThrow('trip_id é obrigatório')
    })

    it('deve rejeitar reserva sem passenger_id', async () => {
      await expect(
        bookingService.create({ ...validBooking, passenger_id: '' })
      ).rejects.toThrow('passenger_id é obrigatório')
    })

    it('deve rejeitar luggage_size inválido', async () => {
      await expect(
        bookingService.create({ ...validBooking, luggage_size: 'XL' as any })
      ).rejects.toThrow('luggage_size deve ser P, M ou G')
    })

    it('deve aceitar reserva sem luggage_size (null)', async () => {
      const input = {
        trip_id: 'trip-123',
        passenger_id: 'user-456',
        luggage_size: null
      }
      const expected = { id: 'booking-1', ...input, status: 'pending' }
      mockClient._setMockData(expected)

      const result = await bookingService.create(input)
      expect(result).toEqual(expected)
    })

    it('deve criar reserva com dados válidos', async () => {
      const expected = { id: 'booking-1', ...validBooking, status: 'pending' }
      mockClient._setMockData(expected)

      const result = await bookingService.create(validBooking)

      expect(result).toEqual(expected)
      expect(mockClient.from).toHaveBeenCalledWith('bookings')
      expect(mockClient._builder.insert).toHaveBeenCalledWith(validBooking)
    })

    it('deve lançar RLSError quando sem permissão', async () => {
      mockClient._setMockError(
        'new row violates row-level security policy',
        '42501'
      )

      await expect(bookingService.create(validBooking)).rejects.toThrow(
        RLSError
      )
    })
  })

  // ==========================================
  // READ - List by passenger
  // ==========================================

  describe('listByPassenger', () => {
    it('deve listar reservas do passageiro', async () => {
      const bookings = [
        { id: 'b1', ...validBooking, status: 'confirmed' },
        { id: 'b2', ...validBooking, status: 'pending' }
      ]
      mockClient._setMockData(bookings)

      const result = await bookingService.listByPassenger('user-456')

      expect(mockClient.from).toHaveBeenCalledWith('bookings')
      expect(mockClient._builder.eq).toHaveBeenCalledWith(
        'passenger_id',
        'user-456'
      )
    })

    it('deve retornar lista vazia quando sem reservas', async () => {
      mockClient._setMockData([])

      const result = await bookingService.listByPassenger('user-456')
      expect(result).toEqual([])
    })
  })

  // ==========================================
  // UPDATE - Status change + RLS
  // ==========================================

  describe('updateStatus', () => {
    it('deve atualizar status para confirmed', async () => {
      const updated = { id: 'b1', ...validBooking, status: 'confirmed' }
      mockClient._setMockData(updated)

      const result = await bookingService.updateStatus('b1', 'confirmed')

      expect(result.status).toBe('confirmed')
      expect(mockClient._builder.update).toHaveBeenCalledWith({
        status: 'confirmed'
      })
    })

    it('deve lançar RLSError quando não é participante', async () => {
      mockClient._setMockError(
        'new row violates row-level security policy',
        '42501'
      )

      await expect(
        bookingService.updateStatus('b1', 'cancelled')
      ).rejects.toThrow(RLSError)
    })
  })
})
