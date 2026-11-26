/**
 * The catalogue for Tinu Eventer, Gudalur — a Nilgiris business that caters,
 * decorates, photographs and does bridal makeup.
 *
 * Money is integer paise. Every price is a plausible 2026 Nilgiris rate, and the
 * cost is roughly what the kitchen, flower market or crew bills for the same
 * unit, so quote margins on screen are believable.
 */
import type {
  ArtistSpec,
  CatalogueItem,
  MaterialSpec,
  MenuSectionSpec,
  PackageSpec,
  RecipeSpec,
} from './types'

export const MENU_SECTIONS: MenuSectionSpec[] = [
  { name: 'Breakfast', start: '07:00', end: '10:00', groups: ['Tiffin', 'Beverages'] },
  { name: 'Lunch', start: '12:00', end: '15:00', groups: ['Welcome drinks', 'Starters', 'Main course', 'Rice & breads', 'Desserts', 'Live counters'] },
  { name: 'Evening', start: '16:00', end: '18:30', groups: ['Snacks', 'Beverages'] },
  { name: 'Dinner', start: '19:00', end: '22:30', groups: ['Welcome drinks', 'Starters', 'Main course', 'Rice & breads', 'Desserts', 'Live counters'] },
]

export const CATERING_ITEMS: CatalogueItem[] = [
  { name: 'Nannari sarbath', category: 'Welcome drinks', unit: 'PER_GUEST', label: 'per guest', price: 4000, cost: 2200, diet: 'veg', section: 'Lunch', group: 'Welcome drinks' },
  { name: 'Spiced buttermilk', category: 'Welcome drinks', unit: 'PER_GUEST', label: 'per guest', price: 3000, cost: 1500, diet: 'veg', section: 'Lunch', group: 'Welcome drinks' },
  { name: 'Rose milk', category: 'Welcome drinks', unit: 'PER_GUEST', label: 'per guest', price: 5000, cost: 2800, diet: 'veg', section: 'Lunch', group: 'Welcome drinks' },
  { name: 'Tender coconut', category: 'Welcome drinks', unit: 'PER_GUEST', label: 'per guest', price: 5500, cost: 4000, diet: 'veg', section: 'Dinner', group: 'Welcome drinks' },
  { name: 'Idli and sambar', category: 'Breakfast', unit: 'PER_GUEST', label: 'per guest', price: 8000, cost: 4200, diet: 'veg', section: 'Breakfast', group: 'Tiffin' },
  { name: 'Ven pongal with chutney', category: 'Breakfast', unit: 'PER_GUEST', label: 'per guest', price: 9000, cost: 4800, diet: 'veg', section: 'Breakfast', group: 'Tiffin' },
  { name: 'Ghee dosai', category: 'Breakfast', unit: 'PER_GUEST', label: 'per guest', price: 9500, cost: 5200, diet: 'veg', section: 'Breakfast', group: 'Tiffin' },
  { name: 'Poori masala', category: 'Breakfast', unit: 'PER_GUEST', label: 'per guest', price: 10000, cost: 5500, diet: 'veg', section: 'Breakfast', group: 'Tiffin' },
  { name: 'Rava kesari and vadai', category: 'Breakfast', unit: 'PER_GUEST', label: 'per guest', price: 8500, cost: 4500, diet: 'veg', section: 'Breakfast', group: 'Tiffin' },
  { name: 'Paneer 65', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 15000, cost: 9000, diet: 'veg', section: 'Lunch', group: 'Starters' },
  { name: 'Gobi 65', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 12000, cost: 6500, diet: 'veg', section: 'Lunch', group: 'Starters' },
  { name: 'Mushroom pepper fry', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 14000, cost: 8200, diet: 'veg', section: 'Dinner', group: 'Starters' },
  { name: 'Chicken 65', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 18000, cost: 11500, diet: 'non_veg', section: 'Lunch', group: 'Starters' },
  { name: 'Mutton kola urundai', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 26000, cost: 17500, diet: 'non_veg', section: 'Dinner', group: 'Starters' },
  { name: 'Nethili fish fry', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 19000, cost: 12500, diet: 'non_veg', section: 'Lunch', group: 'Starters' },
  { name: 'Prawn pepper fry', category: 'Starters', unit: 'PER_GUEST', label: 'per guest', price: 28000, cost: 19500, diet: 'non_veg', section: 'Dinner', group: 'Starters' },
  { name: 'Vegetable kurma', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 12000, cost: 6200, diet: 'veg', section: 'Lunch', group: 'Main course' },
  { name: 'Paneer butter masala', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 15000, cost: 8800, diet: 'veg', section: 'Lunch', group: 'Main course' },
  { name: 'Dal tadka', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 9000, cost: 4500, diet: 'veg', section: 'Lunch', group: 'Main course' },
  { name: 'Sambar', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 7000, cost: 3400, diet: 'veg', section: 'Lunch', group: 'Main course' },
  { name: 'Rasam', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 6000, cost: 2800, diet: 'veg', section: 'Lunch', group: 'Main course' },
  { name: 'Chettinad chicken curry', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 20000, cost: 13000, diet: 'non_veg', section: 'Lunch', group: 'Main course' },
  { name: 'Mutton pepper masala', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 26000, cost: 18000, diet: 'non_veg', section: 'Dinner', group: 'Main course' },
  { name: 'Meen kuzhambu', category: 'Main course', unit: 'PER_GUEST', label: 'per guest', price: 22000, cost: 15000, diet: 'non_veg', section: 'Lunch', group: 'Main course' },
  { name: 'Chicken biryani', category: 'Rice & breads', unit: 'PER_GUEST', label: 'per guest', price: 26000, cost: 16500, diet: 'non_veg', section: 'Lunch', group: 'Rice & breads' },
  { name: 'Mutton biryani', category: 'Rice & breads', unit: 'PER_GUEST', label: 'per guest', price: 32000, cost: 22000, diet: 'non_veg', section: 'Dinner', group: 'Rice & breads' },
  { name: 'Vegetable biryani', category: 'Rice & breads', unit: 'PER_GUEST', label: 'per guest', price: 18000, cost: 10000, diet: 'veg', section: 'Lunch', group: 'Rice & breads' },
  { name: 'Ghee rice', category: 'Rice & breads', unit: 'PER_GUEST', label: 'per guest', price: 12000, cost: 6500, diet: 'veg', section: 'Lunch', group: 'Rice & breads' },
  { name: 'Lemon rice', category: 'Rice & breads', unit: 'PER_GUEST', label: 'per guest', price: 8000, cost: 4000, diet: 'veg', section: 'Lunch', group: 'Rice & breads' },
  { name: 'Curd rice', category: 'Rice & breads', unit: 'PER_GUEST', label: 'per guest', price: 7000, cost: 3500, diet: 'veg', section: 'Lunch', group: 'Rice & breads' },
  { name: 'Chappathi with kurma', category: 'Rice & breads', unit: 'PER_GUEST', label: 'per guest', price: 9000, cost: 5000, diet: 'veg', section: 'Dinner', group: 'Rice & breads' },
  { name: 'Malabar parotta', category: 'Rice & breads', unit: 'PER_GUEST', label: 'per guest', price: 6000, cost: 3200, diet: 'veg', section: 'Dinner', group: 'Rice & breads' },
  { name: 'Idiyappam', category: 'Rice & breads', unit: 'PER_GUEST', label: 'per guest', price: 6000, cost: 3000, diet: 'veg', section: 'Breakfast', group: 'Tiffin' },
  { name: 'Semiya payasam', category: 'Desserts', unit: 'PER_GUEST', label: 'per guest', price: 8000, cost: 4500, diet: 'veg', section: 'Lunch', group: 'Desserts' },
  { name: 'Paal payasam', category: 'Desserts', unit: 'PER_GUEST', label: 'per guest', price: 9000, cost: 5200, diet: 'veg', section: 'Lunch', group: 'Desserts' },
  { name: 'Gulab jamun', category: 'Desserts', unit: 'PER_GUEST', label: 'per guest', price: 8000, cost: 4200, diet: 'veg', section: 'Dinner', group: 'Desserts' },
  { name: 'Fruit salad with ice cream', category: 'Desserts', unit: 'PER_GUEST', label: 'per guest', price: 11000, cost: 6800, diet: 'veg', section: 'Dinner', group: 'Desserts' },
  { name: 'Dosai counter', category: 'Live counters', unit: 'PER_GUEST', label: 'per guest', price: 12000, cost: 7000, diet: 'veg', section: 'Dinner', group: 'Live counters', description: 'Two tawa stations and a dosai master.' },
  { name: 'Chaat counter', category: 'Live counters', unit: 'PER_GUEST', label: 'per guest', price: 14000, cost: 8500, diet: 'veg', section: 'Evening', group: 'Snacks' },
  { name: 'Grill and tandoor counter', category: 'Live counters', unit: 'PER_GUEST', label: 'per guest', price: 24000, cost: 16000, diet: 'non_veg', section: 'Dinner', group: 'Live counters' },
  { name: 'Filter coffee counter', category: 'Live counters', unit: 'PER_GUEST', label: 'per guest', price: 6000, cost: 3000, diet: 'veg', section: 'Breakfast', group: 'Beverages' },
  { name: 'Filter coffee', category: 'Beverages', unit: 'PER_GUEST', label: 'per guest', price: 4000, cost: 1800, diet: 'veg', section: 'Breakfast', group: 'Beverages' },
  { name: 'Masala tea', category: 'Beverages', unit: 'PER_GUEST', label: 'per guest', price: 3500, cost: 1600, diet: 'veg', section: 'Evening', group: 'Beverages' },
  { name: 'Fresh lime soda', category: 'Beverages', unit: 'PER_GUEST', label: 'per guest', price: 5000, cost: 2600, diet: 'veg', section: 'Lunch', group: 'Welcome drinks' },
  { name: 'Serving team', category: 'Service', unit: 'PER_GUEST', label: 'per guest', price: 4500, cost: 3200, description: 'One steward for every 25 guests.' },
]

