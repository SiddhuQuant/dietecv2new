-- =============================================
-- SCHEMA CLEANUP - Remove Redundancies
-- =============================================

-- Drop redundant tables
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.kv_store_ac24702d CASCADE;
DROP TABLE IF EXISTS public.kv_store_e46e3ba6 CASCADE;

-- Clean up orphaned data before adding foreign keys
TRUNCATE TABLE public.appointments CASCADE;
TRUNCATE TABLE public.bills CASCADE;
TRUNCATE TABLE public.tests CASCADE;
TRUNCATE TABLE public.appointment_blocks CASCADE;

-- Add password columns to doctors and admins tables (they don't use Supabase Auth)
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS password TEXT;

-- Make user_id nullable for doctors and admins (they don't link to auth.users)
ALTER TABLE public.doctors ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.admins ALTER COLUMN user_id DROP NOT NULL;

-- Add unique constraints on user_id for all role tables
DO $$ 
BEGIN
    -- Admins table
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admins_user_id_unique') THEN
        ALTER TABLE public.admins ADD CONSTRAINT admins_user_id_unique UNIQUE (user_id);
    END IF;
    
    -- Doctors table
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctors_user_id_unique') THEN
        ALTER TABLE public.doctors ADD CONSTRAINT doctors_user_id_unique UNIQUE (user_id);
    END IF;
    
    -- Patients table
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patients_user_id_unique') THEN
        ALTER TABLE public.patients ADD CONSTRAINT patients_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- Drop foreign key constraints for doctors and admins (they don't use Supabase Auth)
ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_user_id_fkey;
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_user_id_fkey;

-- Create password verification function for doctors and admins
CREATE OR REPLACE FUNCTION verify_password(stored_password TEXT, input_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN stored_password = crypt(input_password, stored_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create login function for doctors (bypasses RLS)
CREATE OR REPLACE FUNCTION login_doctor(user_email TEXT, user_password TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    specialization TEXT,
    experience_years INTEGER,
    qualification TEXT,
    phone TEXT,
    status TEXT
) AS $$
DECLARE
    doctor_record RECORD;
BEGIN
    SELECT d.* INTO doctor_record
    FROM public.doctors d
    WHERE d.email = user_email;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    IF doctor_record.password = crypt(user_password, doctor_record.password) THEN
        RETURN QUERY SELECT 
            doctor_record.id,
            doctor_record.name,
            doctor_record.email,
            doctor_record.specialization,
            doctor_record.experience_years,
            doctor_record.qualification,
            doctor_record.phone,
            doctor_record.status;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create login function for admins (bypasses RLS)
CREATE OR REPLACE FUNCTION login_admin(user_email TEXT, user_password TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT,
    status TEXT
) AS $$
DECLARE
    admin_record RECORD;
BEGIN
    SELECT a.* INTO admin_record
    FROM public.admins a
    WHERE a.email = user_email;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    IF admin_record.password = crypt(user_password, admin_record.password) THEN
        RETURN QUERY SELECT 
            admin_record.id,
            admin_record.name,
            admin_record.email,
            admin_record.phone,
            admin_record.role,
            admin_record.status;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing foreign key constraints
DO $$
BEGIN
    -- appointments -> patients
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_patient_id_fkey') THEN
        ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_patient_id_fkey 
        FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
    END IF;
    
    -- appointments -> doctors
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_doctor_id_fkey') THEN
        ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_doctor_id_fkey 
        FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;
    END IF;
    
    -- bills -> patients
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bills_patient_id_fkey') THEN
        ALTER TABLE public.bills 
        ADD CONSTRAINT bills_patient_id_fkey 
        FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
    END IF;
    
    -- tests -> patients
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tests_patient_id_fkey') THEN
        ALTER TABLE public.tests 
        ADD CONSTRAINT tests_patient_id_fkey 
        FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
    END IF;
    
    -- tests -> doctors
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tests_doctor_id_fkey') THEN
        ALTER TABLE public.tests 
        ADD CONSTRAINT tests_doctor_id_fkey 
        FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;
    END IF;
    
    -- appointment_blocks -> doctors
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointment_blocks_doctor_id_fkey') THEN
        ALTER TABLE public.appointment_blocks 
        ADD CONSTRAINT appointment_blocks_doctor_id_fkey 
        FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS on all tables if not already enabled
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_tests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Doctors can view their own profile" ON public.doctors;
DROP POLICY IF EXISTS "Admins can view all doctors" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can update their own profile" ON public.doctors;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.doctors;
DROP POLICY IF EXISTS "Enable insert for authenticated users on doctors" ON public.doctors;
DROP POLICY IF EXISTS "Patients can view their own profile" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Patients can update their own profile" ON public.patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users on patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can update their own profile" ON public.admins;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.admins;
DROP POLICY IF EXISTS "Allow all authenticated users to view medicines" ON public.medicines;
DROP POLICY IF EXISTS "Allow all authenticated users to view medical_tests" ON public.medical_tests;
DROP POLICY IF EXISTS "Patients can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can view their own bills" ON public.bills;
DROP POLICY IF EXISTS "Admins can view all bills" ON public.bills;
DROP POLICY IF EXISTS "Patients can view their own tests" ON public.tests;
DROP POLICY IF EXISTS "Doctors can view their tests" ON public.tests;
DROP POLICY IF EXISTS "Admins can view all tests" ON public.tests;

-- Create clean RLS policies
-- Admins policies
CREATE POLICY "Admins can view all admins" ON public.admins 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update their own profile" ON public.admins 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON public.admins 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Doctors policies
CREATE POLICY "Doctors can view their own profile" ON public.doctors 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all doctors" ON public.doctors 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update their own profile" ON public.doctors 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users on doctors" ON public.doctors 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Patients policies
CREATE POLICY "Patients can view their own profile" ON public.patients 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view all patients" ON public.patients 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all patients" ON public.patients 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

CREATE POLICY "Patients can update their own profile" ON public.patients 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users on patients" ON public.patients 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Medicines and Medical Tests - Allow all authenticated users to view
CREATE POLICY "Allow all authenticated users to view medicines" ON public.medicines 
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to view medical_tests" ON public.medical_tests 
    FOR SELECT USING (auth.role() = 'authenticated');

-- Appointments policies
CREATE POLICY "Patients can view their own appointments" ON public.appointments 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.patients WHERE id = patient_id AND user_id = auth.uid()));

CREATE POLICY "Doctors can view their appointments" ON public.appointments 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id AND user_id = auth.uid()));

CREATE POLICY "Admins can view all appointments" ON public.appointments 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Bills policies
CREATE POLICY "Patients can view their own bills" ON public.bills 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.patients WHERE id = patient_id AND user_id = auth.uid()));

CREATE POLICY "Admins can view all bills" ON public.bills 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Tests policies
CREATE POLICY "Patients can view their own tests" ON public.tests 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.patients WHERE id = patient_id AND user_id = auth.uid()));

CREATE POLICY "Doctors can view their tests" ON public.tests 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.doctors WHERE id = doctor_id AND user_id = auth.uid()));

CREATE POLICY "Admins can view all tests" ON public.tests 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON public.doctors(email);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_bills_patient_id ON public.bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_tests_patient_id ON public.tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_tests_doctor_id ON public.tests(doctor_id);
