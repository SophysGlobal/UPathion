import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedValue } from "./useDebouncedValue";

export type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid_short"
  | "invalid_chars";

export interface UsernameAvailability {
  status: UsernameStatus;
  message: string;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const MIN_LEN = 3;

/**
 * Real-time username availability check.
 *
 * - Runs format validation immediately (no DB call needed)
 * - For valid formats, queries `public_profiles.username` after 350ms debounce
 * - Skips the DB check if `currentUsername` matches (user already owns it)
 */
export function useUsernameAvailability(
  username: string,
  currentUsername?: string | null,
): UsernameAvailability {
  const trimmed = username.trim();
  const debounced = useDebouncedValue(trimmed, 350);
  const [result, setResult] = useState<UsernameAvailability>({
    status: "idle",
    message: "",
  });

  useEffect(() => {
    let cancelled = false;

    if (!trimmed) {
      setResult({ status: "idle", message: "" });
      return;
    }
    if (trimmed.length < MIN_LEN) {
      setResult({
        status: "invalid_short",
        message: `Username must be at least ${MIN_LEN} characters`,
      });
      return;
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      setResult({
        status: "invalid_chars",
        message: "Only letters, numbers, and underscores allowed",
      });
      return;
    }

    // If they're typing their own existing username, treat as available.
    if (currentUsername && trimmed.toLowerCase() === currentUsername.toLowerCase()) {
      setResult({ status: "available", message: "Username is available" });
      return;
    }

    // Wait for debounce before hitting the network
    if (debounced !== trimmed) {
      setResult({ status: "checking", message: "Checking availability…" });
      return;
    }

    setResult({ status: "checking", message: "Checking availability…" });

    (async () => {
      try {
        const { data, error } = await supabase
          .from("public_profiles")
          .select("id")
          .eq("username", debounced)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          // Fail-open: don't block the user on transient network errors
          setResult({ status: "available", message: "Username looks good" });
          return;
        }
        if (data) {
          setResult({ status: "taken", message: "Username already taken" });
        } else {
          setResult({ status: "available", message: "Username is available" });
        }
      } catch {
        if (!cancelled) {
          setResult({ status: "available", message: "Username looks good" });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trimmed, debounced, currentUsername]);

  return result;
}
