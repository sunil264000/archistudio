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
  const sessionRegistered = useRef(false);
  const validationInProgress = useRef(false);

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
      if (error) return null;
      return data as Profile | null;
    } catch {
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
      if (error) return null;
      return data as Profile;
    } catch {
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
        sessionRegistered.current = false;
        return;
      }

      // Fetch profile + admin role
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

      // Session management: register on SIGNED_IN, validate on TOKEN_REFRESHED
      if (event === 'SIGNED_IN' && !sessionRegistered.current) {
        sessionRegistered.current = true;
        try {
          await registerSession(nextSession.user.id);
        } catch (e) {
          console.error('Session register failed:', e);
        }
      } else if (event === 'TOKEN_REFRESHED' && !validationInProgress.current) {
        // Only validate on token refresh (periodic check), NOT on initial load
        validationInProgress.current = true;
        try {
          const valid = await validateSession(nextSession.user.id);
          if (!valid && localStorage.getItem('session_token')) {
            // Token exists but invalidated = another device logged in
            toast.error('Logged out: your account was opened on another device.');
            localStorage.removeItem('session_token');
            sessionRegistered.current = false;
            await supabase.auth.signOut();
            setLoading(false);
            validationInProgress.current = false;
            return;
          }
        } finally {
          validationInProgress.current = false;
        }
      } else if (event === 'INITIAL_SESSION') {
        // On initial page load, just validate without kicking out
        // If no local token, register a new session (e.g., page refresh)
        const localToken = localStorage.getItem('session_token');
        if (!localToken && !sessionRegistered.current) {
          sessionRegistered.current = true;
          try {
            await registerSession(nextSession.user.id);
          } catch (e) {
            console.error('Session register on init failed:', e);
          }
        }
      }

      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void handleAuthState(event, nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      sessionRegistered.current = false;
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
      sessionRegistered.current = false;
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
    sessionRegistered.current = false;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setHasAdminRole(false);
  };

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
        isAdmin: hasAdminRole,
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
