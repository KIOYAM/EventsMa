/**
 * Sample storefront content for one demonstration tenant.
 *
 * The public page renders only what a tenant actually stores, so an empty
 * catalogue produces an empty page. This file is the content side of
 * `scripts/seed-storefront-demo.ts`: a full, plausible catalogue for Kannan
 * Events — a Kochi business that caters, decorates, photographs and does bridal
 * makeup — so the storefront renderer can be reviewed against real rows instead
 * of a hand-built mock.
 *
 * Every row lands in the normal tenant tables (`service_items`,
 * `service_packages`, `portfolio_items`, `storefront_sections`) and is published
 * as a normal immutable storefront version. Nothing here is rendered from this
 * file at runtime: edit or delete any of it in the studio and the page follows.
 *
 * Money is integer paise, as everywhere else.
 */
import type { UnitClass } from '../lib/domain/units'

export interface DemoItem {
  name: string
  category: string
  unit: UnitClass
  /** Tenant wording, never parsed: "per guest", "per table". */
  label: string
  /** Integer paise. */
  price: number
  diet?: 'veg' | 'non_veg' | 'egg'
  description?: string
}

export interface DemoPackage {
  verticalKey: string
  name: string
  unit: UnitClass
  rate: number
  minQuantity: number
  inclusions: string[]
}

export const DEMO_BUSINESS = {
  tagline: 'Weddings, receptions and family functions, planned and served by one team.',
  subtitle: 'Catering · Decor · Photography · Makeup',
  city: 'Kochi',
  district: 'Ernakulam',
  about:
    'Kannan Events cooks and styles weddings, receptions and family functions across Ernakulam. One team runs the kitchen, the stage, the camera and the makeup chair, so the day is planned once instead of four times. Menus are written around your family traditions, the guest count and what the venue kitchen allows. Every booking starts with a written quote that lists what is included, what is not, and when the guest count is due.',
} as const

/** The services this business offers, in the order they should read. */
export const DEMO_SERVICES = [
  { verticalKey: 'catering', sortOrder: 0 },
  { verticalKey: 'decor', sortOrder: 1 },
  { verticalKey: 'photography', sortOrder: 2 },
  { verticalKey: 'makeup', sortOrder: 3 },
] as const

