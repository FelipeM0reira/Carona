import {
  validateCheckIn,
  calculateDistance,
  CheckInError,
  GeoPoint
} from '@/lib/services/checkin'

describe('CheckIn - Geolocalização', () => {
  // Ponto de encontro fixo: Av. Paulista, São Paulo
  const pickupPoint: GeoPoint = { lat: -23.561414, lng: -46.655881 }

  // ==========================================
  // calculateDistance - Haversine
  // ==========================================

  describe('calculateDistance', () => {
    it('deve retornar 0 para o mesmo ponto', () => {
      const distance = calculateDistance(pickupPoint, pickupPoint)
      expect(distance).toBe(0)
    })

    it('deve calcular distância aproximada entre dois pontos conhecidos', () => {
      // Av. Paulista → Praça da Sé (~2.2km)
      const pracaDaSe: GeoPoint = { lat: -23.5505, lng: -46.6333 }
      const distance = calculateDistance(pickupPoint, pracaDaSe)
      expect(distance).toBeGreaterThan(2000)
      expect(distance).toBeLessThan(3000)
    })

    it('deve ser simétrico (A→B === B→A)', () => {
      const pointB: GeoPoint = { lat: -23.562, lng: -46.656 }
      const distAB = calculateDistance(pickupPoint, pointB)
      const distBA = calculateDistance(pointB, pickupPoint)
      expect(distAB).toBeCloseTo(distBA, 5)
    })
  })

  // ==========================================
  // validateCheckIn - Sucesso (dentro do raio de 50m)
  // ==========================================

  describe('validateCheckIn - Sucesso (dentro do raio)', () => {
    it('deve aprovar check-in quando usuário está no ponto exato', () => {
      const result = validateCheckIn(pickupPoint, pickupPoint)
      expect(result.success).toBe(true)
      expect(result.distance).toBe(0)
    })

    it('deve aprovar check-in quando usuário está a ~10m', () => {
      // ~10m ao norte do pickup point
      const userLocation: GeoPoint = { lat: -23.561324, lng: -46.655881 }
      const result = validateCheckIn(userLocation, pickupPoint)
      expect(result.success).toBe(true)
      expect(result.distance).toBeLessThanOrEqual(50)
    })

    it('deve aprovar check-in quando usuário está a ~30m', () => {
      // ~30m a leste
      const userLocation: GeoPoint = { lat: -23.561414, lng: -46.655551 }
      const result = validateCheckIn(userLocation, pickupPoint)
      expect(result.success).toBe(true)
      expect(result.distance).toBeLessThanOrEqual(50)
    })

    it('deve aprovar check-in no limite de 50m', () => {
      // ~49m ao norte
      const userLocation: GeoPoint = { lat: -23.560973, lng: -46.655881 }
      const result = validateCheckIn(userLocation, pickupPoint)
      expect(result.success).toBe(true)
      expect(result.distance).toBeLessThanOrEqual(50)
    })
  })

  // ==========================================
  // validateCheckIn - Falha (fora do raio de 50m)
  // ==========================================

  describe('validateCheckIn - Falha (fora do raio)', () => {
    it('deve bloquear check-in quando usuário está a ~100m', () => {
      // ~100m ao norte
      const userLocation: GeoPoint = { lat: -23.560514, lng: -46.655881 }
      expect(() => validateCheckIn(userLocation, pickupPoint)).toThrow(
        CheckInError
      )
      expect(() => validateCheckIn(userLocation, pickupPoint)).toThrow(
        /Aproxime-se para realizar o check-in/
      )
    })

    it('deve bloquear check-in quando usuário está a ~500m', () => {
      // ~500m a sudoeste
      const userLocation: GeoPoint = { lat: -23.565, lng: -46.66 }
      try {
        validateCheckIn(userLocation, pickupPoint)
        fail('Deveria ter lançado CheckInError')
      } catch (error) {
        expect(error).toBeInstanceOf(CheckInError)
        expect((error as CheckInError).distance).toBeGreaterThan(50)
      }
    })

    it('deve bloquear check-in quando usuário está a ~2km', () => {
      const userLocation: GeoPoint = { lat: -23.5505, lng: -46.6333 }
      expect(() => validateCheckIn(userLocation, pickupPoint)).toThrow(
        CheckInError
      )
    })

    it('deve incluir a distância no erro', () => {
      const userLocation: GeoPoint = { lat: -23.560514, lng: -46.655881 }
      try {
        validateCheckIn(userLocation, pickupPoint)
        fail('Deveria ter lançado CheckInError')
      } catch (error) {
        expect(error).toBeInstanceOf(CheckInError)
        const checkinError = error as CheckInError
        expect(checkinError.distance).toBeGreaterThan(50)
        expect(checkinError.message).toContain('m do ponto de encontro')
      }
    })
  })

  // ==========================================
  // validateCheckIn - Coordenadas inválidas
  // ==========================================

  describe('validateCheckIn - Coordenadas inválidas', () => {
    it('deve rejeitar latitude do usuário fora do range [-90, 90]', () => {
      const invalidLocation: GeoPoint = { lat: 91, lng: -46.655881 }
      expect(() => validateCheckIn(invalidLocation, pickupPoint)).toThrow(
        'Coordenadas do usuário inválidas'
      )
    })

    it('deve rejeitar longitude do usuário fora do range [-180, 180]', () => {
      const invalidLocation: GeoPoint = { lat: -23.561414, lng: 181 }
      expect(() => validateCheckIn(invalidLocation, pickupPoint)).toThrow(
        'Coordenadas do usuário inválidas'
      )
    })

    it('deve rejeitar latitude do pickup fora do range [-90, 90]', () => {
      const invalidPickup: GeoPoint = { lat: -91, lng: -46.655881 }
      expect(() => validateCheckIn(pickupPoint, invalidPickup)).toThrow(
        'Coordenadas do ponto de encontro inválidas'
      )
    })

    it('deve rejeitar longitude do pickup fora do range [-180, 180]', () => {
      const invalidPickup: GeoPoint = { lat: -23.561414, lng: -181 }
      expect(() => validateCheckIn(pickupPoint, invalidPickup)).toThrow(
        'Coordenadas do ponto de encontro inválidas'
      )
    })
  })
})
