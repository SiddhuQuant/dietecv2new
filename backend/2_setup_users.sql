-- =============================================
-- CREATE TEST USERS
-- Doctors/Admins: Store passwords in their own tables (no Supabase Auth)
-- Patients: Use Supabase Auth
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- STEP 1: Create admin (stored password)
-- =============================================
DELETE FROM public.admins WHERE email = 'admin@dietec.com';
INSERT INTO public.admins (name, email, phone, role, status, password)
VALUES ('System Admin', 'admin@dietec.com', '+1-555-9999', 'admin', 'active', 
        crypt('Admin@123', gen_salt('bf')));

-- =============================================
-- STEP 2: Create doctors (stored passwords)
-- =============================================
DELETE FROM public.doctors WHERE email IN (
    'dr.sarah.johnson@hospital.com',
    'dr.michael.chen@hospital.com',
    'dr.priya.sharma@hospital.com',
    'dr.james.wilson@hospital.com',
    'dr.anita.desai@hospital.com',
    'dr.robert.patel@hospital.com'
);

INSERT INTO public.doctors (name, email, specialization, experience_years, qualification, phone, status, password)
VALUES 
    ('Dr. Sarah Johnson', 'dr.sarah.johnson@hospital.com', 'Cardiologist', 12, 'MBBS, MD (Cardiology), DM', '+91-98765-43210', 'active', crypt('Doctor@123', gen_salt('bf'))),
    ('Dr. Michael Chen', 'dr.michael.chen@hospital.com', 'Dermatologist', 8, 'MBBS, MD (Dermatology)', '+91-98765-43211', 'active', crypt('Doctor@123', gen_salt('bf'))),
    ('Dr. Priya Sharma', 'dr.priya.sharma@hospital.com', 'Orthopedic Surgeon', 15, 'MBBS, MS (Orthopedics)', '+91-98765-43212', 'active', crypt('Doctor@123', gen_salt('bf'))),
    ('Dr. James Wilson', 'dr.james.wilson@hospital.com', 'Pediatrician', 10, 'MBBS, MD (Pediatrics)', '+91-98765-43213', 'active', crypt('Doctor@123', gen_salt('bf'))),
    ('Dr. Anita Desai', 'dr.anita.desai@hospital.com', 'General Physician', 7, 'MBBS, MD (Medicine)', '+91-98765-43214', 'active', crypt('Doctor@123', gen_salt('bf'))),
    ('Dr. Robert Patel', 'dr.robert.patel@hospital.com', 'Neurologist', 14, 'MBBS, MD (Neurology), DM', '+91-98765-43215', 'active', crypt('Doctor@123', gen_salt('bf')));

-- =============================================
-- STEP 3: Note for Patients
-- =============================================
-- Patients will signup through the app using Supabase Auth
-- Or create them manually in Supabase Dashboard -> Authentication -> Users
