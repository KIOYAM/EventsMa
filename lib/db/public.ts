import 'server-only'
import { cache } from 'react'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { getSystemDb, isDatabaseConfigured } from './client'
import {
  businessServices,
  businesses,
  organisations,
  portfolioItems,
  serviceItems,
  servicePackages,
  storefrontSections,
} from './schema'
import { signedPortfolioUrls } from '@/lib/storage/portfolio-images'
import { isDemoEnvironment } from '@/lib/environment'
import { demoBusiness, demoItems, demoServices } from '@/lib/demo/data'
import { verticalDescriptor } from '@/lib/domain/verticals'
import { unitClassLabel, type UnitClass } from '@/lib/domain/units'
import { formatINR } from '@/lib/domain/money'
import {
  emptySectionConfig,
  resolveStorefrontFont,
  resolveStorefrontTheme,
  visibleSections,
  type SectionConfig,
  type SectionKey,
  type StorefrontFontKey,
  type StorefrontThemeKey,
} from '@/lib/domain/storefront'
import { signedStorefrontImage } from '@/lib/storage/storefront-image'
import { getPublishedSnapshot } from './storefronts'

/**
 * How much of a catalogue the public page shows. The storefront sells the
 * business, not a price list: eight entries answer "what do they actually cook
 * or build" without promising a rate that a quotation may change.
 */
const CATALOGUE_PREVIEW = 8

/**
 * Packages are shown per service, not as one pool: sorting alphabetically by
 * vertical and taking six rows would hand every slot to the first two services
 * and leave a business that also decorates or photographs looking like it does
 * not. Two per service, eight in total, keeps every adopted service visible.
 */
const PACKAGE_PREVIEW_PER_SERVICE = 2
const PACKAGE_PREVIEW_TOTAL = 8

/**
 * One service the business has adopted, with a taste of its catalogue.
 *
 * `itemNoun` is the descriptor's singular noun so the page can say "1 dish" or
 * "12 dishes" instead of a generic "items".
 */
export interface PublicService {
  verticalKey: string
  label: string
  itemNoun: string
  itemCount: number
  items: { id: string; name: string; unit: string }[]
}

/**
 * A package a visitor may see. Rates are formatted on the server: a package whose
 * rate is zero is shown as "on request" rather than as a free service, because
 * the real number is negotiated in the quotation.
 */
export interface PublicPackage {
  id: string
  name: string
  serviceLabel: string
  rate: string | null
  unit: string
  inclusions: string[]
  minQuantity: number | null
}

/** One visible section, in the owner's order, with its own content. */
export interface PublicSection {
  key: SectionKey
  heading: string | null
  imageUrl: string | null
  config: SectionConfig
}

export interface PublicProfile {
  orgId: string
  slug: string
  name: string
  tagline: string | null
  city: string | null
  phone: string | null
  /** The owner's chosen design. */
  theme: StorefrontThemeKey
  /** The tenant's own brand colour, applied as the accent on the public page. */
  brandPrimary: string
  /** Wordmark style for the business name. */
  brandFont: StorefrontFontKey
  /** "Catering · Decor · Kochi" line under the name. */
  brandSubtitle: string | null
  /** The owner's own introduction, shown under the name when set. */
  about: string | null
  /** Signed logo URL; the initials wordmark stands in when absent. */
  logoUrl: string | null
  services: PublicService[]
  /** Active packages from the tenant's own catalogue, never an example price. */
  packages: PublicPackage[]
  /**
   * The visible sections in the owner's own order. Empty only when every section
   * has been hidden; the page then falls back to the opening block so a storefront
   * is never a blank page.
   */
  sections: PublicSection[]
  /**
   * Published work, newest first by the owner's own order. `photoUrl` is a signed,
   * expiring URL — the bucket is private, so a hidden entry cannot be reached by
   * keeping an old link.
   */
  portfolio: {
    id: string
    title: string
    venueName: string | null
    eventDate: string | null
    description: string | null
    photoUrl: string | null
  }[]
}

function preview(
  descriptor: ReturnType<typeof verticalDescriptor>,
  rows: readonly { id: string; name: string; unit: string }[],
): PublicService {
  return {
    verticalKey: descriptor.key,
    label: descriptor.label,
    itemNoun: descriptor.itemNoun,
    itemCount: rows.length,
    items: rows.slice(0, CATALOGUE_PREVIEW).map((row) => ({ ...row })),
  }
}

