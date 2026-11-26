/**
 * Everything about the tenant that is not a catalogue row: identity, brand and
 * storefront settings, the crew, clients, suppliers, stock, published work and
 * the storefront layout.
 *
 * Tinu Eventer is a Nilgiris business working out of Gudalur: Tamil lunch menus,
 * mandap work, a two-camera wedding crew and a bridal makeup chair. Prices in
 * paise, phones in a plausible local format, names with the family's consent.
 */
import type {
  ClientSpec,
  CrewMember,
  FaqSpec,
  InventorySpec,
  PortfolioSpec,
  SupplierSpec,
  TeamCard,
  TestimonialSpec,
} from './types'

export const TENANT = {
  name: 'Tinu Eventer',
  tagline: 'Weddings, receptions and family functions across the Nilgiris.',
  city: 'Gudalur',
  district: 'Nilgiris',
  phone: '9361490331',
  email: 'tinutale3@gmail.com',
  subtitle: 'Catering · Decor · Photography · Makeup',
  about:
    'Tinu Eventer cooks, builds and photographs weddings across the Nilgiris from a kitchen in Gudalur. One crew handles the banana-leaf lunch, the mandap, the camera and the makeup chair, so a family plans the day once instead of four times. Menus are written around the family, the guest count and what the venue kitchen allows. Every booking starts with a written quote that lists what is included, what is not, and when the guest count is due. A 40% advance holds the date; the balance is settled on the morning of the function.',
  areas: [
    'Gudalur',
    'Ooty',
    'Coonoor',
    'Masinagudi',
    'Pandalur',
    'Kotagiri',
    'Mettupalayam',
    'Sultan Bathery',
  ],
} as const

export const BRAND = {
  primary: '#183d33',
  font: 'serif',
  theme: 'editorial',
} as const

export const SEO = {
  title: 'Tinu Eventer — weddings across the Nilgiris',
  description:
    'Catering, mandap decoration, photography and bridal makeup for weddings and family functions in Gudalur, Ooty, Coonoor and Masinagudi.',
} as const

export const PAYMENT = {
  instructions:
    'A 40% advance confirms the date. The balance is paid on the morning of the function, before service starts. UPI or bank transfer; a receipt is issued for every payment.',
  upiVpa: 'tinueventer@okhdfcbank',
  bankName: 'HDFC Bank',
  accountName: 'Tinu Eventer',
  accountNumber: '50100234567890',
  ifsc: 'HDFC0004321',
} as const

export const SERVICE_CONFIG: Record<string, Record<string, string>> = {
  catering: {
    serviceStyle: 'Banana leaf, buffet and seated service',
    minOrder: '50 guests',
    dietary: 'Pure vegetarian by default; halal non-veg on request; Jain on request',
    cutoff: '72 hours before service',
  },
  decor: {
    setupWindow: 'Six hours before the muhurtham, or the previous evening',
    teardown: 'Cleared the same night unless the venue asks for the next morning',
    siteRequirements: 'Level ground, one 5A power point, written permission for a bamboo frame',
    flowers: 'Nilgiri seasonal flowers; any substitution is agreed a week ahead',
  },
  photography: {
    deliverables: 'Edited set in 30 days, 60-page album in 45 days, highlight film in 21 days',
    coverageHours: 'Eight hours, plus travel inside the Nilgiris',
    turnaround: '21 days for the film, 30 days for the edited photographs',
    rights: 'The family may print and share freely; we show the work only with their consent',
  },
  makeup: {
    makeupStyles: 'HD, airbrush and traditional Tamil bridal',
    trialDuration: '90',
    travelFee: '300000',
    serviceLocations: 'Home, venue or the Gudalur studio',
  },
}