export const DECOR_ITEMS: CatalogueItem[] = [
  { name: 'Mandap with Nilgiri flowers', category: 'Stage', unit: 'FLAT', label: 'per event', price: 16500000, cost: 10500000 },
  { name: 'Reception backdrop with drapery', category: 'Stage', unit: 'FLAT', label: 'per event', price: 11000000, cost: 6800000 },
  { name: 'Entrance arch in marigold and jasmine', category: 'Entrance', unit: 'FLAT', label: 'per event', price: 6000000, cost: 3600000 },
  { name: 'Aisle floral walkway', category: 'Entrance', unit: 'FLAT', label: 'per event', price: 8500000, cost: 5200000 },
  { name: 'Table centrepieces', category: 'Tables', unit: 'PER_UNIT', label: 'per table', price: 110000, cost: 62000 },
  { name: 'Chair covers and sashes', category: 'Tables', unit: 'PER_UNIT', label: 'per chair', price: 14000, cost: 8000 },
  { name: 'Fairy light canopy', category: 'Lighting', unit: 'FLAT', label: 'per event', price: 4200000, cost: 2400000 },
  { name: 'Ceiling drape and chandeliers', category: 'Lighting', unit: 'FLAT', label: 'per event', price: 13500000, cost: 8200000 },
  { name: 'Nilgiri flower wall', category: 'Features', unit: 'FLAT', label: 'per wall', price: 7500000, cost: 4400000 },
  { name: 'Kolam and floral floor design', category: 'Traditional', unit: 'FLAT', label: 'per design', price: 4500000, cost: 2500000 },
  { name: 'Brass kuthuvilakku arrangement', category: 'Traditional', unit: 'FLAT', label: 'per event', price: 3500000, cost: 1800000 },
  { name: 'Photo booth with florals', category: 'Features', unit: 'FLAT', label: 'per event', price: 7500000, cost: 4300000 },
  { name: 'Children corner with props', category: 'Features', unit: 'FLAT', label: 'per event', price: 3000000, cost: 1650000 },
  { name: 'Car decoration', category: 'Features', unit: 'FLAT', label: 'per car', price: 4000000, cost: 2300000 },
  { name: 'On-site styling team', category: 'Service', unit: 'PER_DAY', label: 'per day', price: 1600000, cost: 1100000 },
]

