import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://3fb8b4cb0e91f1f2ca2651b2d98bb790@o4511342777532416.ingest.us.sentry.io/4511405669089280",
  tracesSampleRate: 0.5,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  ignoreErrors: [
    'Failed to fetch',
    'NetworkError',
    'Load failed',
    "Failed to execute 'sendBeacon' on 'Navigator'",
    "Failed to execute 'sendBeacon'",
  ],
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
})
