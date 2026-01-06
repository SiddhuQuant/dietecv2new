-- Create separate tables for doctors, patients, and admins
-- Drop existing tables if they exist to recreate with new schema
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- Doctors table
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    specialization TEXT,
    experience_years INTEGER,
    qualification TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    blood_group TEXT,
    address TEXT,
    emergency_contact TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins table
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policies for doctors table
CREATE POLICY "Doctors can view their own profile" ON public.doctors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all doctors" ON public.doctors FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);
CREATE POLICY "Doctors can update their own profile" ON public.doctors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users" ON public.doctors FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for patients table
CREATE POLICY "Patients can view their own profile" ON public.patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Doctors can view all patients" ON public.patients FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can view all patients" ON public.patients FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);
CREATE POLICY "Patients can update their own profile" ON public.patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users" ON public.patients FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for admins table
CREATE POLICY "Admins can view all admins" ON public.admins FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);
CREATE POLICY "Admins can update their own profile" ON public.admins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users" ON public.admins FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON public.doctors(email);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
