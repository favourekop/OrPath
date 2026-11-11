import { PostHog } from "posthog-node";

const projectToken =
  process.env.POSTHOG_PROJECT_TOKEN ||
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

const host =
  process.env.POSTHOG_HOST ||
  process.env.NEXT_PUBLIC_POSTHOG_HOST ||
  "https://us.i.posthog.com";

const globalForPostHog = globalThis as typeof globalThis & {
  posthogServer?: PostHog;
};

export function getPostHogServer() {
  if (!projectToken) {
    throw new Error("PostHog is not configured. Set POSTHOG_PROJECT_TOKEN in the server environment.");
  }

  if (!globalForPostHog.posthogServer) {
    globalForPostHog.posthogServer = new PostHog(projectToken, {
      host,
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return globalForPostHog.posthogServer;
}