export const DEMO_ITEMS: Record<string, DemoItem[]> = {
  catering: [
    { name: 'Tender coconut water', category: 'Welcome drinks', unit: 'PER_GUEST', label: 'per guest', price: 4500, diet: 'veg' },
    { name: 'Spiced buttermilk', category: 'Welcome drinks', unit: 'PER_GUEST', label: 'per guest', price: 3500, diet: 'veg' },
    { name: 'Nannari sherbet', category: 'Welcome drinks', unit: 'PER_GUEST', label: 'per guest', price: 4000, diet: 'veg' },
    { name: 'Rose milk', category: 'Welcome drinks', unit: 'PER_GUEST', label: 'per guest', price: 5500, diet: 'veg' },
    { name: 'Appam with vegetable stew', category: 'Breakfast', unit: 'PER_GUEST', label: 'per guest', price: 14000, diet: 'veg' },
    { name: 'Idiyappam and egg curry', category: 'Breakfast', unit: 'PER_GUEST', label: 'per guest', price: 13000, diet: 'egg' },
    { name: 'Ghee roast dosa', category: 'Breakfast', unit: 'PER_GUEST', label: 'per guest', price: 12000, diet: 'veg' },
    { name: 'Puttu and kadala curry', category: 'Breakfast', unit: 'PER_GUEST', label: 'per guest', price: 11000, diet: 'veg' },
    { name: 'Vada, sambar and chutney', category: 'Breakfast', unit: 'PER_GUEST', label: 'per guest', price: 9000, diet: 'veg' },
    { name: 'Banana blossom cutlet', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 9500, diet: 'veg' },
    { name: 'Paneer tikka', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 15000, diet: 'veg' },
    { name: 'Unnakkaya', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 8500, diet: 'veg' },
    { name: 'Kerala chicken ularthiyathu', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 18000, diet: 'non_veg' },
    { name: 'Prawn tempura with curry leaf', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 26000, diet: 'non_veg' },
    { name: 'Karimeen pollichathu', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 28000, diet: 'non_veg' },
    { name: 'Vegetable ishtu', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 12000, diet: 'veg' },
    { name: 'Avial', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 10000, diet: 'veg' },
    { name: 'Thoran of the day', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 8000, diet: 'veg' },
    { name: 'Olan', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 9500, diet: 'veg' },
    { name: 'Kerala fish moilee', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 24000, diet: 'non_veg' },
    { name: 'Nadan chicken curry', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 20000, diet: 'non_veg' },
    { name: 'Beef ularthiyathu', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 22000, diet: 'non_veg' },
    { name: 'Meen peera', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 19000, diet: 'non_veg' },
    { name: 'Kaima rice biryani', category: 'Rice and breads', unit: 'PER_GUEST', label: 'per guest', price: 26000, diet: 'non_veg' },
    { name: 'Ghee rice', category: 'Rice and breads', unit: 'PER_GUEST', label: 'per guest', price: 14000, diet: 'veg' },
    { name: 'Kerala matta rice', category: 'Rice and breads', unit: 'PER_GUEST', label: 'per guest', price: 4000, diet: 'veg' },
    { name: 'Malabar parotta', category: 'Rice and breads', unit: 'PER_GUEST', label: 'per guest', price: 6000, diet: 'veg' },
    { name: 'Appam', category: 'Rice and breads', unit: 'PER_GUEST', label: 'per guest', price: 5000, diet: 'veg' },
    { name: 'Palada pradhaman', category: 'Desserts', unit: 'PER_GUEST', label: 'per guest', price: 9000, diet: 'veg' },
    { name: 'Ada pradhaman', category: 'Desserts', unit: 'PER_GUEST', label: 'per guest', price: 9500, diet: 'veg' },
    { name: 'Payasam of the day', category: 'Desserts', unit: 'PER_GUEST', label: 'per guest', price: 8000, diet: 'veg' },
    { name: 'Elaneer pudding', category: 'Desserts', unit: 'PER_GUEST', label: 'per guest', price: 11000, diet: 'veg' },
    { name: 'Unniyappam', category: 'Desserts', unit: 'PER_GUEST', label: 'per guest', price: 6000, diet: 'veg' },
    { name: 'Live dosa counter', category: 'Live counters', unit: 'PER_GUEST', label: 'per guest', price: 12000, diet: 'veg', description: 'Two tawa stations and a dosa chef.' },
    { name: 'Appam and stew counter', category: 'Live counters', unit: 'PER_GUEST', label: 'per guest', price: 13000, diet: 'veg' },
    { name: 'Chaat counter', category: 'Live counters', unit: 'PER_GUEST', label: 'per guest', price: 14000, diet: 'veg' },
    { name: 'Grill and tandoor counter', category: 'Live counters', unit: 'PER_GUEST', label: 'per guest', price: 24000, diet: 'non_veg' },
    { name: 'Filter coffee counter', category: 'Live counters', unit: 'PER_GUEST', label: 'per guest', price: 6000, diet: 'veg' },
    { name: 'Kerala filter coffee', category: 'Beverages', unit: 'PER_GUEST', label: 'per guest', price: 4000, diet: 'veg' },
    { name: 'Masala chai', category: 'Beverages', unit: 'PER_GUEST', label: 'per guest', price: 3500, diet: 'veg' },
    { name: 'Fresh juice of the day', category: 'Beverages', unit: 'PER_GUEST', label: 'per guest', price: 6000, diet: 'veg' },
    { name: 'Serving team', category: 'Service', unit: 'PER_GUEST', label: 'per guest', price: 4500, description: 'One steward for every 25 guests.' },
  ],
  decor: [
    { name: 'Mandap stage with fresh flowers', category: 'Stage', unit: 'FLAT', label: 'per event', price: 18500000 },
    { name: 'Reception backdrop with drapery', category: 'Stage', unit: 'FLAT', label: 'per event', price: 12500000 },
    { name: 'Entrance arch in jasmine and marigold', category: 'Entrance', unit: 'FLAT', label: 'per event', price: 6500000 },
    { name: 'Aisle floral walkway', category: 'Entrance', unit: 'FLAT', label: 'per event', price: 9500000 },
    { name: 'Table centrepieces', category: 'Tables', unit: 'PER_UNIT', label: 'per table', price: 120000 },
    { name: 'Chair covers and sashes', category: 'Tables', unit: 'PER_UNIT', label: 'per chair', price: 15000 },
    { name: 'Fairy light canopy', category: 'Lighting', unit: 'FLAT', label: 'per event', price: 4500000 },
    { name: 'Ceiling drape and chandeliers', category: 'Lighting', unit: 'FLAT', label: 'per event', price: 15000000 },
    { name: 'Brass lamp and uruli arrangement', category: 'Traditional', unit: 'FLAT', label: 'per event', price: 7500000 },
    { name: 'Pookalam floor design', category: 'Traditional', unit: 'FLAT', label: 'per design', price: 5500000 },
    { name: 'Photo booth with florals', category: 'Features', unit: 'FLAT', label: 'per event', price: 8500000 },
    { name: 'Childrens corner with props', category: 'Features', unit: 'FLAT', label: 'per event', price: 3500000 },
    { name: 'Car decoration', category: 'Features', unit: 'FLAT', label: 'per car', price: 4500000 },
    { name: 'On-site styling team', category: 'Service', unit: 'PER_DAY', label: 'per day', price: 1800000 },
  ],
  photography: [
    { name: 'Full-day wedding coverage', category: 'Wedding', unit: 'FLAT', label: 'per event', price: 3500000 },
    { name: 'Candid photography', category: 'Wedding', unit: 'PER_DAY', label: 'per day', price: 2500000 },
    { name: 'Second photographer', category: 'Wedding', unit: 'PER_DAY', label: 'per day', price: 800000 },
    { name: 'Cinematic highlight film', category: 'Film', unit: 'FLAT', label: 'per event', price: 2200000 },
    { name: 'Same-day edit', category: 'Film', unit: 'FLAT', label: 'per event', price: 2500000 },
    { name: 'Drone coverage', category: 'Film', unit: 'FLAT', label: 'per event', price: 1200000 },
    { name: 'Pre-wedding shoot', category: 'Shoots', unit: 'FLAT', label: 'per shoot', price: 1800000 },
    { name: 'Reception coverage', category: 'Wedding', unit: 'FLAT', label: 'per event', price: 1500000 },
    { name: 'Traditional album, 60 pages', category: 'Deliverables', unit: 'PER_UNIT', label: 'per album', price: 1600000 },
    { name: 'Extra hour of coverage', category: 'Wedding', unit: 'PER_HOUR', label: 'per hour', price: 350000 },
    { name: 'Live streaming for family abroad', category: 'Deliverables', unit: 'FLAT', label: 'per event', price: 2000000 },
    { name: 'Photo booth prints', category: 'Deliverables', unit: 'PER_UNIT', label: 'per 50 prints', price: 450000 },
  ],
  makeup: [
    { name: 'Bridal HD makeup', category: 'Bridal', unit: 'FLAT', label: 'per person', price: 2500000 },
    { name: 'Airbrush bridal makeup', category: 'Bridal', unit: 'FLAT', label: 'per person', price: 3200000 },
    { name: 'Traditional Kerala bridal set', category: 'Bridal', unit: 'FLAT', label: 'per person', price: 2000000 },
    { name: 'Engagement look', category: 'Occasion', unit: 'FLAT', label: 'per person', price: 1500000 },
    { name: 'Reception makeup', category: 'Occasion', unit: 'FLAT', label: 'per person', price: 1800000 },
    { name: 'Groom grooming', category: 'Occasion', unit: 'FLAT', label: 'per person', price: 600000 },
    { name: 'Family member makeup', category: 'Occasion', unit: 'PER_GUEST', label: 'per person', price: 450000 },
    { name: 'Hair styling and draping', category: 'Styling', unit: 'FLAT', label: 'per person', price: 800000 },
    { name: 'Pre-bridal trial', category: 'Styling', unit: 'FLAT', label: 'per session', price: 700000 },
    { name: 'Bridal mehendi', category: 'Mehendi', unit: 'FLAT', label: 'per person', price: 900000 },
    { name: 'Mehendi for guests', category: 'Mehendi', unit: 'PER_GUEST', label: 'per person', price: 25000 },
    { name: 'Artist travel', category: 'Service', unit: 'FLAT', label: 'per event', price: 350000 },
  ],
}