export const PHOTOGRAPHY_ITEMS: CatalogueItem[] = [
  { name: 'Full-day wedding coverage', category: 'Wedding', unit: 'FLAT', label: 'per event', price: 3200000, cost: 1700000 },
  { name: 'Candid photography', category: 'Wedding', unit: 'PER_DAY', label: 'per day', price: 2400000, cost: 1300000 },
  { name: 'Second photographer', category: 'Wedding', unit: 'PER_DAY', label: 'per day', price: 750000, cost: 450000 },
  { name: 'Cinematic highlight film', category: 'Film', unit: 'FLAT', label: 'per event', price: 2000000, cost: 1050000 },
  { name: 'Same-day edit', category: 'Film', unit: 'FLAT', label: 'per event', price: 2300000, cost: 1200000 },
  { name: 'Drone coverage', category: 'Film', unit: 'FLAT', label: 'per event', price: 1200000, cost: 650000 },
  { name: 'Pre-wedding shoot', category: 'Shoots', unit: 'FLAT', label: 'per shoot', price: 1600000, cost: 850000 },
  { name: 'Reception coverage', category: 'Wedding', unit: 'FLAT', label: 'per event', price: 1400000, cost: 750000 },
  { name: 'Traditional album, 60 pages', category: 'Deliverables', unit: 'PER_UNIT', label: 'per album', price: 1500000, cost: 950000 },
  { name: 'Extra hour of coverage', category: 'Wedding', unit: 'PER_HOUR', label: 'per hour', price: 320000, cost: 180000 },
  { name: 'Live streaming for family abroad', category: 'Deliverables', unit: 'FLAT', label: 'per event', price: 1800000, cost: 950000 },
  { name: 'Photo booth prints', category: 'Deliverables', unit: 'PER_UNIT', label: 'per 50 prints', price: 420000, cost: 250000 },
]