export const CREW: CrewMember[] = [
  {
    userId: 'a1b2c3d4-0001-4000-8000-000000000001',
    name: 'Ramesh Kumar', email: 'ramesh@tinueventer.in', role: 'manager', phone: '+91 94433 55101',
    skills: ['biryani', 'banana leaf service', 'kitchen planning'], wage: 180000,
  },
  {
    userId: 'a1b2c3d4-0002-4000-8000-000000000002',
    name: 'Selvi Murugan', email: 'selvi@tinueventer.in', role: 'employee', phone: '+91 94433 55102',
    skills: ['sadya', 'payasam', 'desserts'], wage: 140000,
  },
  {
    userId: 'a1b2c3d4-0003-4000-8000-000000000003',
    name: 'Arun Prasad', email: 'arun@tinueventer.in', role: 'employee', phone: '+91 94433 55103',
    skills: ['mandap', 'bamboo frame', 'lighting'], wage: 160000,
  },
  {
    userId: 'a1b2c3d4-0004-4000-8000-000000000004',
    name: 'Nithya Balan', email: 'nithya@tinueventer.in', role: 'employee', phone: '+91 94433 55104',
    skills: ['candid', 'sony a7iv', 'drone'], wage: 220000,
  },
  {
    userId: 'a1b2c3d4-0005-4000-8000-000000000005',
    name: 'Divya Shankar', email: 'divya@tinueventer.in', role: 'employee', phone: '+91 94433 55105',
    skills: ['bridal makeup', 'airbrush', 'saree draping'], wage: 200000,
  },
  {
    userId: 'a1b2c3d4-0006-4000-8000-000000000006',
    name: 'Murugan Thangavel', email: 'murugan@tinueventer.in', role: 'employee', phone: '+91 94433 55106',
    skills: ['service captain', 'buffet setup', 'crew rota'], wage: 120000,
  },
]

export const CLIENTS: ClientSpec[] = [
  { name: 'Divya Raghavan', phone: '+91 98431 55210', email: 'divya.raghavan@gmail.com', source: 'referral', notes: 'Family in Gudalur; the sister booked us in 2024.' },
  { name: 'Karthik Menon', phone: '+91 98431 55211', email: 'karthik.menon@outlook.com', source: 'storefront', notes: 'Reception in Ooty; venue allows setup from the previous evening.' },
  { name: 'Sundaram Pillai', phone: '+91 98431 55212', source: 'whatsapp', notes: 'Housewarming; wants breakfast service at home.' },
  { name: 'Ayesha Fathima', phone: '+91 98431 55213', email: 'ayesha.fathima@gmail.com', source: 'instagram', notes: 'Nikah lunch; halal kitchen line required.' },
  { name: 'Mohan Raj', phone: '+91 98431 55214', source: 'walk_in', notes: 'Engagement in February; deciding between two decor packages.' },
  { name: 'Lakshmi Narayanan', phone: '+91 98431 55215', source: 'referral', notes: 'Coonoor family; prefers a small, quiet function.' },
  { name: 'Ravi Chandran', phone: '+91 98431 55216', email: 'ravi.chandran@gmail.com', source: 'referral', notes: 'Wedding in October; album still in progress.' },
  { name: 'Sindhu Devi', phone: '+91 98431 55217', source: 'storefront', notes: 'Bride; wanted candid coverage and a same-day edit.' },
  { name: 'Sathya Prakash', phone: '+91 98431 55218', source: 'whatsapp', notes: 'Wedding postponed to 2027; deposit carried forward.' },
  { name: 'Vignesh Kumar', phone: '+91 98431 55219', source: 'walk_in', notes: "Groom; handles the family's bookings." },
  { name: 'Revathi Subramani', phone: '+91 98431 55220', email: 'revathi.s@gmail.com', source: 'referral', notes: 'Coonoor housewarming; repeat customer.' },
  { name: 'Anand Krishnan', phone: '+91 98431 55221', source: 'storefront', notes: 'Enquiry for a December reception, still comparing dates.' },
  { name: 'Nilgiris Estates', phone: '+91 98431 55222', email: 'events@nilgirisestates.in', source: 'referral', notes: 'Corporate contact: Ganesh Iyer, estate manager.' },
  { name: 'Green Hills School', phone: '+91 98431 55223', email: 'office@greenhillsschool.in', source: 'referral', notes: 'Annual day every September; contact is the principal, Latha Rajan.' },
  { name: 'Coonoor Club', phone: '+91 98431 55224', email: 'secretary@coonoorclub.in', source: 'referral', notes: 'Deepavali dinner; contact is the secretary, Thomas Mathew.' },
]