export const DEMO_PACKAGES: DemoPackage[] = [
  {
    verticalKey: 'catering',
    name: 'Sadya for the family',
    unit: 'PER_GUEST',
    rate: 120000,
    minQuantity: 75,
    inclusions: ['Full vegetarian sadya', 'Banana leaf service', 'Payasam and filter coffee'],
  },
  {
    verticalKey: 'catering',
    name: 'Malabar wedding feast',
    unit: 'PER_GUEST',
    rate: 145000,
    minQuantity: 100,
    inclusions: ['Welcome drink', 'Two non-vegetarian mains', 'Biryani, breads and dessert'],
  },
  {
    verticalKey: 'catering',
    name: 'Reception dinner buffet',
    unit: 'PER_GUEST',
    rate: 165000,
    minQuantity: 100,
    inclusions: ['Six starters', 'Live counter of your choice', 'Dessert station'],
  },
  {
    verticalKey: 'catering',
    name: 'Corporate working lunch',
    unit: 'PER_GUEST',
    rate: 65000,
    minQuantity: 40,
    inclusions: ['Packed or buffet service', 'Scheduled delivery', 'Vegetarian and mixed options'],
  },
  {
    verticalKey: 'decor',
    name: 'Classic mandap',
    unit: 'FLAT',
    rate: 14500000,
    minQuantity: 0,
    inclusions: ['Fresh flower stage', 'Entrance arch', 'Aisle lights and seating'],
  },
  {
    verticalKey: 'decor',
    name: 'Garden reception',
    unit: 'FLAT',
    rate: 21000000,
    minQuantity: 0,
    inclusions: ['Backdrop and drapery', 'Fairy light canopy', 'Centrepieces for 25 tables'],
  },
  {
    verticalKey: 'decor',
    name: 'Intimate home function',
    unit: 'FLAT',
    rate: 6500000,
    minQuantity: 0,
    inclusions: ['Pooja corner', 'Pookalam', 'Lamps and seating styling'],
  },
  {
    verticalKey: 'photography',
    name: 'Wedding day essentials',
    unit: 'FLAT',
    rate: 6500000,
    minQuantity: 0,
    inclusions: ['Lead and second photographer', 'Two films', 'Edited set within 30 days'],
  },
  {
    verticalKey: 'photography',
    name: 'Full weekend story',
    unit: 'FLAT',
    rate: 11000000,
    minQuantity: 0,
    inclusions: ['Three-day coverage', 'Cinematic highlight film', '60-page album'],
  },
  {
    verticalKey: 'photography',
    name: 'Reception only',
    unit: 'FLAT',
    rate: 3800000,
    minQuantity: 0,
    inclusions: ['Four hours on stage', 'Candid set', 'Short highlight film'],
  },
  {
    verticalKey: 'makeup',
    name: 'Bridal complete',
    unit: 'FLAT',
    rate: 4200000,
    minQuantity: 0,
    inclusions: ['HD makeup and hair', 'Saree draping', 'Touch-up kit'],
  },
  {
    verticalKey: 'makeup',
    name: 'Bride and two family members',
    unit: 'FLAT',
    rate: 5800000,
    minQuantity: 0,
    inclusions: ['Bridal look', 'Two guest looks', 'On-location artist'],
  },
  {
    verticalKey: 'makeup',
    name: 'Engagement fresh look',
    unit: 'FLAT',
    rate: 1800000,
    minQuantity: 0,
    inclusions: ['Fresh makeup and hair', 'Natural look', 'Trial at the studio'],
  },
]

