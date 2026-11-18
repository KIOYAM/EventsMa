import { describe, expect, it } from 'vitest'
import { orderSections } from './storefront'
import {
  STOREFRONT_SNAPSHOT_SCHEMA_VERSION,
  buildStorefrontSnapshot,
  parseStorefrontSnapshot,
  snapshotFingerprint,
} from './storefront-snapshot'

const draft = {
  name: '  Annapoorna Events  ',
  tagline: 'Banana-leaf weddings',
  city: 'Kochi',
  phone: null,
  theme: 'gallery',
  font: 'sans',
  primary: '#8A6524',
  subtitle: 'Catering · Decor',
  about: 'Family-run since 1998.',
  logoPath: 'org/logo.png',
  sections: orderSections([
    { key: 'services', position: 1, visible: false, heading: null, imagePath: null },
    { key: 'hero', position: 0, visible: true, heading: 'Our day', imagePath: 'org/hero.png' },
  ]),
  services: [
    { verticalKey: 'catering', visible: true },
    { verticalKey: 'decor', visible: false },
  ],
}

describe('buildStorefrontSnapshot', () => {
  it('freezes the draft, trimmed and in canonical section order', () => {
    const snapshot = buildStorefrontSnapshot(draft, '2026-11-17T00:00:00.000Z')

    expect(snapshot.schemaVersion).toBe(STOREFRONT_SNAPSHOT_SCHEMA_VERSION)
    expect(snapshot.identity.name).toBe('Annapoorna Events')
    expect(snapshot.brand.theme).toBe('gallery')
    expect(snapshot.brand.font).toBe('sans')
    expect(snapshot.publishedAt).toBe('2026-11-17T00:00:00.000Z')
    // `orderSections` materialises the canonical keys the owner never touched, so a
    // published page always has a complete, deterministic section list.
    expect(snapshot.sections.map((section) => section.key)).toEqual([
      'hero',
      'services',
      'about',
      'packages',
      'gallery',
      'team',
      'faq',
      'contact',
      'enquiry',
    ])
    const [first, second] = snapshot.sections
    expect(first).toMatchObject({ heading: 'Our day', imagePath: 'org/hero.png' })
    expect(second?.visible).toBe(false)
  })

  it('falls back instead of storing a colour or theme it cannot render', () => {
    const snapshot = buildStorefrontSnapshot(
      { ...draft, primary: 'javascript:alert(1)', theme: 'nope', font: 'comic' },
      '2026-11-17T00:00:00.000Z',
    )

    expect(snapshot.brand.primary).toBe('#183d33')
    expect(snapshot.brand.theme).toBe('editorial')
    expect(snapshot.brand.font).toBe('serif')
  })

  it('turns empty strings into null so the renderer keeps its own wording', () => {
    const snapshot = buildStorefrontSnapshot(
      { ...draft, tagline: '   ', subtitle: '', about: '' },
      '2026-11-17T00:00:00.000Z',
    )

    expect(snapshot.identity.tagline).toBeNull()
    expect(snapshot.brand.subtitle).toBeNull()
    expect(snapshot.brand.about).toBeNull()
  })
})

describe('parseStorefrontSnapshot', () => {
  it('round-trips a valid snapshot', () => {
    const snapshot = buildStorefrontSnapshot(draft, '2026-11-17T00:00:00.000Z')
    expect(parseStorefrontSnapshot(snapshot)).toEqual(snapshot)
  })

  it('refuses a snapshot from a shape it does not understand', () => {
    expect(parseStorefrontSnapshot(null)).toBeNull()
    expect(parseStorefrontSnapshot({})).toBeNull()
    expect(parseStorefrontSnapshot({ schemaVersion: 99, identity: { name: 'x' }, brand: {}, sections: [] })).toBeNull()
    expect(parseStorefrontSnapshot({ schemaVersion: 1, brand: {}, sections: [] })).toBeNull()
  })

  it('drops sections it does not recognise instead of rendering them', () => {
    const parsed = parseStorefrontSnapshot({
      schemaVersion: 1,
      identity: { name: 'Tenant' },
      brand: { primary: '#123456' },
      sections: [
        { key: 'hero', position: 0, visible: true },
        { key: 'rm -rf', position: 1, visible: true },
      ],
    })

    expect(parsed?.sections.map((section) => section.key)).toEqual(['hero'])
    expect(parsed?.brand.primary).toBe('#123456')
  })

  it('still reads a v1 snapshot, with empty section content', () => {
    const parsed = parseStorefrontSnapshot({
      schemaVersion: 1,
      identity: { name: 'Tenant' },
      brand: {},
      sections: [{ key: 'faq', position: 0, visible: true }],
    })

    expect(parsed?.sections[0]?.key).toBe('faq')
    expect(parsed?.sections[0]?.config).toEqual({ faq: [], team: [] })
  })

  it('freezes which services the owner chose to show', () => {
    const snapshot = buildStorefrontSnapshot(draft, '2026-11-17T00:00:00.000Z')
    expect(snapshot.services).toEqual([
      { verticalKey: 'catering', visible: true },
      { verticalKey: 'decor', visible: false },
    ])
    expect(snapshotFingerprint(snapshot)).toContain('catering')
  })

  it('treats a v1/v2 snapshot as "no service decision"', () => {
    const parsed = parseStorefrontSnapshot({
      schemaVersion: 2,
      identity: { name: 'Tenant' },
      brand: {},
      sections: [{ key: 'hero', position: 0, visible: true }],
    })

    expect(parsed?.services).toBeNull()
  })

  it('caps section content and replaces ids it cannot trust', () => {
    const faq = Array.from({ length: 20 }, (_, index) => ({
      id: `hand-edited-${index}`,
      question: `Question ${index}`,
      answer: `Answer ${index}`,
    }))

    const parsed = parseStorefrontSnapshot({
      schemaVersion: 2,
      identity: { name: 'Tenant' },
      brand: {},
      sections: [
        {
          key: 'faq',
          position: 0,
          visible: true,
          config: { faq: [...faq, { question: '   ', answer: 'orphan' }] },
        },
      ],
    })

    const items = parsed?.sections[0]?.config.faq ?? []
    expect(items).toHaveLength(12)
    expect(items.every((item) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(item.id))).toBe(true)
  })
})

describe('snapshotFingerprint', () => {
  it('ignores when a version was published', () => {
    const one = buildStorefrontSnapshot(draft, '2026-01-01T00:00:00.000Z')
    const two = buildStorefrontSnapshot(draft, '2026-06-01T00:00:00.000Z')
    expect(snapshotFingerprint(one)).toBe(snapshotFingerprint(two))
  })

  it('changes when any publishable field changes', () => {
    const base = buildStorefrontSnapshot(draft, '2026-01-01T00:00:00.000Z')
    const edited = buildStorefrontSnapshot({ ...draft, primary: '#c56e4e' }, '2026-01-01T00:00:00.000Z')
    expect(snapshotFingerprint(base)).not.toBe(snapshotFingerprint(edited))
  })
})
