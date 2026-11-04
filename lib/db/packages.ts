import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import { servicePackages } from './schema'
import type { PackageRow } from '@/lib/domain/ops'
import { demoPackages } from '@/lib/demo/workspace'

export async function getPackages(orgId: string, demo: boolean): Promise<PackageRow[]> {
  if (demo || !isDatabaseConfigured()) return demoPackages

  const rows = await getDb()
    .select({
      id: servicePackages.id,
      name: servicePackages.name,
      verticalKey: servicePackages.verticalKey,
      unitClass: servicePackages.unitClass,
      ratePaise: servicePackages.ratePaise,
      minQuantity: servicePackages.minQuantity,
      taxRateBp: servicePackages.taxRateBp,
      inclusions: servicePackages.inclusions,
      active: servicePackages.active,
    })
    .from(servicePackages)
    .where(eq(servicePackages.orgId, orgId))
    .orderBy(asc(servicePackages.verticalKey), asc(servicePackages.name))

  return rows.map((row) => ({ ...row, unitClass: row.unitClass as PackageRow['unitClass'] }))
}