export const DEMO_PORTFOLIO = [
  { title: 'Meera and Karthik', venueName: 'Brunton Boatyard, Fort Kochi', eventDate: '2026-01-18', description: '480 guests, banana leaf sadya and a mandap built overnight.' },
  { title: 'Sreelakshmi and Vishnu', venueName: 'Vadakkumnathan Hall, Thrissur', eventDate: '2025-12-08', description: 'Traditional wedding lunch with a live dosa counter.' },
  { title: 'Pranav Tech annual lunch', venueName: 'Kakkanad', eventDate: '2026-02-21', description: 'A packed working lunch for 220 employees. Rolled out in 40 minutes.' },
  { title: 'Narayanan housewarming', venueName: 'Edappally', eventDate: '2025-11-02', description: 'Breakfast and filter coffee for 90 guests, served at home.' },
  { title: 'Rhea and Arjun reception', venueName: 'Marine Drive, Kochi', eventDate: '2026-03-14', description: 'Garden reception with a fairy-light canopy and a chaat counter.' },
  { title: 'Onam sadya for 400', venueName: 'Aluva', eventDate: '2025-09-06', description: 'Twenty-six dishes, five counters and a pookalam at the entrance.' },
]

export const DEMO_TESTIMONIALS = [
  { name: 'Meera and Karthik', context: 'Wedding · Fort Kochi', quote: 'They cooked for 480 guests and every plate reached the table hot. The banana leaf service was exactly what both our families asked for.' },
  { name: 'Pranav Kumar', context: 'Corporate lunch · Kakkanad', quote: 'The team arrived at eight and served 220 people by half past twelve, with nothing left to clear. We have booked them again.' },
  { name: 'Lakshmi Narayanan', context: 'Housewarming · Edappally', quote: 'They handled breakfast for ninety people in a house with one kitchen and no yard. The filter coffee alone was worth it.' },
  { name: 'Rhea and Arjun', context: 'Reception · Marine Drive', quote: 'Same team on the stage, the camera and the food, so we made one call instead of four. The photographs arrived in three weeks.' },
]

