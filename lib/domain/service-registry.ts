/**
 * Service registry.
 *
 * Central logic for what each enabled service can do, where it lives in the
 * navigation, and how the owner configures it. This is the single place that
 * maps a vertical key to its capabilities, routes and configuration schema.
 *
 * The registry does not own database tables. It reads `business_services`
 * (org-scoped enabled + config jsonb) and combines it with the static
 * descriptors in `verticals.ts`.
 */

import type { ServiceCapability, ServiceRoute, VerticalDescriptor } from './verticals'
import { GENERIC_VERTICAL, VERTICAL_CATALOG, verticalDescriptor } from './verticals'

/** What the owner has enabled for their organisation, with resolved config. */
export interface EnabledService {
  readonly key: string
  readonly label: string
  readonly enabled: boolean
  readonly sortOrder: number
  readonly config: Record<string, string>
  readonly descriptor: VerticalDescriptor
}

/** Navigation entry resolved from an enabled service's descriptor routes. */
export interface ServiceNavEntry {
  readonly key: string
  readonly path: string
  readonly label: string
  readonly icon: string
  readonly group: 'sell' | 'catalogue' | 'business'
}

/** Resolve every navigation entry a business should see, in display order. */
export function buildServiceNavigation(enabled: readonly EnabledService[]): readonly ServiceNavEntry[] {
  const entries: ServiceNavEntry[] = []

  // Fixed non-service entries (always present when at least one vertical is configured)
  const fixed: ServiceNavEntry[] = [
    { key: 'clients', path: '/clients', label: 'Clients', icon: 'Inbox', group: 'sell' },
    { key: 'events', path: '/events', label: 'Events', icon: 'CalendarDays', group: 'sell' },
    { key: 'quotes', path: '/quotes', label: 'Quotes', icon: 'FileText', group: 'sell' },
    { key: 'invoices', path: '/invoices', label: 'Invoices', icon: 'Receipt', group: 'sell' },
  ]
  entries.push(...fixed)

  // Service-specific routes, ordered by service sortOrder then route order
  const sorted = [...enabled].sort((a, b) => a.sortOrder - b.sortOrder)
  for (const service of sorted) {
    if (!service.enabled) continue
    for (const route of service.descriptor.routes) {
      entries.push({
        key: `${service.key}:${route.path}`,
        path: route.path,
        label: route.label,
        icon: route.icon,
        group: route.group,
      })
    }
  }

  // Fixed business entries
  entries.push(
    { key: 'finance', path: '/finance', label: 'Money', icon: 'Wallet', group: 'business' },
    { key: 'reports', path: '/reports', label: 'Reports', icon: 'TrendingUp', group: 'business' },
    { key: 'team', path: '/team', label: 'Team', icon: 'Users', group: 'business' },
    { key: 'services', path: '/services', label: 'Services', icon: 'Layers', group: 'business' },
    { key: 'portfolio', path: '/portfolio', label: 'Portfolio', icon: 'Images', group: 'business' },
    { key: 'storefront', path: '/storefront', label: 'Storefront', icon: 'Store', group: 'business' },
    { key: 'settings', path: '/settings', label: 'Settings', icon: 'Settings', group: 'business' },
  )

  return entries
}

/** Check whether an enabled service declares a capability. */
export function serviceHasCapability(service: EnabledService, capability: ServiceCapability): boolean {
  return service.descriptor.capabilities.includes(capability)
}

/** Get the configuration schema for a service (its config fields with current values). */
export function serviceConfigSchema(service: EnabledService): readonly {
  readonly key: string
  readonly label: string
  readonly hint: string | undefined
  readonly kind: string
  readonly options: readonly string[] | undefined
  readonly value: string | undefined
}[] {
  return service.descriptor.configFields.map((field) => ({
    key: field.key,
    label: field.label,
    hint: field.hint,
    kind: field.kind,
    options: field.options,
    value: service.config[field.key],
  }))
}

/** All known vertical descriptors, including the generic fallback. */
export function allDescriptors(): readonly VerticalDescriptor[] {
  return [...VERTICAL_CATALOG, GENERIC_VERTICAL]
}

/** Look up a descriptor by key. */
export function descriptorFor(key: string): VerticalDescriptor {
  return verticalDescriptor(key)
}
