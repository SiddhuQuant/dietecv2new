import { supabase } from '../utils/supabase/client';

export interface DoctorStats {
  todayAppointments: number;
  totalPatients: number;
  monthAppointments: number;
}

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  condition: string;
  lastVisit: string;
}

class DoctorService {
  async getStats(doctorEmail: string): Promise<DoctorStats> {
    try {
      // Get doctor ID first
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('email', doctorEmail)
        .single();

      if (!doctor) {
        return { todayAppointments: 0, totalPatients: 0, monthAppointments: 0 };
      }

      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // Count today's appointments
      const { count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .eq('date', today)
        .neq('status', 'cancelled');

      // Count total unique patients
      const { data: appointments } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctor.id);

      const uniquePatients = new Set(appointments?.map(a => a.patient_id)).size;

      // Count this month's appointments
      const { count: monthCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .gte('date', firstDayOfMonth)
        .neq('status', 'cancelled');

      return {
        todayAppointments: todayCount || 0,
        totalPatients: uniquePatients,
        monthAppointments: monthCount || 0,
      };
    } catch (error) {
      console.error('Error fetching doctor stats:', error);
      return { todayAppointments: 0, totalPatients: 0, monthAppointments: 0 };
    }
  }

  async getMyPatients(doctorEmail: string): Promise<PatientRecord[]> {
    try {
      // Get doctor ID first
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('email', doctorEmail)
        .single();

      if (!doctor) {
        return [];
      }

      // Get appointments with patient details
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          date,
          patients!inner (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('doctor_id', doctor.id)
        .order('date', { ascending: false });

      if (!appointments) {
        return [];
      }

      // Group by patient and get their latest visit
      const patientMap = new Map<string, PatientRecord>();

      appointments.forEach(apt => {
        const patient = apt.patients as any;
        if (patient && !patientMap.has(patient.id)) {
          patientMap.set(patient.id, {
            id: patient.id,
            name: patient.name || 'Unknown',
            age: 0, // Age not in current schema
            condition: 'General Checkup', // Condition not in current schema
            lastVisit: apt.date,
          });
        }
      });

      return Array.from(patientMap.values()).slice(0, 6); // Return top 6 patients
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return [];
    }
  }

  async getPendingActions(doctorEmail: string): Promise<{
    pendingAppointments: number;
    newReports: number;
    prescriptionUpdates: number;
  }> {
    try {
      // Get doctor ID first
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('email', doctorEmail)
        .single();

      if (!doctor) {
        return { pendingAppointments: 0, newReports: 0, prescriptionUpdates: 0 };
      }

      // Count pending appointments
      const { count: pendingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor.id)
        .eq('status', 'pending');

      return {
        pendingAppointments: pendingCount || 0,
        newReports: 0, // Would need a reports table
        prescriptionUpdates: 0, // Would need a prescriptions table
      };
    } catch (error) {
      console.error('Error fetching pending actions:', error);
      return { pendingAppointments: 0, newReports: 0, prescriptionUpdates: 0 };
    }
  }
}

export const doctorService = new DoctorService();
