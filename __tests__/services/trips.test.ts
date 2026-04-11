import {
  createTripService,
  ValidationError,
  RLSError
} from '@/lib/services/trips'
import { createMockSupabaseClient } from '../mocks/supabase'

describe('TripService', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>
  let tripService: ReturnType<typeof createTripService>

  beforeEach(() => {
    mockClient = createMockSupabaseClient()
    tripService = createTripService(mockClient as any)
  })

  const validTrip = {
    driver_id: 'user-123',
    origin_name: 'São Paulo',
    origin_lat: -23.55,
    origin_lng: -46.63,
    destination_name: 'Rio de Janeiro',
    destination_lat: -22.9,
    destination_lng: -43.17,
    departure_time: '2026-05-01T08:00:00Z',
    price_per_seat: 50,
    total_seats: 4,
    available_seats: 4
  }

  // ==========================================
  // CREATE - Validations
  // ==========================================

  describe('create', () => {
    it('deve rejeitar viagem sem origin_name', async () => {
      await expect(
        tripService.create({ ...validTrip, origin_name: '' })
      ).rejects.toThrow(ValidationError)
      await expect(
        tripService.create({ ...validTrip, origin_name: '  ' })
      ).rejects.toThrow('origin_name é obrigatório')
    })

    it('deve rejeitar viagem sem destination_name', async () => {
      await expect(
        tripService.create({ ...validTrip, destination_name: '' })
      ).rejects.toThrow(ValidationError)
    })

    it('deve rejeitar viagem sem departure_time', async () => {
      await expect(
        tripService.create({ ...validTrip, departure_time: '' })
      ).rejects.toThrow('departure_time é obrigatório')
    })

    it('deve rejeitar viagem com total_seats < 1', async () => {
      await expect(
        tripService.create({ ...validTrip, total_seats: 0 })
      ).rejects.toThrow(ValidationError)
      await expect(
        tripService.create({ ...validTrip, total_seats: -1 })
      ).rejects.toThrow('total_seats deve ser >= 1')
    })

    it('deve rejeitar viagem com available_seats > total_seats', async () => {
      await expect(
        tripService.create({ ...validTrip, total_seats: 3, available_seats: 5 })
      ).rejects.toThrow('available_seats não pode ser maior que total_seats')
    })

    it('deve rejeitar viagem com price_per_seat negativo', async () => {
      await expect(
        tripService.create({ ...validTrip, price_per_seat: -10 })
      ).rejects.toThrow('price_per_seat deve ser >= 0')
    })

    it('deve criar viagem com dados válidos', async () => {
      const expected = { id: 'trip-1', ...validTrip }
      mockClient._setMockData(expected)

      const result = await tripService.create(validTrip)

      expect(result).toEqual(expected)
      expect(mockClient.from).toHaveBeenCalledWith('trips')
      expect(mockClient._builder.insert).toHaveBeenCalledWith(validTrip)
    })

    it('deve lançar RLSError quando sem permissão', async () => {
      mockClient._setMockError(
        'new row violates row-level security policy',
        '42501'
      )

      await expect(tripService.create(validTrip)).rejects.toThrow(RLSError)
      await expect(tripService.create(validTrip)).rejects.toThrow(
        'Sem permissão para criar viagem'
      )
    })
  })

  // ==========================================
  // READ - List & Filters
  // ==========================================

  describe('list', () => {
    it('deve retornar lista vazia quando não há viagens', async () => {
      mockClient._setMockData([])

      const result = await tripService.list()
      expect(result).toEqual([])
    })

    it('deve filtrar apenas viagens com assentos disponíveis', async () => {
      const trips = [
        { ...validTrip, id: '1', available_seats: 3 },
        { ...validTrip, id: '2', available_seats: 0 }
      ]
      mockClient._setMockData(trips)

      await tripService.list({ availableOnly: true })

      expect(mockClient._builder.gt).toHaveBeenCalledWith('available_seats', 0)
    })

    it('deve ordenar por departure_time ascendente', async () => {
      mockClient._setMockData([])

      await tripService.list()

      expect(mockClient._builder.order).toHaveBeenCalledWith('departure_time', {
        ascending: true
      })
    })

    it('deve filtrar apenas viagens ativas', async () => {
      mockClient._setMockData([])

      await tripService.list()

      expect(mockClient._builder.eq).toHaveBeenCalledWith('status', 'active')
    })
  })

  // ==========================================
  // UPDATE - RLS
  // ==========================================

  describe('update', () => {
    it('deve atualizar viagem do próprio motorista', async () => {
      const updated = { ...validTrip, id: 'trip-1', price_per_seat: 60 }
      mockClient._setMockData(updated)

      const result = await tripService.update(
        'trip-1',
        { price_per_seat: 60 },
        'user-123'
      )

      expect(result.price_per_seat).toBe(60)
    })

    it('deve lançar RLSError quando não é o dono', async () => {
      mockClient._setMockError(
        'new row violates row-level security policy',
        '42501'
      )

      await expect(
        tripService.update('trip-1', { price_per_seat: 60 }, 'other-user')
      ).rejects.toThrow(RLSError)
    })
  })

  // ==========================================
  // DELETE - RLS
  // ==========================================

  describe('remove', () => {
    it('deve deletar viagem do próprio motorista', async () => {
      mockClient._setMockData(null)

      await expect(
        tripService.remove('trip-1', 'user-123')
      ).resolves.toBeUndefined()
    })

    it('deve lançar RLSError quando não é o dono', async () => {
      mockClient._setMockError(
        'new row violates row-level security policy',
        '42501'
      )

      await expect(tripService.remove('trip-1', 'other-user')).rejects.toThrow(
        RLSError
      )
    })
  })
})