export const SUPPLIERS: SupplierSpec[] = [
  { name: 'Nilgiris Fresh Vegetables', category: 'Vegetables', phone: '+91 94422 30101', notes: 'Daily 5am delivery to the Gudalur kitchen.' },
  { name: 'Amma Flower Mart', category: 'Flowers', phone: '+91 94422 30102', notes: 'Mettupalayam market; orders a week ahead for weddings.' },
  { name: 'Sree Ganesh Provisions', category: 'Groceries', phone: '+91 94422 30103', notes: 'Rice, dal, ghee and dry goods on 15-day credit.' },
  { name: 'Highland Tent House', category: 'Decor and equipment', phone: '+91 94422 30104', notes: 'Chairs, drape, lights and bamboo frames.' },
  { name: 'Mettupalayam Seafood', category: 'Meat and fish', phone: '+91 94422 30105', notes: 'Fish and prawns on the morning of service only.' },
]

export const INVENTORY: InventorySpec[] = [
  { name: 'Seeraga samba rice', unit: 'kg', reorderMilli: 50000, costPaise: 9800, supplier: 'Sree Ganesh Provisions', openingMilli: 240000, receiptMilli: 120000 },
  { name: 'Ponni rice', unit: 'kg', reorderMilli: 40000, costPaise: 6200, supplier: 'Sree Ganesh Provisions', openingMilli: 180000 },
  { name: 'Toor dal', unit: 'kg', reorderMilli: 20000, costPaise: 14500, supplier: 'Sree Ganesh Provisions', openingMilli: 85000 },
  { name: 'Coconut oil', unit: 'ltr', reorderMilli: 15000, costPaise: 19000, supplier: 'Sree Ganesh Provisions', openingMilli: 62000 },
  { name: 'Sunflower oil', unit: 'ltr', reorderMilli: 20000, costPaise: 13500, supplier: 'Sree Ganesh Provisions', openingMilli: 90000 },
  { name: 'Ghee', unit: 'kg', reorderMilli: 8000, costPaise: 62000, supplier: 'Sree Ganesh Provisions', openingMilli: 34000 },
  { name: 'Chicken', unit: 'kg', reorderMilli: 25000, costPaise: 21000, supplier: 'Nilgiris Fresh Vegetables', openingMilli: 60000 },
  { name: 'Mutton', unit: 'kg', reorderMilli: 15000, costPaise: 68000, supplier: 'Nilgiris Fresh Vegetables', openingMilli: 32000 },
  { name: 'Seer fish', unit: 'kg', reorderMilli: 10000, costPaise: 52000, supplier: 'Mettupalayam Seafood', openingMilli: 18000 },
  { name: 'Prawns', unit: 'kg', reorderMilli: 8000, costPaise: 56000, supplier: 'Mettupalayam Seafood', openingMilli: 12000 },
  { name: 'Paneer', unit: 'kg', reorderMilli: 10000, costPaise: 38000, supplier: 'Sree Ganesh Provisions', openingMilli: 22000 },
  { name: 'Milk', unit: 'ltr', reorderMilli: 30000, costPaise: 4800, supplier: 'Nilgiris Fresh Vegetables', openingMilli: 120000 },
  { name: 'Sugar', unit: 'kg', reorderMilli: 30000, costPaise: 4600, supplier: 'Sree Ganesh Provisions', openingMilli: 140000 },
  { name: 'Coffee powder', unit: 'kg', reorderMilli: 5000, costPaise: 42000, supplier: 'Sree Ganesh Provisions', openingMilli: 24000 },
  { name: 'Tea dust', unit: 'kg', reorderMilli: 5000, costPaise: 28000, supplier: 'Sree Ganesh Provisions', openingMilli: 18000 },
  { name: 'Onion', unit: 'kg', reorderMilli: 40000, costPaise: 3400, supplier: 'Nilgiris Fresh Vegetables', openingMilli: 160000, receiptMilli: 80000 },
  { name: 'Tomato', unit: 'kg', reorderMilli: 25000, costPaise: 2800, supplier: 'Nilgiris Fresh Vegetables', openingMilli: 95000 },
  { name: 'Banana leaf', unit: 'pcs', reorderMilli: 100000, costPaise: 1200, supplier: 'Nilgiris Fresh Vegetables', openingMilli: 480000 },
]

