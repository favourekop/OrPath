import { OpenTelemetry } from "@ai-sdk/otel";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { PostHogSpanProcessor } from "@posthog/ai/otel";
import { registerTelemetry } from "ai";

let initialized = false;

/**
 * Next.js server instrumentation for PostHog AI Observability.
 *
 * This registers the Vercel AI SDK OpenTelemetry bridge. AI generations will
 * appear in PostHog when server-side AI calls use the Vercel AI SDK telemetry
 * integration. No prompts or model outputs are recorded by this bootstrap.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || initialized) return;

  const projectToken = process.env.POSTHOG_PROJECT_TOKEN;
  if (!projectToken) {
    console.info("[OrPath] PostHog AI Observability is not configured.");
    return;
  }

  const host = process.env.POSTHOG_HOST || "https://us.i.posthog.com";
  const spanProcessor = new PostHogSpanProcessor({ projectToken, host });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      "service.name": "orpath",
      "deployment.environment": process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    }),
    spanProcessors: [spanProcessor],
  });

  sdk.start();

  registerTelemetry(
    new OpenTelemetry({
      enrichSpan: ({ runtimeContext }) => ({
        environment:
          typeof runtimeContext?.properties === "object" &&
          runtimeContext.properties !== null &&
          "environment" in runtimeContext.properties &&
          typeof runtimeContext.properties.environment === "string"
            ? runtimeContext.properties.environment
            : undefined,
        "posthog.distinct_id":
          typeof runtimeContext?.distinctId === "string"
            ? runtimeContext.distinctId
            : undefined,
        "$ai_session_id":
          typeof runtimeContext?.sessionId === "string"
            ? runtimeContext.sessionId
            : undefined,
        "$groups":
          typeof runtimeContext?.groups === "object" &&
          runtimeContext.groups !== null &&
          !Array.isArray(runtimeContext.groups)
            ? JSON.stringify(runtimeContext.groups)
            : undefined,
      }),
    })
  );

  initialized = true;
}
