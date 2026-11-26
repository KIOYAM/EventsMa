import * as Sentry from '@sentry/nextjs'
import { scrubEvent } from '@/lib/observability/scrub'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
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
