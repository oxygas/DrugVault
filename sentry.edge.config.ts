import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://3fb8b4cb0e91f1f2ca2651b2d98bb790@o4511342777532416.ingest.us.sentry.io/4511405669089280",
  tracesSampleRate: 0.5,
})
