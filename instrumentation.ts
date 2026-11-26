import * as Sentry from '@sentry/nextjs'

/**
 * Next calls `register` once per runtime before serving. Loading the matching
 * config only in its own runtime keeps the Node SDK out of the edge bundle.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

/**
 * Every unhandled server error from a Server Component, Server Action, route
 * handler or middleware reaches the monitor with its route and digest. This is the
 * hook that makes a storefront 500 visible without a client complaint.
 */
export const onRequestError = Sentry.captureRequestError
