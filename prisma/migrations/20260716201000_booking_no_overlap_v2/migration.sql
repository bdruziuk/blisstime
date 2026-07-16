-- Request-to-book: PENDING (active hold) now also blocks a slot, and
-- DECLINED/EXPIRED no longer do. Recreate the exclusion constraint with
-- the expanded exclusion list (Postgres has no ALTER CONSTRAINT for this).
ALTER TABLE "Booking" DROP CONSTRAINT "booking_no_overlap";

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    "staffId" WITH =,
    tsrange("slotStart", "slotEnd") WITH &&
  )
  WHERE ("status" NOT IN ('CANCELLED', 'NO_SHOW', 'DECLINED', 'EXPIRED'));
