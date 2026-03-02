import { supabase } from '@/integrations/supabase/client';

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';

  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os, device_info: `${browser} on ${os}` };
}

export async function registerSession(userId: string) {
  const sessionToken = crypto.randomUUID();
  const { browser, os, device_info } = getDeviceInfo();

  // Deactivate all previous sessions for this user
  await supabase
    .from('user_sessions')
    .update({ 
      is_active: false, 
      logged_out_at: new Date().toISOString(),
      logout_reason: 'new_login_elsewhere'
    })
    .eq('user_id', userId)
    .eq('is_active', true);

  // Create new session
  await supabase.from('user_sessions').insert({
    user_id: userId,
    session_token: sessionToken,
    browser,
    os,
    device_info,
  });

  // Store token locally
  localStorage.setItem('session_token', sessionToken);
  return sessionToken;
}

export async function validateSession(userId: string): Promise<boolean> {
  const localToken = localStorage.getItem('session_token');
  if (!localToken) return false;

  const { data } = await supabase
    .from('user_sessions')
    .select('id, is_active')
    .eq('user_id', userId)
    .eq('session_token', localToken)
    .eq('is_active', true)
    .maybeSingle();

  return !!data;
}

export async function endSession(userId: string) {
  const localToken = localStorage.getItem('session_token');
  if (localToken) {
    await supabase
      .from('user_sessions')
      .update({ 
        is_active: false, 
        logged_out_at: new Date().toISOString(),
        logout_reason: 'manual_logout'
      })
      .eq('user_id', userId)
      .eq('session_token', localToken);
  }
  localStorage.removeItem('session_token');
}
