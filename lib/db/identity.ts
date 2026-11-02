import 'server-only'
import { eq } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import { businesses } from './schema'
import { demoBusiness } from '@/lib/demo/data'

/** One column, one row: the shell does not need a full workspace query. */
export async function getBusinessIdentity(
  orgId: string,
  demo: boolean,
): Promise<{ name: string; published: boolean }> {
  if (demo || !isDatabaseConfigured()) {
    return { name: demoBusiness.name, published: demoBusiness.published }
  }

  const [row] = await getDb()
    .select({ name: businesses.name, published: businesses.published })
    .from(businesses)
    .where(eq(businesses.orgId, orgId))
    .limit(1)

  return { name: row?.name ?? 'Your business', published: row?.published ?? false }
}
