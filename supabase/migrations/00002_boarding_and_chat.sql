-- ==========================================
-- MIGRATION: Boarding Management & Chat
-- ==========================================

-- ==========================================
-- 1. Add pickup_point to trips
-- ==========================================

ALTER TABLE public.trips
  ADD COLUMN pickup_lat double precision,
  ADD COLUMN pickup_lng double precision,
  ADD COLUMN pickup_name text;

-- ==========================================
-- 2. Extend bookings status with boarded / no_show
-- ==========================================

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'boarded', 'no_show'));

-- Add checked_in_at timestamp for geolocation check-in
ALTER TABLE public.bookings
  ADD COLUMN checked_in_at timestamptz;

-- ==========================================
-- 3. Messages table for trip chat
-- ==========================================

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_trip_id ON public.messages(trip_id);
CREATE INDEX idx_messages_created_at ON public.messages(trip_id, created_at);

-- ==========================================
-- 4. No-show refund events table
-- ==========================================

CREATE TABLE public.refund_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  refund_type text NOT NULL CHECK (refund_type IN ('partial', 'total')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  reason text NOT NULL DEFAULT 'no_show',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX idx_refund_events_booking ON public.refund_events(booking_id);
CREATE INDEX idx_refund_events_status ON public.refund_events(status);

-- ==========================================
-- 5. RLS Policies
-- ==========================================

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only confirmed passengers and the trip driver can read messages
CREATE POLICY "Trip participants can read messages"
  ON public.messages FOR SELECT
  USING (
    -- User is the trip driver
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = messages.trip_id
        AND trips.driver_id = auth.uid()
    )
    OR
    -- User has a confirmed booking for this trip
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.trip_id = messages.trip_id
        AND bookings.passenger_id = auth.uid()
        AND bookings.status IN ('confirmed', 'boarded')
    )
  );

-- Only confirmed passengers and the trip driver can send messages
CREATE POLICY "Trip participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      -- User is the trip driver
      EXISTS (
        SELECT 1 FROM public.trips
        WHERE trips.id = messages.trip_id
          AND trips.driver_id = auth.uid()
      )
      OR
      -- User has a confirmed booking for this trip
      EXISTS (
        SELECT 1 FROM public.bookings
        WHERE bookings.trip_id = messages.trip_id
          AND bookings.passenger_id = auth.uid()
          AND bookings.status IN ('confirmed', 'boarded')
      )
    )
  );

-- Enable RLS on refund_events (admin/service role only for processing)
ALTER TABLE public.refund_events ENABLE ROW LEVEL SECURITY;

-- Passengers can view their own refund events
CREATE POLICY "Passengers can view own refunds"
  ON public.refund_events FOR SELECT
  USING (passenger_id = auth.uid());

-- ==========================================
-- 6. Function: Handle no_show refund event
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_no_show_refund()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  trip_price numeric(10,2);
BEGIN
  IF NEW.status = 'no_show' AND (OLD IS NULL OR OLD.status != 'no_show') THEN
    SELECT t.price_per_seat INTO trip_price
    FROM public.trips t
    WHERE t.id = NEW.trip_id;

    INSERT INTO public.refund_events (booking_id, trip_id, passenger_id, amount, refund_type, reason)
    VALUES (
      NEW.id,
      NEW.trip_id,
      NEW.passenger_id,
      trip_price,
      'total',
      'no_show'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_no_show
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'no_show')
  EXECUTE FUNCTION public.handle_no_show_refund();

-- ==========================================
-- 7. Enable Realtime for messages
-- ==========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
