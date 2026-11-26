import { describe, expect, it } from 'vitest'
import { scrubEvent, scrubText } from './scrub'

describe('scrubText', () => {
  it('masks emails, Indian mobile numbers and URL query strings', () => {
    const text =
      'Enquiry from priya@example.com on +91 98420 11452 at https://eventsma.in/p/kannan?s=secret'
    const clean = scrubText(text)

    expect(clean).not.toContain('priya@example.com')
    expect(clean).not.toContain('98420')
    expect(clean).not.toContain('s=secret')
    expect(clean).toContain('[email]')
    expect(clean).toContain('[phone]')
    expect(clean).toContain('https://eventsma.in/p/kannan?[redacted]')
  })

  it('leaves ordinary text and quantities alone', () => {
    expect(scrubText('Quote 1204 for 250 guests')).toBe('Quote 1204 for 250 guests')
  })
})

describe('scrubEvent', () => {
  it('redacts identity fields at any depth and scrubs messages', () => {
    const event = {
      message: 'Failed for 9842011452',
      request: { query_string: 'token=abc', url: 'https://x.test/p?token=abc' },
      user: { id: 'user-1', email: 'priya@example.com', phone: '9842011452' },
      exception: { values: [{ value: 'contact priya@example.com' }] },
    }

    const clean = scrubEvent(event) as typeof event

    expect(clean.message).toBe('Failed for [phone]')
    expect(clean.request.query_string).toBe('[redacted]')
    expect(clean.user.email).toBe('[redacted]')
    expect(clean.user.phone).toBe('[redacted]')
    expect(clean.user.id).toBe('user-1')
    expect(clean.exception.values[0]?.value).toBe('contact [email]')
  })

  it('does not mutate the event it was given', () => {
    const event = { message: 'call 9842011452', user: { email: 'a@b.co' } }
    const before = JSON.stringify(event)
    scrubEvent(event)
    expect(JSON.stringify(event)).toBe(before)
  })

  it('caps long arrays so one hostile event cannot grow without bound', () => {
    const event = { breadcrumbs: Array.from({ length: 80 }, (_, i) => ({ message: String(i) })) }
    const clean = scrubEvent(event) as typeof event
    expect(clean.breadcrumbs).toHaveLength(50)
  })
})