export const MAKEUP_ITEMS: CatalogueItem[] = [
  { name: 'Bridal HD makeup', category: 'Bridal', unit: 'FLAT', label: 'per person', price: 2200000, cost: 1200000 },
  { name: 'Airbrush bridal makeup', category: 'Bridal', unit: 'FLAT', label: 'per person', price: 2900000, cost: 1650000 },
  { name: 'Traditional Tamil bridal set', category: 'Bridal', unit: 'FLAT', label: 'per person', price: 1900000, cost: 1050000 },
  { name: 'Engagement look', category: 'Occasion', unit: 'FLAT', label: 'per person', price: 1400000, cost: 750000 },
  { name: 'Reception look', category: 'Occasion', unit: 'FLAT', label: 'per person', price: 1600000, cost: 880000 },
  { name: 'Groom grooming', category: 'Occasion', unit: 'FLAT', label: 'per person', price: 550000, cost: 280000 },
  { name: 'Family member makeup', category: 'Occasion', unit: 'PER_UNIT', label: 'per person', price: 420000, cost: 230000 },
  { name: 'Hair styling and draping', category: 'Styling', unit: 'FLAT', label: 'per person', price: 750000, cost: 400000 },
  { name: 'Pre-bridal trial', category: 'Styling', unit: 'FLAT', label: 'per session', price: 650000, cost: 320000 },
  { name: 'Bridal mehendi', category: 'Mehendi', unit: 'FLAT', label: 'per person', price: 850000, cost: 450000 },
  { name: 'Mehendi for guests', category: 'Mehendi', unit: 'PER_UNIT', label: 'per person', price: 22000, cost: 11000 },
  { name: 'Artist travel', category: 'Service', unit: 'FLAT', label: 'per event', price: 300000, cost: 180000 },
]

