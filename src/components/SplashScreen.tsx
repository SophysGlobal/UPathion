/**
 * SplashScreen is now LOGO-FREE.
 *
 * The UPathion logo + wordmark are rendered exclusively by
 * `PersistentLogoLayer`, which animates from screen-center → docked position
 * along a single timeline. This file is intentionally a tiny shim retained
 * so existing imports keep working — it renders nothing.
 *
 * The visual scrim (background dim) and the timing of the splash phase live
 * in `AppEntryGate`. There is therefore no second logo instance to crossfade
 * with, eliminating the previous flicker on the splash → sign-in handoff.
 */
const SplashScreen = () => null;

export default SplashScreen;
