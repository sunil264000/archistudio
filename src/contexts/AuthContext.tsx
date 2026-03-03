import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
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
  const authReadyRef = useRef(false);
  const registerInFlightRef = useRef(false);

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
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile | null;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  };

  const createProfile = async (userId: string, email: string, fullName?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({ user_id: userId, email, full_name: fullName || null, role: 'student' })
        .select()
        .single();
      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.error('Profile creation error:', err);
      return null;
    }
  };

  useEffect(() => {
    const handleAuthState = async (event: string, nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setHasAdminRole(false);
        setLoading(false);
        authReadyRef.current = true;
        return;
      }

      let userProfile = await fetchProfile(nextSession.user.id);
      if (!userProfile) {
        userProfile = await createProfile(
          nextSession.user.id,
          nextSession.user.email || '',
          nextSession.user.user_metadata?.full_name
        );
      }
      setProfile(userProfile);

      const isAdminUser = await checkAdminRole(nextSession.user.id);
      setHasAdminRole(isAdminUser);

      const shouldCheckSession = event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION';
      if (shouldCheckSession) {
        const hasValidLocalSession = await validateSession(nextSession.user.id);

        if (event === 'SIGNED_IN' && !hasValidLocalSession && !registerInFlightRef.current) {
          registerInFlightRef.current = true;
          try {
            await registerSession(nextSession.user.id);
          } finally {
            registerInFlightRef.current = false;
          }
        }

        if ((event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && !hasValidLocalSession && authReadyRef.current) {
          toast.error('You were logged out because this account was opened on another device.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      authReadyRef.current = true;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void handleAuthState(event, nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName },
        },
      });

      // Force signed-out state until OTP verification + login
      await supabase.auth.signOut();

      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithPhone = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const verifyPhoneOTP = async (phone: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    if (user) {
      await endSession(user.id);
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setHasAdminRole(false);
  };

  const isAdmin = hasAdminRole;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithPhone,
        verifyPhoneOTP,
        signOut,
        isAdmin,
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