export const ITEMS_BY_VERTICAL: Record<string, CatalogueItem[]> = {
  catering: CATERING_ITEMS,
  decor: DECOR_ITEMS,
  photography: PHOTOGRAPHY_ITEMS,
  makeup: MAKEUP_ITEMS,
}

export const PACKAGES: PackageSpec[] = [
  {
    vertical: 'catering', name: 'Wedding lunch — vegetarian', unit: 'PER_GUEST', rate: 115000, minQuantity: 100,
    inclusions: ['Welcome drink and two starters', 'Three mains, sambar and rasam', 'Rice, breads and two desserts', 'Serving team and banana leaf service'],
  },
  {
    vertical: 'catering', name: 'Wedding lunch — non-vegetarian', unit: 'PER_GUEST', rate: 145000, minQuantity: 100,
    inclusions: ['Welcome drink and three starters', 'Chicken biryani and mutton pepper masala', 'Vegetarian mains and desserts', 'Serving team and service equipment'],
  },
  {
    vertical: 'catering', name: 'Reception dinner buffet', unit: 'PER_GUEST', rate: 165000, minQuantity: 80,
    inclusions: ['Live counter of your choice', 'Six starters, four mains and desserts', 'Buffet equipment and stewards', 'Two service lines above 200 guests'],
  },
  {
    vertical: 'catering', name: 'Traditional sadya on banana leaf', unit: 'PER_GUEST', rate: 98000, minQuantity: 75,
    inclusions: ['Twenty-two items on banana leaf', 'Two payasams and filter coffee', 'Serving team in traditional dress', 'Pookalam at the dining entrance'],
  },
  {
    vertical: 'catering', name: 'Housewarming breakfast', unit: 'PER_GUEST', rate: 78000, minQuantity: 50,
    inclusions: ['Idli, dosai, pongal and vadai', 'Chutney, sambar and filter coffee', 'Service at home for four hours', 'Crockery and clearing'],
  },
  {
    vertical: 'catering', name: 'Corporate working lunch', unit: 'PER_GUEST', rate: 68000, minQuantity: 40,
    inclusions: ['Buffet or packed service', 'Vegetarian and non-vegetarian options', 'Scheduled delivery and setup', 'Disposable or reusable crockery'],
  },
  {
    vertical: 'decor', name: 'Classic mandap', unit: 'FLAT', rate: 12500000, minQuantity: 0,
    inclusions: ['Fresh flower stage and entrance arch', 'Aisle lighting', 'Centrepieces for 15 tables', 'Setup and teardown crew'],
  },
  {
    vertical: 'decor', name: 'Garden reception', unit: 'FLAT', rate: 19500000, minQuantity: 0,
    inclusions: ['Backdrop, drapery and fairy lights', 'Centrepieces for 25 tables', 'Photo booth with florals', 'Overnight teardown'],
  },
  {
    vertical: 'decor', name: 'Intimate home function', unit: 'FLAT', rate: 5800000, minQuantity: 0,
    inclusions: ['Pooja corner and kolam', 'Flower garlands and lamps', 'Seating styling for 40', 'Same-day teardown'],
  },
  {
    vertical: 'photography', name: 'Wedding day essentials', unit: 'FLAT', rate: 5800000, minQuantity: 0,
    inclusions: ['Lead and second photographer', 'Candid set and highlight film', 'Edited photographs within 30 days', 'One 60-page album'],
  },
  {
    vertical: 'photography', name: 'Full weekend story', unit: 'FLAT', rate: 10500000, minQuantity: 0,
    inclusions: ['Three-day coverage', 'Cinematic film and same-day edit', 'Drone coverage', 'Two albums and a printed set'],
  },
  {
    vertical: 'photography', name: 'Reception only', unit: 'FLAT', rate: 3400000, minQuantity: 0,
    inclusions: ['Four hours on stage', 'Candid set', 'Short highlight film', 'Edited set within 21 days'],
  },
  {
    vertical: 'makeup', name: 'Bridal complete', unit: 'FLAT', rate: 3900000, minQuantity: 0,
    inclusions: ['HD makeup and hair', 'Saree draping', 'Touch-up kit for the day', 'Artist at the venue'],
  },
  {
    vertical: 'makeup', name: 'Bride and two family members', unit: 'FLAT', rate: 5400000, minQuantity: 0,
    inclusions: ['Bridal look', 'Two guest looks', 'Hair styling for three', 'On-location artist and assistant'],
  },
  {
    vertical: 'makeup', name: 'Engagement fresh look', unit: 'FLAT', rate: 1700000, minQuantity: 0,
    inclusions: ['Fresh makeup and hair', 'Natural look', 'Trial at the studio'],
  },
]

