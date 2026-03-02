import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { registerSession, validateSession, endSession } from '@/utils/sessionManager';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: 'student' | 'admin' | 'instructor';
  email_verified: boolean;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  ai_queries_used_today: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyPhoneOTP: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAdminRole, setHasAdminRole] = useState(false);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    } catch {
      return false;
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) { console.error('Error fetching profile:', error); return null; }
      return data as Profile | null;
    } catch (err) { console.error('Profile fetch error:', err); return null; }
  };

  const createProfile = async (userId: string, email: string, fullName?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({ user_id: userId, email, full_name: fullName || null, role: 'student' })
        .select()
        .single();
      if (error) { console.error('Error creating profile:', error); return null; }
      return data as Profile;
    } catch (err) { console.error('Profile creation error:', err); return null; }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            let userProfile = await fetchProfile(session.user.id);
            if (!userProfile) {
              userProfile = await createProfile(
                session.user.id,
                session.user.email || '',
                session.user.user_metadata?.full_name
              );
            }
            setProfile(userProfile);
            const isAdminUser = await checkAdminRole(session.user.id);
            setHasAdminRole(isAdminUser);
            
            // Register session for single-device enforcement
            if (event === 'SIGNED_IN') {
              await registerSession(session.user.id);
            } else {
              // Validate existing session
              const valid = await validateSession(session.user.id);
              if (!valid && event !== 'TOKEN_REFRESHED') {
                // Session invalidated (logged in elsewhere)
                toast.error('You have been logged out because your account was accessed from another device.');
                await supabase.auth.signOut();
                return;
              }
            }
            
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(async (userProfile) => {
          if (!userProfile) {
            userProfile = await createProfile(
              session.user.id,
              session.user.email || '',
              session.user.user_metadata?.full_name
            );
          }
          setProfile(userProfile);
          const isAdminUser = await checkAdminRole(session.user.id);
          setHasAdminRole(isAdminUser);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      return { error: null };
    } catch (err) { return { error: err as Error }; }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName },
        },
      });
      
      if (error) return { error };

      // NOTE: Welcome email is NOT sent here anymore.
      // The OTP verification email (sent by EmailAuthForm) serves as the first contact.
      // After verification, the send-welcome-email is called once.
      // This prevents triple-email on signup.

      return { error: null };
    } catch (err) { return { error: err as Error }; }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) return { error };
      return { error: null };
    } catch (err) { return { error: err as Error }; }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) return { error };
      return { error: null };
    } catch (err) { return { error: err as Error }; }
  };

  const verifyPhoneOTP = async (phone: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) return { error };
      return { error: null };
    } catch (err) { return { error: err as Error }; }
  };

  const signOut = async () => {
    if (user) {
      await endSession(user.id);
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const isAdmin = hasAdminRole;

  return (
    <AuthContext.Provider
      value={{
        user, session, profile, loading,
        signInWithEmail, signUpWithEmail, signInWithGoogle,
        signInWithPhone, verifyPhoneOTP, signOut, isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
