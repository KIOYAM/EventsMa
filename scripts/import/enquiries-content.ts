/**
 * The enquiry inbox for Tinu Eventer, newest first.
 */
export interface EnquirySpec {
  client: string
  date: string
  guests: number
  eventType: string
  message: string
  status: 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost'
  source: string
  landingSection?: string
  utmSource?: string
  daysAgo: number
  followUpDays?: number
}

export const ENQUIRIES: EnquirySpec[] = [
  {
    client: 'Anand Krishnan', date: '2026-12-20', guests: 180, eventType: 'Reception',
    message: 'Looking for a reception dinner in Ooty for about 180 guests. Vegetarian menu, one live counter.',
    status: 'qualified', source: 'storefront', landingSection: 'enquiry', utmSource: 'instagram', daysAgo: 2, followUpDays: 1,
  },
  {
    client: 'Nilgiris Estates', date: '2027-01-10', guests: 180, eventType: 'Corporate',
    message: 'Annual day lunch for staff and families. Need a quote with two vegetarian options and one non-vegetarian.',
    status: 'quoted', source: 'referral', daysAgo: 5, followUpDays: 2,
  },
  {
    client: 'Mohan Raj', date: '2027-02-07', guests: 160, eventType: 'Engagement',
    message: 'Engagement at home in Gudalur. Stage decoration and makeup for the bride and two cousins.',
    status: 'quoted', source: 'walk_in', daysAgo: 9, followUpDays: 3,
  },
  {
    client: 'Lakshmi Narayanan', date: '2027-01-31', guests: 90, eventType: 'Housewarming',
    message: 'Small housewarming breakfast in Coonoor. Parents are vegetarian and prefer no onion or garlic.',
    status: 'contacted', source: 'referral', daysAgo: 1, followUpDays: 2,
  },
  {
    client: 'Sathya Prakash', date: '2026-12-12', guests: 300, eventType: 'Wedding',
    message: 'Wedding lunch with mandap and photography. We are comparing two caterers this week.',
    status: 'lost', source: 'whatsapp', daysAgo: 26,
  },
  {
    client: 'Divya Raghavan', date: '2026-12-06', guests: 420, eventType: 'Wedding',
    message: 'Wedding lunch for 420 at St. Antony Hall. Banana leaf service and a mandap the previous night.',
    status: 'won', source: 'referral', daysAgo: 41,
  },
  {
    client: 'Ayesha Fathima', date: '2026-12-27', guests: 320, eventType: 'Nikah',
    message: 'Nikah lunch in Gudalur. Halal non-vegetarian line and makeup for the bride.',
    status: 'won', source: 'instagram', landingSection: 'enquiry', utmSource: 'instagram', daysAgo: 18,
  },
  {
    client: 'Green Hills School', date: '2027-01-24', guests: 240, eventType: 'Corporate',
    message: 'Asking about a Republic Day lunch for staff. Same menu as last year if the rate holds.',
    status: 'new', source: 'storefront', landingSection: 'enquiry', daysAgo: 0,
  },
]
