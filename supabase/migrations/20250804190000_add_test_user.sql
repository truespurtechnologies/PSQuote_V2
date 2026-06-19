-- Create a test user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'test@example.com',
  '$2a$10$k4F5s8eX9Y5Zz8Z1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0Q1', -- password is 'password123'
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"email":"test@example.com","email_verified":true,"full_name":"Test User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Add profile for the test user
INSERT INTO public.profiles (
  id,
  username,
  email,
  full_name,
  role,
  is_active
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'testuser',
  'test@example.com',
  'Test User',
  'admin',
  true
) ON CONFLICT (id) DO NOTHING;
