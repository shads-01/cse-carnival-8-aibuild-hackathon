import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabaseClient } from '../../services/supabaseClient';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../store/toastStore';
import { UserRole } from '@shared/types';
import { Card } from '../../components/common/Card';

/**
 * Lands here after supabase.auth.signInWithOAuth() bounces the browser through
 * Google + Supabase. The Supabase client auto-parses the redirect and stores a
 * session by the time this mounts — we just hand its access token to our own
 * backend to get back a normal CampusOS session (see LoginPage's Google button).
 */
export const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const hasRun = useRef(false);
  // TEMP DIAGNOSTIC STATE — remove once the OAuth callback is confirmed working.
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    (async () => {
      const landingUrl = window.location.href;
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const oauthError = searchParams.get('error') || hashParams.get('error');
      const oauthErrorDescription =
        searchParams.get('error_description') || hashParams.get('error_description');

      try {
        if (oauthError) {
          throw new Error(`Supabase/Google returned an error: ${oauthError} — ${oauthErrorDescription}`);
        }

        const { data, error } = await supabaseClient.auth.getSession();
        const accessToken = data.session?.access_token;

        if (error || !accessToken) {
          throw new Error(
            `No Google session found. getSession() error: ${error?.message || 'none'}, ` +
              `has hash tokens: ${hashParams.has('access_token')}, ` +
              `has query code: ${searchParams.has('code')}`
          );
        }

        const session = await authService.loginWithGoogle(accessToken);
        setSession(session.user, session.token);
        toast.success(`Welcome, ${session.user.name}!`);
        navigate(session.user.role === UserRole.ADMIN ? '/admin' : '/app', { replace: true });
      } catch (err: any) {
        const message = err?.message || 'Google sign-in failed. Please try again.';
        toast.error(message);
        // eslint-disable-next-line no-console
        console.error('[oauth-callback] failed', { landingUrl, message });
        setDebugInfo(`Landing URL:\n${landingUrl}\n\nError:\n${message}`);
        // Do NOT auto-navigate away — leave this on screen so it can be read/copied.
      }
    })();
  }, [navigate, setSession]);

  if (debugInfo) {
    return (
      <Card variant="elevated" style={{ width: '100%', padding: '2rem' }}>
        <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Google sign-in didn't complete.</p>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontSize: '0.75rem',
            background: 'var(--glass-bg)',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}
        >
          {debugInfo}
        </pre>
        <Link to="/login">Back to login</Link>
      </Card>
    );
  }

  return (
    <Card variant="elevated" style={{ width: '100%', textAlign: 'center', padding: '2rem' }}>
      <p>Signing you in with Google…</p>
    </Card>
  );
};
