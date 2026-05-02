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
  subscription_tier?: string | null;
  is_verified_pro?: boolean | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string, promoCode?: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyPhoneOTP: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  setVerifyingOTP: (verifying: boolean) => void;
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
  const isVerifyingOTP = useRef(false);

  const setVerifyingOTP = (verifying: boolean) => {
    isVerifyingOTP.current = verifying;
  };

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

  const createProfile = async (userId: string, email: string, fullName?: string, emailVerified = false) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({ user_id: userId, email, full_name: fullName || null, role: 'student', email_verified: emailVerified })
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
      if (!nextSession?.user) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setHasAdminRole(false);
        setLoading(false);
        sessionRegistered.current = false;
        return;
      }

      // Fetch/create profile first so we can enforce custom OTP verification gate
      let userProfile = await fetchProfile(nextSession.user.id);

      // Detect Google OAuth provider
      const provider = nextSession.user.app_metadata?.provider as string | undefined;
      const isGoogleUser = provider === 'google';
      const isNewProfile = !userProfile; // true when user signs in with Google for the first time

      if (!userProfile) {
        // For Google users, email is pre-verified by Google — mark it verified immediately
        userProfile = await createProfile(
          nextSession.user.id,
          nextSession.user.email || '',
          nextSession.user.user_metadata?.full_name,
          isGoogleUser // auto-confirm Google users
        );
      } else if (!userProfile.full_name && nextSession.user.user_metadata?.full_name) {
        // Profile exists but name is missing (e.g., created during brief signup session)
        // Patch it from user_metadata
        const metaName = nextSession.user.user_metadata.full_name;
        await supabase
          .from('profiles')
          .update({ full_name: metaName })
          .eq('user_id', nextSession.user.id);
        userProfile = { ...userProfile, full_name: metaName };
      }

      // ONLY trust the profile's email_verified flag (set by our OTP edge function or Google path)
      // Do NOT trust Supabase's email_confirmed_at since auto-confirm may have set it
      let isEmailVerified = userProfile?.email_verified === true;

      // If this is a Google user and profile isn't yet marked verified, fix it now
      if (!isEmailVerified && isGoogleUser) {
        await supabase
          .from('profiles')
          .update({ email_verified: true })
          .eq('user_id', nextSession.user.id);
        if (userProfile) userProfile = { ...userProfile, email_verified: true };
        isEmailVerified = true;
      }

      // For brand-new Google users, send them their auto-generated password in the background
      if (isGoogleUser && isNewProfile && nextSession.user.email) {
        supabase.functions.invoke('setup-google-password', {
          body: {
            userId: nextSession.user.id,
            email: nextSession.user.email,
            name: nextSession.user.user_metadata?.full_name || nextSession.user.email.split('@')[0],
          },
        }).catch(err => console.error('setup-google-password failed:', err));
      }

      if (!isEmailVerified) {
        if (event === 'SIGNED_IN' || isVerifyingOTP.current) {
          // After OTP verification the edge function sets email_verified=true.
          // Give it more time (up to 6 seconds) to propagate if we are in verification mode.
          const maxRetries = isVerifyingOTP.current ? 6 : 1;
          let verified = false;

          for (let i = 0; i < maxRetries; i++) {
            if (i > 0) await new Promise(r => setTimeout(r, 1000));
            const refreshedProfile = await fetchProfile(nextSession.user.id);
            if (refreshedProfile?.email_verified) {
              userProfile = refreshedProfile;
              verified = true;
              break;
            }
          }

          if (!verified) {
            // Still not verified — sign out silently
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
            setHasAdminRole(false);
            setLoading(false);
            sessionRegistered.current = false;
            return;
          }
        } else {
          // INITIAL_SESSION / TOKEN_REFRESHED — strict gate
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setHasAdminRole(false);
          setLoading(false);
          sessionRegistered.current = false;
          return;
        }
      }

      setSession(nextSession);
      setUser(nextSession.user);
      setProfile(userProfile);

      const isAdminUser = await checkAdminRole(nextSession.user.id);
      setHasAdminRole(isAdminUser);

      // Session management: register on SIGNED_IN, validate on TOKEN_REFRESHED
      if (event === 'SIGNED_IN' && !sessionRegistered.current) {
        sessionRegistered.current = true;
        validationInProgress.current = true; // Block validation while registering
        try {
          await registerSession(nextSession.user.id);
        } catch (e) {
          console.error('Session register failed:', e);
        } finally {
          validationInProgress.current = false;
        }
      } else if (event === 'TOKEN_REFRESHED' && !validationInProgress.current) {
        // Only validate on token refresh (periodic check), NOT on initial load or during register
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
        const localToken = localStorage.getItem('session_token');
        if (!localToken && !sessionRegistered.current) {
          sessionRegistered.current = true;
          validationInProgress.current = true;
          try {
            await registerSession(nextSession.user.id);
          } catch (e) {
            console.error('Session register on init failed:', e);
          } finally {
            validationInProgress.current = false;
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
      localStorage.removeItem('session_token');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };

      let signedInProfile = data.user ? await fetchProfile(data.user.id) : null;
      if (!signedInProfile && data.user) {
        signedInProfile = await createProfile(
          data.user.id,
          data.user.email || email,
          data.user.user_metadata?.full_name,
          !!data.user.email_confirmed_at
        );
      }

      if (!signedInProfile?.email_verified) {
        await supabase.auth.signOut();
        return { error: new Error('Email not confirmed') };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string, promoCode?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            signup_promo_code: promoCode
          },
        },
      });

      if (error) return { error };

      // With auto-confirm enabled, signUp may create a session immediately.
      // Keep user signed out until OTP is verified.
      if (data.session) {
        await supabase.auth.signOut();
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      sessionRegistered.current = false;
      localStorage.removeItem('session_token');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
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
        setVerifyingOTP,
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
