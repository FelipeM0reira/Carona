export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          role: 'driver' | 'passenger' | 'both'
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: 'driver' | 'passenger' | 'both'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: 'driver' | 'passenger' | 'both'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          driver_id: string
          origin_name: string
          origin_lat: number
          origin_lng: number
          destination_name: string
          destination_lat: number
          destination_lng: number
          route_json: Json | null
          departure_time: string
          price_per_seat: number
          total_seats: number
          available_seats: number
          luggage_policy: string[]
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_name: string | null
          status: 'active' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          origin_name: string
          origin_lat: number
          origin_lng: number
          destination_name: string
          destination_lat: number
          destination_lng: number
          route_json?: Json | null
          departure_time: string
          price_per_seat: number
          total_seats: number
          available_seats: number
          luggage_policy?: string[]
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_name?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          origin_name?: string
          origin_lat?: number
          origin_lng?: number
          destination_name?: string
          destination_lat?: number
          destination_lng?: number
          route_json?: Json | null
          departure_time?: string
          price_per_seat?: number
          total_seats?: number
          available_seats?: number
          luggage_policy?: string[]
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_name?: string | null
          status?: 'active' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          trip_id: string
          passenger_id: string
          luggage_size: 'P' | 'M' | 'G' | null
          status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'boarded' | 'no_show'
          checked_in_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          passenger_id: string
          luggage_size?: 'P' | 'M' | 'G' | null
          status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'boarded' | 'no_show'
          checked_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          passenger_id?: string
          luggage_size?: 'P' | 'M' | 'G' | null
          status?: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'boarded' | 'no_show'
          checked_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      v_driver_stats: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          total_trips: number
          avg_rating: number
          total_reviews: number
        }
      }
    }
      messages: {
        Row: {
          id: string
          trip_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
      refund_events: {
        Row: {
          id: string
          booking_id: string
          trip_id: string
          passenger_id: string
          amount: number
          refund_type: 'partial' | 'total'
          status: 'pending' | 'processed' | 'failed'
          reason: string
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          trip_id: string
          passenger_id: string
          amount: number
          refund_type: 'partial' | 'total'
          status?: 'pending' | 'processed' | 'failed'
          reason?: string
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          trip_id?: string
          passenger_id?: string
          amount?: number
          refund_type?: 'partial' | 'total'
          status?: 'pending' | 'processed' | 'failed'
          reason?: string
          created_at?: string
          processed_at?: string | null
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
