ALTER TABLE "AstroCareersDataTable"
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS payment_date timestamptz;
