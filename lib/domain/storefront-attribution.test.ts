import { describe, expect, it } from 'vitest'
import {
  attributionBucket,
  landingSection,
  parseAttribution,
  referrerHost,
  utmFromQuery,
} from './storefront-attribution'

describe('storefront attribution', () => {
  it('keeps only the referring host', () => {
    expect(referrerHost('https://www.instagram.com/p/Cabc/?utm_source=ig')).toBe('instagram.com')
    expect(referrerHost('http://Google.CO.in/search?q=wedding')).toBe('google.co.in')
    expect(referrerHost('https://example.com:8443/path')).toBe('example.com')
  })

  it('rejects referrers that are not web pages', () => {
    expect(referrerHost('')).toBe('')
    expect(referrerHost('not a url')).toBe('')
    expect(referrerHost('javascript:alert(1)')).toBe('')
    expect(referrerHost('data:text/html,hello')).toBe('')
  })

  it('reads the three UTM fields and ignores the rest', () => {
    const utm = utmFromQuery(
      '?utm_source=Instagram&utm_medium=Social&utm_campaign=Onam%202026&name=Meera',
    )
    expect(utm).toEqual({
      utmSource: 'instagram',
      utmMedium: 'social',
      utmCampaign: 'onam-2026',
    })
  })

  it('sanitises tokens instead of trusting them', () => {
    expect(utmFromQuery('?utm_source=%3Cscript%3Ealert(1)%3C%2Fscript%3E').utmSource).toBe(
      'script-alert-1-script',
    )
    expect(utmFromQuery(`?utm_campaign=${'a'.repeat(200)}`).utmCampaign).toHaveLength(60)
    expect(utmFromQuery('?utm_source=பொங்கல்').utmSource).toBe('பொங்கல்')
    expect(utmFromQuery('?utm_source=')).toEqual({
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
    })
  })

  it('maps the page element ids to the section vocabulary', () => {
    expect(landingSection('services')).toBe('services')
    expect(landingSection('menus')).toBe('packages')
    expect(landingSection('top')).toBe('hero')
    expect(landingSection('closing')).toBe('enquiry')
    expect(landingSection('mobile')).toBe('enquiry')
    expect(landingSection('pricing')).toBe('')
    expect(landingSection('<script>')).toBe('')
  })

  it('parses one payload without throwing on junk', () => {
    expect(
      parseAttribution({
        referrer: 'https://www.facebook.com/groups/kochi',
        query: '?utm_source=fb&utm_medium=paid',
        section: 'services',
      }),
    ).toEqual({
      referrerHost: 'facebook.com',
      utmSource: 'fb',
      utmMedium: 'paid',
      utmCampaign: '',
      landingSection: 'services',
    })

    expect(parseAttribution({ referrer: null, query: null, section: 42 })).toEqual({
      referrerHost: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      landingSection: '',
    })
  })

  it('rolls identical sources into one bucket and keeps sources apart', () => {
    const base = parseAttribution({ query: '?utm_source=fb', section: 'services' })
    const direct = parseAttribution({})
    expect(attributionBucket('/p/kannan', base)).toBe(attributionBucket('/p/kannan', base))
    expect(attributionBucket('/p/kannan', base)).not.toBe(attributionBucket('/p/kannan', direct))
    expect(attributionBucket('/p/kannan', base)).not.toBe(attributionBucket('/p/other', base))
    expect(attributionBucket('/p/kannan', base)).toContain('/p/kannan|')
  })
})
