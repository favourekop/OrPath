"use client";

import { useEffect } from "react";
import { PostHogProvider as Provider } from "posthog-js/react";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    if (!projectToken || posthog.__loaded) return;

    posthog.init(projectToken, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      defaults: "2026-08-30",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      person_profiles: "identified_only",
      respect_dnt: true,
      disable_session_recording: true,
    });
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;

    const supabase = createClient();
    let identifiedUserId: string | null = null;

    const syncIdentity = (user: { id: string } | null) => {
      if (user?.id) {
        if (identifiedUserId !== user.id) {
          posthog.identify(user.id);
          identifiedUserId = user.id;
        }
      } else if (identifiedUserId) {
        posthog.reset();
        identifiedUserId = null;
      }
    };

    supabase.auth.getUser().then(({ data }) => syncIdentity(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncIdentity(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <Provider client={posthog}>{children}</Provider>;
}
