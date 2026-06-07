// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import drugData from "./src/data/all-data.json";

const DRUG_COUNT = drugData.s?.length || 0;
const CATEGORIES = [...new Set(drugData.s?.map((d: any) => d.c) || [])];

Sentry.init({
  dsn: "https://3fb8b4cb0e91f1f2ca2651b2d98bb790@o4511342777532416.ingest.us.sentry.io/4511405669089280",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Attach drug database info to all events
  beforeSend(event) {
    event.tags = event.tags || {};
    event.tags.drugDatabase = "DrugVault";
    event.tags.drugCount = DRUG_COUNT;
    event.tags.categories = CATEGORIES.length;
    
    event.extra = event.extra || {};
    event.extra.drugDatabase = {
      totalSubstances: DRUG_COUNT,
      categories: CATEGORIES,
      version: "557-substances",
    };
    return event;
  },
});
