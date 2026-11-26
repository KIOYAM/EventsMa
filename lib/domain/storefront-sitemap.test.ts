import { describe, expect, it } from 'vitest'
import { shownServiceKeys } from './storefront-sitemap'

const entitled = new Set(['catering', 'decor', 'photography'])

describe('shownServiceKeys', () => {
  it('lists only the services the owner chose to show', () => {
    expect(
      shownServiceKeys(
        [
          { verticalKey: 'catering', visible: true },
          { verticalKey: 'decor', visible: false },
          { verticalKey: 'photography', visible: true },
        ],
        entitled,
      ),
    ).toEqual(['catering', 'photography'])
  })

  it('drops a service the workspace has since revoked, even if the snapshot showed it', () => {
    expect(
      shownServiceKeys(
        [
          { verticalKey: 'catering', visible: true },
          { verticalKey: 'makeup', visible: true },
        ],
        entitled,
      ),
    ).toEqual(['catering'])
  })

  it('treats a v1/v2 snapshot (no choice frozen) as "everything enabled"', () => {
    expect(shownServiceKeys(null, entitled)).toEqual(['catering', 'decor', 'photography'])
  })

  it('shows nothing when the owner published with every service hidden', () => {
    expect(
      shownServiceKeys([{ verticalKey: 'catering', visible: false }], entitled),
    ).toEqual([])
  })
})
