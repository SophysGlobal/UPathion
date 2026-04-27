import { ReactNode, useEffect, useRef, useState } from 'react';
import { useAppEntry } from '@/hooks/useAppEntry';
import { useAuth } from '@/context/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import PersistentLogoLayer from './PersistentLogoLayer';

interface AppEntryGateProps {
  children: ReactNode;
}

/**
 * AppEntryGate — single SplashScreen component handles both splash + welcome
 * in one continuous animation. No unmount/remount = no flicker.
 */
/**
 * Splash timing — the UPathion logo is rendered ONLY by PersistentLogoLayer
 * (mounted continuously). We just dim the rest of the UI behind a scrim while
 * the logo plays its intro, then flip phase to "docked" so the logo migrates
 * to its final position alongside the sign-in screen rendering underneath.
 *
 * Total: SPLASH_INTRO_MS (centered hold) + MIGRATE_MS (animate to dock).
 */
const SPLASH_INTRO_MS = 1900; // logo fade-in + wordmark reveal + brief hold
const MIGRATE_MS = 900;       // center → docked
const SCRIM_FADE_MS = 350;

const AppEntryGate = ({ children }: AppEntryGateProps) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminStatus();
  const {
    showSplash,
    isReady,
    onSplashComplete,
    markDeviceSignedIn,
    markAdminSession,
  } = useAppEntry();

  // Phase the persistent logo should be in.
  // - If splash is active: start "splash" (centered), then flip to "docked".
  // - If splash already shown this session: jump straight to "docked".
  const [phase, setPhase] = useState<'splash' | 'docked'>(
    showSplash ? 'splash' : 'docked',
  );
  const [scrimVisible, setScrimVisible] = useState(showSplash);
  const childrenMountedRef = useRef(false);

  useEffect(() => {
    if (user) markDeviceSignedIn();
  }, [user, markDeviceSignedIn]);

  useEffect(() => {
    if (user && isAdmin !== undefined) markAdminSession(isAdmin);
  }, [user, isAdmin, markAdminSession]);

  // Splash timeline: centered hold → flip phase to "docked" so the logo
  // animates to its final position. The sign-in screen (children) is
  // pre-mounted underneath the scrim so its layout is fully ready before the
  // logo arrives — no late-render flicker.
  useEffect(() => {
    if (!showSplash) return;
    const flip = window.setTimeout(() => setPhase('docked'), SPLASH_INTRO_MS);
    return () => window.clearTimeout(flip);
  }, [showSplash]);

  // Called by PersistentLogoLayer once the docked position is reached.
  const handleDocked = () => {
    if (!showSplash) return;
    // Fade scrim out; mark ready slightly after so children are revealed
    // exactly as the scrim disappears — the logo is already in place.
    setScrimVisible(false);
    window.setTimeout(() => {
      onSplashComplete();
    }, SCRIM_FADE_MS);
  };

  // Children must mount during splash too (under the scrim) so the sign-in
  // page is fully laid out before the logo finishes migrating.
  const renderChildren = isReady || showSplash;
  if (renderChildren) childrenMountedRef.current = true;

  return (
    <>
      {/* Scrim — dims everything except the persistent logo. The logo lives
          OUTSIDE this element (it's a sibling at root) so it is never hidden
          when the scrim fades. */}
      {(showSplash || scrimVisible) && (
        <div
          className="fixed inset-0 z-[40] bg-background transition-opacity pointer-events-none"
          style={{
            opacity: scrimVisible ? 1 : 0,
            transitionDuration: `${SCRIM_FADE_MS}ms`,
          }}
          aria-hidden
        />
      )}

      {/* Single, continuously-mounted logo. Drives its own animation. */}
      <PersistentLogoLayer
        phase={phase}
        introMs={SPLASH_INTRO_MS - 200}
        migrateMs={MIGRATE_MS}
        onDocked={handleDocked}
      />

      {/* Sign-in / routed children render under the scrim during splash so
          their layout is fully ready BEFORE the logo finishes docking. */}
      {renderChildren && children}
    </>
  );
};

export default AppEntryGate;
