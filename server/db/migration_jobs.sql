-- Run this in psql or your DB client
-- Migration: create jobs table

CREATE TABLE IF NOT EXISTS jobs (
  id            SERIAL PRIMARY KEY,
  torkee_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  torka_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  service_type  VARCHAR(50) NOT NULL CHECK (service_type IN ('mechanic', 'gas', 'wash')),
  description   TEXT NOT NULL,
  ai_summary    TEXT,
  location_address TEXT NOT NULL,
  latitude      DECIMAL(10, 7),
  longitude     DECIMAL(10, 7),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  photo_urls    TEXT[],          -- array of photo URLs (S3/Cloudinary later)
  accepted_at   TIMESTAMP,
  completed_at  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Index for Torka dashboard (pending jobs feed)
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
-- Index for Torkee job history
CREATE INDEX IF NOT EXISTS idx_jobs_torkee ON jobs(torkee_id);
-- Index for Torka's accepted jobs
CREATE INDEX IF NOT EXISTS idx_jobs_torka ON jobs(torka_id);