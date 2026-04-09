-- ==========================================
-- CARONA APP - Initial Schema
-- ==========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLES
-- ==========================================

-- Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  bio text,
  role text NOT NULL DEFAULT 'passenger' CHECK (role IN ('driver', 'passenger', 'both')),
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trips (fixed routes)
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin_name text NOT NULL,
  origin_lat double precision NOT NULL,
  origin_lng double precision NOT NULL,
  destination_name text NOT NULL,
  destination_lat double precision NOT NULL,
  destination_lng double precision NOT NULL,
  route_json jsonb,
  departure_time timestamptz NOT NULL,
  price_per_seat numeric(10,2) NOT NULL CHECK (price_per_seat >= 0),
  total_seats integer NOT NULL CHECK (total_seats > 0),
  available_seats integer NOT NULL CHECK (available_seats >= 0),
  luggage_policy text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT available_lte_total CHECK (available_seats <= total_seats)
);

-- Bookings (N:M between passengers and trips)
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  luggage_size text CHECK (luggage_size IS NULL OR luggage_size IN ('P', 'M', 'G')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, passenger_id)
);

-- Reviews (bidirectional: passenger <> driver)
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id),
  reviewee_id uuid NOT NULL REFERENCES public.profiles(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, reviewer_id)
);

-- ==========================================
-- VIEW: Driver Stats
-- ==========================================

CREATE VIEW public.v_driver_stats AS
SELECT
  p.id,
  p.username,
  p.full_name,
  COUNT(DISTINCT t.id)::integer AS total_trips,
  ROUND(COALESCE(AVG(r.rating), 0), 2) AS avg_rating,
  COUNT(DISTINCT r.id)::integer AS total_reviews
FROM public.profiles p
LEFT JOIN public.trips t ON t.driver_id = p.id AND t.status = 'completed'
LEFT JOIN public.reviews r ON r.reviewee_id = p.id
WHERE p.role IN ('driver', 'both')
GROUP BY p.id, p.username, p.full_name;

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX idx_trips_status_departure ON public.trips(status, departure_time);
CREATE INDEX idx_bookings_trip_id ON public.bookings(trip_id);
CREATE INDEX idx_bookings_passenger_id ON public.bookings(passenger_id);
CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX idx_reviews_booking_id ON public.reviews(booking_id);

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_trips
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_bookings
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Update available_seats when booking status changes
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Booking confirmed: decrement available_seats
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    UPDATE public.trips
    SET available_seats = available_seats - 1
    WHERE id = NEW.trip_id AND available_seats > 0;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No available seats for this trip';
    END IF;
  END IF;

  -- Booking cancelled/rejected after being confirmed: increment available_seats
  IF OLD IS NOT NULL AND OLD.status = 'confirmed' AND NEW.status IN ('cancelled', 'rejected') THEN
    UPDATE public.trips
    SET available_seats = available_seats + 1
    WHERE id = NEW.trip_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_status_change
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_status_change();

-- Validate luggage compatibility before booking
CREATE OR REPLACE FUNCTION public.validate_booking_luggage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  trip_luggage text[];
BEGIN
  IF NEW.luggage_size IS NOT NULL THEN
    SELECT luggage_policy INTO trip_luggage
    FROM public.trips WHERE id = NEW.trip_id;

    IF NOT (NEW.luggage_size = ANY(trip_luggage)) THEN
      RAISE EXCEPTION 'Luggage size % is not accepted for this trip', NEW.luggage_size;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_luggage_before_booking
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_luggage();

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trips
CREATE POLICY "Anyone can view active trips or own trips"
  ON public.trips FOR SELECT
  USING (status = 'active' OR driver_id = auth.uid());

CREATE POLICY "Drivers can create trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = driver_id);

-- Bookings
CREATE POLICY "Users can view own bookings and bookings for own trips"
  ON public.bookings FOR SELECT
  USING (
    passenger_id = auth.uid()
    OR trip_id IN (SELECT id FROM public.trips WHERE driver_id = auth.uid())
  );

CREATE POLICY "Passengers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Participants can update bookings"
  ON public.bookings FOR UPDATE
  USING (
    passenger_id = auth.uid()
    OR trip_id IN (SELECT id FROM public.trips WHERE driver_id = auth.uid())
  );

-- Reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews as reviewer"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);