export const PORTFOLIO: PortfolioSpec[] = [
  { title: 'Divya & Naveen', date: '2026-08-16', venue: 'St. Antony Hall, Gudalur', description: '420 guests for a banana-leaf lunch, with a mandap built the previous night.' },
  { title: 'Meera & Karthik', date: '2026-05-24', venue: 'Gypsy Hall, Ooty', description: 'Reception for 280 with a fairy-light canopy and a chaat counter.' },
  { title: 'Coonoor Club Deepavali', date: '2026-11-08', venue: 'Coonoor Club', description: '220 members for a served dinner; the club kitchen handled only the dessert.' },
  { title: 'Ravi & Sindhu', date: '2026-10-18', venue: 'Bethel Garden, Gudalur', description: 'Full-day coverage and a same-day edit that played before the reception ended.' },
  { title: 'Revathi housewarming', date: '2026-09-27', venue: 'Sims Park Road, Coonoor', description: 'Breakfast for 90 and a pooja corner styled with jasmine and brass lamps.' },
  { title: 'Green Hills School annual day', date: '2026-09-25', venue: 'Green Hills School, Ooty', description: 'Working lunch for 260 staff and parents in 45 minutes.' },
  { title: 'Ayesha & Imran', date: '2026-06-14', venue: 'Masjid Ground, Gudalur', description: 'Halal nikah lunch for 320, cooked on a separate line from the vegetarian menu.' },
  { title: 'Nilgiris Estates foundation day', date: '2026-04-12', venue: 'Pandalur Estate Bungalow', description: 'Garden dinner for 180 with a grill counter and a live filter coffee station.' },
]

export const FAQ: FaqSpec[] = [
  { question: 'How far do you travel?', answer: 'Gudalur, Ooty, Coonoor, Kotagiri, Masinagudi, Pandalur and Sultan Bathery are standard. Beyond that we quote travel and a night stay separately.' },
  { question: 'Is the food pure vegetarian?', answer: 'The sadya and lunch packages are pure vegetarian. Halal non-vegetarian menus are cooked on a separate line, and the guest count decides whether that line is worth running.' },
  { question: 'How many guests can you serve?', answer: '50 to 900 at one sitting. Above 400 we run two service lines, and the venue kitchen has to be available by 6am.' },
  { question: 'When should we book?', answer: 'Six to eight weeks for a wedding, two weeks for a smaller function. April to June and December are the busiest months in the Nilgiris.' },
  { question: 'What does the written quote include?', answer: 'Every dish, the crew, equipment, transport, taxes and the guest count cut-off. Anything we are not providing is listed as excluded.' },
  { question: 'Can we taste the menu first?', answer: 'A tasting for four dishes is arranged at the Gudalur kitchen for ₹800 per person, and the amount is adjusted against the final invoice.' },
  { question: 'How is the advance paid?', answer: 'A 40% advance holds the date, by UPI or bank transfer. The balance is settled on the morning of the function, and every payment gets a receipt.' },
]

