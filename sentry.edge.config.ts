import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://f58962b7328df947e0b56e9fbba3706d@o4504839863877632.ingest.us.sentry.io/4504839863877632",
  tracesSampleRate: 0.5,
})