export function demoPublicProfile(): PublicProfile {
  return {
    orgId: demoBusiness.orgId,
    slug: 'annapoorna-events',
    name: demoBusiness.name,
    tagline: demoBusiness.tagline,
    city: demoBusiness.city,
    phone: demoBusiness.phone,
    theme: 'editorial',
    brandPrimary: '#1f4d3a',
    brandFont: 'serif',
    brandSubtitle: null,
    about: null,
    logoUrl: null,
    services: demoServices
      .filter((service) => service.enabled)
      .map((service) =>
        preview(
          verticalDescriptor(service.verticalKey),
          demoItems
            .filter((item) => item.verticalKey === service.verticalKey && item.active)
            .map((item) => ({
              id: item.id,
              name: item.name,
              unit: unitClassLabel(item.unitClass as UnitClass),
            })),
        ),
      ),
    packages: [],
    sections: [
      { key: 'hero', heading: null, imageUrl: null, config: emptySectionConfig() },
      { key: 'services', heading: null, imageUrl: null, config: emptySectionConfig() },
      { key: 'gallery', heading: null, imageUrl: null, config: emptySectionConfig() },
      { key: 'enquiry', heading: null, imageUrl: null, config: emptySectionConfig() },
    ],
    portfolio: [],
  }
}

export const getPublicProfile = cache(async (slug: string): Promise<PublicProfile | null> => {
  if (isDemoEnvironment()) return demoPublicProfile()
  if (!isDatabaseConfigured()) return null

  const db = getSystemDb()
  const [row] = await db
    .select({
      orgId: organisations.id,
      slug: organisations.slug,
      name: businesses.name,
      tagline: businesses.tagline,
      city: businesses.city,
      phone: businesses.phone,
      published: businesses.published,
      settings: businesses.settings,
    })
    .from(organisations)
    .innerJoin(businesses, eq(businesses.orgId, organisations.id))
    .where(and(eq(organisations.slug, slug), eq(businesses.published, true)))
    .limit(1)

  if (!row) return null

  // Read first: without a published version there is nothing a visitor may see,
  // and every query below can be skipped rather than used as a fallback.
  const published = await getPublishedSnapshot(row.orgId)
  if (published === null) return null

  // Only the services this business adopted. An item belonging to a vertical the
  // workspace never enabled is not even loaded, so it cannot leak by accident.
  const adopted = await db
    .select({
      verticalKey: businessServices.verticalKey,
      storefrontVisible: businessServices.storefrontVisible,
    })
    .from(businessServices)
    .where(and(eq(businessServices.orgId, row.orgId), eq(businessServices.enabled, true)))
    .orderBy(businessServices.sortOrder)

  // Which of them the published version shows. A v1/v2 snapshot has no service
  // decision, so those pages keep showing everything enabled — the behaviour they
  // were published with. Entitlement always wins: a service the workspace stopped
  // offering is not rendered even if the snapshot says it was visible.
  const verticalKeys = published?.services
    ? published.services
        .filter(
          (choice) =>
            choice.visible && adopted.some((service) => service.verticalKey === choice.verticalKey),
        )
        .map((choice) => choice.verticalKey)
    : adopted.map((service) => service.verticalKey)

  const catalogue =
    verticalKeys.length === 0
      ? []
      : await db
          .select({
            id: serviceItems.id,
            verticalKey: serviceItems.verticalKey,
            name: serviceItems.name,
            unitLabel: serviceItems.unitLabel,
            unitClass: serviceItems.unitClass,
          })
          .from(serviceItems)
          .where(
            and(
              eq(serviceItems.orgId, row.orgId),
              eq(serviceItems.active, true),
              inArray(serviceItems.verticalKey, verticalKeys),
            ),
          )
          .orderBy(serviceItems.sortOrder, serviceItems.name)

  const byVertical = new Map<string, { id: string; name: string; unit: string }[]>()
  for (const item of catalogue) {
    const rows = byVertical.get(item.verticalKey) ?? []
    rows.push({
      id: item.id,
      name: item.name,
      unit: item.unitLabel?.trim() || unitClassLabel(item.unitClass as UnitClass),
    })
    byVertical.set(item.verticalKey, rows)
  }

  const work = await db
    .select({
      id: portfolioItems.id,
      title: portfolioItems.title,
      venueName: portfolioItems.venueName,
      eventDate: portfolioItems.eventDate,
      description: portfolioItems.description,
      coverPath: portfolioItems.coverPath,
    })
    .from(portfolioItems)
    .where(and(eq(portfolioItems.orgId, row.orgId), eq(portfolioItems.published, true)))
    .orderBy(portfolioItems.sortOrder, portfolioItems.eventDate)
    .limit(12)

  // Packages the owner made active, in their own catalogue order. A package with
  // no advertised rate still appears with its inclusions: the quote carries the
  // number, the page carries the shape of what is on offer.
  const allPackages =
    verticalKeys.length === 0
      ? []
      : await db
          .select({
            id: servicePackages.id,
            verticalKey: servicePackages.verticalKey,
            name: servicePackages.name,
            unitClass: servicePackages.unitClass,
            ratePaise: servicePackages.ratePaise,
            minQuantity: servicePackages.minQuantity,
            inclusions: servicePackages.inclusions,
          })
          .from(servicePackages)
          .where(
            and(
              eq(servicePackages.orgId, row.orgId),
              eq(servicePackages.active, true),
              inArray(servicePackages.verticalKey, verticalKeys),
            ),
          )
          // Substantial first: a storefront teaser that opens with the cheapest
          // corporate lunch undersells a business whose flagship is a wedding
          // feast. Rate is the tenant's own number, not a ranking we invented.
          .orderBy(
            servicePackages.verticalKey,
            desc(servicePackages.ratePaise),
            servicePackages.name,
          )
          .limit(40)

  const packageRows: typeof allPackages = []
  const takenPerService = new Map<string, number>()
  for (const pkg of allPackages) {
    const taken = takenPerService.get(pkg.verticalKey) ?? 0
    if (taken >= PACKAGE_PREVIEW_PER_SERVICE) continue
    takenPerService.set(pkg.verticalKey, taken + 1)
    packageRows.push(pkg)
    if (packageRows.length >= PACKAGE_PREVIEW_TOTAL) break
  }

  const [signed, layout] = await Promise.all([
    signedPortfolioUrls(work.map((item) => item.coverPath)),
    db
      .select({
        key: storefrontSections.key,
        position: storefrontSections.position,
        visible: storefrontSections.visible,
        heading: storefrontSections.heading,
        imagePath: storefrontSections.imagePath,
      })
      .from(storefrontSections)
      .where(eq(storefrontSections.orgId, row.orgId))
      .orderBy(storefrontSections.position),
  ])

  // Once a tenant has published, the snapshot is the only source of identity,
  // brand and layout. Draft rows are still read above (they are cheap and shared
  // with the editor) but they must not reach a visitor: that is the whole point of
  // publishing. A tenant that has never published keeps the pre-0012 behaviour so
  // this migration cannot blank a live site.
  const identity = published?.identity ?? {
    name: row.name,
    tagline: row.tagline,
    city: row.city,
    phone: row.phone,
  }
  const brand = published?.brand ?? {
    theme: resolveStorefrontTheme(row.settings?.brand?.theme),
    font: resolveStorefrontFont(row.settings?.brand?.font),
    primary: row.settings?.brand?.primary ?? '#1f4d3a',
    subtitle: row.settings?.brand?.subtitle?.trim() || null,
    about: row.settings?.about?.trim() || null,
    logoPath: row.settings?.brand?.logoPath ?? null,
  }

  const ordered = published ? published.sections.filter((section) => section.visible) : visibleSections(layout)
  const hero = ordered.find((section) => section.key === 'hero')
  const [heroImageUrl, logoUrl] = await Promise.all([
    signedStorefrontImage(hero?.imagePath),
    signedStorefrontImage(brand.logoPath),
  ])

  return {
    orgId: row.orgId,
    slug: row.slug,
    name: identity.name,
    tagline: identity.tagline,
    city: identity.city,
    phone: identity.phone,
    theme: brand.theme,
    brandPrimary: brand.primary,
    brandFont: brand.font,
    brandSubtitle: brand.subtitle,
    about: brand.about,
    logoUrl,
    services: verticalKeys.map((key) =>
      preview(verticalDescriptor(key), byVertical.get(key) ?? []),
    ),
    packages: packageRows.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      serviceLabel: verticalDescriptor(pkg.verticalKey).label,
      rate: pkg.ratePaise > 0 ? formatINR(pkg.ratePaise) : null,
      unit: unitClassLabel(pkg.unitClass as UnitClass),
      inclusions: (pkg.inclusions ?? []).filter((line) => line.trim().length > 0).slice(0, 5),
      minQuantity: pkg.minQuantity > 0 ? pkg.minQuantity : null,
    })),
    sections: ordered.map((section) => ({
      key: section.key,
      heading: section.heading,
      imageUrl: section.key === 'hero' ? heroImageUrl : null,
      config: section.config,
    })),
    portfolio: work.map((item) => ({
      id: item.id,
      title: item.title,
      venueName: item.venueName,
      eventDate: item.eventDate,
      description: item.description,
      photoUrl: item.coverPath ? (signed.get(item.coverPath) ?? null) : null,
    })),
  }
})
