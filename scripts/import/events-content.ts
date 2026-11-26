/** The full event history, in the order the importer writes it. */
import { EVENTS_A } from './events-content-a'
import { EVENTS_B } from './events-content-b'
import type { EventSpec } from './types'

export const EVENTS: EventSpec[] = [...EVENTS_A, ...EVENTS_B]
