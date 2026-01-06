import { supabase } from '../utils/supabase/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  joinDate: string;
  status: "active" | "inactive" | "suspended";
}

class AdminService {
  async getUsers(): Promise<User[]> {
    try {
      // Fetch from all three tables
      const [
        { data: patients },
        { data: doctors },
        { data: admins }
      ] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase.from('doctors').select('*'),
        supabase.from('admins').select('*')
      ]);

      const allUsers: User[] = [];

      // Map patients
      if (patients) {
        allUsers.push(...patients.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          role: 'patient' as const,
          joinDate: new Date(p.created_at).toISOString().split('T')[0],
          status: p.status || 'active'
        })));
      }

      // Map doctors
      if (doctors) {
        allUsers.push(...doctors.map(d => ({
          id: d.id,
          name: d.name,
          email: d.email,
          role: 'doctor' as const,
          joinDate: new Date(d.created_at).toISOString().split('T')[0],
          status: d.status || 'active'
        })));
      }

      // Map admins
      if (admins) {
        allUsers.push(...admins.map(a => ({
          id: a.id,
          name: a.name,
          email: a.email,
          role: 'admin' as const,
          joinDate: new Date(a.created_at).toISOString().split('T')[0],
          status: a.status || 'active'
        })));
      }

      return allUsers;
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Try deleting from all tables (will only succeed on the correct one)
      await Promise.allSettled([
        supabase.from('patients').delete().eq('id', userId),
        supabase.from('doctors').delete().eq('id', userId),
        supabase.from('admins').delete().eq('id', userId)
      ]);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async getMetrics(): Promise<{
    totalUsers: number;
    activeDoctors: number;
    activePatients: number;
    totalBookings: number;
  }> {
    try {
      const [
        { count: patientsCount },
        { count: doctorsCount },
        { count: bookingsCount }
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
      ]);

      return {
        totalUsers: (patientsCount || 0) + (doctorsCount || 0),
        activeDoctors: doctorsCount || 0,
        activePatients: patientsCount || 0,
        totalBookings: bookingsCount || 0
      };
    } catch (error) {
      console.error('Error loading metrics:', error);
      return {
        totalUsers: 0,
        activeDoctors: 0,
        activePatients: 0,
        totalBookings: 0
      };
    }
  }

  async getRevenue(): Promise<{
    today: number;
    week: number;
    month: number;
    total: number;
  }> {
    try {
      const { data: bills } = await supabase
        .from('bills')
        .select('amount, created_at, status')
        .eq('status', 'paid');

      if (!bills) {
        return { today: 0, week: 0, month: 0, total: 0 };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      let todayTotal = 0;
      let weekTotal = 0;
      let monthTotal = 0;
      let total = 0;

      bills.forEach(bill => {
        const amount = Number(bill.amount);
        const date = new Date(bill.created_at);
        
        total += amount;
        if (date >= today) todayTotal += amount;
        if (date >= weekAgo) weekTotal += amount;
        if (date >= monthAgo) monthTotal += amount;
      });

      return {
        today: todayTotal,
        week: weekTotal,
        month: monthTotal,
        total
      };
    } catch (error) {
      console.error('Error loading revenue:', error);
      return { today: 0, week: 0, month: 0, total: 0 };
    }
  }
}

export const adminService = new AdminService();
