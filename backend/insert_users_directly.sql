-- Insert users directly into auth.users and create their profiles
-- Note: Passwords are hashed using crypt function

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Disable trigger that auto-creates patient profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_secure();

-- Insert Doctor 1: sarah.smith@hospital.com
DO $$
DECLARE
    doctor1_id UUID;
BEGIN
    -- Insert into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'sarah.smith@hospital.com',
        crypt('Doctor@123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '{"provider":"email","providers":["email"]}',
        '{"name":"Dr. Sarah Smith","role":"doctor"}'
    )
    RETURNING id INTO doctor1_id;
    
    -- Insert into doctors table
    INSERT INTO public.doctors (user_id, name, email, specialization, experience_years, qualification, status)
    VALUES (doctor1_id, 'Dr. Sarah Smith', 'sarah.smith@hospital.com', 'General Physician', 8, 'MBBS, MD', 'active');
END $$;

-- Insert Doctor 2: mike.wilson@hospital.com
DO $$
DECLARE
    doctor2_id UUID;
BEGIN
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'mike.wilson@hospital.com',
        crypt('Doctor@123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '{"provider":"email","providers":["email"]}',
        '{"name":"Dr. Mike Wilson","role":"doctor"}'
    )
    RETURNING id INTO doctor2_id;
    
    INSERT INTO public.doctors (user_id, name, email, specialization, experience_years, qualification, status)
    VALUES (doctor2_id, 'Dr. Mike Wilson', 'mike.wilson@hospital.com', 'Cardiologist', 12, 'MBBS, DM Cardiology', 'active');
END $$;

-- Insert Patient 1: john.patient@email.com
DO $$
DECLARE
    patient1_id UUID;
BEGIN
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'john.patient@email.com',
        crypt('Patient@123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '{"provider":"email","providers":["email"]}',
        '{"name":"John Doe","role":"patient"}'
    )
    RETURNING id INTO patient1_id;
    
    INSERT INTO public.patients (user_id, name, email, phone, blood_group, status)
    VALUES (patient1_id, 'John Doe', 'john.patient@email.com', '+1-555-0101', 'O+', 'active');
END $$;

-- Insert Patient 2: jane.patient@email.com
DO $$
DECLARE
    patient2_id UUID;
BEGIN
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'jane.patient@email.com',
        crypt('Patient@123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '{"provider":"email","providers":["email"]}',
        '{"name":"Jane Smith","role":"patient"}'
    )
    RETURNING id INTO patient2_id;
    
    INSERT INTO public.patients (user_id, name, email, phone, blood_group, status)
    VALUES (patient2_id, 'Jane Smith', 'jane.patient@email.com', '+1-555-0102', 'A+', 'active');
END $$;

-- Insert Patient 3: mike.patient@email.com
DO $$
DECLARE
    patient3_id UUID;
BEGIN
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'mike.patient@email.com',
        crypt('Patient@123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '{"provider":"email","providers":["email"]}',
        '{"name":"Mike Johnson","role":"patient"}'
    )
    RETURNING id INTO patient3_id;
    
    INSERT INTO public.patients (user_id, name, email, phone, blood_group, status)
    VALUES (patient3_id, 'Mike Johnson', 'mike.patient@email.com', '+1-555-0103', 'B+', 'active');
END $$;

-- Insert Admin: admin@dietec.com
DO $$
DECLARE
    admin_id UUID;
BEGIN
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@dietec.com',
        crypt('Admin@123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        '{"provider":"email","providers":["email"]}',
        '{"name":"System Admin","role":"admin"}'
    )
    RETURNING id INTO admin_id;
    
    INSERT INTO public.admins (user_id, name, email, phone, role, status)
    VALUES (admin_id, 'System Admin', 'admin@dietec.com', '+1-555-9999', 'admin', 'active');
END $$;

-- Display created users
SELECT 
    '✅ Users created successfully!' as status,
    '👨‍⚕️ Doctors: sarah.smith@hospital.com, mike.wilson@hospital.com' as doctors,
    '👤 Patients: john.patient@email.com, jane.patient@email.com, mike.patient@email.com' as patients,
    '🔐 Admin: admin@dietec.com' as admin,
    '🔑 All passwords: Doctor@123, Patient@123, Admin@123' as passwords;