export const RECIPES: RecipeSpec[] = [
  {
    item: 'Chicken biryani',
    ingredients: [
      { name: 'Seeraga samba rice', quantityMilliPerServing: 120000, unit: 'g', wastageBp: 500 },
      { name: 'Chicken', quantityMilliPerServing: 180000, unit: 'g', wastageBp: 800 },
      { name: 'Ghee', quantityMilliPerServing: 15000, unit: 'g', wastageBp: 200 },
      { name: 'Onion', quantityMilliPerServing: 60000, unit: 'g', wastageBp: 1200 },
    ],
  },
  {
    item: 'Sambar',
    ingredients: [
      { name: 'Toor dal', quantityMilliPerServing: 35000, unit: 'g', wastageBp: 600 },
      { name: 'Tomato', quantityMilliPerServing: 40000, unit: 'g', wastageBp: 1000 },
      { name: 'Sambar powder', quantityMilliPerServing: 8000, unit: 'g', wastageBp: 300 },
      { name: 'Curry leaves', quantityMilliPerServing: 2000, unit: 'g', wastageBp: 1500 },
    ],
  },
  {
    item: 'Paneer butter masala',
    ingredients: [
      { name: 'Paneer', quantityMilliPerServing: 90000, unit: 'g', wastageBp: 500 },
      { name: 'Tomato', quantityMilliPerServing: 60000, unit: 'g', wastageBp: 1000 },
      { name: 'Butter', quantityMilliPerServing: 12000, unit: 'g', wastageBp: 200 },
      { name: 'Cashew', quantityMilliPerServing: 10000, unit: 'g', wastageBp: 400 },
    ],
  },
  {
    item: 'Semiya payasam',
    ingredients: [
      { name: 'Milk', quantityMilliPerServing: 120000, unit: 'ml', wastageBp: 500 },
      { name: 'Sugar', quantityMilliPerServing: 25000, unit: 'g', wastageBp: 200 },
      { name: 'Vermicelli', quantityMilliPerServing: 20000, unit: 'g', wastageBp: 400 },
      { name: 'Ghee', quantityMilliPerServing: 5000, unit: 'g', wastageBp: 200 },
    ],
  },
  {
    item: 'Filter coffee',
    ingredients: [
      { name: 'Coffee powder', quantityMilliPerServing: 12000, unit: 'g', wastageBp: 300 },
      { name: 'Milk', quantityMilliPerServing: 90000, unit: 'ml', wastageBp: 500 },
      { name: 'Sugar', quantityMilliPerServing: 10000, unit: 'g', wastageBp: 200 },
    ],
  },
  {
    item: 'Mutton pepper masala',
    ingredients: [
      { name: 'Mutton', quantityMilliPerServing: 200000, unit: 'g', wastageBp: 900 },
      { name: 'Black pepper', quantityMilliPerServing: 6000, unit: 'g', wastageBp: 300 },
      { name: 'Onion', quantityMilliPerServing: 70000, unit: 'g', wastageBp: 1200 },
      { name: 'Coconut oil', quantityMilliPerServing: 15000, unit: 'ml', wastageBp: 300 },
    ],
  },
]

