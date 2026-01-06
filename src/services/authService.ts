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
      // For patients with Supabase Auth, try user_id first, then email as fallback
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .or(`user_id.eq.${userId},email.eq.${email}`)
        .maybeSingle();

      if (patient) {
        return {
          id: patient.user_id || userId,
          email: patient.email,
          name: patient.name || email.split('@')[0],
          role: 'patient',
          profile: patient
        };
      }

      // Check doctors table by email only (they don't use Supabase Auth)
      const { data: doctor } = await supabase
        .from('doctors')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (doctor) {
        return {
          id: doctor.id,
          email: doctor.email,
          name: doctor.name,
          role: 'doctor',
          profile: doctor
        };
      }

      // Check admins table by email only (they don't use Supabase Auth)
      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (admin) {
        return {
          id: admin.id,
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
      // Return fallback even on error
      return {
        id: userId,
        email: email,
        name: email.split('@')[0],
        role: 'patient'
      };
    }
  }

  // Login with email and password
  async login(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Try doctor login first
      const { data: doctor, error: doctorError } = await supabase.rpc('login_doctor', {
        user_email: email,
        user_password: password
      });

      if (doctor && doctor.length > 0) {
        const doc = doctor[0];
        const userData = {
          id: doc.id,
          email: doc.email,
          name: doc.name,
          role: 'doctor',
          profile: doc
        };
        // Store in localStorage for persistent login
        localStorage.setItem('dietec-current-user', JSON.stringify(userData));
        return {
          user: userData,
          error: null
        };
      }

      // Try admin login
      const { data: admin, error: adminError } = await supabase.rpc('login_admin', {
        user_email: email,
        user_password: password
      });

      if (admin && admin.length > 0) {
        const adm = admin[0];
        const userData = {
          id: adm.id,
          email: adm.email,
          name: adm.name,
          role: 'admin',
          profile: adm
        };
        // Store in localStorage for persistent login
        localStorage.setItem('dietec-current-user', JSON.stringify(userData));
        return {
          user: userData,
          error: null
        };
      }

      // If not doctor or admin, try patient login with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: 'Invalid email or password' };
      }

      if (!data.user) {
        return { user: null, error: 'No user data returned' };
      }

      // Fetch patient profile
      const userProfile = await this.getUserProfile(data.user.id, data.user.email || '');
      return { user: userProfile, error: null };
    } catch (err: any) {
      return { user: null, error: err.message || 'Login failed' };
    }
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      console.log('START getCurrentUser');
      
      // First check localStorage for doctor/admin session
      const storedUser = localStorage.getItem('dietec-current-user');
      if (storedUser) {
        console.log('Found stored user');
        try {
          const userData = JSON.parse(storedUser);
          
          // Verify it's still valid by checking if user exists in database
          if (userData.role === 'doctor') {
            const { data: doctor } = await supabase
              .from('doctors')
              .select('*')
              .eq('email', userData.email)
              .maybeSingle();
            
            if (doctor) {
              console.log('Doctor verified');
              return {
                id: doctor.id,
                email: doctor.email,
                name: doctor.name,
                role: 'doctor',
                profile: doctor
              };
            }
          } else if (userData.role === 'admin') {
            const { data: admin } = await supabase
              .from('admins')
              .select('*')
              .eq('email', userData.email)
              .maybeSingle();
            
            if (admin) {
              console.log('Admin verified');
              return {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: 'admin',
                profile: admin
              };
            }
          }
          
          // If verification failed, clear invalid stored data
          localStorage.removeItem('dietec-current-user');
        } catch (parseError) {
          console.error('Error parsing stored user:', parseError);
          localStorage.removeItem('dietec-current-user');
        }
      }

      // Check Supabase Auth for patients
      console.log('Checking Supabase session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session check complete:', !!session);
      
      if (!session?.user) {
        console.log('No session');
        return null;
      }

      console.log('Fetching profile...');
      // Fetch complete user profile
      const userProfile = await this.getUserProfile(session.user.id, session.user.email || '');
      console.log('Profile fetched:', !!userProfile);
      
      return userProfile || {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.email?.split('@')[0] || 'User',
        role: 'patient'
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Logout
  async logout(): Promise<void> {
    // Clear localStorage for doctors/admins
    localStorage.removeItem('dietec-current-user');
    // Sign out from Supabase Auth (for patients)
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
