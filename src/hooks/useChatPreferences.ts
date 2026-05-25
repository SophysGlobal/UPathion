import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export type NotificationPrefs = {
  desktop: boolean;
  sound: boolean;
  preview: boolean;
};

export type ChatPreferences = {
  starred: string[];
  favorited: string[];
  archived: string[];
  // Per-conversation mute deadline (epoch ms) or "indefinite".
  muteUntil: Record<string, number | "indefinite">;
  // Per-conversation read override (lets the user mark something as unread).
  unread: string[];
  notifications: NotificationPrefs;
};

const DEFAULTS: ChatPreferences = {
  starred: [],
  favorited: [],
  archived: [],
  muteUntil: {},
  unread: [],
  notifications: { desktop: true, sound: true, preview: true },
};

const keyFor = (userId: string | undefined) =>
  userId ? `upathion_chat_prefs_${userId}` : "upathion_chat_prefs_anon";

const load = (key: string): ChatPreferences => {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed, notifications: { ...DEFAULTS.notifications, ...(parsed.notifications ?? {}) } };
  } catch {
    return DEFAULTS;
  }
};

export const useChatPreferences = () => {
  const { user } = useAuth();
  const key = keyFor(user?.id);
  const [prefs, setPrefs] = useState<ChatPreferences>(() => load(key));

  useEffect(() => {
    setPrefs(load(key));
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [key, prefs]);

  const toggleSet = useCallback(
    (field: "starred" | "favorited" | "archived" | "unread", id: string) =>
      setPrefs((p) => {
        const has = p[field].includes(id);
        return { ...p, [field]: has ? p[field].filter((x) => x !== id) : [...p[field], id] };
      }),
    [],
  );

  const setMute = useCallback(
    (id: string, durationMs: number | "indefinite" | null) =>
      setPrefs((p) => {
        const next = { ...p.muteUntil };
        if (durationMs === null) {
          delete next[id];
        } else if (durationMs === "indefinite") {
          next[id] = "indefinite";
        } else {
          next[id] = Date.now() + durationMs;
        }
        return { ...p, muteUntil: next };
      }),
    [],
  );

  const isMuted = useCallback(
    (id: string) => {
      const v = prefs.muteUntil[id];
      if (!v) return false;
      if (v === "indefinite") return true;
      return v > Date.now();
    },
    [prefs.muteUntil],
  );

  const setNotification = useCallback(
    (key: keyof NotificationPrefs, value: boolean) =>
      setPrefs((p) => ({ ...p, notifications: { ...p.notifications, [key]: value } })),
    [],
  );

  return {
    prefs,
    toggleStarred: (id: string) => toggleSet("starred", id),
    toggleFavorited: (id: string) => toggleSet("favorited", id),
    toggleArchived: (id: string) => toggleSet("archived", id),
    toggleUnreadFlag: (id: string) => toggleSet("unread", id),
    setMute,
    isMuted,
    setNotification,
  };
};