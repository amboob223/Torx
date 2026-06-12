-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email               VARCHAR(255) UNIQUE NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  role                VARCHAR(10)  NOT NULL CHECK (role IN ('torka', 'torkee')),
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  phone               VARCHAR(20),
  avatar_url          TEXT,
  bio                 TEXT,
  service_types       TEXT[],           -- torka only: ['mechanic','gasser','washer']
  is_available        BOOLEAN DEFAULT true,
  rating_avg          NUMERIC(3,2) DEFAULT 0,
  rating_count        INTEGER DEFAULT 0,
  stripe_customer_id  VARCHAR(255),
  stripe_account_id   VARCHAR(255),     -- Stripe Connect (torka)
  stripe_onboarded    BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jobs (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  torkee_id               UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  torka_id                UUID REFERENCES users(id) ON DELETE SET NULL,
  service_type             VARCHAR(20) NOT NULL CHECK (service_type IN ('mechanic','gasser','washer')),
  status                   VARCHAR(20)  DEFAULT 'pending'
                             CHECK (status IN ('pending','accepted','in_progress','completed','cancelled')),
  location_address         TEXT NOT NULL,
  location_lat             NUMERIC(10,7),
  location_lng             NUMERIC(10,7),
  description              TEXT NOT NULL,
  ai_diagnosis             TEXT,                -- stored as JSON string
  price_amount             INTEGER,             -- cents
  price_confirmed          BOOLEAN DEFAULT false,
  stripe_payment_intent_id VARCHAR(255),
  stripe_transfer_id       VARCHAR(255),
  payment_status           VARCHAR(20)  DEFAULT 'unpaid'
                             CHECK (payment_status IN ('unpaid','paid','refunded')),
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id       UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  reviewer_id  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_torkee    ON jobs(torkee_id);
CREATE INDEX idx_jobs_torka     ON jobs(torka_id);
CREATE INDEX idx_jobs_status     ON jobs(status);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