export const TESTIMONIALS: TestimonialSpec[] = [
  { name: 'Divya & Naveen', context: 'Wedding · Gudalur', quote: 'The lunch ran on time for 420 guests and the banana leaf service felt unhurried. They handled the mandap the night before while we were still at the mehendi.' },
  { name: 'Karthik Menon', context: 'Reception · Ooty', quote: 'The fairy lights over the lawn made the photographs. Tinu moved one counter twice until the queue stopped, without anyone asking.' },
  { name: 'Revathi Subramani', context: 'Housewarming · Coonoor', quote: 'Breakfast for 90 at home, and the kitchen was cleaner when they left than when they arrived. The filter coffee is the thing my mother still mentions.' },
  { name: 'Thomas Mathew', context: 'Club dinner · Coonoor', quote: 'We have used three caterers in ten years. This is the first one that sent one written quote and then charged exactly that amount.' },
  { name: 'Ayesha Fathima', context: 'Nikah lunch · Gudalur', quote: 'They kept the non-vegetarian line separate and labelled everything, which mattered to both families. The dessert counter for the children was a lovely surprise.' },
]

export const TEAM_CARDS: TeamCard[] = [
  { name: 'Tinu Thomas', role: 'Founder and bookings' },
  { name: 'Ramesh Kumar', role: 'Head cook, biryani and mains' },
  { name: 'Selvi Murugan', role: 'Sadya, payasam and desserts' },
  { name: 'Arun Prasad', role: 'Decor and production' },
  { name: 'Nithya Balan', role: 'Photography lead' },
  { name: 'Divya Shankar', role: 'Bridal makeup and styling' },
]

/** Storefront section order plus the owner's heading overrides. */
export const LAYOUT: { key: string; heading: string | null }[] = [
  { key: 'hero', heading: null },
  { key: 'about', heading: 'Our kitchen and our crew' },
  { key: 'services', heading: 'What we cook, build and shoot' },
  { key: 'packages', heading: 'Wedding packages' },
  { key: 'gallery', heading: 'Recent functions across the Nilgiris' },
  { key: 'testimonials', heading: 'What families say' },
  { key: 'team', heading: 'The people on the day' },
  { key: 'faq', heading: 'Before you book' },
  { key: 'contact', heading: 'Talk to us' },
  { key: 'enquiry', heading: 'Ask for a date' },
]

export const BLOCKED_DATES: { date: string; reason: string }[] = [
  { date: '2026-12-31', reason: 'Year-end private function, crew committed' },
  { date: '2027-01-15', reason: 'Crew leave after Pongal' },
]

/** Last seven days of storefront traffic, so the owner report has something real. */
export const STOREFRONT_VIEWS: {
  daysAgo: number
  path: string
  referrerHost: string
  utmSource: string
  views: number
}[] = [
  { daysAgo: 6, path: '/p/tinu-eventer', referrerHost: 'instagram.com', utmSource: 'instagram', views: 46 },
  { daysAgo: 5, path: '/p/tinu-eventer', referrerHost: 'google.com', utmSource: '', views: 31 },
  { daysAgo: 5, path: '/p/tinu-eventer/packages', referrerHost: 'instagram.com', utmSource: 'instagram', views: 12 },
  { daysAgo: 4, path: '/p/tinu-eventer', referrerHost: 'whatsapp.com', utmSource: 'whatsapp', views: 38 },
  { daysAgo: 3, path: '/p/tinu-eventer', referrerHost: 'google.com', utmSource: '', views: 24 },
  { daysAgo: 2, path: '/p/tinu-eventer', referrerHost: 'instagram.com', utmSource: 'instagram', views: 57 },
  { daysAgo: 2, path: '/p/tinu-eventer/services/makeup', referrerHost: 'instagram.com', utmSource: 'instagram', views: 9 },
  { daysAgo: 1, path: '/p/tinu-eventer', referrerHost: 'google.com', utmSource: '', views: 33 },
  { daysAgo: 1, path: '/p/tinu-eventer/packages', referrerHost: 'whatsapp.com', utmSource: 'whatsapp', views: 14 },
  { daysAgo: 0, path: '/p/tinu-eventer', referrerHost: '', utmSource: '', views: 21 },
]
