import { supabase } from '../utils/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
  profile?: any;
}

class AuthService {
  // Get user role and profile from database
  async getUserProfile(userId: string, email: string): Promise<AuthUser | null> {
    try {
      // Check in patients table
      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (patient) {
        return {
          id: userId,
          email: patient.email,
          name: patient.name,
          role: 'patient',
          profile: patient
        };
      }

      // Check in doctors table
      const { data: doctor } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (doctor) {
        return {
          id: userId,
          email: doctor.email,
          name: doctor.name,
          role: 'doctor',
          profile: doctor
        };
      }

      // Check in admins table
      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (admin) {
        return {
          id: userId,
          email: admin.email,
          name: admin.name,
          role: 'admin',
          profile: admin
        };
      }

      // Fallback - no profile found, default to patient
      return {
        id: userId,
        email: email,
        name: email.split('@')[0],
        role: 'patient'
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Login with email and password
  async login(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user data returned' };
      }

      // Fetch complete user profile
      const userProfile = await this.getUserProfile(data.user.id, data.user.email || '');
      return { user: userProfile, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Login failed' };
    }
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return null;
      }

      // Fetch complete user profile
      return await this.getUserProfile(session.user.id, session.user.email || '');
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Logout
  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  // Signup (only for patients)
  async signup(email: string, password: string, name: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'patient'
          }
        }
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'No user data returned' };
      }

      // Create patient profile
      const { error: profileError } = await supabase
        .from('patients')
        .insert({
          user_id: data.user.id,
          name,
          email,
          status: 'active'
        });

      if (profileError) {
        console.error('Error creating patient profile:', profileError);
      }

      // Fetch complete user profile
      const userProfile = await this.getUserProfile(data.user.id, email);
      return { user: userProfile, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Signup failed' };
    }
  }
}

export const authService = new AuthService();
