import { memo, useEffect, useRef, useState, useCallback } from "react";
import { matchPath, useLocation } from "react-router-dom";
import upathionLogo from "@/assets/upathion-logo.png";
import { cn } from "@/lib/utils";

const authPatterns = ["/", "/signin", "/signup"];
const onboardingPatterns = ["/onboarding/*", "/subscription"];
const appHeaderPatterns = ["/dashboard", "/feed", "/explore", "/profile", "/messages"];

const matchesAny = (pathname: string, patterns: string[]) =>
  patterns.some((pattern) =>
    matchPath({ path: pattern, end: pattern.indexOf("*") === -1 }, pathname),
  );

export type EntryPhase = "splash" | "docked";

interface PersistentLogoLayerProps {
  /**
   * "splash" → logo centered on screen, larger, with wordmark clip-revealing.
   * "docked" → logo migrated to its final route-appropriate position.
   *
   * The transition between the two is driven by a single internal RAF
   * timeline so the logo never unmounts, never crossfades, and never snaps.
   */
  phase: EntryPhase;
  /** Total ms for splash intro (logo fade + wordmark reveal). */
  introMs?: number;
  /** Total ms for the migrate animation (center → docked). */
  migrateMs?: number;
  /** Called once the docked position has been reached. */
  onDocked?: () => void;
}

/**
 * Single source of truth for the UPathion logo.
 *
 * Mounted ONCE at app root. Never unmounts. Drives the entire splash → docked
 * transition itself, so there is no second logo instance to crossfade with —
 * which is what previously caused the flicker on the sign-in handoff.
 */
