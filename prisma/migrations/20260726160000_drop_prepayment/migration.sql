-- Drop the unused LiqPay prepayment model. Prepayment is replaced by an
-- advisory approach (show the master the client's reliability and recommend
-- asking for a prepayment for risky/new clients) — no payment processing.
DROP TABLE IF EXISTS "Prepayment";
DROP TYPE IF EXISTS "PrepaymentStatus";