export const DEMO_TEAM = [
  { name: 'Kannan R', role: 'Founder and head of kitchen' },
  { name: 'Anitha Menon', role: 'Head chef, sadya' },
  { name: 'Vipin Das', role: 'Decor and production' },
  { name: 'Sneha Kurup', role: 'Photography lead' },
]

export const DEMO_FAQ = [
  { question: 'How many guests can you serve?', answer: '60 to 1,200 at one sitting. Above 500 we run two service lines, and the kitchen needs the venue by 6am on the day.' },
  { question: 'Is the menu pure vegetarian?', answer: 'The sadya packages are pure vegetarian. Mixed menus are also pure vegetarian unless you add a non-vegetarian main, and we keep the lines separate.' },
  { question: 'When should we book?', answer: 'Four to six weeks ahead for a wedding, two weeks for a smaller function. August to January is the busiest season.' },
  { question: 'Do you travel outside Kochi?', answer: 'Yes: Ernakulam, Thrissur, Alappuzha and Kottayam are standard. Further out we quote travel and an overnight stay separately.' },
  { question: 'What does the written quote include?', answer: 'Every dish, the service team, equipment, transport, taxes and the guest count cut-off. Anything we are not providing is listed as excluded.' },
  { question: 'Can we taste the menu first?', answer: 'A tasting for four dishes is arranged at the studio for ₹1,500 per person, and the amount is adjusted against the final invoice.' },
]

/** Section order and content for the published layout. */
export const DEMO_SECTION_ORDER = [
  'hero',
  'about',
  'services',
  'packages',
  'gallery',
  'testimonials',
  'team',
  'faq',
  'contact',
  'enquiry',
] as const
