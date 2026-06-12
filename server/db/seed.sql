-- Test accounts (password: "password123")
INSERT INTO users (email, password_hash, role, first_name, last_name, service_types) VALUES
  ('torka@test.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'torka',  'Marcus',  'Johnson', ARRAY['mechanic', 'washer']),
  ('torkee@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'torkee', 'Aaliya',  'Smith',   NULL);
