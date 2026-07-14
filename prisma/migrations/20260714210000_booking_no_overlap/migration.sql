-- Business rule: a staff member cannot have two overlapping bookings.
-- Enforced at the DB level (not just app logic) via a Postgres exclusion
-- constraint, since Prisma's schema language can't express EXCLUDE USING gist.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    "staffId" WITH =,
    tsrange("slotStart", "slotEnd") WITH &&
  )
  WHERE ("status" NOT IN ('CANCELLED', 'NO_SHOW'));
