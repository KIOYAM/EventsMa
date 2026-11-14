import 'server-only'
import { sessionProblems, type MenuDish, type MenuSession } from '@/lib/domain/menu-selection'
import { priceSelection, type PricedSelection } from '@/lib/domain/share-pricing'
import { shareSubmissionLines, shareSubmissionSessions } from './schema-share'
import type { getDb } from './client'
import type { SharePortal } from './share-portal'

type Tx = Parameters<Parameters<ReturnType<typeof getDb>['transaction']>[0]>[0]

export interface MenuSelectionInput {
  sessionId: string
  dishIds: string[]
}

export interface PreparedMenuLine {
  dish: MenuDish
  categoryId: string
  categoryName: string
  line: PricedSelection
}

export interface PreparedMenuSession {
  session: MenuSession
  dishCount: number
  paise: number
  lines: PreparedMenuLine[]
}

export interface PreparedMenu {
  sessions: PreparedMenuSession[]
  dishCount: number
  paise: number
  /** Stable key of session+dish pairs, for the repeat-submission guard. */
  key: string
}

export type MenuPreparation =
  | { ok: true; menu: PreparedMenu }
  | { ok: false; error: string; status: number }

const EMPTY: PreparedMenu = { sessions: [], dishCount: 0, paise: 0, key: '' }

/**
 * Validate the customer's dish picks against the plan loaded for this token.
 *
 * A browser can only ever send ids; every one of them is re-checked here against
 * the session it claims to belong to, and each category's count is re-validated
 * with the owner's own rule function. Nothing about price or legality is taken
 * from the request.
 */
export function prepareMenuSelection(
  portal: SharePortal,
  input: readonly MenuSelectionInput[],
): MenuPreparation {
  if (portal.menu.length === 0) {
    return input.length > 0
      ? { ok: false, error: 'This event has no catering menu to choose from.', status: 400 }
      : { ok: true, menu: EMPTY }
  }

  const byId = new Map(portal.menu.map((session) => [session.id, session]))
  const prepared: PreparedMenuSession[] = []
  const keyParts: string[] = []

  for (const entry of input) {
    const session = byId.get(entry.sessionId)
    if (!session) {
      return { ok: false, error: 'One of the meal sessions is no longer available.', status: 400 }
    }

    const wanted = new Set(entry.dishIds.filter(Boolean))
    if (wanted.size === 0) continue

    const picked: Record<string, readonly string[]> = {}
    const chosenDishes = new Map<string, { dish: MenuDish; categoryId: string; categoryName: string }>()

    for (const category of session.categories) {
      const ids = category.dishes.filter((dish) => wanted.has(dish.id)).map((dish) => dish.id)
      if (ids.length === 0) continue
      picked[category.id] = ids
      for (const dish of category.dishes) {
        if (wanted.has(dish.id)) {
          chosenDishes.set(dish.id, { dish, categoryId: category.id, categoryName: category.name })
        }
      }
    }

    const unknown = [...wanted].filter((id) => !chosenDishes.has(id))
    if (unknown.length > 0) {
      return {
        ok: false,
        error: `A dish you chose is no longer on the ${session.name} menu. Please refresh and choose again.`,
        status: 400,
      }
    }

    const problems = sessionProblems(session, picked)
    if (problems.length > 0) {
      return {
        ok: false,
        error: `${session.name} · ${problems[0]?.name}: ${problems[0]?.message ?? 'Check the selection.'}`,
        status: 400,
      }
    }

    const lines: PreparedMenuLine[] = []
    for (const category of session.categories) {
      for (const dish of category.dishes) {
        if (!wanted.has(dish.id)) continue
        const meta = chosenDishes.get(dish.id)
        if (!meta) continue
        lines.push({
          dish,
          categoryId: category.id,
          categoryName: category.name,
          line: priceSelection(
            {
              itemId: dish.id,
              serviceKey: 'catering',
              label: dish.name,
              unitClass: dish.unitClass,
              quantity: 1,
              unitPricePaise: dish.pricePaise,
            },
            session.guests,
          ),
        })
      }
    }

    if (lines.length === 0) continue

    prepared.push({
      session,
      dishCount: lines.length,
      paise: lines.reduce((sum, entryLine) => sum + entryLine.line.amountPaise, 0),
      lines,
    })
    keyParts.push(`${session.id}:${[...wanted].sort().join('+')}`)
  }

  return {
    ok: true,
    menu: {
      sessions: prepared,
      dishCount: prepared.reduce((sum, entry) => sum + entry.dishCount, 0),
      paise: prepared.reduce((sum, entry) => sum + entry.paise, 0),
      key: keyParts.sort().join('|'),
    },
  }
}

/** Write the frozen session and dish rows inside the caller's transaction. */
export async function writeMenuSelection(
  tx: Tx,
  args: {
    orgId: string
    submissionId: string
    serviceRowId: string
    menu: PreparedMenu
  },
): Promise<void> {
  let sortOrder = 0

  for (const [sessionIndex, entry] of args.menu.sessions.entries()) {
    const [sessionRow] = await tx
      .insert(shareSubmissionSessions)
      .values({
        orgId: args.orgId,
        submissionId: args.submissionId,
        eventSessionId: entry.session.id,
        name: entry.session.name,
        startTime: entry.session.startTime,
        endTime: entry.session.endTime,
        guests: entry.session.guests,
        dishCount: entry.dishCount,
        indicativePaise: entry.paise,
        sortOrder: sessionIndex,
      })
      .returning({ id: shareSubmissionSessions.id })

    if (!sessionRow) throw new Error('submission_session_insert_failed')

    for (const line of entry.lines) {
      await tx.insert(shareSubmissionLines).values({
        orgId: args.orgId,
        submissionServiceId: args.serviceRowId,
        submissionSessionId: sessionRow.id,
        itemId: line.dish.id,
        categoryId: line.categoryId,
        categoryName: line.categoryName,
        label: line.dish.name,
        unitClass: line.dish.unitClass,
        quantity: 1,
        basis: line.line.basis,
        unitPricePaise: line.line.unitPricePaise,
        indicativePaise: line.line.amountPaise,
        sortOrder: sortOrder++,
      })
    }
  }
}