export const MATERIALS: MaterialSpec[] = [
  { name: 'Marigold garland', category: 'Flowers', unit: 'metre', quantity: 320, quantityUnit: 'metre', costPaise: 12000, supplier: 'Amma Flower Mart' },
  { name: 'Jasmine string', category: 'Flowers', unit: 'metre', quantity: 180, quantityUnit: 'metre', costPaise: 18000, supplier: 'Amma Flower Mart' },
  { name: 'Red rose bunch', category: 'Flowers', unit: 'bunch', quantity: 90, quantityUnit: 'bunch', costPaise: 22000, supplier: 'Amma Flower Mart' },
  { name: 'Nilgiri chrysanthemum', category: 'Flowers', unit: 'bunch', quantity: 75, quantityUnit: 'bunch', costPaise: 15000, supplier: 'Amma Flower Mart' },
  { name: 'Drape fabric, ivory', category: 'Fabric', unit: 'metre', quantity: 240, quantityUnit: 'metre', costPaise: 24000, supplier: 'Highland Tent House' },
  { name: 'Drape fabric, maroon', category: 'Fabric', unit: 'metre', quantity: 160, quantityUnit: 'metre', costPaise: 26000, supplier: 'Highland Tent House' },
  { name: 'Fairy light string, 10m', category: 'Lighting', unit: 'string', quantity: 140, quantityUnit: 'string', costPaise: 32000, supplier: 'Highland Tent House' },
  { name: 'LED par light', category: 'Lighting', unit: 'piece', quantity: 24, quantityUnit: 'piece', costPaise: 185000, supplier: 'Highland Tent House' },
  { name: 'Bamboo frame, 12ft', category: 'Structure', unit: 'piece', quantity: 18, quantityUnit: 'piece', costPaise: 240000, supplier: 'Highland Tent House' },
  { name: 'Brass kuthuvilakku', category: 'Props', unit: 'piece', quantity: 12, quantityUnit: 'piece', costPaise: 145000, supplier: 'Sree Ganesh Provisions' },
  { name: 'Uruli, brass', category: 'Props', unit: 'piece', quantity: 8, quantityUnit: 'piece', costPaise: 210000, supplier: 'Sree Ganesh Provisions' },
  { name: 'Banquet chair, white cover', category: 'Seating', unit: 'piece', quantity: 380, quantityUnit: 'piece', costPaise: 45000, supplier: 'Highland Tent House' },
  { name: 'Table linen set', category: 'Seating', unit: 'set', quantity: 60, quantityUnit: 'set', costPaise: 38000, supplier: 'Highland Tent House' },
  { name: 'Kolam stencil set', category: 'Props', unit: 'set', quantity: 10, quantityUnit: 'set', costPaise: 32000, supplier: 'Sree Ganesh Provisions' },
]

export const ARTISTS: ArtistSpec[] = [
  {
    name: 'Divya Shankar', phone: '+91 94433 22110', email: 'divya@tinueventer.in',
    skills: ['HD makeup', 'airbrush', 'saree draping', 'hair styling'],
    specializations: ['Bridal', 'Reception', 'Traditional Tamil bridal'],
    ratePaisePerHour: 180000, travelFeePaise: 300000,
  },
  {
    name: 'Reshma Thomas', phone: '+91 94433 22111', email: 'reshma@tinueventer.in',
    skills: ['HD makeup', 'mehendi', 'hair styling'],
    specializations: ['Bridal', 'Engagement', 'Guest makeup'],
    ratePaisePerHour: 150000, travelFeePaise: 350000,
  },
  {
    name: 'Anitha Selvam', phone: '+91 94433 22112', email: 'anitha@tinueventer.in',
    skills: ['airbrush', 'groom grooming', 'mehendi'],
    specializations: ['Groom styling', 'Mehendi', 'Family looks'],
    ratePaisePerHour: 120000, travelFeePaise: 250000,
  },
]