const PersistentLogoLayer = memo(
  ({ phase, introMs = 1700, migrateMs = 900, onDocked }: PersistentLogoLayerProps) => {
    const { pathname } = useLocation();

    const isAuth = matchesAny(pathname, authPatterns);
    const isOnboarding = matchesAny(pathname, onboardingPatterns);
    const isAppHeader = matchesAny(pathname, appHeaderPatterns);
    // App-header routes own their own logo (rendered inside AppHeader).
    // The persistent overlay only handles auth + onboarding.
    const showsOnRoute = isAuth || isOnboarding;

    // Final docked layout: centered with wordmark on auth/onboarding.
    const dockedCentered = isAuth || isOnboarding;

    // ---- Single RAF timeline ----------------------------------------------
    // t = 0 .. 1 across each phase. We keep two progress values:
    //   intro  → logo fades+scales in, wordmark clip-reveals
    //   migrate → translate/scale from center to docked position
    const [intro, setIntro] = useState(phase === "splash" ? 0 : 1);
    const [migrate, setMigrate] = useState(phase === "splash" ? 0 : 1);
    const onDockedRef = useRef(onDocked);
    onDockedRef.current = onDocked;
    const dockedFiredRef = useRef(phase !== "splash");

    // Animate intro on mount (only when starting from splash).
    useEffect(() => {
      if (phase !== "splash") return;
      let raf = 0;
      let start = 0;
      const tick = (now: number) => {
        if (!start) start = now;
        const p = Math.min(1, (now - start) / introMs);
        setIntro(p);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [phase, introMs]);

    // Animate migrate when phase flips to docked.
    useEffect(() => {
      if (phase !== "docked") return;
      // If we never ran intro (returning user), snap intro to 1 too.
      setIntro(1);
      let raf = 0;
      let start = 0;
      const tick = (now: number) => {
        if (!start) start = now;
        const p = Math.min(1, (now - start) / migrateMs);
        setMigrate(p);
        if (p < 1) {
          raf = requestAnimationFrame(tick);
        } else if (!dockedFiredRef.current) {
          dockedFiredRef.current = true;
          onDockedRef.current?.();
        }
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [phase, migrateMs]);

    // ---- Easings ----------------------------------------------------------
    const easeOut = useCallback((v: number) => 1 - Math.pow(1 - v, 3), []);
    const easeInOut = useCallback(
      (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2),
      [],
    );

    const introE = easeOut(intro);
    const migrateE = easeInOut(migrate);

    // Wordmark reveal — starts ~40% into intro, finishes with intro.
    const textReveal = easeOut(Math.max(0, Math.min(1, (intro - 0.4) / 0.6)));

    // Measure wordmark width so we can keep the LOGO perfectly centered on
    // the viewport while the wordmark is still hidden, and gradually shift
    // the whole group left as the wordmark reveals — producing the
    // "logo introduces itself, then the brand lockup completes" feel.
    const wordmarkRef = useRef<HTMLSpanElement | null>(null);
    const [wordmarkW, setWordmarkW] = useState(0);
    useEffect(() => {
      const measure = () => {
        if (wordmarkRef.current) {
          setWordmarkW(wordmarkRef.current.offsetWidth);
        }
      };
      measure();
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }, []);
    // gap-3 = 12px. Offset = half of (wordmark + gap), faded out as text appears
    // and as migration completes (so docked final layout is the true center).
    const groupShiftX =
      ((wordmarkW + 12) / 2) * (1 - textReveal) * (1 - migrateE);

    // ---- Geometry ---------------------------------------------------------
    // Splash anchor: viewport center.
    // Docked anchor (centered route): top:64px, horizontal center.
    // Docked anchor (app header):     top:12px, left:20px.
    //
    // We render the layer at FIXED viewport center via top/left+translate,
    // then translate it toward the docked anchor as `migrate` advances.
    const viewportW = typeof window !== "undefined" ? window.innerWidth : 1024;
    const viewportH = typeof window !== "undefined" ? window.innerHeight : 768;

    // Scale the splash logo down on narrow screens so the wordmark never
    // overflows the viewport. We reserve ~32px of horizontal padding on each
    // side and use the natural wordmark width as the constraint.
    const isNarrow = viewportW < 420;
    const startSize = isNarrow ? 64 : 80;
    const endSize = 48;
    const logoSize = startSize - (startSize - endSize) * migrateE;

    // Wordmark renders at its final size (text-2xl) the entire time so the
    // reserved layout width matches the actual visible width. This keeps the
    // logo+wordmark lockup OPTICALLY centered on the viewport — previously
    // we applied a transform: scale(0.75) which shrank the visible wordmark
    // but left the container width at the un-scaled size, shifting the
    // visual midpoint of the lockup to the left of true center.

    // Compute translate from viewport center to docked anchor (logo center).
    let dockedCenterX: number;
    let dockedCenterY: number;
    if (dockedCentered) {
      dockedCenterX = viewportW / 2;
      dockedCenterY = 72 + endSize / 2; // shifted down so branding sits closer to content
    } else {
      dockedCenterX = 20 + endSize / 2; // left-5 + half logo
      dockedCenterY = 12 + endSize / 2; // top-3 + half logo
    }

    // When centered+docked, wordmark sits to the right of logo. The whole
    // group is centered on dockedCenterX. So the GROUP center shifts; logo
    // alone offsets left by (textWidth/2).
    // For app-header route the wordmark is hidden in docked state, so the
    // group is just the logo.
    const showWordmarkDocked = dockedCentered;
    // Wordmark is hidden on app-header docked → fade it out as migrate runs.
    const wordmarkOpacity = showWordmarkDocked ? 1 : 1 - migrateE;

    const shiftX = (dockedCenterX - viewportW / 2) * migrateE;
    const shiftY = (dockedCenterY - viewportH / 2) * migrateE;

    // Hide on routes that have no logo placement (e.g. modal-only pages),
    // BUT only once we're fully docked — never mid-transition.
    if (!showsOnRoute && migrate >= 1) return null;

    // Once fully docked on auth/onboarding routes, switch from `fixed` to
    // `absolute` so the logo becomes part of the document flow and scrolls
    // away with the page content (instead of pinning to the viewport).
    // App-header routes keep the logo fixed (it lives in the sticky header
    // area at the top-left).
    const fullyDocked = migrate >= 1;
    const useAbsolute = fullyDocked && dockedCentered;

    if (useAbsolute) {
      return (
        <div
          className="pointer-events-none absolute left-1/2 z-50"
          style={{
            top: 72,
            transform: `translate(-50%, 0) translateZ(0)`,
          }}
          aria-hidden={false}
        >
          <a
            href="/dashboard"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/dashboard");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 hover:opacity-80 transition-opacity",
            )}
          >
            <img
              src={upathionLogo}
              alt="UPathion Logo"
              loading="eager"
              decoding="sync"
              className="object-contain"
              style={{ width: endSize, height: endSize }}
            />
            {showWordmarkDocked && (
              <span className="text-2xl font-bold gradient-text whitespace-nowrap block">
                UPathion
              </span>
            )}
          </a>
        </div>
      );
    }

    return (
      <div
        className="pointer-events-none fixed left-1/2 top-1/2 z-50"
        style={{
          transform: `translate(-50%, -50%) translate(${shiftX}px, ${shiftY}px) translateZ(0)`,
          willChange: "transform",
          maxWidth: `calc(100vw - 32px)`,
          paddingLeft: 8,
          paddingRight: 8,
        }}
        aria-hidden={false}
      >
        <a
          href="/dashboard"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, "", "/dashboard");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
          className={cn(
            "pointer-events-auto flex items-center gap-3 hover:opacity-80 transition-opacity",
          )}
          style={{
            transform: `translateX(${groupShiftX}px) translateZ(0)`,
            willChange: "transform",
          }}
        >
          <img
            src={upathionLogo}
            alt="UPathion Logo"
            loading="eager"
            decoding="sync"
            className="object-contain"
            style={{
              width: logoSize,
              height: logoSize,
              opacity: 0.15 + 0.85 * introE,
              transform: `scale(${0.9 + 0.1 * introE}) translateZ(0)`,
              willChange: "transform, opacity",
            }}
          />

          <div
            className="overflow-hidden"
            style={{
              // Use clip-path so the text width is determined by its natural
              // (responsive) font size — no fixed pixel cap that could clip
              // the last characters on small screens.
              clipPath: `inset(0 ${(1 - textReveal) * 100}% 0 0)`,
              opacity: wordmarkOpacity,
              willChange: "clip-path, opacity",
            }}
          >
            <span
              ref={wordmarkRef}
              className="text-2xl font-bold gradient-text whitespace-nowrap block"
              style={{
                opacity: textReveal,
                transform: `translateX(${(1 - textReveal) * -20}px) translateZ(0)`,
                transformOrigin: "left center",
                willChange: "transform, opacity",
              }}
            >
              UPathion
            </span>
          </div>
        </a>
      </div>
    );
  },
);

PersistentLogoLayer.displayName = "PersistentLogoLayer";

export default PersistentLogoLayer;