"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export function initializePostHog() {
  if (posthog.__loaded) return true;

  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });
    return true;
  }

  if (process.env.NODE_ENV === "development") {
    const missingVariable = posthogKey ? "NEXT_PUBLIC_POSTHOG_HOST" : "NEXT_PUBLIC_POSTHOG_KEY";

    console.error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
    );
  }
  return false;
}

export function PostHogInit() {
  useEffect(() => {
    initializePostHog();
  }, []);

  return null;
}
