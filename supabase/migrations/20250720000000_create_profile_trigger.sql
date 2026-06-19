-- Enable Row Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the new user
  -- Using the auth.users metadata to populate profile fields
  INSERT INTO public.profiles (
    id, 
    username,
    email,
    full_name,
    role,
    is_active,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(
        NULLIF(NEW.raw_user_meta_data->>'first_name', '') || ' ' || 
        NULLIF(NEW.raw_user_meta_data->>'last_name', '')
      ),
      split_part(NEW.email, '@', 1)
    ),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'user'),
    COALESCE((NEW.raw_user_meta_data->>'is_active')::boolean, true),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Set up Row Level Security (RLS) policies for the profiles table
-- Allow users to read all profiles (adjust as needed)
CREATE POLICY "Allow public read access" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow individual update access"
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile (handled by trigger)
CREATE POLICY "Allow individual insert access"
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
CREATE POLICY "Allow individual delete access"
  ON public.profiles 
  FOR DELETE 
  USING (auth.uid() = id);
