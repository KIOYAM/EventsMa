import * as Sentry from '@sentry/nextjs'
import { scrubEvent } from '@/lib/observability/scrub'

const dsn = process.env.SENTRY_DSN?.trim()

/**
 * Inert until a DSN exists, so a preview deployment without credentials does not
 * fail to boot or silently send events nowhere. `sendDefaultPii` stays false and
 * every event passes the scrubber regardless.
 */
Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  // Sentry 11 replaced `sendDefaultPii` with per-category collection. Nothing
  // identity-bearing leaves the server; the scrubber is the second line.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
  tracesSampleRate: 0,
  beforeSend: (event) => scrubEvent(event),
})
